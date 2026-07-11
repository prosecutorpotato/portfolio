import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import MarqueeModule from 'react-fast-marquee';
import type { Project, ContributionRole } from '../types';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { formatDate, relativeTime } from '../lib/format';
import '../styles/projects.css';

// Vite dev server doesn't resolve the CJS double-default-export correctly
// (MarqueeModule is { default: Component } in dev, Component in prod)
const Marquee = (MarqueeModule as unknown as { default: typeof MarqueeModule }).default ?? MarqueeModule;

interface ProjectsProps {
  projects: Project[];
}

const ROLE_BADGE: Record<ContributionRole, { label: string; class: string }> = {
  creator: { label: 'Creator', class: 'role--creator' },
  primary: { label: 'Primary', class: 'role--primary' },
  contributor: { label: 'Contributor', class: 'role--contributor' },
};

function parseLanguages(langStr: string): string[] {
  return langStr.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6);
}

function contributionPct(project: Project): number {
  return project.total_commits > 0
    ? Math.round((project.my_commits / project.total_commits) * 100)
    : 100;
}

export function Projects({ projects }: ProjectsProps) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  const [pinnedId, setPinnedId] = useState<number | null>(null);
  const [marqueeReady, setMarqueeReady] = useState(false);

  const sorted = useMemo(
    () => [...projects].sort((a, b) => b.last_commit_date.localeCompare(a.last_commit_date)),
    [projects],
  );

  // react-fast-marquee renders null on first pass, then mounts after its own
  // useEffect sets isMounted=true.  This flag lets our measurement effect run
  // only after the marquee children are actually in the DOM.
  useEffect(() => {
    setMarqueeReady(true);
  }, []);

  // Measure every collapsed card's natural height and set a CSS variable to
  // the tallest value so all tiles are uniform without clipping content.
  useLayoutEffect(() => {
    if (!marqueeReady) return;
    const section = ref.current;
    if (!section) return;
    const cards = section.querySelectorAll<HTMLElement>('.project-marquee-card');
    if (cards.length === 0) return;

    let max = 0;
    cards.forEach((card) => {
      card.style.height = 'auto'; // reveal natural content height
      max = Math.max(max, card.scrollHeight);
      card.style.height = ''; // let CSS variable take over
    });

    section.style.setProperty('--card-collapsed-height', `${max}px`);
  }, [marqueeReady, projects, ref]);

  return (
    <section id="projects" className="projects-section" ref={ref}>
      <div className="container">
        <p className="section-label">Open Source & Projects</p>
        <h2 className="section-title">GitHub repositories from the last two years</h2>
        <p className="projects-section__intro">
          A snapshot of repositories I've contributed to, derived from local git history.
          Hover to pause. Click a card to pin and expand details — click again to release.
        </p>
      </div>

      <div className={`projects-marquee-wrapper ${visible ? 'visible' : ''}`}>
        <Marquee
          speed={30}
          pauseOnHover
          play={pinnedId === null}
          gradient
        >
          {sorted.map((project) => {
            const isPinned = pinnedId === project.id;
            const langs = parseLanguages(project.languages);
            const role = ROLE_BADGE[project.contribution_role] || ROLE_BADGE.contributor;
            const pct = contributionPct(project);

            return (
              <div
                key={project.id}
                className={`project-marquee-card ${isPinned ? 'pinned' : ''}`}
                onClick={() => setPinnedId(isPinned ? null : project.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPinnedId(isPinned ? null : project.id);
                  }
                }}
              >
                <div className="project-marquee-card__header">
                  <h3 className="project-marquee-card__name">{project.name}</h3>
                  <span className={`project-marquee-card__role ${role.class}`}>{role.label}</span>
                </div>

                <p className="project-marquee-card__desc">{project.description}</p>

                <div className="project-marquee-card__footer">
                  <div className="project-marquee-card__langs">
                    {langs.map((lang) => (
                      <span key={lang} className="project-marquee-card__lang">{lang}</span>
                    ))}
                  </div>
                  <div className="project-marquee-card__stats">
                    <span className="project-marquee-card__pct">{pct}%</span>
                    <span className="project-marquee-card__sep">·</span>
                    <span className="project-marquee-card__commits">{project.my_commits} commits</span>
                    <span className="project-marquee-card__sep">·</span>
                    <span className="project-marquee-card__date">{relativeTime(project.last_commit_date)}</span>
                  </div>
                </div>

                {isPinned && (
                  <div className="project-marquee-card__expanded">
                    <div className="project-marquee-card__stat">
                      <span className="project-marquee-card__stat-label">My Commits</span>
                      <span className="project-marquee-card__stat-value">{project.my_commits}</span>
                    </div>
                    <div className="project-marquee-card__stat">
                      <span className="project-marquee-card__stat-label">Total Commits</span>
                      <span className="project-marquee-card__stat-value">{project.total_commits}</span>
                    </div>
                    <div className="project-marquee-card__stat">
                      <span className="project-marquee-card__stat-label">First Commit</span>
                      <span className="project-marquee-card__stat-value">{formatDate(project.first_commit_date)}</span>
                    </div>
                    <div className="project-marquee-card__stat">
                      <span className="project-marquee-card__stat-label">Last Active</span>
                      <span className="project-marquee-card__stat-value">{formatDate(project.last_commit_date)}</span>
                    </div>
                    <div className="project-marquee-card__stat">
                      <span className="project-marquee-card__stat-label">Organisation</span>
                      <span className="project-marquee-card__stat-value">{project.organisation}</span>
                    </div>
                    {project.is_fork && (
                      <div className="project-marquee-card__stat">
                        <span className="project-marquee-card__stat-label">Note</span>
                        <span className="project-marquee-card__stat-value project-marquee-card__fork-note">Forked repository</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="project-marquee-card__hint">
                  {isPinned ? 'Click to release ▲' : 'Click to expand ▼'}
                </div>
              </div>
            );
          })}
        </Marquee>
      </div>

      <div className="container">
        <p className="projects-count">
          {projects.length} repositories · click to pin
        </p>
      </div>
    </section>
  );
}