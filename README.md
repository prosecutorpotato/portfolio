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

## How data gets here

This repo is a **static frontend**. The data it displays is built elsewhere:

**[portfolio-backend](https://github.com/prosecutorpotato/portfolio-backend)** is the source of truth for all profile data. It owns the Prisma schema, migrations, seed data, and commit analysis. On every push to its `main` branch, CI builds a `profile.db` (SQLite) and `profile-types.ts` (TypeScript), then opens an auto-PR on this repo with those two files. You review and merge that PR — and the deploy workflow ships the new site to GitHub Pages.

**To add a new role, project, award, etc.** — see the [portfolio-backend README](https://github.com/prosecutorpotato/portfolio-backend/blob/main/README.md#how-to-add-new-data). You create a Prisma migration with your INSERT statement, push it, and the auto-PR appears here within a minute or two.

## Local development

```bash
npm install              # install deps
npm run dev              # start Vite dev server at localhost:5173/portfolio/
npm run build            # full local build (tsc + vite)
npm run build:ci         # CI build (same as build, but no db:build)
npm run preview          # preview the production build at localhost:4173/portfolio/
npm run lint             # oxlint
```

You'll need a `public/profile.db` in this repo to render anything. It's committed to the repo, so a fresh clone has the latest data.

If you're working on the frontend in isolation and want to use test data, you can drop any SQLite file with the expected schema (see `src/types/profile.ts`) into `public/profile.db`.

## Tech

| Layer | Choice |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| Visualisation | D3.js v7 |
| Database | SQLite via sql.js (WASM, in-browser) |
| Hosting | GitHub Pages (static) |

## License

Personal portfolio. © Kenji Sison.
