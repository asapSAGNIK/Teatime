import Link from 'next/link';

export default function ArticleCard({ article }) {
  // Safe extraction
  const category = article?.category || 'News';
  const headline = article?.headline || 'Breaking News';
  const subtitle = article?.subtitle || '';
  const slug = article?.slug || '#';
  const readTime = article?.read_time || 5;

  let rawBody = article?.body || '';

  // 1. Self-healing: Extract nested JSON if Groq leaked raw JSON output into the body string
  if (rawBody.includes('```json')) {
    try {
      const jsonMatch = rawBody.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.body) rawBody = parsed.body;
      } else {
        rawBody = rawBody.replace(/```json/gi, '').replace(/```/g, '');
      }
    } catch (e) {
      rawBody = rawBody.replace(/```json/gi, '').replace(/```/g, '');
    }
  }

  // 2. Strip standard markdown wrappers if any remain
  rawBody = rawBody.replace(/```([\s\S]*?)```/g, '');

  // 3. Split into paragraphs and scrub markdown symbols
  const paragraphs = rawBody
    .split(/\n+/)
    .map(p => p.trim())
    .map(p => {
      // Drop standalone headings (less than 60 chars) entirely
      if (p.match(/^#+\s*[a-zA-Z\s\/&-]+$/) && p.length < 60) return '';
      
      // Strip markdown hashes
      let cleaned = p.replace(/^#+\s*/, '');
      
      // Strip common AI meta-labels at the start of paragraphs
      cleaned = cleaned.replace(/^(Introduction|Context|Background|Context\/Background|Leading Paragraph|Specific Data|Perspectives|Key Takeaways|Conclusion|Summary)[\s:-]*/i, '');
      
      // Strip asterisks
      return cleaned.replace(/\*\*/g, '');
    })
    .filter(p => p.length > 30); // Remove empty or tiny parsed elements

  return (
    <article className="article-card">
      <div className="article-card-header">
        <span className="article-category">{category}</span>
        <h2>{headline}</h2>
        {subtitle ? <p className="newspaper-lede">{subtitle}</p> : null}
        <div className="article-card-meta">
          {readTime} min read • AI Authored
        </div>
      </div>
      
      {paragraphs.length > 0 && (
        <div className="article-body-columns">
          {paragraphs.map((para, i) => (
            <p key={i} className={i === 0 ? 'drop-cap-para' : ''}>
              {i === 0 ? (
                <>
                  <span className="drop-cap-letter">{para.charAt(0)}</span>
                  {para.slice(1)}
                </>
              ) : (
                para
              )}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
