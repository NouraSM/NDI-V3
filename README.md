# NDI-V3 — Sutherland Enterprise Data Management Office

Production backend for the NDI compliance dashboard. Next.js 14 (App Router,
TypeScript) frontend and API routes, PostgreSQL via Prisma, and Auth.js
credentials-based authentication with role-based access control.

The original static prototype is preserved at
`reference/NDI-Dashboard-original.html` for design reference — every screen
in this app is a 1:1 rebuild of it, now wired to a real database instead of
in-browser mock data generation.

## Stack

| Layer | Choice |
|---|---|
| Frontend + API | Next.js 14 (App Router), TypeScript, React Query |
| Database | PostgreSQL (Prisma ORM) |
| Auth | Auth.js (NextAuth v5) — credentials + bcrypt, JWT sessions, RBAC |
| Styling | Hand-written CSS ported from the original design (no framework) |
| Hosting (recommended, $0) | Vercel (app) + Supabase or Neon (Postgres) |

Auth is self-managed via Auth.js rather than a hosted auth provider — this
avoids a dependency on any single vendor and means the whole stack runs
against any plain Postgres connection string (local, Supabase, Neon, RDS,
etc.) without extra setup.

## Local development

Requires Node 20+ and a Postgres instance.

```bash
cp .env.example .env          # edit DATABASE_URL / AUTH_SECRET as needed
npm install
npm run db:migrate            # creates schema
npm run db:seed               # seeds 14 NDI domains + real assessment data
npm run dev                   # http://localhost:3000
```

Demo login: `admin@ndi.local` / `Password123!` (all seeded users share this
password — see `prisma/seed-data.ts` for the full list and their roles).

### Roles

| Role | Can do |
|---|---|
| `ADMIN` | Everything, including scheduling audits and managing findings |
| `AUDITOR` | Manage audits and findings |
| `DATA_STEWARD` | Edit evidence status/scores |
| `VIEWER` | Read-only |

Permission logic lives in one place: `src/lib/rbac.ts`.

## Deploying for free

1. **Database** — create a free [Supabase](https://supabase.com) project (or
   [Neon](https://neon.tech) if you'd rather avoid Supabase's 7-day
   inactivity auto-pause). Copy the Postgres connection string into
   `DATABASE_URL`.
2. **App** — push this repo to GitHub, import it into
   [Vercel](https://vercel.com) (Hobby plan, free), and set the environment
   variables from `.env.example` (`DATABASE_URL`, `AUTH_SECRET`,
   `NEXTAUTH_URL` = your Vercel URL).
3. Run migrations against the production database once:
   `DATABASE_URL=<prod-url> npx prisma migrate deploy`, then
   `DATABASE_URL=<prod-url> npx tsx prisma/seed.ts` to seed it.
4. Vercel auto-deploys on every push to `main`; PRs get preview deployments.

This stays at $0 indefinitely at this scale. If you outgrow the free tiers,
Supabase Pro ($25/mo) and Vercel Pro ($20/mo) are drop-in upgrades — no
architecture changes required.

## What's real vs. placeholder

- **Real**: the 14 NDI domains, the per-domain aggregate assessment numbers
  (complete/partial/incomplete counts, targets) for the current quarter —
  carried over verbatim from the original assessment data.
- **Placeholder**: individual evidence item *descriptions* (e.g. "Policy —
  Level 2 specification 3"), audit findings text, and activity trail
  entries. These are structured to match the real aggregate counts exactly
  (481 evidence rows total, matching the real total) but the specific
  wording is generated, not sourced from an actual evidence register.
  Replace `prisma/seed.ts` with a real import once that register exists —
  the schema and UI don't need to change, only the seed data.
- **Historical quarters** (2024 Q2–Q4): aggregate `DomainSnapshot` rows exist
  so the quarter selector genuinely changes the numbers shown (this was
  decorative/non-functional in the original prototype), but detailed
  per-evidence rows only exist for the current quarter (2025 Q1) — switching
  to a historical quarter shows an honest "detailed data only available for
  the current quarter" message on the granular charts instead of fabricating
  history that doesn't exist.

## Project structure

```
prisma/schema.prisma       Database schema (see Phase 2 design in original assessment)
prisma/seed.ts             Seed script (real aggregate data + realistic placeholder detail)
src/auth.ts                Auth.js config (credentials provider, JWT/session callbacks)
src/middleware.ts          Route protection (redirects pages, 401s API routes)
src/lib/rbac.ts            Permission map — single source of truth for roles
src/app/api/**             REST API routes
src/app/(app)/**           Protected pages (Overall, Dashboard, Domain Detail, Audit Center)
src/app/login/             Public login page
src/components/            Shared UI (shell, modals, charts)
```

## Testing what's here

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # next lint
npm run build        # production build
```

There is no automated test suite yet (see the execution plan in the original
assessment for the recommended Vitest/Playwright setup) — this was verified
manually end-to-end (login → every tab on every page → CRUD mutations →
CSV exports → RBAC enforcement) before this commit.
