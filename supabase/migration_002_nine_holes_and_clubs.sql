-- Migration 002: 9-hole round support + club distance / recommendation feature
--
-- Run this in the Supabase SQL Editor after schema.sql (and seed_courses.sql,
-- if you ran it). Written as ALTER/CREATE IF NOT EXISTS statements so it's
-- safe to run on a project that already has real rounds in it — nothing
-- here drops or rewrites existing data.

-- ---------------------------------------------------------------------------
-- 1. Per-hole yardage, for the club recommender. Optional: existing holes
--    keep working with net-double-bogey / differential math either way,
--    since that only ever needed par and stroke index.
-- ---------------------------------------------------------------------------
alter table holes add column if not exists yardage_meters smallint check (yardage_meters between 15 and 650);

-- ---------------------------------------------------------------------------
-- 2. Separate front-nine / back-nine Course Rating and Slope Rating.
--    These are NOT derived by halving the 18-hole rating -- a 9-hole rating
--    is a distinct figure established by the handicapping authority for
--    that specific nine. Left null until someone supplies the real numbers
--    off the card; 9-hole rounds are only enabled in the app for tees that
--    have them.
-- ---------------------------------------------------------------------------
alter table tee_sets add column if not exists front_course_rating numeric(4, 1);
alter table tee_sets add column if not exists front_slope_rating smallint check (front_slope_rating between 55 and 155);
alter table tee_sets add column if not exists back_course_rating numeric(4, 1);
alter table tee_sets add column if not exists back_slope_rating smallint check (back_slope_rating between 55 and 155);

-- ---------------------------------------------------------------------------
-- 3. Rounds: how many holes were played, which nine (if 9), and the raw
--    9-hole differential alongside the existing `score_differential`
--    column, which now always means "the 18-hole-equivalent value used in
--    the Handicap Index calculation" regardless of how it was derived.
-- ---------------------------------------------------------------------------
alter table rounds add column if not exists holes_played smallint not null default 18 check (holes_played in (9, 18));
alter table rounds add column if not exists nine_played text check (nine_played in ('front', 'back'));
alter table rounds add column if not exists raw_nine_hole_differential numeric(4, 1);

alter table rounds add constraint nine_played_matches_holes_played
  check (
    (holes_played = 18 and nine_played is null) or
    (holes_played = 9 and nine_played is not null)
  );

-- ---------------------------------------------------------------------------
-- 4. A golfer's typical distance per club, for the club recommender.
--    Private per user, same RLS pattern as rounds.
-- ---------------------------------------------------------------------------
create table if not exists club_distances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  club_name text not null,
  typical_distance_meters smallint not null check (typical_distance_meters between 15 and 350),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, club_name)
);

alter table club_distances enable row level security;

create policy "Users can view their own clubs"
  on club_distances for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add their own clubs"
  on club_distances for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own clubs"
  on club_distances for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own clubs"
  on club_distances for delete
  to authenticated
  using (auth.uid() = user_id);
