"use client";
import Link from 'next/link';
import { useState } from 'react';

export default function ArticleCard({ article }) {
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    try {
      const htmlContent = `
        <div style="font-family: 'Times New Roman', Times, serif;">
          <h2><strong>${headline}</strong></h2>
          <br/>
          ${paragraphs.map(p => `<p>${p}</p>`).join('\n')}
        </div>
      `;
      
      const textContent = `${headline}\n\n${paragraphs.join('\n\n')}`;

      // ClipboardItem support Check
      if (window.ClipboardItem) {
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([textContent], { type: 'text/plain' });
        
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
          })
        ]);
      } else {
        // Fallback for Firefox or older browsers
        await navigator.clipboard.writeText(textContent);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      try {
        const fallbackText = `${headline}\n\n${paragraphs.join('\n\n')}`;
        await navigator.clipboard.writeText(fallbackText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed', fallbackErr);
      }
    }
  };

  return (
    <article className="article-card group" style={{ position: 'relative' }}>
      <button 
        onClick={handleCopy}
        className="copy-capsule"
        title="Copy article"
      >
        {copied ? 'COPIED' : 'COPY'}
      </button>

      <div className="article-card-header">
        <span className="article-category">{category}</span>
        <h2>{headline}</h2>
        {subtitle ? <p className="newspaper-lede">{subtitle}</p> : null}
      </div>
      
      {paragraphs.length > 0 && (
        <div className="article-body-columns">
          {paragraphs.slice(0, 3).map((para, i) => (
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
          <div className="continued-container" style={{ marginTop: '0.4rem' }}>
            {paragraphs.length > 3 && (
                <Link href={`/article/${slug}`} className="continued-label">
                    CONTINUED.
                </Link>
            )}
          </div>
        </div>
      )}
    </article>


  );
}
