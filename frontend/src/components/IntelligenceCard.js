
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
      <div className="newspaper-block" style={timesFont}>
        <h4 style={{ ...timesFont, borderBottom: '2px double #000', paddingBottom: '2px', marginBottom: '0.6rem', textTransform: 'uppercase', fontSize: '1.1rem', textAlign: 'center', fontWeight: 'bold' }}>The Pulse</h4>



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
      <div className="newspaper-block" style={timesFont}>
        <h4 style={{ ...timesFont, borderBottom: '2px double #000', paddingBottom: '2px', marginBottom: '0.6rem', textTransform: 'uppercase', fontSize: '1.1rem', textAlign: 'center', fontWeight: 'bold' }}>Viral Intel</h4>
        <p style={{ ...timesFont, textAlign: 'center', opacity: 0.7, padding: '0.5rem 0', fontStyle: 'italic', fontSize: '0.85rem' }}>Monitoring global streams...</p>
      </div>

    );



    return (
      <div className="newspaper-block" style={timesFont}>
        <h4 style={{ ...timesFont, borderBottom: '2px double #000', paddingBottom: '2px', marginBottom: '0.6rem', textTransform: 'uppercase', fontSize: '1.1rem', textAlign: 'center', fontWeight: 'bold' }}>Viral Intel</h4>
        <div className="viral-card-content" style={{ padding: '0px' }}>
          {data.thumbnail && (
            <img
              src={data.thumbnail}
              alt={data.description?.slice(0, 40)}
              style={{ width: '100%', height: '140px', objectFit: 'cover', filter: 'grayscale(100%) sepia(50%) contrast(1.1)', marginBottom: '0.4rem', border: '1px solid #000' }}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #000', marginBottom: '0.4rem' }}>
            <span style={{ ...timesFont, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{data.platform}</span>
            <span style={{ ...timesFont, fontSize: '0.75rem' }}>{formatViews(data.views)} views</span>
          </div>
          <p style={{ ...timesFont, fontSize: '0.9rem', lineHeight: '1.2' }}>
            {data.description}
          </p>
          <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ ...timesFont, display: 'block', textAlign: 'right', fontSize: '0.75rem', textDecoration: 'underline', marginTop: '0.4rem', fontWeight: 'bold' }}>VIEW REPORT →</a>
        </div>
      </div>

    );
  }

  if (type === 'niche') {
    if (!data) return null;
    return (
        <div className="newspaper-block" style={timesFont}>
            <h4 style={{ ...timesFont, margin: 0, fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Bulletin</h4>
            <h3 style={{ ...timesFont, margin: '0.2rem 0', textTransform: 'uppercase', fontSize: '1.2rem', letterSpacing: '1px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px' }}>{data.name}</h3>
            <p style={{ ...timesFont, fontSize: '0.85rem', marginTop: '0.4rem', fontStyle: 'italic' }}>Active Pulse Reports: {data.report_count || 0}</p>
        </div>
    );
  }


  return null;
}
