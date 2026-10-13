-- 一樹同仁 citizen verification store. Paste into Supabase → SQL Editor → Run.
create table if not exists public.verifications (
  id bigint generated always as identity primary key,
  city text not null default 'taipei',
  site_id text not null,          -- e.g. p305123_2770123 (TWD97 m); stable across data refreshes
  verdict text not null check (verdict in ('empty', 'tree', 'no')),
  client_id uuid not null,            -- random per-browser id, no personal data
  created_at timestamptz not null default now()
);  -- insert-only log; a browser's latest vote per pit counts (see view)
alter table public.verifications enable row level security;
create policy "anyone can read"   on public.verifications for select to anon using (true);
create policy "anyone can vote"   on public.verifications for insert to anon with check (true);

create or replace view public.pit_votes with (security_invoker = true) as
select city, site_id,
  count(*) filter (where verdict = 'empty') as empty,
  count(*) filter (where verdict = 'tree')  as tree,
  count(*) filter (where verdict = 'no')    as no,
  max(created_at) as last_at
from (
  select distinct on (city, site_id, client_id) city, site_id, verdict, created_at
  from public.verifications order by city, site_id, client_id, created_at desc
) latest group by city, site_id;
grant select on public.pit_votes to anon;
