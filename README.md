# Golf Handicap Tracker

A full-stack golf app for logging rounds, tracking scores, and calculating a handicap.

Designed to be real golfer’s digital scorecard, structured round history, course data, and clear score adjustments.

LIVE🔴: https://golf-handicap-tracker-mu.vercel.app/

## Features

* Dashboard showing your Handicap Index, recent rounds, and score trends
* Log 18-hole rounds and eligible 9-hole rounds
* View every round in a full round history table
* See which rounds currently count toward your Handicap Index
* Calculate Course Handicap using the course rating, slope rating, and par
* Calculate Score Differential for each round
* Apply Net Double Bogey adjustments hole-by-hole
* Show a plain-English summary of any score adjustments after a round
* Add and view golf courses, tee sets, and hole information
* Support front-nine and back-nine ratings for 9-hole rounds
* Track your club distances on the My Bag page
* Get simple club suggestions based on hole distance
* Private user accounts with Supabase login
* Each golfer can only view and manage their own rounds
* Seed data for real Western Sydney golf courses
* Tested handicap calculation logic

## Tech Stack

* Next.js App Router
* React
* TypeScript
* Tailwind CSS v4
* Supabase
* PostgreSQL
* Supabase Auth
* Recharts

## Project Structure

```text
app/
  page.tsx                  Dashboard
  rounds/                   Round history, round details, and round entry
  courses/                  Course list and course guide pages
  my-bag/                   Club distance tracking
  api/keep-alive/route.ts   Keeps the Supabase project active

components/
  layout/                   App shell, sidebar, and header
  dashboard/                Dashboard cards and score trend chart
  rounds/                   Round tables, scorecards, and status labels
  courses/                  Course and tee display components
  ui/                       Shared loading, error, and empty states

lib/
  whs.ts                    Handicap calculation logic
  clubRecommendation.ts     Club suggestion helper
  supabaseClient.ts         Supabase browser client
  types.ts                  Shared TypeScript types

supabase/
  schema.sql                                Main database schema
  migration_002_nine_holes_and_clubs.sql    9-hole rounds and club distances
  migration_003_editable_hole_distances.sql Editable hole distances
  seed_courses.sql                          Western Sydney course seed data
```

## Handicap Calculations

The main handicap logic is in `lib/whs.ts`.

This file calculates the World Handicap System used by Golf Australia. It handles Course Handicap, Score Differential, Net Double Bogey adjustments, 9-hole score handling, and Handicap Index calculations.

The calculation logic is kept separate from the app pages and database code so it is easier to test, review, and explain.

Run the tests with:

```bash
npm test
```

## 9-Hole Rounds

The app supports 9-hole rounds when a tee set has its own front-nine or back-nine rating.

The app does not simply halve the 18-hole course rating, because each nine needs its own proper rating and slope.

## Club Recommendations

The My Bag page lets you save how far you usually hit each club.

Course guide pages can then suggest a club for each hole based on distance. This is a simple helper, not a full golf strategy tool. It does not account for wind, hazards, lie, elevation, or shot shape.

## Deliberately Out of Scope

A few official handicap features are not included because they require data that a personal golf app does not have.

* Playing Conditions Calculation, because it needs course-wide scoring data from the day
* Exceptional Score Reduction cascade, because it changes previous handicap records
* Full retroactive recalculation of older 9-hole scores after a player gets their first Handicap Index

These are documented clearly rather than hidden.

## Running Locally

This project uses Supabase for the database and user accounts.

1. Create a free Supabase project.
2. Open the SQL Editor in Supabase.
3. Run `supabase/schema.sql`.
4. Run `supabase/migration_002_nine_holes_and_clubs.sql`.
5. Run `supabase/migration_003_editable_hole_distances.sql`.
6. Optionally run `supabase/seed_courses.sql` to add real Western Sydney courses.
7. Copy `.env.local.example` to `.env.local`.
8. Add your Supabase Project URL and anon public key to `.env.local`.
9. Install dependencies and start the app:

```bash
npm install
npm run dev
```

10. Sign up, add your clubs on the My Bag page, then log a round.

For local testing, you can turn off email confirmation in Supabase under Authentication → Providers → Email → Confirm email. This lets new accounts sign in straight away while developing.
#
