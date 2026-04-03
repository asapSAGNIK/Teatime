import ArticleCard from '@/components/ArticleCard';
import IntelligenceCard from '@/components/IntelligenceCard';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

async function getArticles() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/articles?limit=25`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch articles:', e.message);
    return [];
  }
}

async function getTrending() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/trending`, { cache: 'no-store' });
    if (!res.ok) return { trends: [], niches: [], instagram: [], youtube: [], videos: [] };
    return await res.json();
  } catch (e) {
    return { trends: [], niches: [], instagram: [], youtube: [], videos: [] };
  }
}

export default async function Home() {
  const [articles, intelligence] = await Promise.all([getArticles(), getTrending()]);
  
  // 1. Smarter Deduplication (Fuzzy Word Overlap)
  const seenHeadlineSets = [];
  const uniqueArticles = articles.filter(a => {
    const title = (a.headline || '').toLowerCase().trim();
    const words = new Set(title.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3)); // skip small words
    
    for (const seenWords of seenHeadlineSets) {
      let intersection = 0;
      for (const w of words) {
        if (seenWords.has(w)) intersection++;
      }
      const unionSize = new Set([...words, ...seenWords]).size;
      
      // If titles share >40% of their substantial words, they are covering the same story/event identically
      if (unionSize > 0 && (intersection / unionSize) > 0.4) {
        return false;
      }
    }
    seenHeadlineSets.push(words);
    return true;
  });

  // 2. Prepare Items
  const articlesPool = uniqueArticles.map(a => ({ type: 'article', data: a }));
  const intelligencePool = [];

  // 3. Populate Intelligence Pool (DENSE but NO PLACEHOLDERS)
  const trendData = intelligence.trends || [];
  if (trendData.length > 0) {
    for (let i = 0; i < trendData.length; i += 3) {
      const chunk = trendData.slice(i, i + 3);
      if (chunk.length > 0) {
        intelligencePool.push({ type: 'trend', data: chunk });
      }
    }
  }

  const combinedVideos = [...(intelligence.instagram || []), ...(intelligence.youtube || [])].filter(v => v && v.thumbnail);
  combinedVideos.forEach(v => intelligencePool.push({ type: 'video', data: v }));

  const nicheData = (intelligence.niches || []).filter(n => n && n.name);
  nicheData.slice(0, 4).forEach(n => {
    intelligencePool.push({ type: 'niche', data: n });
  });

  // Shuffle the pools once to get internal variety
  intelligencePool.sort(() => Math.random() - 0.5);

  // 4. BALANCED GRID SPREAD (PREVENTS CLUMPING AT BOTTOM)
  let masterItems = [];
  
  // If no intel, just use articles
  if (intelligencePool.length === 0) {
    masterItems = articlesPool;
  } else {
    // We want to sprinkle intel cards evenly through the articles pool
    const totalArticles = articlesPool.length;
    const totalIntel = intelligencePool.length;
    
    // Calculate interval. e.g. 10 articles, 2 intel -> interval = 5.
    // Intel at index 2, 7 etc.
    const interval = Math.max(2, Math.floor(totalArticles / totalIntel));
    
    let aPtr = 0;
    let iPtr = 0;
    
    while (aPtr < totalArticles || iPtr < totalIntel) {
      // Add 'interval' articles
      for (let count = 0; count < interval && aPtr < totalArticles; count++) {
        masterItems.push(articlesPool[aPtr++]);
      }
      // Add 1 intel card
      if (iPtr < totalIntel) {
        masterItems.push(intelligencePool[iPtr++]);
      }
    }
  }

  return (
    <div className="broadsheet-wrapper" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <div className="section-title" style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '0.2rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginTop: 0, marginBottom: '0.5rem' }}>Top News & Reports</h1>
      </div>

      <div className="article-grid" style={{ columnCount: Math.min(masterItems.filter(i => i.type === 'article').length || 1, 4) }}>
        {masterItems.length === 0 ? (
          <div className="empty-state" style={{ columnSpan: 'all', textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontSize: '1.2rem', fontStyle: 'italic' }}>The autonomous newsroom is currently gathering intelligence...</p>
          </div>
        ) : (
          masterItems.map((item, idx) => (
            <div key={idx} style={{ breakInside: 'avoid', marginBottom: '1.5rem' }}>
              {item.type === 'article' ? (
                <ArticleCard article={item.data} />
              ) : (
                <IntelligenceCard type={item.type} data={item.data} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
