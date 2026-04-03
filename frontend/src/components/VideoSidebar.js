
function formatViews(views) {
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return views;
}

export default function VideoSidebar({ videos = [] }) {
  if (videos.length === 0) return (
    <div className="newspaper-block">
      <h4>Viral Visuals</h4>
      <p style={{ textAlign: 'center', opacity: 0.7, color: 'var(--paper-text)' }}>Monitoring the web...</p>
    </div>
  );

  return (
    <div className="newspaper-block">
      <h4>Viral Visuals</h4>
      <div className="video-grid-mini">
        {videos.slice(0, 6).map((video, idx) => (
          <a
            key={idx}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="viral-card"
            style={{ border: '1px solid var(--paper-border)', borderRadius: 0 }}
          >
            {video.thumbnail && (
              <img
                src={video.thumbnail}
                alt={video.description?.slice(0, 40)}
                className="viral-thumb"
                style={{ height: '80px', filter: 'grayscale(100%)', contrast: '1.2' }}
              />
            )}
            <div className="viral-meta" style={{ backgroundColor: '#fff', color: '#000', borderTop: '1px solid #000', padding: '2px 4px', fontSize: '0.65rem' }}>
              <span className="viral-views" style={{ color: '#000', fontWeight: 'bold' }}>{formatViews(video.views)} v.</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
