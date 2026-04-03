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

  // 3. Populate Intelligence Pool (DENSE)
  const trendData = intelligence.trends || [];
  if (trendData.length > 0) {
    for (let i = 0; i < trendData.length; i += 3) {
      intelligencePool.push({ type: 'trend', data: trendData.slice(i, i + 3) });
    }
  } else {
    for (let i = 0; i < 3; i++) intelligencePool.push({ type: 'trend', data: [] });
  }

  const combinedVideos = [...(intelligence.instagram || []), ...(intelligence.youtube || [])];
  if (combinedVideos.length > 0) {
    combinedVideos.forEach(v => intelligencePool.push({ type: 'video', data: v }));
  } else {
    for (let i = 0; i < 3; i++) intelligencePool.push({ type: 'video', data: null });
  }

  const nicheData = intelligence.niches || [];
  nicheData.slice(0, 4).forEach(n => {
    intelligencePool.push({ type: 'niche', data: n });
  });

  // Shuffle the pools once to get internal variety
  intelligencePool.sort(() => Math.random() - 0.5);

  // 4. BALANCED DISTRIBUTION GRID (SPREADING BOXES EVERYWHERE)
  let masterItems = [];
  
  // Calculate a dynamic interval so Intelligence is spread throughout, not clumped.
  const totalArticles = articlesPool.length;
  const totalIntel = intelligencePool.length;
  const totalItems = totalArticles + totalIntel;
  const interval = totalIntel > 0 ? Math.floor(totalArticles / totalIntel) : 0;

  let aIdx = 0;
  let iIdx = 0;
  
  while (aIdx < totalArticles || iIdx < totalIntel) {
    // Add 'interval' articles, then 1 intel card
    for (let j = 0; j < interval && aIdx < totalArticles; j++) {
      masterItems.push(articlesPool[aIdx++]);
    }
    if (iIdx < totalIntel) {
      masterItems.push(intelligencePool[iIdx++]);
    }
    // Safety for leftover articles
    if (iIdx === totalIntel && aIdx < totalArticles) {
      masterItems.push(articlesPool[aIdx++]);
    }
  }

  // 5. FILL THE GRID (ELIMINATE BOTTOM WHITE SPACE)
  // Ensure the grid is a perfect rectangle by padding the array to a multiple of 4
  const cols = 4;
  const remainder = masterItems.length % cols;
  if (remainder !== 0) {
    const paddingNeeded = cols - remainder;
    for (let p = 0; p < paddingNeeded; p++) {
      // Add a 'null' or empty placeholder card that still renders a grid border
      masterItems.push({ type: 'padding', data: null });
    }
  }

  return (
    <div className="broadsheet-wrapper" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <div className="section-title" style={{ textAlign: 'center', marginBottom: 0, paddingBottom: '0.2rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginTop: 0, marginBottom: '0.5rem' }}>Top News & Reports</h1>
      </div>

      <div className="article-grid">
        {masterItems.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: 'span 4', textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontSize: '1.2rem', fontStyle: 'italic' }}>The autonomous newsroom is currently gathering intelligence...</p>
          </div>
        ) : (
          masterItems.map((item, idx) => (
            <div key={idx} className="grid-cell">
              {item.type === 'article' && <ArticleCard article={item.data} />}
              {(item.type === 'trend' || item.type === 'video' || item.type === 'niche') && (
                <IntelligenceCard type={item.type} data={item.data} />
              )}
              {item.type === 'padding' && (
                <div style={{ opacity: 0.3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Wire signal stable...</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

