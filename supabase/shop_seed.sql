-- Canonical catalog only; no user, wallet, inventory, or purchase rows are seeded.
insert into public.shop_items(id, scope, name, description, price, item_type, metadata)
values
  ('single-focus', 'single', 'Focus lens', 'A cleaner signal for the moments when the pattern is almost there.', 120, 'utility', '{"icon":"target","tone":"lime"}'),
  ('single-ember', 'single', 'Ember trail', 'Leave a warm trail through your 30-level run.', 180, 'visual', '{"icon":"flame","tone":"coral"}'),
  ('single-orbit', 'single', 'Quiet orbit', 'A low-noise interface for high-volume thinking.', 240, 'visual', '{"icon":"sparkles","tone":"violet"}'),
  ('single-crown', 'single', 'Pattern crown', 'For the player who never needs the answer twice.', 360, 'badge', '{"icon":"crown","tone":"gold"}'),
  ('multi-shield', 'multi', 'Duel shield', 'A visual badge for rooms where pressure is part of the puzzle.', 140, 'defense', '{"icon":"shield","tone":"blue"}'),
  ('multi-signal', 'multi', 'Signal flare', 'Make your correct answers impossible to miss.', 210, 'visual', '{"icon":"zap","tone":"coral"}'),
  ('multi-wand', 'multi', 'Quick draw', 'A little theatre for the moment before the first crack.', 280, 'utility', '{"icon":"wand","tone":"violet"}'),
  ('multi-gem', 'multi', 'Sharp edge', 'A rare finish for a clean win streak.', 420, 'badge', '{"icon":"gem","tone":"lime"}')
on conflict (id) do update set scope = excluded.scope, name = excluded.name, description = excluded.description, price = excluded.price, item_type = excluded.item_type, metadata = excluded.metadata, active = true;
