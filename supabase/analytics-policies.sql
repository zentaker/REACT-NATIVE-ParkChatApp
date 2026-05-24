-- ─── Stage 2F: Analytics + Feedback RLS Policies ────────────────────────────
-- Idempotent. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── product_events policies ──────────────────────────────────────────────────

-- Users can insert their own events only
drop policy if exists "product_events_insert_own" on public.product_events;
create policy "product_events_insert_own"
  on public.product_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can read their own events
drop policy if exists "product_events_select_own" on public.product_events;
create policy "product_events_select_own"
  on public.product_events
  for select
  to authenticated
  using (user_id = auth.uid());

-- ── pilot_feedback policies ──────────────────────────────────────────────────

-- Users can insert their own feedback
drop policy if exists "pilot_feedback_insert_own" on public.pilot_feedback;
create policy "pilot_feedback_insert_own"
  on public.pilot_feedback
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can read their own feedback
drop policy if exists "pilot_feedback_select_own" on public.pilot_feedback;
create policy "pilot_feedback_select_own"
  on public.pilot_feedback
  for select
  to authenticated
  using (user_id = auth.uid());

-- Users cannot update or delete feedback (append-only)
-- No update/delete policies needed — deny by default with RLS
