-- Migration 003: allow editing hole distances after a course already exists
--
-- Run this in the Supabase SQL Editor after migration_002.
--
-- schema.sql only ever let signed-in users INSERT courses/tee_sets/holes
-- (a "write once" shared reference model). This adds an UPDATE policy for
-- holes specifically, so distances can be corrected or filled in later --
-- e.g. standing on the tee and noticing the marker says 300m -- without
-- needing to touch par or stroke index, which stay insert-only since
-- changing those after rounds have been posted against them would be a
-- much bigger deal (it'd retroactively change past Net Double Bogey caps).

create policy "Signed-in users can update hole yardage"
  on holes for update
  to authenticated
  using (true)
  with check (true);
