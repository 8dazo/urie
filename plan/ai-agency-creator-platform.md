# AI Agency + Creator Platform — Product & Technical Plan

> **Overview:** Design for an AI-first agency + creator platform with MongoDB: multi-account creators, agency–creator workflows (Kanban), content scheduling (IG + TikTok first), and AI-powered insights. Competitors: SideShift, Postiz.

---

## Goal

- **Strong agency–creator workflow & Kanban** (top priority)
- **Content scheduling & posting** (Instagram + TikTok first)
- **AI-powered insights, recommendations, and assistance**
- **MongoDB** as the primary database

---

## 1. Core user types & roles

- **Agency** — Owns workspaces; onboard/manage creators; request content; review, approve/reject; schedule or post. Team roles: Owner, Manager, Analyst, Editor.
- **Creator** — Connects multiple social accounts per platform (e.g. 2–3 Instagram, 2 TikTok); uploads drafts; responds to feedback; schedules or posts. May work with one or multiple agencies (start with single-agency).
- **Optional later:** Client/Brand (reporting), External freelancer/editor.

---

## 2. High-level workflow

### 2.1 Campaigns & briefs

- Agency creates campaign/brief: brand, goals, platforms (IG, TikTok), timelines, budget, content volume; attaches examples, moodboards.
- Agency assigns to creators with deliverables (e.g. 3 TikTok videos, 5 IG reels per creator).

### 2.2 Kanban task flow

Default columns:

- **Backlog** — Not started  
- **In_Progress** — Creator working  
- **Submitted_By_Creator** — Draft uploaded  
- **Needs_Changes** — Agency requested revisions  
- **Approved** — Ready to schedule/post  
- **Scheduled** — Has scheduled time  
- **Published** — Posted

Each card = **ContentTask** (e.g. “IG Reel about product launch”).

### 2.3 Review & approval

- Creator uploads draft (video, caption, thumbnail, platform, target accounts).
- Agency: comments, caption suggestions, thumbnails, due dates, column moves.
- On approval: **Schedule** or **Post now** per connected account.

### 2.4 Scheduling & posting (IG + TikTok first)

- OAuth + tokens for social accounts; read analytics + write posts.
- Schedule: pick accounts, time(s), timezone; caption, hashtags, media → saved as scheduled job.
- Worker runs at scheduled time; on success mark Published + store `platformPostId`; on failure notify (in-app, email, Slack).

---

## 3. Data model: Prisma + MongoDB

**ORM:** Prisma on top of MongoDB. Single source of truth: `prisma/schema.prisma`. Sync schema with `npx prisma db push` (MongoDB has no SQL-style migrations).

Tenant model: **Agency** owns most data.

| Model (Prisma)       | Key fields |
|---------------------|------------|
| `Agency`            | id, name, slug, ownerUserId, settings (JSON) |
| `User`               | id, email, passwordHash, role (enum), profile (JSON) |
| `AgencyMember`      | id, agencyId, userId, role (enum), permissions (JSON?) |
| `Creator`           | id, agencyId, userId?, displayName, notes, tags (array) |
| `SocialAccount`     | id, creatorId, agencyId, platform, handle, externalId, status, meta (JSON); tokens stored encrypted server-side |
| `Campaign`          | id, agencyId, name, description, status, platforms (array), startDate, endDate |
| `ContentTask`       | id, agencyId, campaignId?, creatorId, assignedToUserId?, title, description, platform, kanbanColumn, orderIndex, dueAt, createdAt, updatedAt; targetSocialAccountIds (array of IDs) |
| `Asset`             | id, agencyId, contentTaskId, type, storageProvider, url, metadata (JSON) |
| `CaptionVersion`    | id, contentTaskId, createdByUserId, text, language, createdAt |
| `Comment`           | id, contentTaskId, authorUserId, body, createdAt |
| `ScheduledPost`     | id, contentTaskId, agencyId, socialAccountId, platform, scheduledFor, status, platformPostId?, error? |
| `PostMetrics`       | id, scheduledPostId, snapshotTime, impressions, views, likes, etc.; ctr, engagementRate (optional) |

**Indexes:** Defined in `schema.prisma` with `@@index([agencyId])`, `@@index([agencyId, campaignId, creatorId, kanbanColumn])` on ContentTask, etc.

---

## 4. AI integration (AI-first agency)

- **Workflow:** Smart task creation from briefs; AI summarization of comment threads; status hints; workload planning.
- **Content:** Caption/hook/hashtag generation; repurposing (e.g. TikTok → IG Reel); thumbnail/title suggestions; localization; quality checks (policy, brand guidelines).
- **Insights:** Performance explanations; action recommendations; benchmarking; forecasting.
- **Co-pilot:** Chat with workspace (“creators underperforming on TikTok”); draft reminders and client summaries.

**MVP AI:** Caption + hashtag suggestions; thread summarization; basic “Top 3 posts & why” insight cards.

---

## 5. System architecture

- **Frontend:** Next.js (or similar) — Kanban, calendar, dashboards.
- **Backend:** Node/TypeScript API (REST or GraphQL); JWT auth; services: Campaign, ContentTask, Scheduling, Metrics, AI.
- **DB:** MongoDB via Prisma; schema in `prisma/schema.prisma`; sync with `prisma db push`.
- **Workers:** Job queue (e.g. BullMQ) for scheduled posts, metrics sync, AI jobs.
- **Storage:** S3 (or equivalent) for media.
- **Integrations:** IG + TikTok APIs first; notifications (email, Slack, in-app).

---

## 6. MVP slice (workflow + IG/TikTok)

1. Accounts & roles — Agency signup; creator invites; Owner / Manager / Creator.
2. Creators & social accounts — Profiles; multiple IG + TikTok accounts per creator.
3. Kanban — Campaigns; ContentTask board; file uploads; comments.
4. Approval & scheduling — Approve/reject; create scheduled_posts (manual or API when ready).
5. Basic analytics — Store metrics; simple dashboards per creator/campaign.
6. Initial AI — Caption/hashtag suggestions; thread summarization; basic insight cards.

Then: full auto-post, more platforms, deeper AI.

---

## 7. Future DB changes (schema evolution with Prisma)

- **Schema in code:** Prisma schema (`prisma/schema.prisma`) is the single source of truth; generate client with `npx prisma generate`.
- **MongoDB + Prisma:** Use `npx prisma db push` to sync schema to DB (no migration history; for production, review changes and run push during maintenance or with backward-compatible app).
- **Add optional field:** Add in schema, run `db push`; existing docs get the field as undefined/missing; app defaults in code.
- **Rename field:** Add new field in schema; deploy code that reads both (old fallback); backfill data; switch to new field; remove old from schema and push.
- **New model/index:** Add to schema, run `db push`. Run on staging first.

---

## 8. Reference

- **Competitors:** SideShift (creator campaigns, hiring, payouts), Postiz (scheduling, AI captions, multi-platform).
- **Plan doc:** This file. See also `docs/GUIDELINES.md` and `.cursor/rules/` for implementation conventions.
