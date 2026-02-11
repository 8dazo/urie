---
name: urie-project-context
description: Provides product and technical context for the Urie AI agency + creator platform. Use when implementing features, APIs, or data models for agencies, creators, Kanban workflow, scheduling, social accounts (IG/TikTok), or MongoDB schema.
---

# Urie project context

## When to use this skill

- Implementing or changing agency/creator workflows, Kanban, campaigns, or content tasks.
- Adding or changing API routes, services, or MongoDB models for this product.
- Working with social accounts (Instagram, TikTok), scheduled posts, or post metrics.
- Planning or writing migrations or schema changes.

## Core references

- **Full plan:** `plan/ai-agency-creator-platform.md` — goals, user types, workflow, MongoDB collections, AI integration, MVP, schema evolution.
- **Guidelines:** `docs/GUIDELINES.md` — stack, conventions, locations, priorities.

## Quick facts

- **Users:** Agency (team roles), Creator (multiple social accounts per platform).
- **Workflow:** Campaign → ContentTask Kanban (Backlog → In_Progress → Submitted_By_Creator → Needs_Changes → Approved → Scheduled → Published).
- **Platforms v1:** Instagram, TikTok. One creator can have multiple accounts per platform.
- **DB:** MongoDB; tenant model (agency-scoped); migrations idempotent, optional `schemaVersion`.
- **Priorities:** Workflow first, then scheduling/posting, then AI (captions, summarization, insight cards).

Use the plan and guidelines as the source of truth for data model and conventions.
