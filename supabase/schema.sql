-- Golf Handicap Tracker schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`) 

create extension if not exists "pgcrypto";

-- Courses
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists tee_sets (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  name text not null,
  course_rating numeric(4, 1) not null check (course_rating between 55 and 85),
  slope_rating smallint not null check (slope_rating between 55 and 155),
  par smallint not null check (par between 60 and 80),
  created_at timestamptz not null default now()
);

create table if not exists holes (
  id uuid primary key default gen_random_uuid(),
  tee_set_id uuid not null references tee_sets (id) on delete cascade,
  hole_number smallint not null check (hole_number between 1 and 18),
  par smallint not null check (par between 3 and 6),
  stroke_index smallint not null check (stroke_index between 1 and 18),
  unique (tee_set_id, hole_number),
  unique (tee_set_id, stroke_index)
);

-- Rounds 
create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tee_set_id uuid not null references tee_sets (id),
  date_played date not null,
  handicap_index_at_time numeric(4, 1),
  course_handicap smallint not null,
  total_gross_score smallint not null,
  adjusted_gross_score smallint not null,
  score_differential numeric(4, 1) not null,
  is_exceptional boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists round_holes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds (id) on delete cascade,
  hole_number smallint not null check (hole_number between 1 and 18),
  par smallint not null check (par between 3 and 6),
  gross_score smallint not null check (gross_score > 0),
  net_double_bogey_cap smallint not null,
  adjusted_score smallint not null,
  putts smallint,
  unique (round_id, hole_number)
);

create index if not exists rounds_user_id_date_idx on rounds (user_id, date_played desc);
create index if not exists tee_sets_course_id_idx on tee_sets (course_id);
create index if not exists holes_tee_set_id_idx on holes (tee_set_id);
create index if not exists round_holes_round_id_idx on round_holes (round_id);

-- Row Level Security
alter table courses enable row level security;
alter table tee_sets enable row level security;
alter table holes enable row level security;
alter table rounds enable row level security;
alter table round_holes enable row level security;

-- Shared reference data: any signed-in golfer can read and contribute.
create policy "Courses are readable by any signed-in user"
  on courses for select
  to authenticated
  using (true);

create policy "Signed-in users can add courses"
  on courses for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Tee sets are readable by any signed-in user"
  on tee_sets for select
  to authenticated
  using (true);

create policy "Signed-in users can add tee sets"
  on tee_sets for insert
  to authenticated
  with check (true);

create policy "Holes are readable by any signed-in user"
  on holes for select
  to authenticated
  using (true);

create policy "Signed-in users can add holes"
  on holes for insert
  to authenticated
  with check (true);

-- Private data: strictly scoped to the owning golfer.
create policy "Users can view their own rounds"
  on rounds for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own rounds"
  on rounds for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own rounds"
  on rounds for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own rounds"
  on rounds for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view their own round holes"
  on round_holes for select
  to authenticated
  using (exists (
    select 1 from rounds
    where rounds.id = round_holes.round_id
    and rounds.user_id = auth.uid()
  ));

create policy "Users can insert their own round holes"
  on round_holes for insert
  to authenticated
  with check (exists (
    select 1 from rounds
    where rounds.id = round_holes.round_id
    and rounds.user_id = auth.uid()
  ));

create policy "Users can delete their own round holes"
  on round_holes for delete
  to authenticated
  using (exists (
    select 1 from rounds
    where rounds.id = round_holes.round_id
    and rounds.user_id = auth.uid()
  ));
