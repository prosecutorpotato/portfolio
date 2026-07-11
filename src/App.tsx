import './App.css'

type ExperienceItem = {
  period: string
  role: string
  summary: string
}

type SkillItem = {
  label: string
  strength: number
}

const experiences: ExperienceItem[] = [
  {
    period: '2024 — Present',
    role: 'Software Engineer',
    summary: 'Building resilient products with a focus on user-centric architecture and delivery.'
  },
  {
    period: '2022 — 2024',
    role: 'Platform Engineer',
    summary: 'Improved reliability and developer velocity through automation and observability.'
  },
  {
    period: '2020 — 2022',
    role: 'Data Analyst',
    summary: 'Translated complex metrics into clear narratives that informed product strategy.'
  }
]

const skills: SkillItem[] = [
  { label: 'TypeScript', strength: 90 },
  { label: 'React', strength: 85 },
  { label: 'Data Storytelling', strength: 88 },
  { label: 'System Design', strength: 78 }
]

function App() {
  return (
    <main className="page">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">LinkedIn Companion</p>
        <h1 id="page-title">Hi, I&apos;m Potato.</h1>
        <p className="lead">
          This site turns my professional journey into a visual story: who I am, what I build, and how I create impact.
        </p>
      </section>

      <section className="grid" aria-label="Experience and highlights">
        <article className="panel timeline">
          <h2>Experience Timeline</h2>
          <ul>
            {experiences.map((item) => (
              <li key={item.period}>
                <p className="period">{item.period}</p>
                <p className="role">{item.role}</p>
                <p>{item.summary}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Strength Snapshot</h2>
          <ul className="skills">
            {skills.map((skill) => (
              <li key={skill.label}>
                <div>
                  <span>{skill.label}</span>
                  <strong>{skill.strength}%</strong>
                </div>
                <div className="bar" role="img" aria-label={`${skill.label} strength ${skill.strength}%`}>
                  <span style={{ width: `${skill.strength}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}

export default App
