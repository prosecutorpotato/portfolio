import '../styles/hero.css';

export function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero__bg-grid" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />
      <div className="container hero__content">
        <p className="hero__eyebrow">Data / Analytics / LLM-Ops Engineer</p>
        <h1 className="hero__name">
          Kenji <span className="hero__name-accent">Sison</span>
        </h1>
        <p className="hero__tagline">
          I build data systems that tell stories — from warehouse architecture
          to agentic AI. Turning raw data into decisions is what I do best.
        </p>
        <div className="hero__stats">
          <div className="hero__stat">
            <span className="hero__stat-num">7+</span>
            <span className="hero__stat-label">Years in data</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-num">4</span>
            <span className="hero__stat-label">Companies</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-num">30+</span>
            <span className="hero__stat-label">Tools in stack</span>
          </div>
        </div>
        <div className="hero__actions">
          <a href="#timeline" className="hero__btn hero__btn--primary">
            Explore my journey
          </a>
          <a
            href="https://github.com/prosecutorpotato"
            target="_blank"
            rel="noopener noreferrer"
            className="hero__btn hero__btn--secondary"
          >
            GitHub ↗
          </a>
          <a
            href="https://www.linkedin.com/in/kenji-sison/"
            target="_blank"
            rel="noopener noreferrer"
            className="hero__btn hero__btn--secondary"
          >
            LinkedIn ↗
          </a>
        </div>
      </div>
      <div className="hero__scroll-hint" aria-hidden="true">
        <span>scroll</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  );
}