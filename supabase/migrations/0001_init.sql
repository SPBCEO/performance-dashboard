create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  created_at timestamptz not null default now()
);
alter table properties enable row level security;
drop policy if exists "properties_v1_read" on properties;
create policy "properties_v1_read" on properties for select using (true);
drop policy if exists "properties_v1_write" on properties;
create policy "properties_v1_write" on properties for all using (true) with check (true);

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  property_id uuid references properties(id) on delete cascade,
  name text not null,
  category text not null default 'non-fb' check (category in ('fb','non-fb')),
  created_at timestamptz not null default now()
);
alter table tenants enable row level security;
drop policy if exists "tenants_v1_read" on tenants;
create policy "tenants_v1_read" on tenants for select using (true);
drop policy if exists "tenants_v1_write" on tenants;
create policy "tenants_v1_write" on tenants for all using (true) with check (true);

create table if not exists turnover_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  tenant_id uuid not null references tenants(id) on delete cascade,
  entry_date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  source text default 'manual',
  confidence numeric,
  review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);
alter table turnover_entries enable row level security;
drop policy if exists "turnover_entries_v1_read" on turnover_entries;
create policy "turnover_entries_v1_read" on turnover_entries for select using (true);
drop policy if exists "turnover_entries_v1_write" on turnover_entries;
create policy "turnover_entries_v1_write" on turnover_entries for all using (true) with check (true);

insert into properties (id, name)
select 'a0000000-0000-0000-0000-000000000001'::uuid, 'Harborfront Plaza'
where not exists (select 1 from properties where name = 'Harborfront Plaza');

insert into properties (id, name)
select 'a0000000-0000-0000-0000-000000000002'::uuid, 'Riverside Galleria'
where not exists (select 1 from properties where name = 'Riverside Galleria');

insert into tenants (id, property_id, name, category)
select 'b0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'The Salty Fork', 'fb'
where not exists (select 1 from tenants where name = 'The Salty Fork');

insert into tenants (id, property_id, name, category)
select 'b0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Brew & Co', 'fb'
where not exists (select 1 from tenants where name = 'Brew & Co');

insert into tenants (id, property_id, name, category)
select 'b0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Lifestyle Apparel', 'non-fb'
where not exists (select 1 from tenants where name = 'Lifestyle Apparel');

insert into tenants (id, property_id, name, category)
select 'b0000000-0000-0000-0000-000000000004'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'TechGadget Hub', 'non-fb'
where not exists (select 1 from tenants where name = 'TechGadget Hub');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000001'::uuid, '2025-01-06', 3200.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000001'::uuid and entry_date = '2025-01-06');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000001'::uuid, '2025-02-10', 4100.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000001'::uuid and entry_date = '2025-02-10');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000001'::uuid, '2025-03-05', 3800.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000001'::uuid and entry_date = '2025-03-05');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000002'::uuid, '2025-01-08', 5600.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000002'::uuid and entry_date = '2025-01-08');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000002'::uuid, '2025-02-12', 6200.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000002'::uuid and entry_date = '2025-02-12');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000002'::uuid, '2025-03-08', 5900.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000002'::uuid and entry_date = '2025-03-08');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000003'::uuid, '2025-01-15', 8900.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000003'::uuid and entry_date = '2025-01-15');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000003'::uuid, '2025-02-18', 9500.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000003'::uuid and entry_date = '2025-02-18');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000003'::uuid, '2025-03-10', 7800.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000003'::uuid and entry_date = '2025-03-10');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000004'::uuid, '2025-01-20', 11200.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000004'::uuid and entry_date = '2025-01-20');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000004'::uuid, '2025-02-22', 12500.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000004'::uuid and entry_date = '2025-02-22');

insert into turnover_entries (tenant_id, entry_date, amount)
select 'b0000000-0000-0000-0000-000000000004'::uuid, '2025-03-15', 10800.00
where not exists (select 1 from turnover_entries where tenant_id = 'b0000000-0000-0000-0000-000000000004'::uuid and entry_date = '2025-03-15');