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

  // 4. PROPORTIONAL INTERLEAVING (NO CLUMPING)
  let masterItems = [];
  const totalArticles = articlesPool.length;
  const totalIntel = intelligencePool.length;
  
  if (totalArticles === 0) {
    masterItems = intelligencePool;
  } else if (totalIntel === 0) {
    masterItems = articlesPool;
  } else {
    // Distribute intel proportionally among articles
    const intelPerArticle = totalIntel / totalArticles;
    let intelAccumulator = 0;
    let aIdx = 0;
    let iIdx = 0;

    while (aIdx < totalArticles || iIdx < totalIntel) {
      if (aIdx < totalArticles) {
        masterItems.push(articlesPool[aIdx++]);
        intelAccumulator += intelPerArticle;
        
        // Push as many intel items as the ratio allows for this step
        while (intelAccumulator >= 1 && iIdx < totalIntel) {
          masterItems.push(intelligencePool[iIdx++]);
          intelAccumulator -= 1;
        }
      } else {
        // Fallback for any leftovers
        masterItems.push(intelligencePool[iIdx++]);
      }
    }
  }

  // 5. MANUAL COLUMN DISTRIBUTION (FOR COMMON BASELINE)
  const numCols = Math.min(uniqueArticles.length || 1, 4);
  const columns = Array.from({ length: numCols }, () => []);
  
  // High-fidelity distribution: Item 0 -> Col 1, Item 1 -> Col 2... 
  // This ensures a horizontal "spread" of content types.
  masterItems.forEach((item, idx) => {
    columns[idx % numCols].push(item);
  });

  return (
    <div className="broadsheet-wrapper" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <div className="section-title" style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '0.2rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginTop: 0, marginBottom: '0.5rem' }}>Top News & Reports</h1>
      </div>

      {masterItems.length === 0 ? (
        <div className="article-grid" style={{ display: 'block' }}>
          <div className="empty-state" style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontSize: '1.2rem', fontStyle: 'italic' }}>The autonomous newsroom is currently gathering intelligence...</p>
          </div>
        </div>
      ) : (
        <div className="article-grid-flex">
          {columns.map((colItems, colIdx) => (
            <div key={colIdx} className="article-column">
              {colItems.map((item, idx) => (
                <div key={idx} className="grid-item-wrapper">
                  {item.type === 'article' ? (
                    <ArticleCard article={item.data} />
                  ) : (
                    <IntelligenceCard type={item.type} data={item.data} />
                  )}
                </div>
              ))}
              {/* This "pusher" ensures columns with few items still align titles at the top, 
                  but we'll use justify-content in CSS for the true baseline. */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
