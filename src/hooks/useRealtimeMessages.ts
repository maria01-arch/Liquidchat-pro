/**
 * Subscribes to new rows on public.messages for one chat and delivers them
 * decrypted (for direct chats) via onMessage. Cleans up its subscription on
 * chat change / unmount.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { deriveSharedKey, decryptE2EEMessage, isE2EEEncrypted } from '../utils/crypto';
import { getDirectChatPeer } from '../services/chatService';
import type { PigionIdentity } from '../utils/wallet';
import type { Chat, Message } from '../types';

export function useRealtimeMessages(
  chat: Chat | null,
  identity: PigionIdentity | null,
  myUserId: string | undefined,
  onMessage: (message: Message) => void
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!chat || !identity || !myUserId) return;

    const peer = chat.type === 'direct' ? getDirectChatPeer(chat, myUserId) : undefined;
    let sharedKeyPromise: Promise<CryptoKey> | null =
      chat.type === 'direct' && peer ? deriveSharedKey(identity.encryptionSecretKey, peer.encryptionPublicKey) : null;

    const channel = supabase
      .channel(`messages:${chat.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chat.id}` },
        async (payload) => {
          const row = payload.new as any;
          // Skip echoing our own optimistically-rendered message back
          if (row.sender_id === myUserId) return;

          const sharedKey = sharedKeyPromise ? await sharedKeyPromise : null;
          const content =
            sharedKey && isE2EEEncrypted(row.ciphertext)
              ? await decryptE2EEMessage(row.ciphertext, sharedKey)
              : row.ciphertext;

          const sender = chat.members.find((m) => m.id === row.sender_id);

          onMessageRef.current({
            id: row.id,
            chatId: row.chat_id,
            senderId: row.sender_id,
            senderName: sender?.username ?? 'Unknown',
            senderAvatar: sender?.avatar ?? '',
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat?.id, identity, myUserId]);
}
