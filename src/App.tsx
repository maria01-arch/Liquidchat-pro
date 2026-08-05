import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, PhoneCall, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { LiquidVault } from './components/LiquidVault';
import { XchordAIHub } from './components/XchordAIHub';
import { ContactsTab } from './components/ContactsTab';
import { SettingsTab } from './components/SettingsTab';
import { PasskeyModal } from './components/PasskeyModal';
import { EncryptionVerificationModal } from './components/EncryptionVerificationModal';
import { NewGroupModal } from './components/NewGroupModal';
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
import { encryptE2EEMessage, generateFingerprint } from './utils/crypto';
import { playNotificationSound } from './utils/audio';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [vaultFiles, setVaultFiles] = useState<CloudFile[]>(INITIAL_FILES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [theme, setTheme] = useState<'dark' | 'light' | 'emerald'>('dark');
  const [wallpaper, setWallpaper] = useState<ChatWallpaper>('telegram-doodle');

  // In-App Browser & Search Engine state
  const [useInAppBrowser, setUseInAppBrowserState] = useState<boolean>(() => {
    return localStorage.getItem('liquid_use_in_app_browser') !== 'false';
  });

  const setUseInAppBrowser = (val: boolean) => {
    setUseInAppBrowserState(val);
    localStorage.setItem('liquid_use_in_app_browser', val ? 'true' : 'false');
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
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedContactChat, setSelectedContactChat] = useState<Chat | null>(null);

  const handleUpdateUserProfile = (updated: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updated }));
  };

  // Unread notification count
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeChatMessages = activeChatId ? messages[activeChatId] || [] : [];

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

    const encryptedContent = type === 'text' ? encryptE2EEMessage(content, chat?.e2eFingerprint || 'secret') : content;

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

    // If active chat is xchord AI, trigger AI response automatically!
    if (chat?.type === 'ai') {
      triggerXchordAIReply(chatId, content);
    }
  };

  // Trigger xchord AI response in chat
  const triggerXchordAIReply = async (chatId: string, userPrompt: string) => {
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
      const replyText = data.text || data.fallbackResponse || 'xchord AI responded.';

      playNotificationSound();

      const aiMsg: Message = {
        id: `msg_ai_${Date.now()}`,
        chatId,
        senderId: 'usr_ai_999',
        senderName: 'xchord AI',
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
      console.error('Failed calling xchord AI', err);
    }
  };

  // Ask xchord AI from Hub or Header
  const handleAskXchordAI = async (prompt: string, mode?: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
      });
      const data = await res.json();
      return data.text || data.fallbackResponse || 'xchord AI processed your request.';
    } catch {
      return 'Offline mode: xchord AI could not be reached.';
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
        body: `Saved "${newFile.name}" to Liquid Storage.`,
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
    handleSendMessage(chatId, `Shared from Liquid Storage: ${file.name}`, 'file', {
      attachmentName: file.name,
      attachmentUrl: file.url,
      attachmentSize: file.sizeFormatted,
    });
    setActiveTab('chats');
    setActiveChatId(chatId);
  };

  // Create New Group
  const handleCreateGroup = (name: string, topic: string, memberIds: string[], timerSeconds: number) => {
    const selectedUsers = users.filter((u) => memberIds.includes(u.id));
    const newChatId = `chat_group_${Date.now()}`;

    const newGroup: Chat = {
      id: newChatId,
      name,
      type: 'group',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      unreadCount: 0,
      lastMessage: 'Group created with E2EE active',
      lastMessageTime: 'Just now',
      selfDestructTimer: timerSeconds,
      e2eFingerprint: generateFingerprint(name + Date.now()),
      members: selectedUsers,
      topic: topic || 'Encrypted liquidchat Group',
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
  };

  // Start direct chat with user from directory
  const handleStartDirectChat = (user: User) => {
    const existing = chats.find((c) => c.type === 'direct' && c.members.some((m) => m.id === user.id));
    if (existing) {
      setActiveTab('chats');
      setActiveChatId(existing.id);
      return;
    }

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
                  onAskXchordAI={() => {
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
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F9FAFB] dark:bg-slate-900 select-none">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-1">
                    LIQUIDCHAT Web
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm">
                    Select a conversation from the list to start messaging with Zero-Knowledge E2EE.
                  </p>
                </div>
              )}

              {activeTab === 'rooms' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
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
                <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
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
                <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
                  <LiquidVault
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
                <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
                  <XchordAIHub
                    onAskAI={handleAskXchordAI}
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
                <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
                  <ContactsTab
                    users={users}
                    currentUser={currentUser}
                    onStartChat={(chatId) => navigateTo('chats', chatId)}
                    unreadNotifCount={unreadNotifCount}
                    onOpenNotifications={() => setShowNotifications(true)}
                    onOpenUserProfile={() => setShowUserProfileModal(true)}
                    theme={theme}
                    setTheme={setTheme}
                    onBackToChats={handleGoBack}
                  />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
                  <SettingsTab
                    currentUser={currentUser}
                    theme={theme}
                    setTheme={setTheme}
                    onOpenPasskeyModal={() => setShowPasskeyModal(true)}
                    onOpenAuthModal={() => setShowAuthModal(true)}
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
            handleAskXchordAI(prompt);
          }}
          vaultFiles={vaultFiles}
        />
      )}
      {showPasskeyModal && (
        <PasskeyModal
          currentUser={currentUser}
          onClose={() => setShowPasskeyModal(false)}
          onUpdatePasskey={(key) => setCurrentUser((prev) => ({ ...prev, passkey: key }))}
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
          currentUser={currentUser}
          onLoginOrCreate={(user) => {
            setCurrentUser(user);
            setUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
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
