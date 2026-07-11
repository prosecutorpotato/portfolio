import { useEffect, useMemo, useState } from 'react';
import type { Role, Education, Award } from '../types';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { formatDateRange, formatMonthYear } from '../lib/format';
import '../styles/experience.css';

interface ExperienceProps {
  roles: Role[];
  education: Education[];
  awards: Award[];
}

// ── Streaming text component ──────────────────────────────────────────────
// Reveals text word-by-word when `start` becomes true, giving a "streamed in"
// effect.  A blinking cursor is shown while streaming is in progress.
function StreamText({ text, start, speed = 35 }: { text: string; start: boolean; speed?: number }) {
  const [count, setCount] = useState(0);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const complete = count >= words.length;

  useEffect(() => {
    if (!start) {
      setCount(0);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCount(i);
      if (i >= words.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [start, speed, text]);

  if (!start) return null;

  return (
    <>
      {words.slice(0, count).join(' ')}
      {!complete && <span className="stream-cursor">▋</span>}
    </>
  );
}

export function Experience({ roles, education, awards }: ExperienceProps) {
  const [showEducation, setShowEducation] = useState(false);
  const [showAwards, setShowAwards] = useState(false);

  return (
    <section id="experience" className="experience-section">
      <div className="container">
        <p className="section-label">The Details</p>
        <h2 className="section-title">Where I've made an impact</h2>

        <div className="experience-roles">
          {roles.map((role, i) => (
            <ExperienceCard key={role.id} role={role} index={i} />
          ))}
        </div>

        {/* Education — collapsible */}
        <div className="experience-collapsible">
          <button
            className="experience-collapsible__header"
            onClick={() => setShowEducation(!showEducation)}
            aria-expanded={showEducation}
          >
            <span className="experience-collapsible__title">Education ({education.length})</span>
            <span className={`experience-collapsible__chevron ${showEducation ? 'open' : ''}`}>▸</span>
          </button>
          {showEducation && (
            <div className="experience-collapsible__content">
              {education.map((edu) => (
                <div key={edu.id} className="experience-edu-card">
                  <h4 className="experience-edu-qualification">{edu.qualification}</h4>
                  <p className="experience-edu-institution">{edu.institution}</p>
                  <p className="experience-edu-date">
                    {formatDateRange(edu.start_date, edu.end_date)}
                  </p>
                  <p className="experience-edu-desc">{edu.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Awards & Certifications — collapsible */}
        <div className="experience-collapsible">
          <button
            className="experience-collapsible__header"
            onClick={() => setShowAwards(!showAwards)}
            aria-expanded={showAwards}
          >
            <span className="experience-collapsible__title">
              Awards &amp; Certifications ({awards.length})
            </span>
            <span className={`experience-collapsible__chevron ${showAwards ? 'open' : ''}`}>▸</span>
          </button>
          {showAwards && (
            <div className="experience-collapsible__content">
              <div className="experience-awards-list">
                {awards.map((award) => (
                  <div key={award.id} className="experience-award-card">
                    <div className="experience-award-icon">★</div>
                    <div className="experience-award-content">
                      <h4 className="experience-award-title">{award.title}</h4>
                      <p className="experience-award-issuer">{award.issuer}</p>
                      <p className="experience-award-date">
                        {formatMonthYear(award.date)}
                      </p>
                      <p className="experience-award-desc">{award.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({ role, index }: { role: Role; index: number }) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  const [streamIndex, setStreamIndex] = useState(0);

  // Total streaming items: 1 (description) + N (achievements)
  const totalItems = 1 + role.achievements.length;

  useEffect(() => {
    if (!visible) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Start with description, then cascade through achievements
    for (let i = 0; i < totalItems; i++) {
      timers.push(setTimeout(() => setStreamIndex(i + 1), i * 500));
    }
    return () => timers.forEach(clearTimeout);
  }, [visible, totalItems]);

  return (
    <div
      ref={ref}
      className={`experience-card ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="experience-card__header">
        <div>
          <h3 className="experience-card__title">
            {role.title}
            {role.is_current && (
              <span className="experience-card__badge">
                <span className="experience-card__badge-dot" /> Current role
              </span>
            )}
          </h3>
          <p className="experience-card__company">
            {role.company} <span className="experience-card__separator">·</span>{' '}
            <span className="experience-card__location">{role.location}</span>
          </p>
        </div>
        <span className="experience-card__dates">{formatDateRange(role.start_date, role.end_date)}</span>
      </div>

      <p className="experience-card__desc">
        <StreamText text={role.description} start={streamIndex >= 1} />
      </p>

      <ul className="experience-card__achievements">
        {role.achievements.map((achievement, i) => (
          <li key={i} className="experience-card__achievement">
            <span className="experience-card__achievement-dot" />
            <StreamText text={achievement} start={streamIndex >= i + 2} />
          </li>
        ))}
      </ul>
    </div>
  );
}