-- ============================================================================
-- Pigion — consolidated schema (safe to run multiple times / on partially-
-- applied databases). This is the union of every patch given so far.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  public_key text unique not null,
  encryption_public_key text unique not null,
  public_key_fingerprint text not null,
  username text unique not null,
  avatar_url text,
  status text not null default 'offline' check (status in ('online','offline','away')),
  custom_status text,
  bio text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.users add column if not exists country_code text;
alter table public.users add column if not exists private_number text unique;
alter table public.users add column if not exists private_number_display text;

alter table public.users enable row level security;

drop policy if exists "Users are viewable by any authenticated user" on public.users;
drop policy if exists "Users can view themselves, contacts, and chat co-members" on public.users;
drop policy if exists "Users can update their own row" on public.users;

create policy "Users can update their own row"
  on public.users for update
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- AUTH CHALLENGES
-- ---------------------------------------------------------------------------
create table if not exists public.auth_challenges (
  public_key text primary key,
  nonce text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.auth_challenges enable row level security;

-- ---------------------------------------------------------------------------
-- CONTACTS
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  owner_id uuid not null references public.users(id) on delete cascade,
  contact_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, contact_user_id)
);
alter table public.contacts enable row level security;

drop policy if exists "Users manage their own contact list" on public.contacts;
create policy "Users manage their own contact list"
  on public.contacts for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Users SELECT policy lives here (after contacts + chat_members exist, since
-- it references both tables).
create policy "Users can view themselves, contacts, and chat co-members"
  on public.users for select
  using (
    id = auth.uid()
    or exists (select 1 from public.contacts c where c.owner_id = auth.uid() and c.contact_user_id = users.id)
    or exists (
      select 1 from public.chat_members my
      join public.chat_members their on their.chat_id = my.chat_id
      where my.user_id = auth.uid() and their.user_id = users.id
    )
  );

-- ---------------------------------------------------------------------------
-- PRIVATE NUMBER LOOKUP
-- ---------------------------------------------------------------------------
create or replace function public.search_by_private_number(p_number text)
returns table (
  id uuid, username text, avatar_url text, public_key text,
  encryption_public_key text, public_key_fingerprint text, private_number_display text
)
language sql security definer set search_path = public
as $$
  select id, username, avatar_url, public_key, encryption_public_key, public_key_fingerprint, private_number_display
  from public.users where private_number = p_number limit 1;
$$;
grant execute on function public.search_by_private_number(text) to authenticated;

-- ---------------------------------------------------------------------------
-- CHATS
-- ---------------------------------------------------------------------------
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct','group','ai')),
  name text,
  avatar_url text,
  topic text,
  description text,
  self_destruct_timer integer not null default 0,
  e2e_fingerprint text not null,
  group_invite_code text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
alter table public.chats enable row level security;

create table if not exists public.chat_members (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  is_pinned boolean not null default false,
  is_muted boolean not null default false,
  is_archived boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);
alter table public.chat_members enable row level security;

drop policy if exists "Members can view their chats" on public.chats;
create policy "Members can view their chats"
  on public.chats for select
  using (exists (select 1 from public.chat_members cm where cm.chat_id = chats.id and cm.user_id = auth.uid()));

drop policy if exists "Creators can view chats they created" on public.chats;
create policy "Creators can view chats they created"
  on public.chats for select
  using (created_by = auth.uid());

drop policy if exists "Users can create chats they own" on public.chats;
create policy "Users can create chats they own"
  on public.chats for insert
  with check (created_by = auth.uid());

drop policy if exists "Members can view their membership rows" on public.chat_members;
create policy "Members can view their membership rows"
  on public.chat_members for select
  using (user_id = auth.uid());

drop policy if exists "Chat creator can add members" on public.chat_members;
create policy "Chat creator can add members"
  on public.chat_members for insert
  with check (exists (select 1 from public.chats c where c.id = chat_members.chat_id and c.created_by = auth.uid()));

-- ---------------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  ciphertext text not null,
  type text not null default 'text' check (type in ('text','image','voice','file','system')),
  attachment_url text,
  attachment_name text,
  attachment_size bigint,
  voice_duration integer,
  self_destruct_timer integer not null default 0,
  expires_at timestamptz,
  reply_to_id uuid references public.messages(id),
  status text not null default 'sent' check (status in ('sent','delivered','read')),
  created_at timestamptz not null default now()
);
create index if not exists messages_chat_id_created_at_idx on public.messages (chat_id, created_at);
alter table public.messages enable row level security;

drop policy if exists "Members can read messages in their chats" on public.messages;
create policy "Members can read messages in their chats"
  on public.messages for select
  using (exists (select 1 from public.chat_members cm where cm.chat_id = messages.chat_id and cm.user_id = auth.uid()));

drop policy if exists "Members can send messages to their chats" on public.messages;
create policy "Members can send messages to their chats"
  on public.messages for insert
  with check (
    messages.sender_id = auth.uid()
    and exists (select 1 from public.chat_members cm where cm.chat_id = messages.chat_id and cm.user_id = auth.uid())
  );

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null,
  primary key (message_id, user_id, emoji)
);
alter table public.message_reactions enable row level security;

-- ---------------------------------------------------------------------------
-- VAULT
-- ---------------------------------------------------------------------------
create table if not exists public.vault_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  size_bytes bigint not null,
  mime_type text not null,
  storage_path text not null,
  category text not null check (category in ('image','document','audio','archive','code')),
  is_favorite boolean not null default false,
  uploaded_at timestamptz not null default now()
);
alter table public.vault_files enable row level security;

drop policy if exists "Owners manage their own vault files" on public.vault_files;
create policy "Owners manage their own vault files"
  on public.vault_files for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- CALL LOGS
-- ---------------------------------------------------------------------------
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.users(id),
  callee_id uuid not null references public.users(id),
  call_type text not null check (call_type in ('voice','video')),
  direction text not null check (direction in ('incoming','outgoing','missed')),
  duration_seconds integer,
  is_e2ee boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.call_logs enable row level security;

drop policy if exists "Participants can view their call logs" on public.call_logs;
create policy "Participants can view their call logs"
  on public.call_logs for select
  using (auth.uid() in (call_logs.caller_id, call_logs.callee_id));

-- ---------------------------------------------------------------------------
-- REALTIME (safe to re-run — skips if already added)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Done. Every table, column, policy, and function needed by the current
-- app is now present, regardless of what you'd already run before.
