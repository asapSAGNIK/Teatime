import Link from 'next/link';

export default function Header() {
  return (
    <header className="newspaper-nav">
      <div className="container header-content">
        <Link href="/" className="site-title">
          <span style={{color: '#8b0000', fontSize: '1.2rem', fontFamily: 'var(--font-serif)', verticalAlign: 'super'}}>- the -</span>
          Teatime
        </Link>
        
        <nav className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/category/Tech & AI">Tech & AI</Link>
          <Link href="/category/Business & Finance">Business & Finance</Link>
          <Link href="/category/Sports">Sports</Link>
          <Link href="/category/World & Politics">World & Politics</Link>
        </nav>
      </div>
    </header>
  );
}
