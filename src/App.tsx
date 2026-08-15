import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, PhoneCall, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { PigionVault } from './components/PigionVault';
import { PigionAIHub } from './components/PigionAIHub';
import { ContactsTab } from './components/ContactsTab';
import { SettingsTab } from './components/SettingsTab';
import { PasskeyModal } from './components/PasskeyModal';
import { EncryptionVerificationModal } from './components/EncryptionVerificationModal';
import { NewGroupModal } from './components/NewGroupModal';
import { AddContactModal } from './components/AddContactModal';
import { AuthModal } from './components/AuthModal';
import { NotificationCenter } from './components/NotificationCenter';
import { UserProfileModal } from './components/UserProfileModal';
import { ContactProfileModal } from './components/ContactProfileModal';
import { LiquidNavBar } from './components/LiquidNavBar';
import { InAppBrowserModal } from './components/InAppBrowserModal';

import { RoomsTab } from './components/RoomsTab';
import { CallsTab } from './components/CallsTab';
import { CallModal } from './components/CallModal';
import { ActiveTab, Chat, Message, User, CloudFile, NotificationItem, ChatWallpaper, CallLog, ActiveCall } from './types';
import { CURRENT_USER, MOCK_USERS, INITIAL_CHATS, INITIAL_MESSAGES, INITIAL_FILES, INITIAL_NOTIFICATIONS } from './data/mockData';
import { generateFingerprint } from './utils/crypto';
import { playNotificationSound } from './utils/audio';
import { isBackendConfigured } from './lib/backendMode';
import { fetchMyChats, fetchMessages as fetchLiveMessages, sendMessage as sendLiveMessage, findOrCreateDirectChat, updateUserProfile, createGroupChat, fetchMyContacts, addContact, searchByPrivateNumber, claimPrivateNumber } from './services/chatService';
import { logout, restoreSession } from './utils/auth';
import type { CountryOption } from './utils/privateNumber';
import { useRealtimeMessages } from './hooks/useRealtimeMessages';
import type { PigionIdentity } from './utils/wallet';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [identity, setIdentity] = useState<PigionIdentity | null>(null);
  /** True once a real wallet login/signup has completed against a configured Supabase backend. */
  const isLiveSession = isBackendConfigured && identity !== null;
  /** True while checking for a saved session on first load — avoids flashing the login gate unnecessarily. */
  const [isRestoringSession, setIsRestoringSession] = useState(isBackendConfigured);

  // On load: if a phrase was saved on this device from a previous login,
  // silently re-authenticate instead of forcing the user to type it again.
  useEffect(() => {
    if (!isBackendConfigured) return;
    let cancelled = false;
    restoreSession()
      .then((result) => {
        if (cancelled || !result) return;
        setCurrentUser(result.user);
        setIdentity(result.identity);
        setUsers((prev) => (prev.some((u) => u.id === result.user.id) ? prev : [...prev, result.user]));
      })
      .finally(() => {
        if (!cancelled) setIsRestoringSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [users, setUsers] = useState<User[]>(isBackendConfigured ? [] : MOCK_USERS);
  const [chats, setChats] = useState<Chat[]>(isBackendConfigured ? [] : INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(isBackendConfigured ? {} : INITIAL_MESSAGES);
  const [vaultFiles, setVaultFiles] = useState<CloudFile[]>(isBackendConfigured ? [] : INITIAL_FILES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(isBackendConfigured ? [] : INITIAL_NOTIFICATIONS);

  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [theme, setTheme] = useState<'dark' | 'light' | 'emerald'>('dark');
  const [wallpaper, setWallpaper] = useState<ChatWallpaper>('telegram-doodle');

  // In-App Browser & Search Engine state
  const [useInAppBrowser, setUseInAppBrowserState] = useState<boolean>(() => {
    return localStorage.getItem('pigion_use_in_app_browser') !== 'false';
  });

  const setUseInAppBrowser = (val: boolean) => {
    setUseInAppBrowserState(val);
    localStorage.setItem('pigion_use_in_app_browser', val ? 'true' : 'false');
  };

  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(false);
  const [browserInitialUrl, setBrowserInitialUrl] = useState<string | null>(null);

  const handleOpenUrl = (url: string) => {
    if (useInAppBrowser) {
      setBrowserInitialUrl(url);
      setIsBrowserOpen(true);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenBrowser = () => {
    setBrowserInitialUrl(null);
    setIsBrowserOpen(true);
  };

  // Smart Navigation Stack with Remembrance & Touch Swiping
  type NavHistoryItem = { tab: ActiveTab; activeChatId: string | null };
  const [navHistory, setNavHistory] = useState<NavHistoryItem[]>([]);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  const TABS_ORDER: ActiveTab[] = ['chats', 'rooms', 'calls', 'contacts', 'settings'];

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const navigateTo = (newTab: ActiveTab, newChatId: string | null = null, dir: 'left' | 'right' = 'left') => {
    if (activeTab === newTab && activeChatId === newChatId) return;

    setNavHistory((prev) => [
      ...prev,
      { tab: activeTab, activeChatId },
    ]);
    setSlideDirection(dir);
    setActiveTab(newTab);
    setActiveChatId(newChatId);

    try {
      window.history.pushState({ tab: newTab, activeChatId: newChatId }, '');
    } catch (e) {
      // ignore
    }
  };

  const handleGoBack = () => {
    setSlideDirection('right');
    if (activeChatId !== null) {
      setActiveChatId(null);
      return;
    }

    // Direct back navigation from any menu/tab to the chat interface
    setActiveTab('chats');
    setActiveChatId(null);
    setNavHistory([]);
  };

  const handleNextTab = () => {
    const currentIndex = TABS_ORDER.indexOf(activeTab);
    if (currentIndex !== -1 && currentIndex < TABS_ORDER.length - 1) {
      const nextTab = TABS_ORDER[currentIndex + 1];
      navigateTo(nextTab, null, 'left');
    }
  };

  const handlePrevTab = () => {
    const currentIndex = TABS_ORDER.indexOf(activeTab);
    if (currentIndex > 0) {
      const prevTab = TABS_ORDER[currentIndex - 1];
      navigateTo(prevTab, null, 'right');
    }
  };

  const isInputField = (target: HTMLElement | null): boolean => {
    if (!target) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable ||
      Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
    );
  };

  const handleStartGesture = (clientX: number, clientY: number, target: HTMLElement) => {
    if (isInputField(target)) return;
    touchStartRef.current = {
      x: clientX,
      y: clientY,
      time: Date.now(),
    };
  };

  const handleEndGesture = (clientX: number, clientY: number) => {
    if (!touchStartRef.current) return;
    const deltaX = clientX - touchStartRef.current.x;
    const deltaY = clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;

    // Minimum drag/swipe threshold: abs(deltaX) >= 30, horizontal dominance (deltaX > 1.1 * deltaY), completed within 750ms
    if (Math.abs(deltaX) >= 30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1 && deltaTime < 750) {
      if (deltaX > 0) {
        // Dragged LEFT to RIGHT (Finger/cursor moves right)
        if (activeChatId !== null) {
          // Inside a DM -> close chat view and return to chat list
          handleGoBack();
        } else {
          // On main tab screen -> navigate to previous tab sequentially (Settings -> Contacts -> Calls -> Rooms -> Chats)
          handlePrevTab();
        }
      } else {
        // Dragged RIGHT to LEFT (Finger/cursor moves left)
        if (activeChatId === null) {
          // On main tab screen -> navigate to next tab sequentially (Chats -> Rooms -> Calls -> Contacts -> Settings)
          handleNextTab();
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStartGesture(e.touches[0].clientX, e.touches[0].clientY, e.target as HTMLElement);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length > 0) {
      handleEndGesture(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      handleStartGesture(e.clientX, e.clientY, e.target as HTMLElement);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      handleEndGesture(e.clientX, e.clientY);
    }
  };

  // Browser Back Button (popstate) integration
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
        setActiveChatId(event.state.activeChatId ?? null);
      } else {
        handleGoBack();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navHistory, activeTab, activeChatId]);

  // Audio / Video Calling States
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([
    {
      id: 'call_1',
      contactId: MOCK_USERS[0].id,
      contactName: MOCK_USERS[0].username,
      contactAvatar: MOCK_USERS[0].avatar,
      type: 'incoming',
      callType: 'voice',
      timestamp: 'Today, 11:24 AM',
      duration: 252,
      isE2EE: true,
    },
    {
      id: 'call_2',
      contactId: MOCK_USERS[1].id,
      contactName: MOCK_USERS[1].username,
      contactAvatar: MOCK_USERS[1].avatar,
      type: 'outgoing',
      callType: 'video',
      timestamp: 'Yesterday, 8:45 PM',
      duration: 725,
      isE2EE: true,
    },
    {
      id: 'call_3',
      contactId: MOCK_USERS[2].id,
      contactName: MOCK_USERS[2].username,
      contactAvatar: MOCK_USERS[2].avatar,
      type: 'missed',
      callType: 'voice',
      timestamp: 'Aug 2, 4:10 PM',
      duration: 0,
      isE2EE: true,
    },
  ]);

  const handleStartCall = (peer: User, isVideo: boolean) => {
    setActiveCall({
      id: `call_${Date.now()}`,
      contactId: peer.id,
      contactName: peer.username,
      contactAvatar: peer.avatar,
      isVideo,
      isMuted: false,
      isCameraOff: !isVideo,
      isSpeakerOn: true,
      status: 'connected',
      duration: 0,
      isE2EE: true,
    });
  };

  const handleEndCall = () => {
    if (activeCall) {
      setCallLogs((prev) => [
        {
          id: `call_${Date.now()}`,
          contactId: activeCall.contactId,
          contactName: activeCall.contactName,
          contactAvatar: activeCall.contactAvatar,
          type: 'outgoing',
          callType: activeCall.isVideo ? 'video' : 'voice',
          timestamp: 'Just now',
          duration: activeCall.duration,
          isE2EE: true,
        },
        ...prev,
      ]);
    }
    setActiveCall(null);
  };

  // Modals state
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedContactChat, setSelectedContactChat] = useState<Chat | null>(null);

  const handleUpdateUserProfile = (updated: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updated }));

    if (isLiveSession) {
      updateUserProfile(currentUser.id, {
        username: updated.username,
        avatarUrl: updated.avatar,
        bio: updated.bio,
        customStatus: updated.customStatus,
      }).catch((err) => console.error('[Pigion] Failed to save profile:', err));
    }
  };

  const [privateNumberError, setPrivateNumberError] = useState<string | null>(null);

  // Global toast for background/async failures (chat creation, sending,
  // contacts) that would otherwise fail silently with only a console log —
  // exactly the kind of bug that's impossible to diagnose from the UI alone.
  const [toastError, setToastError] = useState<string | null>(null);
  const showErrorToast = (message: string) => {
    setToastError(message);
    setTimeout(() => setToastError(null), 6000);
  };
  const handleClaimPrivateNumber = (country: CountryOption) => {
    if (!isLiveSession) return;
    setPrivateNumberError(null);
    claimPrivateNumber(currentUser.id, country)
      .then((updatedUser) => setCurrentUser(updatedUser))
      .catch((err) => setPrivateNumberError(err instanceof Error ? err.message : 'Failed to claim a private number.'));
  };

  const handleAddContact = (user: User) => {
    setUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
    if (isLiveSession) {
      addContact(currentUser.id, user.id).catch((err) => {
        console.error('[Pigion] Failed to save contact:', err);
        showErrorToast('Could not save that contact — ' + (err instanceof Error ? err.message : 'please try again.'));
      });
    }
  };

  // Unread notification count
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeChatMessages = activeChatId ? messages[activeChatId] || [] : [];

  // --- Live backend: fetch real chats once a wallet session exists ---
  useEffect(() => {
    if (!isLiveSession || !identity) return;
    let cancelled = false;
    fetchMyChats(currentUser.id, identity)
      .then((liveChats) => {
        if (!cancelled) setChats(liveChats);
      })
      .catch((err) => console.error('[Pigion] Failed to load chats from Supabase:', err));
    return () => {
      cancelled = true;
    };
  }, [isLiveSession, currentUser.id]);

  // --- Live backend: fetch your saved contacts (not an open directory) ---
  useEffect(() => {
    if (!isLiveSession) return;
    let cancelled = false;
    fetchMyContacts(currentUser.id)
      .then((contacts) => {
        if (!cancelled) setUsers([currentUser, ...contacts]);
      })
      .catch((err) => console.error('[Pigion] Failed to load contacts from Supabase:', err));
    return () => {
      cancelled = true;
    };
  }, [isLiveSession, currentUser.id]);

  // --- Live backend: fetch a chat's real (decrypted) message history when opened ---
  useEffect(() => {
    if (!isLiveSession || !identity || !activeChat) return;
    let cancelled = false;
    fetchLiveMessages(activeChat, identity, currentUser.id)
      .then((msgs) => {
        if (!cancelled) setMessages((prev) => ({ ...prev, [activeChat.id]: msgs }));
      })
      .catch((err) => console.error('[Pigion] Failed to load messages from Supabase:', err));
    return () => {
      cancelled = true;
    };
  }, [isLiveSession, activeChat?.id, identity, currentUser.id]);

  // --- Live backend: receive new messages in realtime for the open chat ---
  useRealtimeMessages(isLiveSession ? activeChat : null, identity, currentUser.id, (incoming) => {
    setMessages((prev) => {
      const existing = prev[incoming.chatId] || [];
      if (existing.some((m) => m.id === incoming.id)) return prev;
      return { ...prev, [incoming.chatId]: [...existing, incoming] };
    });
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === incoming.chatId
          ? {
              ...c,
              lastMessage: incoming.type === 'text' ? incoming.content : `[${incoming.type.toUpperCase()} Attachment]`,
              lastMessageTime: 'Just now',
            }
          : c
      )
    );
  });

  // Ticking timer effect for Self-Destructing Messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => {
        let changed = false;
        const updated: Record<string, Message[]> = {};

        Object.keys(prev).forEach((cId) => {
          const chatMsgs = prev[cId];
          const filtered = chatMsgs.filter((m) => {
            if (m.selfDestructTimer > 0) {
              const now = Date.now();
              if (!m.expiresAt) {
                // Initialize expiration timer timestamp
                m.expiresAt = now + m.selfDestructTimer * 1000;
              }
              if (now >= m.expiresAt) {
                changed = true;
                return false; // Remove / dissolve message!
              }
            }
            return true;
          });
          updated[cId] = filtered;
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Send Message Handler
  const handleSendMessage = (
    chatId: string,
    content: string,
    type: Message['type'] = 'text',
    attachment?: Partial<Message>
  ) => {
    const chat = chats.find((c) => c.id === chatId);
    const selfDestructSecs = chat ? chat.selfDestructTimer : 0;

    // Live backend + direct or group chat: persist to Supabase, then reflect
    // the real (server-confirmed) message locally once the write succeeds.
    // Direct chats are genuinely E2E encrypted; group chats pass through as
    // plaintext for now (see chatService.ts module note — real multi-party
    // E2EE for groups is a separate follow-up).
    //
    // NOTE: checking `type === 'text'` here, not `!attachment` — ChatWindow
    // always passes a 4th argument object for reply-context (even when not
    // replying, it's `{ replyTo: undefined }`, which is still truthy), so
    // `!attachment` was never true for a normal message and this branch was
    // silently never running — every message was falling through to the
    // local-only demo path below and never actually reaching Supabase.
    if (isLiveSession && identity && chat && (chat.type === 'direct' || chat.type === 'group') && type === 'text') {
      const optimisticId = `pending_${Date.now()}`;
      const optimisticMsg: Message = {
        id: optimisticId,
        chatId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        content,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEncrypted: chat.type === 'direct',
        status: 'sent',
        selfDestructTimer: selfDestructSecs,
        expiresAt: selfDestructSecs > 0 ? Date.now() + selfDestructSecs * 1000 : undefined,
        replyTo: attachment?.replyTo,
      };
      setMessages((prev) => ({ ...prev, [chatId]: [...(prev[chatId] || []), optimisticMsg] }));
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, lastMessage: content, lastMessageTime: 'Just now' } : c))
      );

      sendLiveMessage({
        chat,
        identity,
        myUserId: currentUser.id,
        content,
        type,
        selfDestructTimer: selfDestructSecs,
        replyToId: attachment?.replyTo?.id,
      })
        .then((saved) => {
          setMessages((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((m) =>
              m.id === optimisticId
                ? { ...saved, senderName: currentUser.username, senderAvatar: currentUser.avatar, replyTo: attachment?.replyTo }
                : m
            ),
          }));
        })
        .catch((err) => {
          console.error('[Pigion] Failed to send message:', err);
          showErrorToast('Message failed to send — ' + (err instanceof Error ? err.message : 'please try again.'));
          setMessages((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((m) => (m.id === optimisticId ? { ...m, status: 'sent' } : m)),
          }));
        });
      return;
    }

    // Demo mode / group / AI chats: local-only state (see SETUP.md).
    const encryptedContent = content;

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      content: encryptedContent,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true,
      status: 'sent',
      selfDestructTimer: selfDestructSecs,
      expiresAt: selfDestructSecs > 0 ? Date.now() + selfDestructSecs * 1000 : undefined,
      ...attachment,
    };

    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMsg],
    }));

    // Update chat last message preview
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: type === 'text' ? content : `[${type.toUpperCase()} Attachment]`,
              lastMessageTime: 'Just now',
            }
          : c
      )
    );

    // If active chat is Pigion AI, trigger AI response automatically!
    if (chat?.type === 'ai') {
      triggerPigionAIReply(chatId, content);
    }
  };

  // Trigger Pigion AI response in chat
  const triggerPigionAIReply = async (chatId: string, userPrompt: string) => {
    try {
      const chatHistory = (messages[chatId] || []).map((m) => ({
        role: m.senderId === currentUser.id ? 'user' : 'model',
        text: m.content,
      }));

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          conversationHistory: chatHistory.slice(-6),
        }),
      });

      const data = await response.json();
      const replyText = data.text || data.fallbackResponse || 'Pigion AI responded.';

      playNotificationSound();

      const aiMsg: Message = {
        id: `msg_ai_${Date.now()}`,
        chatId,
        senderId: 'usr_ai_999',
        senderName: 'Pigion AI',
        senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        content: replyText,
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEncrypted: true,
        status: 'read',
        selfDestructTimer: 0,
      };

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), aiMsg],
      }));
    } catch (err) {
      console.error('Failed calling Pigion AI', err);
    }
  };

  // Ask Pigion AI from Hub or Header
  const handleAskPigionAI = async (prompt: string, mode?: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
      });
      const data = await res.json();
      return data.text || data.fallbackResponse || 'Pigion AI processed your request.';
    } catch {
      return 'Offline mode: Pigion AI could not be reached.';
    }
  };

  // Update Chat Self-Destruct Timer
  const handleUpdateSelfDestruct = (chatId: string, seconds: number) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, selfDestructTimer: seconds } : c))
    );
  };

  // Delete message manually
  const handleDeleteMessage = (msgId: string) => {
    if (!activeChatId) return;
    setMessages((prev) => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).filter((m) => m.id !== msgId),
    }));
  };

  // Toggle emoji reaction on message
  const handleToggleReaction = (chatId: string, messageId: string, emoji: string) => {
    setMessages((prev) => {
      const chatMsgs = prev[chatId] || [];
      const updated = chatMsgs.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = msg.reactions || [];
        const existingIndex = currentReactions.findIndex((r) => r.emoji === emoji);

        let newReactions = [...currentReactions];
        if (existingIndex > -1) {
          const rx = newReactions[existingIndex];
          const hasUser = rx.users.includes(currentUser.id);
          if (hasUser) {
            const nextUsers = rx.users.filter((u) => u !== currentUser.id);
            if (nextUsers.length === 0) {
              newReactions.splice(existingIndex, 1);
            } else {
              newReactions[existingIndex] = { ...rx, users: nextUsers };
            }
          } else {
            newReactions[existingIndex] = { ...rx, users: [...rx.users, currentUser.id] };
          }
        } else {
          newReactions.push({ emoji, users: [currentUser.id] });
        }
        return { ...msg, reactions: newReactions };
      });
      return { ...prev, [chatId]: updated };
    });
  };

  // Clear all messages in active chat
  const handleClearChat = (chatId: string) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: [],
    }));
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, lastMessage: 'Chat history cleared', lastMessageTime: 'Just now' }
          : c
      )
    );
  };

  // Storage Vault Actions
  const handleUploadVaultFile = (fileData: Partial<CloudFile>) => {
    const newFile: CloudFile = {
      id: `file_${Date.now()}`,
      ownerId: currentUser.id,
      name: fileData.name || 'Untitled',
      size: fileData.size || 1024 * 1024,
      sizeFormatted: fileData.sizeFormatted || '1.0 MB',
      mimeType: fileData.mimeType || 'application/octet-stream',
      url: fileData.url || '#',
      category: fileData.category || 'document',
      uploadedAt: new Date().toLocaleString(),
      isFavorite: false,
      sharedChatIds: [],
    };
    setVaultFiles((prev) => [newFile, ...prev]);

    // Notification
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'File Uploaded to Vault',
        body: `Saved "${newFile.name}" to Pigion Vault.`,
        timestamp: 'Just now',
        read: false,
        type: 'storage',
      },
      ...prev,
    ]);
  };

  const handleDeleteVaultFile = (fileId: string) => {
    setVaultFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleToggleVaultFavorite = (fileId: string) => {
    setVaultFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f))
    );
  };

  const handleShareVaultFileToChat = (file: CloudFile, chatId: string) => {
    handleSendMessage(chatId, `Shared from Pigion Vault: ${file.name}`, 'file', {
      attachmentName: file.name,
      attachmentUrl: file.url,
      attachmentSize: file.sizeFormatted,
    });
    setActiveTab('chats');
    setActiveChatId(chatId);
  };

  // Create New Group
  const handleCreateGroup = (name: string, topic: string, memberIds: string[], timerSeconds: number) => {
    if (isLiveSession && identity) {
      createGroupChat(currentUser.id, name, topic, memberIds, timerSeconds)
        .then((liveGroup) => {
          setChats((prev) => [liveGroup, ...prev]);
          setActiveTab('chats');
          setActiveChatId(liveGroup.id);
          setShowNewGroupModal(false);
        })
        .catch((err) => {
          console.error('[Pigion] Failed to create group:', err);
          showErrorToast('Could not create the group — ' + (err instanceof Error ? err.message : 'please try again.'));
        });
      return;
    }

    // Demo mode fallback — local-only group
    const selectedUsers = users.filter((u) => memberIds.includes(u.id));
    const newChatId = `chat_group_${Date.now()}`;

    const newGroup: Chat = {
      id: newChatId,
      name,
      type: 'group',
      avatar: '',
      unreadCount: 0,
      lastMessage: 'Group created with E2EE active',
      lastMessageTime: 'Just now',
      selfDestructTimer: timerSeconds,
      e2eFingerprint: generateFingerprint(name + Date.now()),
      members: selectedUsers,
      topic: topic || 'Encrypted Pigion Group',
    };

    setChats((prev) => [newGroup, ...prev]);
    setMessages((prev) => ({
      ...prev,
      [newChatId]: [
        {
          id: `msg_sys_${Date.now()}`,
          chatId: newChatId,
          senderId: 'sys',
          senderName: 'System',
          senderAvatar: currentUser.avatar,
          content: `Encrypted group "${name}" created. E2EE active.`,
          type: 'text',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEncrypted: true,
          status: 'read',
          selfDestructTimer: 0,
        },
      ],
    }));

    setActiveTab('chats');
    setActiveChatId(newChatId);
    setShowNewGroupModal(false);
  };

  // Start direct chat with user from directory
  const handleStartDirectChat = (user: User) => {
    const existing = chats.find((c) => c.type === 'direct' && c.members.some((m) => m.id === user.id));
    if (existing) {
      setActiveTab('chats');
      setActiveChatId(existing.id);
      return;
    }

    if (isLiveSession && identity) {
      findOrCreateDirectChat(currentUser.id, user, identity)
        .then((liveChat) => {
          setChats((prev) => [liveChat, ...prev]);
          setActiveTab('chats');
          setActiveChatId(liveChat.id);
        })
        .catch((err) => {
          console.error('[Pigion] Failed to start chat:', err);
          showErrorToast('Could not open that chat — ' + (err instanceof Error ? err.message : 'please try again.'));
        });
      return;
    }

    // Demo mode fallback — local-only chat
    const newChatId = `chat_direct_${Date.now()}`;
    const newChat: Chat = {
      id: newChatId,
      name: user.username,
      type: 'direct',
      avatar: user.avatar,
      unreadCount: 0,
      lastMessage: 'Started encrypted conversation',
      lastMessageTime: 'Just now',
      selfDestructTimer: 0,
      e2eFingerprint: generateFingerprint(user.username + currentUser.username),
      members: [currentUser, user],
      topic: user.customStatus || 'Direct E2EE Chat',
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveTab('chats');
    setActiveChatId(newChatId);
  };

  // No demo fallback once a real backend is configured: you must actually
  // log in (or the mock "AlexRider" account would confusingly be shown as
  // if it were a real, logged-in session). While we're silently checking
  // for a saved session (see restore effect above), show a brief loading
  // state instead of flashing the login form.
  const needsLogin = isBackendConfigured && !identity && !isRestoringSession;

  if (isBackendConfigured && isRestoringSession) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="h-screen w-screen bg-slate-950">
        <AuthModal
          mandatory
          onLoginOrCreate={(user, userIdentity) => {
            setCurrentUser(user);
            setIdentity(userIdentity);
            setUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
            setChats([]);
            setMessages({});
            setActiveChatId(null);
          }}
          onClose={() => {}}
        />
      </div>
    );
  }

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${
        theme === 'emerald'
          ? 'bg-teal-950 text-slate-100'
          : theme === 'dark'
          ? 'bg-slate-950 text-slate-100'
          : 'bg-[#F3F4F6] text-gray-900'
      }`}
    >
      {toastError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[calc(100%-2rem)] bg-red-500/95 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-2xl flex items-start space-x-2 animate-in fade-in slide-in-from-top-2">
          <span className="flex-1">{toastError}</span>
          <button onClick={() => setToastError(null)} className="shrink-0 opacity-80 hover:opacity-100">✕</button>
        </div>
      )}
      {/* Main Container Layout (Full 100vh without top navbar) with Swipe & Drag Gesture Support */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="flex-1 flex overflow-hidden relative h-full select-none"
      >
        {/* Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
            activeTab === 'chats'
              ? activeChatId
                ? 'hidden md:flex'
                : 'flex'
              : 'hidden md:flex'
          }`}
        >
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => navigateTo(tab, null, 'left')}
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={(id) => navigateTo('chats', id, 'left')}
            onOpenNewGroupModal={() => setShowNewGroupModal(true)}
            onOpenNewDirectChatModal={() => navigateTo('contacts', null, 'left')}
            currentUser={currentUser}
            onOpenUserProfile={() => setShowUserProfileModal(true)}
            onOpenPasskeyModal={() => setShowPasskeyModal(true)}
            onOpenNotifications={() => setShowNotifications(true)}
            unreadNotifCount={unreadNotifCount}
            theme={theme}
            setTheme={setTheme}
            onGoBack={handleGoBack}
            canGoBack={navHistory.length > 0 || activeChatId !== null || activeTab !== 'chats'}
            onOpenBrowser={handleOpenBrowser}
          />
        </div>

        {/* Dynamic Right Panel / Chat View */}
        <main
          className={`flex-1 flex flex-col min-w-0 h-full relative ${
            activeTab === 'chats'
              ? !activeChatId
                ? 'hidden md:flex'
                : 'flex'
              : 'flex'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (activeChatId || '')}
              initial={{ opacity: 0, x: slideDirection === 'left' ? 35 : -35 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection === 'left' ? -35 : 35 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden"
            >
              {activeTab === 'chats' && activeChat && (
                <ChatWindow
                  chat={activeChat}
                  messages={activeChatMessages}
                  currentUser={currentUser}
                  wallpaper={wallpaper}
                  onSelectWallpaper={(wp) => setWallpaper(wp)}
                  onSendMessage={handleSendMessage}
                  onUpdateSelfDestruct={handleUpdateSelfDestruct}
                  onOpenEncryptionModal={() => setShowEncryptionModal(true)}
                  onAskPigionAI={() => {
                    navigateTo('ai');
                  }}
                  vaultFiles={vaultFiles}
                  onSaveToVault={handleUploadVaultFile}
                  onDeleteMessage={handleDeleteMessage}
                  onToggleReaction={(messageId, emoji) => handleToggleReaction(activeChat.id, messageId, emoji)}
                  onClearChat={handleClearChat}
                  onBackToList={() => handleGoBack()}
                  onStartCall={(isVideo) => {
                    const members = activeChat.members || [];
                    const peer = members.find((m) => m.id !== currentUser.id) || members[0] || users[1] || currentUser;
                    handleStartCall(peer, isVideo);
                  }}
                  theme={theme}
                  setTheme={setTheme}
                  onOpenProfile={() => setShowUserProfileModal(true)}
                  onOpenContactProfile={(chat) => setSelectedContactChat(chat)}
                  onOpenUrl={handleOpenUrl}
                />
              )}

              {activeTab === 'chats' && !activeChat && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-slate-950 select-none">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-1">
                    PIGION Web
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm">
                    Select a conversation from the list to start messaging with Zero-Knowledge E2EE.
                  </p>
                </div>
              )}

              {activeTab === 'rooms' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <RoomsTab
                    chats={chats}
                    users={users}
                    onSelectRoom={(id) => {
                      navigateTo('chats', id);
                    }}
                    onOpenCreateRoomModal={() => setShowNewGroupModal(true)}
                    currentUser={currentUser}
                    unreadNotifCount={unreadNotifCount}
                    onOpenNotifications={() => setShowNotifications(true)}
                    onOpenUserProfile={() => setShowUserProfileModal(true)}
                    theme={theme}
                    setTheme={setTheme}
                    onBackToChats={handleGoBack}
                  />
                </div>
              )}

              {activeTab === 'calls' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <CallsTab
                    callLogs={callLogs}
                    contacts={users}
                    onStartCall={handleStartCall}
                    currentUser={currentUser}
                    unreadNotifCount={unreadNotifCount}
                    onOpenNotifications={() => setShowNotifications(true)}
                    onOpenUserProfile={() => setShowUserProfileModal(true)}
                    theme={theme}
                    setTheme={setTheme}
                    onBackToChats={handleGoBack}
                  />
                </div>
              )}

              {activeTab === 'vault' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <PigionVault
                    files={vaultFiles}
                    onUploadFile={handleUploadVaultFile}
                    onDeleteFile={handleDeleteVaultFile}
                    onToggleFavorite={handleToggleVaultFavorite}
                    chats={chats}
                    onShareToChat={handleShareVaultFileToChat}
                    currentUser={currentUser}
                    unreadNotifCount={unreadNotifCount}
                    onOpenNotifications={() => setShowNotifications(true)}
                    onOpenUserProfile={() => setShowUserProfileModal(true)}
                    theme={theme}
                    setTheme={setTheme}
                    onBackToChats={handleGoBack}
                  />
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <PigionAIHub
                    onAskAI={handleAskPigionAI}
                    currentUser={currentUser}
                    unreadNotifCount={unreadNotifCount}
                    onOpenNotifications={() => setShowNotifications(true)}
                    onOpenUserProfile={() => setShowUserProfileModal(true)}
                    theme={theme}
                    setTheme={setTheme}
                    onBackToChats={handleGoBack}
                  />
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <ContactsTab
                    users={users}
                    currentUser={currentUser}
                    onStartChat={(user) => handleStartDirectChat(user)}
                    onOpenAddContactModal={isLiveSession ? () => setShowAddContactModal(true) : undefined}
                    unreadNotifCount={unreadNotifCount}
                    onOpenNotifications={() => setShowNotifications(true)}
                    onOpenUserProfile={() => setShowUserProfileModal(true)}
                    theme={theme}
                    setTheme={setTheme}
                    onBackToChats={handleGoBack}
                  />
                </div>
              )}

              {showAddContactModal && (
                <AddContactModal
                  onClose={() => setShowAddContactModal(false)}
                  onSearch={(number) => searchByPrivateNumber(number)}
                  onAddContact={handleAddContact}
                  onStartChat={(user) => handleStartDirectChat(user)}
                />
              )}

              {activeTab === 'settings' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <SettingsTab
                    currentUser={currentUser}
                    theme={theme}
                    setTheme={setTheme}
                    onOpenPasskeyModal={() => setShowPasskeyModal(true)}
                    onOpenAuthModal={() => setShowAuthModal(true)}
                    onLogout={
                      isBackendConfigured
                        ? () => {
                            logout(); // clears the in-memory session token
                            setIdentity(null);
                            setChats([]);
                            setMessages({});
                            setActiveChatId(null);
                            setActiveTab('chats');
                          }
                        : undefined
                    }
                    unreadNotifCount={unreadNotifCount}
                    onOpenNotifications={() => setShowNotifications(true)}
                    onOpenUserProfile={() => setShowUserProfileModal(true)}
                    onBackToChats={handleGoBack}
                    useInAppBrowser={useInAppBrowser}
                    setUseInAppBrowser={setUseInAppBrowser}
                    onOpenBrowser={handleOpenBrowser}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Floating Mobile Bottom Navigation Bar */}
          {(!activeChatId || activeTab !== 'chats') && (
            <div className="md:hidden fixed bottom-2 inset-x-2 z-40">
              <LiquidNavBar
                activeTab={activeTab}
                setActiveTab={(tab) =>
                  navigateTo(tab, null, TABS_ORDER.indexOf(tab) >= TABS_ORDER.indexOf(activeTab) ? 'left' : 'right')
                }
                unreadChatsCount={chats.filter((c) => c.unreadCount > 0).length}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedContactChat && (
        <ContactProfileModal
          chat={selectedContactChat}
          peerUser={
            selectedContactChat.members?.find((m) => m.id !== currentUser.id) ||
            users.find((u) => u.username === selectedContactChat.name) ||
            null
          }
          currentUser={currentUser}
          onClose={() => setSelectedContactChat(null)}
          onStartCall={(peer, isVideo) => {
            setSelectedContactChat(null);
            handleStartCall(peer, isVideo);
          }}
          onUpdateSelfDestruct={handleUpdateSelfDestruct}
          onOpenEncryptionModal={() => {
            setSelectedContactChat(null);
            setShowEncryptionModal(true);
          }}
          onAskAI={(prompt) => {
            setSelectedContactChat(null);
            setActiveTab('ai');
            handleAskPigionAI(prompt);
          }}
          vaultFiles={vaultFiles}
        />
      )}
      {showPasskeyModal && (
        <PasskeyModal
          currentUser={currentUser}
          onClose={() => setShowPasskeyModal(false)}
        />
      )}

      {showEncryptionModal && activeChat && (
        <EncryptionVerificationModal chat={activeChat} onClose={() => setShowEncryptionModal(false)} />
      )}

      {showNewGroupModal && (
        <NewGroupModal
          availableUsers={users}
          currentUser={currentUser}
          onClose={() => setShowNewGroupModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onLoginOrCreate={(user, userIdentity) => {
            setCurrentUser(user);
            setIdentity(userIdentity);
            setUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
            // Live session starts fresh — real chats/messages load via the
            // effects above instead of showing local demo data.
            if (isBackendConfigured) {
              setChats([]);
              setMessages({});
              setActiveChatId(null);
            }
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onClearAll={() => setNotifications([])}
          onSelectNotifChat={(cId) => {
            setActiveChatId(cId);
            setActiveTab('chats');
            setShowNotifications(false);
          }}
        />
      )}

      {showUserProfileModal && (
        <UserProfileModal
          user={currentUser}
          onClose={() => setShowUserProfileModal(false)}
          onSaveProfile={handleUpdateUserProfile}
          onClaimPrivateNumber={isLiveSession ? handleClaimPrivateNumber : undefined}
          privateNumberError={privateNumberError}
        />
      )}

      {/* In-App Browser & Search Engine Modal */}
      <InAppBrowserModal
        isOpen={isBrowserOpen}
        initialUrl={browserInitialUrl}
        onClose={() => setIsBrowserOpen(false)}
      />

      {/* Active Audio / Video Call Modal */}
      {activeCall && (
        <CallModal
          activeCall={activeCall}
          onEndCall={handleEndCall}
          onToggleMute={() => setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))}
          onToggleVideo={() => setActiveCall((prev) => (prev ? { ...prev, isCameraOff: !prev.isCameraOff } : null))}
          onToggleSpeaker={() => setActiveCall((prev) => (prev ? { ...prev, isSpeakerOn: !prev.isSpeakerOn } : null))}
        />
      )}
    </div>
  );
}
