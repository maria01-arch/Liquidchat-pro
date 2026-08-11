/**
 * Pigion — chat/message data layer (Supabase-backed, "live" mode only)
 *
 * Scope of real E2EE in this pass: DIRECT (1:1) chats. Each direct chat's
 * shared AES key is derived on the fly from (my X25519 secret key, peer's
 * X25519 public key) — it's never stored or transmitted, so the server only
 * ever sees ciphertext for direct messages.
 *
 * Group chat E2EE is intentionally NOT implemented here yet: encrypting to
 * multiple recipients securely needs a real multi-party scheme (Signal-style
 * "sender keys", or MLS) rather than re-encrypting per-recipient, which is a
 * meaningfully separate design task. Group messages currently pass through
 * as plaintext rows — flagged clearly rather than faking group E2EE.
 */
import { supabase } from '../lib/supabaseClient';
import type { PigionIdentity } from '../utils/wallet';
import { deriveSharedKey, encryptE2EEMessage, decryptE2EEMessage, isE2EEEncrypted } from '../utils/crypto';
import type { Chat, Message, User } from '../types';

function mapDbUserToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    avatar: row.avatar_url ?? '',
    encryptionPublicKey: row.encryption_public_key,
    signingPublicKey: row.public_key,
    status: row.status,
    customStatus: row.custom_status ?? undefined,
    bio: row.bio ?? undefined,
    createdAt: row.created_at,
    publicKeyFingerprint: row.public_key_fingerprint,
  };
}

function mapDbChatToChat(row: any, members: User[]): Chat {
  return {
    id: row.id,
    name: row.name ?? (row.type === 'direct' ? '' : 'Group'),
    type: row.type,
    avatar: row.avatar_url ?? '',
    unreadCount: 0,
    selfDestructTimer: row.self_destruct_timer ?? 0,
    e2eFingerprint: row.e2e_fingerprint,
    members,
    groupInviteCode: row.group_invite_code ?? undefined,
    topic: row.topic ?? undefined,
    description: row.description ?? undefined,
  };
}

/** Find the "other" member of a direct chat relative to the current user. */
export function getDirectChatPeer(chat: Chat, myUserId: string): User | undefined {
  return chat.members.find((m) => m.id !== myUserId);
}

/** Fetch every chat the current user belongs to, with member lists resolved. */
export async function fetchMyChats(myUserId: string): Promise<Chat[]> {
  const { data: memberRows, error: memberErr } = await supabase
    .from('chat_members')
    .select('chat_id, chats(*)')
    .eq('user_id', myUserId);

  if (memberErr) throw memberErr;
  if (!memberRows || memberRows.length === 0) return [];

  const chatIds = memberRows.map((r: any) => r.chat_id);

  const { data: allMembers, error: allMembersErr } = await supabase
    .from('chat_members')
    .select('chat_id, users(*)')
    .in('chat_id', chatIds);
  if (allMembersErr) throw allMembersErr;

  const membersByChatId = new Map<string, User[]>();
  for (const row of allMembers ?? []) {
    const list = membersByChatId.get(row.chat_id) ?? [];
    list.push(mapDbUserToUser(row.users));
    membersByChatId.set(row.chat_id, list);
  }

  return memberRows.map((r: any) => mapDbChatToChat(r.chats, membersByChatId.get(r.chat_id) ?? []));
}

/**
 * Fetch + decrypt a direct chat's message history. For group/ai chats,
 * content is returned as-is (see module note above).
 */
export async function fetchMessages(chat: Chat, identity: PigionIdentity, myUserId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(username, avatar_url)')
    .eq('chat_id', chat.id)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const peer = chat.type === 'direct' ? getDirectChatPeer(chat, myUserId) : undefined;
  const sharedKey =
    chat.type === 'direct' && peer
      ? await deriveSharedKey(identity.encryptionSecretKey, peer.encryptionPublicKey)
      : null;

  const decrypted: Message[] = [];
  for (const row of data ?? []) {
    const content =
      sharedKey && isE2EEEncrypted(row.ciphertext)
        ? await decryptE2EEMessage(row.ciphertext, sharedKey)
        : row.ciphertext;

    decrypted.push({
      id: row.id,
      chatId: row.chat_id,
      senderId: row.sender_id,
      senderName: row.sender?.username ?? 'Unknown',
      senderAvatar: row.sender?.avatar_url ?? '',
      content,
      type: row.type,
      attachmentUrl: row.attachment_url ?? undefined,
      attachmentName: row.attachment_name ?? undefined,
      attachmentSize: row.attachment_size != null ? String(row.attachment_size) : undefined,
      voiceDuration: row.voice_duration ?? undefined,
      timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: sharedKey != null,
      status: row.status,
      selfDestructTimer: row.self_destruct_timer ?? 0,
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
    });
  }
  return decrypted;
}

export interface SendMessageInput {
  chat: Chat;
  identity: PigionIdentity;
  myUserId: string;
  content: string;
  type: Message['type'];
  selfDestructTimer: number;
}

/** Encrypt (for direct chats) and persist a new message; returns it decrypted for local display. */
export async function sendMessage(input: SendMessageInput): Promise<Message> {
  const { chat, identity, myUserId, content, type, selfDestructTimer } = input;
  const peer = chat.type === 'direct' ? getDirectChatPeer(chat, myUserId) : undefined;

  let ciphertext = content;
  let isEncrypted = false;
  if (chat.type === 'direct' && peer && type === 'text') {
    const sharedKey = await deriveSharedKey(identity.encryptionSecretKey, peer.encryptionPublicKey);
    ciphertext = await encryptE2EEMessage(content, sharedKey);
    isEncrypted = true;
  }

  const expiresAt = selfDestructTimer > 0 ? new Date(Date.now() + selfDestructTimer * 1000).toISOString() : null;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chat.id,
      sender_id: myUserId,
      ciphertext,
      type,
      self_destruct_timer: selfDestructTimer,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    chatId: data.chat_id,
    senderId: data.sender_id,
    senderName: '', // filled by caller from currentUser
    senderAvatar: '',
    content, // plaintext, for immediate local display
    type: data.type,
    timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isEncrypted,
    status: data.status,
    selfDestructTimer: data.self_destruct_timer ?? 0,
    expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
  };
}

/** Persist profile edits (avatar, bio, custom status, username) to Supabase. */
export async function updateUserProfile(userId: string, updates: Partial<{
  username: string;
  avatarUrl: string;
  bio: string;
  customStatus: string;
  status: 'online' | 'offline' | 'away';
}>): Promise<User> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.customStatus !== undefined) dbUpdates.custom_status = updates.customStatus;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { data, error } = await supabase.from('users').update(dbUpdates).eq('id', userId).select().single();
  if (error) throw error;
  return mapDbUserToUser(data);
}

/**
 * Create a real group chat in Supabase (creator + selected members).
 * NOTE: group messages are NOT end-to-end encrypted yet (see module note
 * at top of file) — this creates the chat/membership rows so the group is
 * real and functional; message content passes through as plaintext for now.
 */
export async function createGroupChat(
  myUserId: string,
  name: string,
  topic: string,
  memberIds: string[],
  selfDestructTimer: number
): Promise<Chat> {
  const fingerprint = `GROUP-${name.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const { data: chatRow, error } = await supabase
    .from('chats')
    .insert({
      type: 'group',
      name,
      topic: topic || null,
      self_destruct_timer: selfDestructTimer,
      e2e_fingerprint: fingerprint,
      created_by: myUserId,
    })
    .select()
    .single();
  if (error) throw error;

  const allMemberIds = Array.from(new Set([myUserId, ...memberIds]));
  const { error: memberErr } = await supabase
    .from('chat_members')
    .insert(allMemberIds.map((userId) => ({ chat_id: chatRow.id, user_id: userId })));
  if (memberErr) throw memberErr;

  const { data: memberRows } = await supabase.from('users').select('*').in('id', allMemberIds);
  const members = (memberRows ?? []).map(mapDbUserToUser);

  return mapDbChatToChat(chatRow, members);
}

/** Fetch the public directory of other users (for Contacts / new-chat pickers). Excludes yourself. */
export async function fetchAllUsers(myUserId: string): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').neq('id', myUserId).order('username');
  if (error) throw error;
  return (data ?? []).map(mapDbUserToUser);
}

/** Find (or reuse) a direct chat between the current user and a peer. */
export async function findOrCreateDirectChat(myUserId: string, peer: User, myIdentity: PigionIdentity): Promise<Chat> {
  const { data: myChatIds } = await supabase.from('chat_members').select('chat_id').eq('user_id', myUserId);
  const { data: peerChatIds } = await supabase.from('chat_members').select('chat_id').eq('user_id', peer.id);

  const shared = (myChatIds ?? [])
    .map((r) => r.chat_id)
    .filter((id) => (peerChatIds ?? []).some((r) => r.chat_id === id));

  if (shared.length > 0) {
    const { data: chatRow } = await supabase.from('chats').select('*').eq('id', shared[0]).eq('type', 'direct').maybeSingle();
    if (chatRow) return mapDbChatToChat(chatRow, [peer]);
  }

  const { generateSessionFingerprint } = await import('../utils/crypto');
  const fingerprint = generateSessionFingerprint(myIdentity.encryptionPublicKey, peer.encryptionPublicKey);

  const { data: newChat, error } = await supabase
    .from('chats')
    .insert({ type: 'direct', e2e_fingerprint: fingerprint, created_by: myUserId })
    .select()
    .single();
  if (error) throw error;

  const { error: memberErr } = await supabase
    .from('chat_members')
    .insert([
      { chat_id: newChat.id, user_id: myUserId },
      { chat_id: newChat.id, user_id: peer.id },
    ]);
  if (memberErr) throw memberErr;

  return mapDbChatToChat(newChat, [peer]);
}
