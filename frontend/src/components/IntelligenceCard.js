
function formatViews(views) {
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return views;
}

export default function IntelligenceCard({ type, data }) {
  const timesFont = { fontFamily: "'Times New Roman', Times, serif" };

  if (type === 'trend') {
    const hasData = data && data.length > 0;
    return (
      <div className="newspaper-block intelligence-card" style={timesFont}>
        <h4 className="intelligence-label" style={{ ...timesFont, borderBottom: '3px double #000', paddingBottom: '4px', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '1.2rem', textAlign: 'left', fontWeight: 'bold' }}>The Pulse</h4>
        <div className="trending-list">
          {hasData ? (
            data.map((trend, idx) => (
              <a
                key={idx}
                href={`https://news.google.com/search?q=${encodeURIComponent(trend.name || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="trend-topic"
                style={{ padding: '0.6rem 0', borderBottom: '1px dotted var(--paper-border)', display: 'block' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ ...timesFont, fontSize: '1.2rem', marginRight: '0.5rem', fontWeight: 'bold' }}>{trend.name}</span>
                  <span style={{ ...timesFont, fontSize: '0.9rem', opacity: 0.6 }}>#{trend.ranking}</span>
                </div>
                <div style={{ ...timesFont, color: '#222', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                   {trend.description?.slice(0, 100)}...
                </div>
              </a>
            ))
          ) : (
            <p style={{ ...timesFont, textAlign: 'center', opacity: 0.7, padding: '1rem 0', fontStyle: 'italic' }}>Wire signal weak: Searching...</p>
          )}
        </div>
      </div>
    );
  }

  if (type === 'video') {
    if (!data) return (
      <div className="newspaper-block intelligence-card" style={timesFont}>
        <h4 className="intelligence-label" style={{ ...timesFont, borderBottom: '3px double #000', paddingBottom: '4px', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '1.2rem', textAlign: 'left', fontWeight: 'bold' }}>Viral Intelligence</h4>
        <p style={{ ...timesFont, textAlign: 'center', opacity: 0.7, padding: '1rem 0', fontStyle: 'italic' }}>Monitoring global streams...</p>
      </div>
    );

    return (
      <div className="newspaper-block intelligence-card" style={timesFont}>
        <h4 className="intelligence-label" style={{ ...timesFont, borderBottom: '3px double #000', paddingBottom: '4px', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '1.2rem', textAlign: 'left', fontWeight: 'bold' }}>Viral Intelligence</h4>
        <div className="viral-card-content" style={{ border: '1px solid #000', padding: '4px' }}>
          {data.thumbnail && (
            <img
              src={data.thumbnail}
              alt={data.description?.slice(0, 40)}
              style={{ width: '100%', height: 'auto', filter: 'grayscale(100%) sepia(20%)', contrast: '1.1' }}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>
            <span style={{ ...timesFont, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{data.platform}</span>
            <span style={{ ...timesFont, fontSize: '0.8rem' }}>{formatViews(data.views)} views</span>
          </div>
          <p style={{ ...timesFont, fontSize: '1rem', lineHeight: '1.3' }}>
            {data.description}
          </p>
          <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ ...timesFont, display: 'block', textAlign: 'right', fontSize: '0.8rem', textDecoration: 'underline', marginTop: '0.5rem', fontWeight: 'bold' }}>VIEW REPORT →</a>
        </div>
      </div>
    );
  }

  if (type === 'niche') {
    if (!data) return null;
    return (
        <div className="newspaper-block intelligence-card" style={{ border: '1px solid #000', padding: '1rem', ...timesFont }}>
            <h4 style={{ ...timesFont, margin: 0, fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase' }}>Niche Bulletin</h4>
            <h3 style={{ ...timesFont, margin: '0.5rem 0', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', borderBottom: '1px solid #000' }}>{data.name}</h3>
            <p style={{ ...timesFont, fontSize: '0.8rem', marginTop: '0.5rem' }}>Active Pulse Reports: {data.report_count || 0}</p>
        </div>
    );
  }

  return null;
}
