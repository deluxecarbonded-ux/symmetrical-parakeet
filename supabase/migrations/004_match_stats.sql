-- Keep separated multiplayer profile aggregates and duel wallet rewards authoritative.
create or replace function public.sync_finished_multiplayer_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  winner_id uuid;
begin
  if new.status = 'finished' and old.status is distinct from 'finished' then
    update public.multiplayer_profiles mp
    set duels_played = mp.duels_played + 1
    where mp.profile_id in (select profile_id from public.multiplayer_players where room_id = new.id);

    select profile_id into winner_id from public.multiplayer_players where room_id = new.id order by score desc, joined_at asc limit 1;
    if winner_id is not null then
      update public.multiplayer_profiles set duels_won = duels_won + 1 where profile_id = winner_id;
      update public.multiplayer_wallets set balance = balance + 30, lifetime_earned = lifetime_earned + 30 where profile_id = winner_id;
      insert into public.wallet_transactions(profile_id, scope, amount, reason, reference_id) values (winner_id, 'multi', 30, 'duel_win', new.id::text);
    end if;
  end if;
  return new;
end;
$$;

create trigger multiplayer_match_stats
after update of status on public.multiplayer_rooms
for each row execute function public.sync_finished_multiplayer_match();
