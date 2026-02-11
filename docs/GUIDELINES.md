# Urie — Project Guidelines

Product: **AI agency + creator platform** (agency workflow, Kanban, scheduling, AI insights). See [plan/ai-agency-creator-platform.md](../plan/ai-agency-creator-platform.md) for full product and technical plan.

---

## Stack & structure

- **Frontend:** Next.js (App Router), React, TypeScript. UI in `app/` and shared components.
- **Backend (planned):** Node/TypeScript API; separate service or Next.js API routes; MongoDB.
- **DB:** MongoDB. Schema and migrations: see plan §3 and §8; migrations in `backend/migrations/` when added.
- **Auth (planned):** JWT; agencies and creators via roles (see plan §1).

## Conventions

- **TypeScript:** Strict mode. Prefer interfaces and shared types; avoid `any`. Use path aliases from `tsconfig.json`.
- **Naming:** camelCase (variables, functions); PascalCase (components, types); kebab-case (files/folders when multiple words).
- **Components:** Functional components; colocate styles or use project CSS approach (e.g. `globals.css`, CSS modules, or Tailwind as configured).
- **API/Data:** Single source of truth for schema (types + Mongoose or Zod). Use constants for field names to ease future renames.
- **Migrations:** Idempotent scripts; record completion in DB; run on staging before production; batch large collections by `agencyId` or `_id`.

## Key locations

| Purpose              | Location |
|----------------------|----------|
| Product/tech plan    | `plan/ai-agency-creator-platform.md` |
| Project guidelines   | `docs/GUIDELINES.md` (this file) |
| Cursor rules         | `.cursor/rules/*.mdc` |
| Cursor project skill| `.cursor/skills/urie-project-context/` |
| App entry            | `app/` (Next.js App Router) |
| Backend (when added) | e.g. `backend/` or `app/api/` + server services |

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Migrations (when added): `npm run migrate` or `node backend/scripts/migrate.js`

## Priorities (from plan)

1. **Workflow first** — Kanban, campaigns, content tasks, approval flow.
2. **Platforms v1** — Instagram and TikTok only.
3. **MongoDB** — Tenant model (agency-scoped); schema evolution via migrations and optional `schemaVersion`.
4. **AI** — Start with caption/hashtag suggestions, thread summarization, basic insight cards.

Follow `.cursor/rules/` for file-specific conventions (TypeScript, Next.js, API/MongoDB).
