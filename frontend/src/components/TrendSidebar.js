
export default function TrendSidebar({ trends = [] }) {
  if (trends.length === 0) return (
    <div className="newspaper-block">
      <h4>The Pulse</h4>
      <p style={{ textAlign: 'center', opacity: 0.7, color: 'var(--paper-text)' }}>Scanning the wire...</p>
    </div>
  );

  return (
    <div className="newspaper-block">
      <h4>The Pulse</h4>
      <div className="trending-list">
        {trends.slice(0, 6).map((trend, idx) => (
          <a
            key={idx}
            href={`https://news.google.com/search?q=${encodeURIComponent(trend.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="trend-topic"
            style={{ borderBottom: '1px dotted var(--paper-border)' }}
          >
            <div className="trend-rank" style={{ color: '#000', fontFamily: "'Chomsky', sans-serif", fontSize: '1.4rem', paddingRight: '0.5rem' }}>#{trend.ranking}</div>
            <div className="trend-info">
              <div className="trend-name" style={{ color: '#000', fontFamily: "'Baskervville', serif", fontWeight: 'bold', fontSize: '1.1rem' }}>{trend.name}</div>
              <div className="trend-desc" style={{ color: '#222', fontFamily: "'Baskervville', serif", fontSize: '0.9rem' }}>{trend.description?.slice(0, 80)}...</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
