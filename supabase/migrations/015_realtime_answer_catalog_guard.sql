-- Translation entries contain canonical answer values used by server-side
-- validators. Keep the table in the publication for schema completeness, but
-- do not allow client SELECT or Realtime delivery of answer material.
begin;

drop policy if exists translation_entries_public_read on public.translation_entries;
revoke select on public.translation_entries from anon, authenticated;

commit;
