import ArticleCard from '@/components/ArticleCard';
import VideoSidebar from '@/components/VideoSidebar';
import TrendSidebar from '@/components/TrendSidebar';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

async function getArticlesByCategory(category) {
  try {
    const encodedCategory = encodeURIComponent(category);
    const res = await fetch(
      `${BACKEND_URL}/api/articles?category=${encodedCategory}&limit=20`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('Category fetch failed:', e.message);
    return [];
  }
}

async function getTrending() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/trending`, { cache: 'no-store' });
    if (!res.ok) return { trends: [], videos: [] };
    return await res.json();
  } catch {
    return { trends: [], videos: [] };
  }
}

export default async function CategoryPage({ params }) {
  const decodedCategory = decodeURIComponent(params.name);
  const [articles, trending] = await Promise.all([
    getArticlesByCategory(decodedCategory),
    getTrending(),
  ]);

  return (
    <div className="broadsheet-wrapper">
      {/* 50/50 Intelligence Dash at the Top */}
      <div className="intelligence-banner">
        <VideoSidebar videos={trending.videos || []} />
        <TrendSidebar trends={trending.trends || []} />
      </div>

      <div className="section-title section-title--newsprint">
        <h1>{decodedCategory} Intelligence</h1>
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">
          <p>No recent reports in this sector.</p>
          <p className="empty-hint">The autonomous agents are scanning for {decodedCategory} stories.</p>
        </div>
      ) : (
        <div className="article-grid">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
