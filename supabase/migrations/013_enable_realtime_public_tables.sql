-- Enable Realtime publication and full replica identity for every application
-- table in the public schema. System-managed auth/storage/internal schemas
-- remain excluded so Realtime cannot accidentally expose credentials or
-- storage metadata. Existing RLS policies remain authoritative for reads.
begin;

do $$
declare
  table_record record;
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    execute 'create publication supabase_realtime';
  end if;

  -- Add every current public base/partitioned table that is not already a
  -- member. The membership check keeps this migration safely repeatable.
  for table_record in
    select
      class.oid::regclass as table_oid,
      class.relname as table_name
    from pg_class as class
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relkind in ('r', 'p')
      and not exists (
        select 1
        from pg_publication_tables as publication_table
        where publication_table.pubname = 'supabase_realtime'
          and publication_table.schemaname = 'public'
          and publication_table.tablename = class.relname
      )
  loop
    execute format(
      'alter publication supabase_realtime add table %s',
      table_record.table_oid
    );
  end loop;

  -- Full identity makes UPDATE/DELETE payloads available to Realtime even for
  -- tables whose primary key is not sufficient for a subscriber's filter.
  for table_record in
    select class.oid::regclass as table_oid
    from pg_class as class
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relkind in ('r', 'p')
  loop
    execute format(
      'alter table %s replica identity full',
      table_record.table_oid
    );
  end loop;
end;
$$;

commit;
