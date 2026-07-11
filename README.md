# Kenji Sison — Portfolio

An interactive personal portfolio website built with Vite, React (TypeScript), D3.js, and SQLite (sql.js). Deployed as a static site on GitHub Pages — no server, no backend, no runtime database writes.

## What's here

The deployed site at **prosecutorpotato.github.io/portfolio** is a single-page scroll experience:

- **Career timeline** — D3.js horizontal timeline with hover-to-preview and click-to-pin event details
- **Capabilities graph** — force-directed graph visualising tech stack usage from commit history
- **Project gallery** — expandable marquee cards with contribution metrics
- **Experience** — scroll-reveal role cards with achievements, education, and certifications
- **Print resume** — print-optimized layout (Ctrl+P) with condensed experience and skills

## Why this exists

To present my career as a story rather than a list. The timeline and graph turn raw career data into something explorable; the project gallery shows what I've built without linking to private repositories.

## Tech

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React 19 + TypeScript |
| Visualisation | D3.js v7 |
| Database | SQLite via sql.js (WASM, in-browser) |
| Build-time ORM | Prisma (schema + seeding) |
| Hosting | GitHub Pages (static) |

## License

Personal portfolio. © Kenji Sison.