# Against All Odds — WC 2026 Prediction App

A Next.js + Supabase prediction game for the 2026 FIFA World Cup.

## Features

- **Match predictions** — predict scores for all group stage matches
- **Group predictions** — pick group winners and runners-up
- **Knockout predictions** — predict the full bracket
- **Global predictions** — golden boot, champion, top scorer, etc.
- **Leaderboard** — ranked by scoring rules (see `src/config/scoring.ts`)
- **Rooms** — private prediction rooms with:
  - **A** Header with invite code
  - **B** Live standings table (sorted by points)
  - **D** Watch party scheduler — 8 configurable slots (group + knockout matches, per-slot locking)
  - **E** Telepathy viewer — see how roommates predicted the same locked/finished matches
  - **G** Shared drawing board — collaborative canvas, auto-saved every 1.5 s

## Tech Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Supabase** (PostgreSQL, RLS, Auth)
- **Tailwind CSS**

## Getting Started

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for admin actions) in `.env.local`.

## Database Migrations

Run migrations in order via the Supabase SQL editor (`supabase/migrations/`).

| # | File | Description |
|---|------|-------------|
| 001 | `001_initial_schema.sql` | Core schema |
| 002 | `002_seed_world_cup_2026.sql` | WC 2026 teams & groups |
| 003 | `003_rls_fixes.sql` | RLS fixes |
| 004 | `004_add_team_flags.sql` | Team flag URLs |
| 005 | `005_knockout_slots.sql` | Knockout bracket slots |
| 006 | `006_group_predictions.sql` | Group prediction table |
| 007 | `007_drop_second_place.sql` | Schema cleanup |
| 008 | `008_room_delete_policy.sql` | Room RLS |
| 009 | `009_profile_username_set.sql` | Username setup |
| 010 | `010_username_case_insensitive.sql` | Case-insensitive usernames |
| 011 | `011_profile_age_country.sql` | Profile fields |
| 012 | `012_global_predictions.sql` | Global predictions table |
| 013 | `013_global_predictions_admin_policy.sql` | Admin RLS |
| 014 | `014_knockout_predictions.sql` | Knockout predictions |
| 015 | `015_knockout_score_predictions.sql` | Knockout score predictions |
| 016 | `016_ml_predictions.sql` | ML baseline predictions |
| 017 | `017_ml_predictions_scores.sql` | ML score predictions |
| 018 | `018_ml_predictions_team_names.sql` | ML team name fixes |
| 021 | `021_room_canvas.sql` | Shared drawing board per room |

## Scoring

See `src/config/scoring.ts` and `src/domain/scoring/` for exact rules.
