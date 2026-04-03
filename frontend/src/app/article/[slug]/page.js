import Link from 'next/link';
import VideoSidebar from '@/components/VideoSidebar';
import TrendSidebar from '@/components/TrendSidebar';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

async function getArticleBySlug(slug) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/articles/${slug}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
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

export default async function ArticlePage({ params }) {
  const { slug } = params;
  const [article, trending] = await Promise.all([
    getArticleBySlug(slug),
    getTrending(),
  ]);

  if (!article) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1>Article Not Found</h1>
        <p>The requested intelligence report could not be located.</p>
        <Link href="/" style={{ color: 'var(--accent)', marginTop: '2rem', display: 'inline-block' }}>
          Return to Hub
        </Link>
      </div>
    );
  }

  const paragraphs = article.body.split('\n\n').filter(p => p.trim());

  return (
    <article className="article-detail">
      {/* Side-by-side Intelligence Banner */}
      <div className="intelligence-banner">
        <VideoSidebar videos={trending.videos || []} />
        <TrendSidebar trends={trending.trends || []} />
      </div>

      <header className="article-header">
        <span className="article-category article-category--large">{article.category}</span>
        <h1>{article.headline}</h1>
        {article.subtitle ? (
          <p className="article-dek">{article.subtitle}</p>
        ) : null}
        
        <div className="meta-info">
          <span>{article.read_time} Min Read</span>
          <span>•</span>
          <span>AI Authored Report</span>
          <span>•</span>
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
        </div>
      </header>

      {article.virlo_data && (
        <div className="virlo-badge">
          <strong>🔥 Social Pulse Indicator:</strong> Investigated due to viral spike.
          Currently tracking {article.virlo_data.views} views across {article.virlo_data.count} social nodes.
        </div>
      )}

      <div className="article-body">
        {paragraphs.map((para, i) => (
          para.startsWith('#') ? (
            <h2 key={i}>{para.replace(/#/g, '').trim()}</h2>
          ) : (
            <p key={i}>{para.replace(/\*\*/g, '')}</p>
          )
        ))}
      </div>
    </article>
  );
}
