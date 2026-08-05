export type UserStatus = 'online' | 'offline' | 'away';

export interface User {
  id: string;
  username: string;
  avatar: string;
  passkey: string;
  status: UserStatus;
  customStatus?: string;
  bio?: string;
  createdAt: string;
  publicKeyFingerprint: string;
}

export type MessageType = 'text' | 'image' | 'voice' | 'file' | 'system';

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  emoji: string;
  users: string[]; // User IDs who reacted with this emoji
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  voiceDuration?: number; // seconds
  timestamp: string;
  isEncrypted: boolean;
  status: MessageDeliveryStatus;
  selfDestructTimer: number; // 0 = off, else seconds (5, 30, 60, 3600, 86400)
  expiresAt?: number; // Epoch ms timestamp when message dissolves
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  reactions?: MessageReaction[];
}

export type ChatType = 'direct' | 'group' | 'ai';

export interface Chat {
  id: string;
  name: string;
  type: ChatType;
  avatar: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  selfDestructTimer: number; // default chat-level self destruct setting
  e2eFingerprint: string;
  members: User[];
  groupInviteCode?: string;
  topic?: string;
  description?: string;
  isArchived?: boolean;
}

export type FileCategory = 'image' | 'document' | 'audio' | 'archive' | 'code';

export interface CloudFile {
  id: string;
  ownerId: string;
  name: string;
  size: number; // bytes
  sizeFormatted: string;
  mimeType: string;
  url: string;
  category: FileCategory;
  uploadedAt: string;
  isFavorite: boolean;
  sharedChatIds: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'message' | 'group' | 'security' | 'storage' | 'ai';
  linkChatId?: string;
}

export type ActiveTab = 'chats' | 'rooms' | 'calls' | 'settings' | 'vault' | 'ai' | 'contacts';

export type ChatWallpaper = string;

export interface CallLog {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  type: 'incoming' | 'outgoing' | 'missed';
  callType: 'voice' | 'video';
  timestamp: string;
  duration?: number; // seconds
  isE2EE: boolean;
}

export interface ActiveCall {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  isVideo: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  status: 'dialing' | 'connected' | 'ended';
  duration: number; // seconds elapsed
  isE2EE: boolean;
}
