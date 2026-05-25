-- =====================================================================
-- Tita Media — Client Portal Schema
-- =====================================================================
-- Run this once in the Supabase SQL editor.
-- Also create a PRIVATE storage bucket called "portal-files".
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────
-- portal_projects  (one row per client project)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.portal_projects (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  name        text not null,
  client_name text not null,
  description text,
  logo_url    text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- portal_user_roles  (which users can access which projects)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.portal_user_roles (
  id         uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.portal_projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'client')),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- portal_blocks  (sections: Base & Accesos, Diseño & Marca, etc.)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.portal_blocks (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.portal_projects(id) on delete cascade,
  slug        text not null,
  title       text not null,
  description text,
  icon        text not null default '📦',
  week_start  int,
  week_end    int,
  order_index int not null default 0,
  created_at  timestamptz not null default now(),
  unique(project_id, slug)
);

create index if not exists portal_blocks_project_id_idx on public.portal_blocks(project_id);

-- ─────────────────────────────────────────────────────────────────────
-- portal_items  (individual checklist items inside a block)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.portal_items (
  id             uuid primary key default uuid_generate_v4(),
  block_id       uuid not null references public.portal_blocks(id) on delete cascade,
  slug           text not null,
  title          text not null,
  description    text,
  status         text not null default 'pending'
                   check (status in ('pending', 'in_review', 'approved')),
  comments       text,
  admin_feedback text,
  is_blocker     boolean not null default false,
  order_index    int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(block_id, slug)
);

create index if not exists portal_items_block_id_idx on public.portal_items(block_id);
create index if not exists portal_items_status_idx   on public.portal_items(status);

-- ─────────────────────────────────────────────────────────────────────
-- portal_files  (files uploaded per item, stored in Supabase Storage)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.portal_files (
  id           uuid primary key default uuid_generate_v4(),
  item_id      uuid not null references public.portal_items(id) on delete cascade,
  uploaded_by  uuid references auth.users(id) on delete set null,
  filename     text not null,
  storage_path text not null,
  content_type text,
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);

create index if not exists portal_files_item_id_idx on public.portal_files(item_id);

-- ─────────────────────────────────────────────────────────────────────
-- Trigger: auto-update portal_items.updated_at
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portal_items_updated_at on public.portal_items;
create trigger portal_items_updated_at
  before update on public.portal_items
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- Helper: is the current user a member of a given project?
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.is_portal_member(p_project_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.portal_user_roles
    where project_id = p_project_id
      and user_id    = auth.uid()
  )
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────
alter table public.portal_projects   enable row level security;
alter table public.portal_user_roles enable row level security;
alter table public.portal_blocks     enable row level security;
alter table public.portal_items      enable row level security;
alter table public.portal_files      enable row level security;

-- portal_projects — visible to members
drop policy if exists "portal_projects_select" on public.portal_projects;
create policy "portal_projects_select" on public.portal_projects
  for select using (public.is_portal_member(id));

-- portal_user_roles — each user sees their own rows
drop policy if exists "portal_user_roles_select" on public.portal_user_roles;
create policy "portal_user_roles_select" on public.portal_user_roles
  for select using (user_id = auth.uid());

-- portal_blocks — visible to project members
drop policy if exists "portal_blocks_select" on public.portal_blocks;
create policy "portal_blocks_select" on public.portal_blocks
  for select using (public.is_portal_member(project_id));

-- portal_items — readable by all project members
drop policy if exists "portal_items_select" on public.portal_items;
create policy "portal_items_select" on public.portal_items
  for select using (
    exists (
      select 1 from public.portal_blocks b
      where b.id = portal_items.block_id
        and public.is_portal_member(b.project_id)
    )
  );

-- portal_items — updatable by all project members
-- (API routes enforce field-level restrictions per role)
drop policy if exists "portal_items_update" on public.portal_items;
create policy "portal_items_update" on public.portal_items
  for update using (
    exists (
      select 1 from public.portal_blocks b
      where b.id = portal_items.block_id
        and public.is_portal_member(b.project_id)
    )
  );

-- portal_files — readable by project members
drop policy if exists "portal_files_select" on public.portal_files;
create policy "portal_files_select" on public.portal_files
  for select using (
    exists (
      select 1 from public.portal_items i
      join  public.portal_blocks   b on b.id = i.block_id
      where i.id = portal_files.item_id
        and public.is_portal_member(b.project_id)
    )
  );

-- portal_files — project members can insert their own uploads
drop policy if exists "portal_files_insert" on public.portal_files;
create policy "portal_files_insert" on public.portal_files
  for insert with check (
    auth.uid() = uploaded_by
    and exists (
      select 1 from public.portal_items i
      join  public.portal_blocks   b on b.id = i.block_id
      where i.id = portal_files.item_id
        and public.is_portal_member(b.project_id)
    )
  );

-- portal_files — only uploader can delete
drop policy if exists "portal_files_delete" on public.portal_files;
create policy "portal_files_delete" on public.portal_files
  for delete using (uploaded_by = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- Storage bucket note
-- ─────────────────────────────────────────────────────────────────────
-- 1. Go to Supabase Dashboard → Storage → New bucket
-- 2. Name: portal-files
-- 3. Public: OFF  (private bucket)
-- 4. All uploads/signed-URL generation go through the API using
--    SUPABASE_SERVICE_ROLE_KEY — no storage policies needed.
-- ─────────────────────────────────────────────────────────────────────
