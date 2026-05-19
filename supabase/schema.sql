-- =====================================================================
-- Charlie Assistant — Supabase schema
-- =====================================================================
-- Run this in the Supabase SQL editor (or via supabase db push)
-- to set up tables, indices and RLS policies for the Charlie app.
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nueva conversación',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_idx
  on public.conversations(user_id);

-- ---------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  intent text,
  parameters jsonb,
  requires_action boolean default false,
  action_status text check (action_status in ('pending','executing','success','error')),
  action_result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx
  on public.messages(conversation_id);
create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

-- ---------------------------------------------------------------------
-- actions_log
-- ---------------------------------------------------------------------
create table if not exists public.actions_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  intent text not null,
  parameters jsonb not null default '{}'::jsonb,
  status text not null check (status in ('pending','executing','success','error')),
  result jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists actions_log_user_id_idx on public.actions_log(user_id);
create index if not exists actions_log_message_id_idx on public.actions_log(message_id);

-- ---------------------------------------------------------------------
-- updated_at trigger for conversations
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at
  before update on public.conversations
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.actions_log enable row level security;

-- conversations
drop policy if exists "conversations are user-owned" on public.conversations;
create policy "conversations are user-owned"
  on public.conversations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- messages
drop policy if exists "messages are user-owned" on public.messages;
create policy "messages are user-owned"
  on public.messages
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- actions_log
drop policy if exists "actions_log is user-owned" on public.actions_log;
create policy "actions_log is user-owned"
  on public.actions_log
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
