import { useEffect, useState } from 'react';
import '../styles/nav.css';

const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'skills', label: 'Skills & Tools' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

export function Nav() {
  const [active, setActive] = useState('hero');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      // Find which section is currently in view
      const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
      const midpoint = window.scrollY + window.innerHeight / 2;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i]!.offsetTop <= midpoint) {
          setActive(SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <a href="#hero" className="nav__logo" aria-label="Kenji Sison">
          KS
        </a>
        <ul className="nav__links">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`nav__link ${active === s.id ? 'nav__link--active' : ''}`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          className="nav__cta nav__cta--download"
          onClick={() => window.print()}
          aria-label="Download PDF resume"
        >
          ↓ PDF
        </button>
      </div>
    </nav>
  );
}