# Security

## Overview

This is a static personal portfolio site hosted on GitHub Pages. No server, no backend, no runtime database writes, no authentication.

## What's public

- Source code for the frontend (React + D3.js + sql.js)
- A pre-built SQLite database (`public/profile.db`) containing curated profile data (roles, projects, timeline events, tools, skills, certifications) and derived graph topology
- The sql.js WASM binary (`public/sql-wasm.wasm`)

## What's not in the repo

- Build-time scripts (`prisma/`, `scripts/`, commit analysis, LLM pipeline) — these live in the separate [portfolio-backend](https://github.com/prosecutorpotato/portfolio-backend) repo, not this one
- Internal architecture documentation (`docs/`) — kept in the backend repo
- Raw commit data — purged from the deployed database at build time (only derived graph topology remains)
- Internal repository names, internal system names, Jira ticket references — not in the repo or the deployed database
- Environment files, secrets, API keys — gitignored; none are needed for the site

## Contact form

Uses [FormSubmit.co](https://formsubmit.co) — a free form-to-email service that requires no API key or backend. Submissions are sent directly to email.

## Reporting

Found a security issue? Email kenjisison2@gmail.com.