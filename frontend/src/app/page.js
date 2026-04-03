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

  // 4. ADD FILLER ITEMS for gap plugging
  const fillerPool = [
    { type: 'filler', data: { title: 'LATEST WIRE', content: 'Continuous coverage from global bureaus...', icon: '📡' } },
    { type: 'filler', data: { title: 'MARKET PULSE', content: 'Index fluctuations monitored in real-time.', icon: '📉' } },
    { type: 'filler', data: { title: 'EDITORIAL', content: 'Voices of the autonomous newsroom.', icon: '✍️' } },
    { type: 'filler', data: { title: 'WEATHER MAP', content: 'Atmospheric patterns shifting across regions.', icon: '🌪️' } },
  ];
  fillerPool.sort(() => Math.random() - 0.5);

  // 4. DETERMINISTIC SPACING INJECTION
  // We want variety at the top.
  let masterItems = [];
  let intelIdx = 0;

  // ENSURE ONE AT THE VERY TOP (INDEX 0)
  if (intelIdx < intelligencePool.length) {
    masterItems.push(intelligencePool[intelIdx]);
    intelIdx++;
  }
  
  for (let i = 0; i < articlesPool.length; i++) {
    masterItems.push(articlesPool[i]);
    
    // Inject at fixed interval points for perfect spacing
    // Since we already put one at the very top, we can resume spacing every 3-4 articles
    if (intelIdx < intelligencePool.length) {
      if ((i + 1) % 3 === 0) {
         masterItems.push(intelligencePool[intelIdx]);
         intelIdx++;
      }
    }
  }

  // Final sprinkle if needed
  while (intelIdx < intelligencePool.length) {
    masterItems.push(intelligencePool[intelIdx]);
    intelIdx++;
  }

  // 5. Plug the gaps
  while (masterItems.length < 15 && fillerPool.length > 0) {
    masterItems.push(fillerPool.pop());
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
              ) : item.type === 'filler' ? (
                <div className="newspaper-block filler-card" style={{ padding: '2rem 1.5rem', textAlign: 'center', borderStyle: 'dashed' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.8 }}>{item.data.icon}</div>
                  <h4 style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: '2px', fontWeight: 'bold' }}>{item.data.title}</h4>
                  <div style={{ margin: '1rem auto', width: '40px', height: '2px', background: '#000' }}></div>
                  <p style={{ fontStyle: 'italic', fontSize: '0.9rem', opacity: 0.7 }}>{item.data.content}</p>
                </div>
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
