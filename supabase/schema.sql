-- ============================================================================
-- Pigion — Supabase schema
-- Wallet-style auth: identity = public key derived from the user's local
-- passphrase. No email, no password, no reset flow. auth.uid() is the
-- Supabase auth user id minted by the wallet-auth edge function and mapped
-- 1:1 to a row in public.users via public_key.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- USERS
-- id doubles as the JWT `sub` claim minted by the wallet-auth edge function,
-- so `auth.uid() = users.id` works directly — no separate auth.users row.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  public_key text unique not null,               -- Ed25519 signing public key (hex), derived client-side from the passphrase
  encryption_public_key text unique not null,     -- X25519 public key (hex), used for E2EE key agreement
  public_key_fingerprint text not null,           -- short display fingerprint for verification UI
  username text unique not null,
  avatar_url text,
  status text not null default 'offline' check (status in ('online','offline','away')),
  custom_status text,
  bio text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users are viewable by any authenticated user"
  on public.users for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own row"
  on public.users for update
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- AUTH CHALLENGES
-- Short-lived nonces used by the wallet-auth edge function's challenge/
-- response flow. Only the service role touches this table directly.
-- ---------------------------------------------------------------------------
create table if not exists public.auth_challenges (
  public_key text primary key,
  nonce text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.auth_challenges enable row level security;
-- No policies granted to anon/authenticated — only the service role (used
-- exclusively inside the edge function) may read or write this table.

-- ---------------------------------------------------------------------------
-- CHATS (direct / group / ai)
-- ---------------------------------------------------------------------------
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct','group','ai')),
  name text,
  avatar_url text,
  topic text,
  description text,
  self_destruct_timer integer not null default 0,   -- seconds, 0 = off
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

create policy "Members can view their chats"
  on public.chats for select
  using (
    exists (
      select 1 from public.chat_members cm
      where cm.chat_id = chats.id and cm.user_id = auth.uid()
    )
  );

create policy "Members can view their membership rows"
  on public.chat_members for select
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- MESSAGES
-- Content is always the client-side E2EE ciphertext envelope. The server
-- never sees plaintext.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  ciphertext text not null,                -- encrypted payload (never plaintext)
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

create policy "Members can read messages in their chats"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_members cm
      where cm.chat_id = messages.chat_id and cm.user_id = auth.uid()
    )
  );

create policy "Members can send messages to their chats"
  on public.messages for insert
  with check (
    messages.sender_id = auth.uid()
    and exists (
      select 1 from public.chat_members cm
      where cm.chat_id = messages.chat_id and cm.user_id = auth.uid()
    )
  );

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null,
  primary key (message_id, user_id, emoji)
);

alter table public.message_reactions enable row level security;

-- ---------------------------------------------------------------------------
-- VAULT (encrypted cloud file storage)
-- ---------------------------------------------------------------------------
create table if not exists public.vault_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  size_bytes bigint not null,
  mime_type text not null,
  storage_path text not null,       -- path within the 'vault' storage bucket
  category text not null check (category in ('image','document','audio','archive','code')),
  is_favorite boolean not null default false,
  uploaded_at timestamptz not null default now()
);

alter table public.vault_files enable row level security;

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

create policy "Participants can view their call logs"
  on public.call_logs for select
  using (auth.uid() in (call_logs.caller_id, call_logs.callee_id));

-- ---------------------------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_members;
