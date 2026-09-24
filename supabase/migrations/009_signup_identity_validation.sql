-- Signup-only email and username validation with race-safe username storage.
alter table public.profiles
  add column if not exists username text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_shape_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_shape_check
      check (
        username is null
        or (
          char_length(username) between 3 and 24
          and username = btrim(username)
          and username !~ '[[:space:][:cntrl:]]'
        )
      );
  end if;
end;
$$;

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_display_name text;
begin
  v_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');
  if v_username is not null then
    v_username := lower(v_username);
    if char_length(v_username) < 3
       or char_length(v_username) > 24
       or v_username ~ '[[:space:][:cntrl:]]' then
      raise exception 'Invalid username';
    end if;
  end if;

  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    v_username,
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Player'
  );

  insert into public.profiles (id, display_name, username, locale)
  values (
    new.id,
    left(v_display_name, 40),
    v_username,
    coalesce(new.raw_user_meta_data->>'locale', 'en')
  )
  on conflict (id) do nothing;

  insert into public.single_player_profiles (profile_id, handle)
  values (new.id, v_username)
  on conflict (profile_id) do nothing;

  insert into public.multiplayer_profiles (profile_id, handle)
  values (new.id, v_username)
  on conflict (profile_id) do nothing;

  insert into public.single_player_wallets (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  insert into public.multiplayer_wallets (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

create or replace function public.check_signup_email(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('available', false, 'reason', 'invalid');
  end if;
  if exists (
    select 1 from auth.users where lower(coalesce(email, '')) = v_email
  ) then
    return jsonb_build_object('available', false, 'reason', 'taken');
  end if;
  return jsonb_build_object('available', true, 'reason', null);
end;
$$;

create or replace function public.check_username_availability(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_username text := lower(trim(coalesce(p_username, '')));
begin
  if char_length(v_username) < 3
     or char_length(v_username) > 24
     or v_username ~ '[[:space:][:cntrl:]]' then
    return jsonb_build_object('available', false, 'reason', 'invalid');
  end if;
  if exists (
    select 1 from public.profiles where lower(username) = v_username
  ) then
    return jsonb_build_object('available', false, 'reason', 'taken');
  end if;
  return jsonb_build_object('available', true, 'reason', null);
end;
$$;

revoke execute on function public.check_signup_email(text) from public;
revoke execute on function public.check_username_availability(text) from public;
grant execute on function public.check_signup_email(text) to anon, authenticated;
grant execute on function public.check_username_availability(text) to anon, authenticated;
