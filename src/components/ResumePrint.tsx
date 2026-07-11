import type { ProfileData } from '../types';
import { formatDateRange } from '../lib/format';
import '../styles/print.css';

interface ResumePrintProps {
  data: ProfileData;
}

// ── Hardcoded skill/tool groups for the resume ──────────────
// Overrides the database values with richer, more specific items
const RESUME_SKILL_GROUPS: { cat: string; items: string[] }[] = [
  {
    cat: 'Snowflake Stack',
    items: [
      'Snowflake', 'Cortex Agent', 'Cortex Analyst', 'Cortex Search',
      'Dynamic Tables', 'Integrations', 'Snowpipe', 'Streamlit',
    ],
  },
  {
    cat: 'dbt',
    items: ['dbt (build, clone, defer, unit-testing, microbatching, model-versioning)'],
  },
  {
    cat: 'AWS Stack',
    items: ['S3', 'Redshift', 'Lambda', 'EventBridge', 'Fargate', 'DynamoDB', 'Connect'],
  },
  {
    cat: 'AI/ML & LLMOps',
    items: [
      'RAG (Cortex Search, Amazon OpenSearch Serverless)',
      'LLM-as-Judge (DeepEval, TruLens)',
      'Semantic Modelling (Cortex Analyst)',
      'Cortex Agents for Snowflake Intelligence',
    ],
  },
  {
    cat: 'BI & Visualisation',
    items: ['Power BI', 'Tableau', 'Jupyter Notebooks', 'Streamlit'],
  },
  {
    cat: 'Databases',
    items: ['Snowflake', 'MySQL RDS', 'PostgreSQL'],
  },
  {
    cat: 'DevOps & CI/CD',
    items: ['Buildkite', 'GitHub Actions', 'Sumologic', 'Git'],
  },
  {
    cat: 'Languages',
    items: ['Python', 'SQL', 'TypeScript', 'PowerQuery / DAX'],
  },
  {
    cat: 'Data Engineering',
    items: ['ETL/ELT', 'Data Pipeline Design', 'Data Modelling', 'Data Warehousing'],
  },
  {
    cat: 'Business Operations',
    items: ['Process Refinement', 'Change Implementation', 'Stakeholder Communication', 'Mentoring & Coaching'],
  },
];

export function ResumePrint({ data }: ResumePrintProps) {
  const { roles, education, awards, projects } = data;

  // Latest 3 roles including current (roles are ordered newest→oldest in seed)
  const recentRoles = roles.slice(0, 3);

  // Top 8 projects, Creator + Primary Contributor, most recent first
  const topProjects = projects
    .filter((p) => p.contribution_role === 'creator' || p.contribution_role === 'primary')
    .sort((a, b) => b.last_commit_date.localeCompare(a.last_commit_date))
    .slice(0, 8);

  // Group certifications by issuer
  const certGroups = new Map<string, string[]>();
  for (const a of awards) {
    // Normalise issuer names for grouping
    let issuer = a.issuer;
    if (issuer.includes('Coursera')) issuer = 'Coursera';
    else if (issuer.includes('DataCamp')) issuer = 'DataCamp';
    else if (issuer.includes('Snowflake')) issuer = 'Snowflake';
    else if (issuer.includes('Total TypeScript')) issuer = 'Total TypeScript';
    else if (issuer.includes('dbt Labs')) issuer = 'dbt Labs';
    else if (issuer.includes('Duke University')) issuer = 'Coursera';

    if (!certGroups.has(issuer)) certGroups.set(issuer, []);
    certGroups.get(issuer)!.push(a.title);
  }

  return (
    <div className="resume-print" aria-hidden="true">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="resume-print__header">
        <h1 className="resume-print__name">Kenji Sison</h1>
        <p className="resume-print__title">Senior Analytics Engineer</p>
        <div className="resume-print__contact">
          <span className="resume-print__contact-item">kenjisison2@gmail.com</span>
          <span className="resume-print__contact-item">Adelaide, SA, Australia</span>
          <span className="resume-print__contact-item">linkedin.com/in/kenji-sison</span>
          <span className="resume-print__contact-item">github.com/prosecutorpotato</span>
        </div>
      </header>

      {/* ── About Me ─────────────────────────────────────── */}
      <section className="resume-print__section">
        <h2 className="resume-print__section-title">About Me</h2>
        <p className="resume-print__summary">
          Senior Analytics Engineer at nib Group with 7+ years across data engineering,
          analytics, and AI/ML. Building and maintaining data pipelines with dbt and Snowflake,
          pioneering new dbt capabilities, and innovating with Snowflake Cortex to create
          AI-powered products. Experienced in DataVault and Kimball modelling, CI/CD, and
          facilitating ML/LLMOps workflows.
        </p>
      </section>

      {/* ── Experience (latest 3 only) ───────────────────── */}
      <section className="resume-print__section">
        <h2 className="resume-print__section-title">Experience</h2>
        {recentRoles.map((role) => (
          <div key={role.id} className="resume-print__role">
            <div className="resume-print__role-header">
              <span className="resume-print__role-title">{role.title}</span>
              <span className="resume-print__role-dates">
                {formatDateRange(role.start_date, role.end_date)}
              </span>
            </div>
            <p className="resume-print__role-company">
              {role.company} — {role.location}
            </p>
            <p className="resume-print__role-desc">{role.description}</p>
            {role.achievements.length > 0 && (
              <ul className="resume-print__achievements">
                {role.achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      {/* ── Skills & Tools (page 2) ────────────────────── */}
      <section className="resume-print__section resume-print__section--page2">
        <h2 className="resume-print__section-title">Skills &amp; Tools</h2>
        <div className="resume-print__skills-grid">
          {RESUME_SKILL_GROUPS.map((g) => (
            <div key={g.cat} className="resume-print__skill-group">
              <p className="resume-print__skill-cat">{g.cat}</p>
              <p className="resume-print__skill-items">{g.items.join(', ')}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Projects (condensed — name + one-liner) ──────── */}
      {topProjects.length > 0 && (
        <section className="resume-print__section">
          <h2 className="resume-print__section-title">Some of my Projects</h2>
          {topProjects.map((p) => (
            <div key={p.id} className="resume-print__project">
              <span className="resume-print__project-name">{p.name}</span>
              <span className="resume-print__project-sep"> — </span>
              <span className="resume-print__project-desc-inline">
                {p.description.length > 130 ? p.description.slice(0, 127) + '…' : p.description}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* ── Education ───────────────────────────────────── */}
      <section className="resume-print__section">
        <h2 className="resume-print__section-title">Education</h2>
        {education.map((edu) => (
          <div key={edu.id} className="resume-print__edu">
            <div className="resume-print__role-header">
              <span className="resume-print__edu-qualification">{edu.qualification}</span>
              <span className="resume-print__edu-dates">
                {formatDateRange(edu.start_date, edu.end_date)}
              </span>
            </div>
            <p className="resume-print__edu-institution">{edu.institution}</p>
          </div>
        ))}
      </section>

      {/* ── Certifications (grouped by issuer) ────────────── */}
      {certGroups.size > 0 && (
        <section className="resume-print__section resume-print__section--certs">
          <h2 className="resume-print__section-title">Certifications</h2>
          <div className="resume-print__cert-groups">
            {Array.from(certGroups.entries()).map(([issuer, titles]) => (
              <div key={issuer} className="resume-print__cert-group">
                <span className="resume-print__cert-issuer-label">{issuer}</span>
                <span className="resume-print__cert-sep">: </span>
                <span className="resume-print__cert-titles">{titles.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}