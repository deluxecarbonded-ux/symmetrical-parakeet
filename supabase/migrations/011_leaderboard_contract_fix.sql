-- Fix the leaderboard projection after the initial feature migration.
-- raw_profiles.* already includes avatar_media_type; selecting it again made the
-- derived column name ambiguous in PostgreSQL.
begin;

create or replace function public.get_leaderboard(
  p_scope public.game_scope,
  p_metric text,
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_metric text := lower(trim(coalesce(p_metric, '')));
  v_limit integer := least(100, greatest(1, coalesce(p_limit, 100)));
begin
  if p_scope is null then
    raise exception 'Invalid leaderboard scope';
  end if;

  if not (
    (
      p_scope = 'single'
      and v_metric in ('levels', 'codes', 'accuracy', 'speed', 'inventory', 'wallet', 'score')
    )
    or (
      p_scope = 'multi'
      and v_metric in ('matches', 'wins', 'win_rate', 'codes', 'accuracy', 'speed', 'inventory', 'wallet', 'score')
    )
  ) then
    raise exception 'Unsupported leaderboard metric';
  end if;

  return (
    with raw_profiles as (
      select
        profile.id as profile_id,
        coalesce(profile.username, profile.display_name, 'Player') as username,
        profile.avatar_bucket,
        profile.avatar_url,
        profile.avatar_media_type,
        coalesce(profile.id = (select auth.uid()), false) as is_current_user
      from public.profiles as profile
    ),
    computed as (
      select
        raw_profiles.*,
        case
          when raw_profiles.avatar_bucket in ('avatars', 'profile-media')
            and raw_profiles.avatar_url ~ '^[A-Za-z0-9._/-]+$'
            and char_length(raw_profiles.avatar_url) between 1 and 512
            and raw_profiles.avatar_url !~ '[[:cntrl:]]'
            and raw_profiles.avatar_url !~ '(^|/)\.\.?(/|$)'
            and split_part(raw_profiles.avatar_url, '/', 1) = raw_profiles.profile_id::text
            then raw_profiles.avatar_url
          else null
        end as avatar_path,
        public.get_gameplay_metric(
          raw_profiles.profile_id,
          p_scope,
          v_metric
        ) as metric_value
      from raw_profiles
    ),
    ranked as (
      select
        row_number() over (
          order by metric_value desc, username asc, profile_id asc
        ) as rank,
        username,
        avatar_path,
        avatar_bucket,
        avatar_media_type,
        metric_value,
        is_current_user
      from computed
      where metric_value > 0 or is_current_user
    )
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'rank', ranked.rank,
          'username', ranked.username,
          'avatar_url', ranked.avatar_path,
          'avatar_path', ranked.avatar_path,
          'avatar_bucket', case
            when ranked.avatar_path is not null then ranked.avatar_bucket
            else null
          end,
          'avatar_media_type', case
            when ranked.avatar_path is not null then ranked.avatar_media_type
            else null
          end,
          'metric', v_metric,
          'value', ranked.metric_value,
          'is_current_user', ranked.is_current_user
        )
        order by ranked.rank
      ),
      '[]'::jsonb
    )
    from ranked
    where ranked.rank <= v_limit
  );
end;
$$;

commit;
