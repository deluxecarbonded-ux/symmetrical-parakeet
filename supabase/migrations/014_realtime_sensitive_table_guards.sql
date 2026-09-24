-- Keep the all-public-table Realtime publication safe for clients. RLS governs
-- Realtime row delivery; these tables contain answer/submission secrets and
-- therefore intentionally have no client SELECT policy or table privilege.
-- Server-side security-definer game functions can still read them.
begin;

drop policy if exists puzzles_authenticated_read on public.content_puzzles;
revoke select on public.content_puzzles from anon, authenticated;

drop policy if exists answers_member_read on public.multiplayer_answers;
revoke select on public.multiplayer_answers from anon, authenticated;

commit;
