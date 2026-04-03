'use client';

function formatViews(views) {
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return views;
}

function PlatformBadge({ platform }) {
  const icons = {
    tiktok: '🎵 TikTok',
    youtube: '▶️ YouTube',
    instagram: '📸 Instagram',
  };
  return <span className="platform-badge">{icons[platform] || platform}</span>;
}

export default function TrendingBar({ trending = {} }) {
  const trends = trending.trends || [];
  const videos = trending.videos || [];

  return (
    <div className="sidebar">
      {/* SECTION 1: Trending Topics */}
      <h3>🔥 Social Intelligence</h3>
      <p className="sidebar-desc">
        Real-time trending topics detected by the Virlo API across TikTok, YouTube, and Instagram.
      </p>

      {trends.length > 0 ? (
        <div className="trending-list">
          {trends.slice(0, 6).map((trend, idx) => (
            <a
              key={idx}
              href={`https://news.google.com/search?q=${encodeURIComponent(trend.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="trend-topic"
            >
              <div className="trend-rank">#{trend.ranking}</div>
              <div className="trend-info">
                <div className="trend-name">{trend.name}</div>
                <div className="trend-desc">{trend.description?.slice(0, 120)}...</div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Scanning social platforms...</p>
        </div>
      )}

      {/* SECTION 2: Viral Videos */}
      {videos.length > 0 && (
        <>
          <div className="sidebar-divider" />
          <h4 className="sidebar-subtitle">📹 Viral Right Now</h4>
          <div className="viral-videos">
            {videos.slice(0, 4).map((video, idx) => (
              <a
                key={idx}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="viral-card"
              >
                {video.thumbnail && (
                  <img
                    src={video.thumbnail}
                    alt={video.description?.slice(0, 40)}
                    className="viral-thumb"
                  />
                )}
                <div className="viral-meta">
                  <PlatformBadge platform={video.platform} />
                  <span className="viral-views">{formatViews(video.views)} views</span>
                </div>
                <p className="viral-desc">{video.description?.slice(0, 80)}</p>
              </a>
            ))}
          </div>
        </>
      )}

      <div className="sidebar-divider" />
      <p className="sidebar-powered">
        Powered by <a href="https://virlo.ai" target="_blank" rel="noopener noreferrer">Virlo API</a>
      </p>
    </div>
  );
}
