-- ============================================================
-- Aldea / ParkChat — Stage 2A: Graph-ready RLS policies
-- Non-destructive: drop-if-exists + recreate pattern.
-- Idempotent: safe to re-run.
-- Run via: npm run supabase:apply:graph
-- ============================================================

-- ─── topic_tags policies ────────────────────────────────────
drop policy if exists "topic_tags: authenticated can read" on public.topic_tags;
create policy "topic_tags: authenticated can read"
  on public.topic_tags for select
  to authenticated
  using (true);

drop policy if exists "topic_tags: authenticated can insert" on public.topic_tags;
create policy "topic_tags: authenticated can insert"
  on public.topic_tags for insert
  to authenticated
  with check (true);

-- ─── place_topics policies ──────────────────────────────────
drop policy if exists "place_topics: authenticated can read" on public.place_topics;
create policy "place_topics: authenticated can read"
  on public.place_topics for select
  to authenticated
  using (true);

drop policy if exists "place_topics: authenticated can insert" on public.place_topics;
create policy "place_topics: authenticated can insert"
  on public.place_topics for insert
  to authenticated
  with check (true);

drop policy if exists "place_topics: authenticated can update weight" on public.place_topics;
create policy "place_topics: authenticated can update weight"
  on public.place_topics for update
  to authenticated
  using (true)
  with check (true);

-- ─── user_places policies ───────────────────────────────────
drop policy if exists "user_places: user reads own" on public.user_places;
create policy "user_places: user reads own"
  on public.user_places for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_places: user inserts own" on public.user_places;
create policy "user_places: user inserts own"
  on public.user_places for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_places: user updates own" on public.user_places;
create policy "user_places: user updates own"
  on public.user_places for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── message_topic_tags policies ────────────────────────────
drop policy if exists "message_topic_tags: authenticated can read" on public.message_topic_tags;
create policy "message_topic_tags: authenticated can read"
  on public.message_topic_tags for select
  to authenticated
  using (true);

drop policy if exists "message_topic_tags: authenticated can insert" on public.message_topic_tags;
create policy "message_topic_tags: authenticated can insert"
  on public.message_topic_tags for insert
  to authenticated
  with check (true);

-- ─── user_topic_interests policies ──────────────────────────
drop policy if exists "user_topic_interests: user reads own" on public.user_topic_interests;
create policy "user_topic_interests: user reads own"
  on public.user_topic_interests for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_topic_interests: user inserts own" on public.user_topic_interests;
create policy "user_topic_interests: user inserts own"
  on public.user_topic_interests for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_topic_interests: user updates own" on public.user_topic_interests;
create policy "user_topic_interests: user updates own"
  on public.user_topic_interests for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── user_connections policies ───────────────────────────────
drop policy if exists "user_connections: user reads own connections" on public.user_connections;
create policy "user_connections: user reads own connections"
  on public.user_connections for select
  to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists "user_connections: system inserts only" on public.user_connections;
create policy "user_connections: system inserts only"
  on public.user_connections for insert
  to authenticated
  with check (user_a = auth.uid() or user_b = auth.uid());
