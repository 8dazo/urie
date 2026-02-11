# Urie — Project Guidelines

Product: **AI agency + creator platform** (agency workflow, Kanban, scheduling, AI insights). See [plan/ai-agency-creator-platform.md](../plan/ai-agency-creator-platform.md) for full product and technical plan.

---

## Stack & structure

- **Frontend:** Next.js (App Router), React, TypeScript. UI in `app/` and shared components.
- **Backend:** Next.js API routes (`app/api/`) + server services; Prisma for data access.
- **DB:** MongoDB via Prisma. Schema: `prisma/schema.prisma`; sync with `npx prisma db push`; seed with `npx prisma db seed`.
- **Auth (planned):** JWT; agencies and creators via roles (see plan §1).

## Conventions

- **TypeScript:** Strict mode. Prefer interfaces and shared types; avoid `any`. Use path aliases from `tsconfig.json`.
- **Naming:** camelCase (variables, functions); PascalCase (components, types); kebab-case (files/folders when multiple words).
- **Components:** Functional components; colocate styles or use project CSS approach (e.g. `globals.css`, CSS modules, or Tailwind as configured).
- **API/Data:** Prisma schema is the single source of truth; use `PrismaClient` and generated types. Use constants for field names in app code when referencing often-renamed fields.
- **Schema changes:** Update `prisma/schema.prisma`, then `npx prisma db push` (and optionally `npx prisma generate`); run on staging first.

## Key locations

| Purpose              | Location |
|----------------------|----------|
| Product/tech plan    | `plan/ai-agency-creator-platform.md` |
| Project guidelines   | `docs/GUIDELINES.md` (this file) |
| Cursor rules         | `.cursor/rules/*.mdc` |
| Cursor project skill| `.cursor/skills/urie-project-context/` |
| App entry            | `app/` (Next.js App Router) |
| Prisma schema        | `prisma/schema.prisma` |
| Prisma seed          | `prisma/seed.ts` |
| API routes           | `app/api/` |

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Prisma push: `npx prisma db push` (syncs schema to MongoDB)
- Prisma seed: `npx prisma db seed` (creates mock agency, users, creators, campaign, tasks)
- Prisma generate: `npx prisma generate`

**MongoDB:** `MONGODB_URI` must include a database name (e.g. `...mongodb.net/urie?retryWrites=true&w=majority`). See `.env.example`.

## Priorities (from plan)

1. **Workflow first** — Kanban, campaigns, content tasks, approval flow.
2. **Platforms v1** — Instagram and TikTok only.
3. **Prisma + MongoDB** — Tenant model (agency-scoped); schema in Prisma; evolution via `db push` and backward-compatible deploys.
4. **AI** — Start with caption/hashtag suggestions, thread summarization, basic insight cards.

Follow `.cursor/rules/` for file-specific conventions (TypeScript, Next.js, API/MongoDB).
