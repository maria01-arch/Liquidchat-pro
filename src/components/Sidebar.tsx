import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  HardDrive,
  Bot,
  Settings,
  Plus,
  Search,
  Lock,
  Timer,
  Pin,
  UserPlus,
  Menu,
  X,
  Bell,
  Key,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  PhoneCall,
  Droplets,
  Layers,
  Radio,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidNavBar } from './LiquidNavBar';
import { Avatar } from './Avatar';
import { ActiveTab, Chat, User } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenNewGroupModal: () => void;
  onOpenNewDirectChatModal: () => void;
  currentUser: User;
  onOpenUserProfile: () => void;
  onOpenPasskeyModal: () => void;
  onOpenNotifications: () => void;
  unreadNotifCount: number;
  theme: 'dark' | 'light' | 'emerald';
  setTheme: (theme: 'dark' | 'light' | 'emerald') => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  onOpenBrowser?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewGroupModal,
  onOpenNewDirectChatModal,
  currentUser,
  onOpenUserProfile,
  onOpenPasskeyModal,
  onOpenNotifications,
  unreadNotifCount,
  theme,
  setTheme,
  onGoBack,
  canGoBack,
  onOpenBrowser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'rooms' | 'direct' | 'ai'>('all');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isPillsScrolled, setIsPillsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Scroll detection for vanishing glass bottom bar
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const currentScrollY = scrollContainerRef.current.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      // Scrolling down -> vanish bottom bar
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY.current) {
      // Scrolling up -> appear back
      setIsNavVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const filteredChats = chats.filter((chat) => {
    const chatName = chat.name || '';
    const lastMsg = chat.lastMessage || '';
    const query = searchQuery || '';
    const matchesSearch =
      chatName.toLowerCase().includes(query.toLowerCase()) ||
      lastMsg.toLowerCase().includes(query.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'unread') return chat.unreadCount > 0;
    if (filter === 'rooms') return chat.type === 'group';
    if (filter === 'direct') return chat.type === 'direct';
    if (filter === 'ai') return chat.type === 'ai';
    return true;
  });

  const handleSelectNav = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  // Get dynamic header title & icon based on active page
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'chats':
        return {
          title: 'PIGION',
          subtitle: 'E2EE Messenger',
          icon: Droplets,
          isAppLogo: true,
        };
      case 'rooms':
        return {
          title: 'Rooms & Channels',
          subtitle: 'E2EE Communities',
          icon: Users,
          isAppLogo: false,
        };
      case 'calls':
        return {
          title: 'Call History',
          subtitle: 'Voice & Video Log',
          icon: PhoneCall,
          isAppLogo: false,
        };
      case 'settings':
        return {
          title: 'App Settings',
          subtitle: 'Privacy & Preferences',
          icon: Settings,
          isAppLogo: false,
        };
      case 'vault':
        return {
          title: 'Pigion Vault',
          subtitle: 'Zero-Knowledge Drive',
          icon: HardDrive,
          isAppLogo: false,
        };
      case 'ai':
        return {
          title: 'Pigion AI Hub',
          subtitle: 'Intelligent Assistant',
          icon: Bot,
          isAppLogo: false,
        };
      case 'contacts':
        return {
          title: 'Contacts Directory',
          subtitle: 'Verified Identity Keys',
          icon: Users,
          isAppLogo: false,
        };
      default:
        return {
          title: 'PIGION',
          subtitle: 'E2EE Messenger',
          icon: Droplets,
          isAppLogo: true,
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <aside className="w-full h-full border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 select-none relative overflow-hidden">
      {/* Dynamic Top Header Bar */}
      <div className="p-3.5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-30">
        <div className="flex items-center space-x-2.5">
          {onGoBack && (canGoBack || menuOpen || activeTab !== 'chats' || activeChatId !== null) && (
            <button
              onClick={() => {
                if (menuOpen) setMenuOpen(false);
                onGoBack();
              }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-colors shrink-0 shadow-xs active:scale-95"
              title="Back to Chats"
            >
              <ArrowLeft className="w-4 h-4 text-blue-500" />
            </button>
          )}

          {/* Logo or Page Icon */}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
              {headerInfo.isAppLogo ? (
                <img src="/pigion-mark.png" alt="Pigion" className="w-6 h-6 object-contain" />
              ) : (
                <HeaderIcon className="w-5 h-5 text-cyan-400" />
              )}
            </div>
          </div>

          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-slate-100 flex items-center space-x-1.5">
              <span>{headerInfo.title}</span>
              {headerInfo.isAppLogo && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">
              {headerInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Top Right Profile & Menu Trigger */}
        <div className="flex items-center space-x-2">
          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-blue-500" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenUserProfile}
            className="relative p-0.5 rounded-2xl hover:ring-2 ring-blue-500/50 transition-all"
            title="User Profile"
          >
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.username}
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-slate-700"
            />
          </button>

          {/* Menu Drawer Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2 rounded-2xl transition-colors ${
              menuOpen
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200'
            }`}
            title="Menu Drawer"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Slide-over Clean Menu Drawer */}
      {menuOpen && (
        <div className="absolute inset-x-0 top-[65px] bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 p-4 flex flex-col justify-between overflow-y-auto border-b border-gray-200 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-4">
            {/* Navigation Back Button inside Drawer to return to Chat Interface */}
            {onGoBack && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onGoBack();
                }}
                className="w-full p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-between font-bold text-xs transition-colors shadow-md border border-blue-400/40"
              >
                <div className="flex items-center space-x-2.5">
                  <ArrowLeft className="w-4 h-4 text-white" />
                  <span>Back to Chat Interface</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90 bg-white/20 px-2.5 py-0.5 rounded-full">
                  CHATS
                </span>
              </button>
            )}

            {/* User Profile Card */}
            <div
              onClick={() => {
                onOpenUserProfile();
                setMenuOpen(false);
              }}
              className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Avatar
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-blue-500"
                />
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                    {currentUser.username}
                  </h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {currentUser.customStatus || 'Available for E2EE chat'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                <span>Profile</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Navigation Drawer List */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
                All Modules
              </p>
              {[
                { key: 'chats', label: 'Chats & Messages', icon: MessageSquare, badge: chats.filter((c) => c.unreadCount > 0).length },
                { key: 'rooms', label: 'Rooms & Channels', icon: Users },
                { key: 'calls', label: 'E2EE Calls', icon: PhoneCall },
                { key: 'vault', label: 'Pigion Vault', icon: HardDrive },
                { key: 'ai', label: 'Pigion AI Assistant', icon: Bot },
                { key: 'contacts', label: 'Contacts Directory', icon: Users },
                { key: 'settings', label: 'App Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelectNav(item.key as ActiveTab)}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between font-bold text-xs transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}

              {onOpenBrowser && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenBrowser();
                  }}
                  className="w-full p-2.5 rounded-xl flex items-center justify-between font-bold text-xs text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-colors mt-2"
                >
                  <div className="flex items-center space-x-2.5">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>Inbuilt Search Engine</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300">
                    BROWSER
                  </span>
                </button>
              )}
            </div>

            {/* Passkey & Security */}
            <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-slate-800">
              <button
                onClick={() => {
                  onOpenPasskeyModal();
                  setMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Recovery Passkey</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">12 WORDS</span>
              </button>

              {/* Theme Selector */}
              <div className="p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-200">
                <div className="flex items-center space-x-2.5">
                  <Sun className="w-4 h-4 text-blue-600" />
                  <span>Theme</span>
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-1 rounded-lg transition-colors ${
                      theme === 'light' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-1 rounded-lg transition-colors ${
                      theme === 'dark' ? 'bg-slate-700 text-white shadow-xs' : 'text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-slate-950/80 rounded-2xl border border-gray-200 dark:border-slate-800 text-[11px] text-gray-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1.5 font-semibold text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Knowledge E2EE</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Chats & Conversation List Content area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Search & Filter Header with Takeover Animation */}
          <div
            className={`p-3 transition-colors bg-white dark:bg-slate-900 min-h-[58px] flex items-center border-b ${
              isPillsScrolled ? 'border-gray-200 dark:border-slate-800' : 'border-transparent'
            }`}
          >
            <AnimatePresence mode="wait">
              {isSearchExpanded ? (
                <motion.div
                  key="search-input-active"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex items-center space-x-2 bg-gray-100 dark:bg-slate-950 border border-blue-500/50 rounded-full px-3.5 py-2 shadow-inner"
                >
                  <Search className="w-4 h-4 text-blue-500 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search messages, rooms or contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xs font-bold px-1"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchExpanded(false);
                    }}
                    className="p-1 rounded-full bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-colors shrink-0"
                    title="Close Search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="filter-pills-bar"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  onScroll={(e) => setIsPillsScrolled(e.currentTarget.scrollLeft > 2)}
                  className="w-full flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-0.5"
                >
                  {/* Search Button that animates to take over */}
                  <button
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 transition-all shadow-xs shrink-0 flex items-center justify-center active:scale-95"
                    title="Open Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  {/* Big Comfortable Filter Pills */}
                  {(['all', 'unread', 'rooms', 'direct', 'ai'] as const).map((f) => {
                    const isSelected = filter === f;
                    const label =
                      f === 'all'
                        ? 'All'
                        : f === 'unread'
                        ? 'Unread'
                        : f === 'rooms'
                        ? 'Rooms'
                        : f === 'direct'
                        ? 'Direct'
                        : 'AI Hub';

                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white ring-2 ring-blue-500/30 shadow-md'
                            : 'bg-gray-100 dark:bg-slate-800/90 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat List Scroll Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/40 p-2 space-y-1 pb-24"
          >
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No chats found matching filter.
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = chat.id === activeChatId;

                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full p-3 rounded-2xl flex items-start space-x-3 text-left transition-all ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600 shadow-xs'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar
                        src={chat.avatar}
                        alt={chat.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-1 ring-gray-200 dark:ring-slate-700"
                      />
                      {chat.type === 'ai' && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 p-0.5 rounded-full text-white shadow">
                          <Bot className="w-3 h-3" />
                        </div>
                      )}
                      {chat.type === 'group' && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-0.5 rounded-full text-white shadow">
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Meta & Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          {chat.isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                          <span className="font-bold text-xs text-gray-900 dark:text-slate-100 truncate">
                            {chat.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 shrink-0">
                          {chat.lastMessageTime}
                        </span>
                      </div>

                      {/* Message Preview */}
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate mb-1">
                        {chat.lastMessage || 'No messages yet'}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center space-x-2 text-[10px]">
                        <span className="flex items-center space-x-0.5 text-blue-600 dark:text-blue-400 font-medium">
                          <Lock className="w-2.5 h-2.5" />
                          <span>E2EE</span>
                        </span>

                        {chat.selfDestructTimer > 0 && (
                          <span className="flex items-center space-x-0.5 text-amber-600 dark:text-amber-400 font-mono">
                            <Timer className="w-2.5 h-2.5" />
                            <span>{chat.selfDestructTimer}s</span>
                          </span>
                        )}

                        {chat.unreadCount > 0 && (
                          <span className="ml-auto bg-blue-600 text-white font-bold px-2 py-0.2 rounded-full text-[10px]">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Floating Plus Action Button (FAB) */}
          <div className="absolute bottom-20 right-4 z-30">
            {showFabMenu && (
              <div className="mb-2 space-y-2 flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => {
                    setShowFabMenu(false);
                    onOpenNewDirectChatModal();
                  }}
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 font-bold text-xs rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 flex items-center space-x-2 hover:bg-gray-100"
                >
                  <UserPlus className="w-4 h-4 text-blue-500" />
                  <span>New Direct Chat</span>
                </button>
                <button
                  onClick={() => {
                    setShowFabMenu(false);
                    onOpenNewGroupModal();
                  }}
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 font-bold text-xs rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 flex items-center space-x-2 hover:bg-gray-100"
                >
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>Create Room</span>
                </button>
              </div>
            )}
            <button
              onClick={() => setShowFabMenu(!showFabMenu)}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl flex items-center justify-center transition-transform active:scale-95 ring-4 ring-blue-500/30"
              title="Add New Chat or Room"
            >
              <Plus className={`w-6 h-6 transition-transform ${showFabMenu ? 'rotate-45' : ''}`} />
            </button>
          </div>
        </div>

      {/* Liquid Glass Bottom Navigation Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 transition-transform duration-300 ${
          isNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <LiquidNavBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadChatsCount={chats.filter((c) => c.unreadCount > 0).length}
        />
      </div>
    </aside>
  );
};
