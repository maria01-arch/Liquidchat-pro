import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Lock,
  Timer,
  CheckCheck,
  Bot,
  Sparkles,
  Download,
  Play,
  Pause,
  HardDrive,
  ShieldCheck,
  Trash2,
  CornerUpLeft,
  X,
  FileText,
  ArrowLeft,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Palette,
  Sun,
  Moon,
  Droplets,
  Volume2,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chat, Message, User, CloudFile, ChatWallpaper } from '../types';
import { decryptE2EEMessage } from '../utils/crypto';
import { playSendSound, formatDuration, generateWaveformData } from '../utils/audio';
import { WallpaperModal } from './WallpaperModal';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  currentUser: User;
  onSendMessage: (chatId: string, content: string, type?: Message['type'], attachment?: Partial<Message>) => void;
  onUpdateSelfDestruct: (chatId: string, seconds: number) => void;
  onOpenEncryptionModal: () => void;
  onAskXchordAI: (prompt: string) => void;
  vaultFiles: CloudFile[];
  onSaveToVault: (file: Partial<CloudFile>) => void;
  onDeleteMessage: (msgId: string) => void;
  onClearChat?: (chatId: string) => void;
  onBackToList?: () => void;
  wallpaper?: ChatWallpaper;
  onSelectWallpaper?: (wp: ChatWallpaper) => void;
  onStartCall?: (isVideo: boolean) => void;
  theme?: 'dark' | 'light' | 'emerald';
  setTheme?: (theme: 'dark' | 'light' | 'emerald') => void;
  onOpenProfile?: () => void;
  onOpenContactProfile?: (chat: Chat) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  currentUser,
  onSendMessage,
  onUpdateSelfDestruct,
  onOpenEncryptionModal,
  onAskXchordAI,
  vaultFiles,
  onSaveToVault,
  onDeleteMessage,
  onClearChat,
  onBackToList,
  wallpaper,
  onSelectWallpaper,
  onStartCall,
  theme = 'dark',
  setTheme,
  onOpenProfile,
  onOpenContactProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showVaultPicker, setShowVaultPicker] = useState(false);

  // Popover menus state
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [timerSubMenuOpen, setTimerSubMenuOpen] = useState(false);

  // Voice recording & playback state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const recordingTimerRef = useRef<any>(null);

  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const currentWp = wallpaper || 'telegram-doodle';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  const handleSend = () => {
    if (!inputText.trim() && !replyingTo) return;
    playSendSound();

    const replyData = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          content: decryptE2EEMessage(replyingTo.content),
        }
      : undefined;

    onSendMessage(chat.id, inputText.trim(), 'text', { replyTo: replyData });
    setInputText('');
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onSendMessage(chat.id, 'Shared an image', 'image', {
          attachmentUrl: event.target.result as string,
          attachmentName: file.name,
          attachmentSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartVoiceRecording = () => {
    setIsRecordingVoice(true);
  };

  const handleStopAndSendVoice = () => {
    setIsRecordingVoice(false);
    onSendMessage(chat.id, 'Voice message', 'voice', {
      voiceDuration: recordingSeconds || 5,
    });
    setRecordingSeconds(0);
  };

  const handleTogglePlayVoice = (msg: Message) => {
    if (playingVoiceId === msg.id) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msg.id);
    }
  };

  const handleShareVaultFile = (file: CloudFile) => {
    onSendMessage(chat.id, `Shared vault file: ${file.name}`, 'file', {
      attachmentName: file.name,
      attachmentUrl: file.url,
      attachmentSize: file.sizeFormatted,
    });
    setShowVaultPicker(false);
  };

  const handleAvatarClick = () => {
    if (onOpenContactProfile) {
      onOpenContactProfile(chat);
    } else if (onOpenProfile) {
      onOpenProfile();
    } else {
      onOpenEncryptionModal();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative select-none">
      {/* Redesigned Minimalist Header according to specs */}
      <header className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
        {/* Left Side: Back arrow + Clickable Contact Profile Info */}
        <div className="flex items-center space-x-3 min-w-0">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors md:hidden shrink-0"
              title="Back to chat list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Clickable Profile Picture & Name to view peer profile */}
          <button
            onClick={handleAvatarClick}
            className="flex items-center space-x-3 text-left hover:opacity-90 transition-opacity cursor-pointer group min-w-0"
            title={`View profile & details for ${chat.name}`}
          >
            <div className="relative p-0.5 rounded-full ring-2 ring-transparent group-hover:ring-purple-500 transition-all shrink-0">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800 shadow-md group-hover:scale-105 transition-transform"
              />
              {chat.type === 'ai' ? (
                <span className="absolute -bottom-1 -right-1 p-0.5 bg-blue-600 rounded-full">
                  <Bot className="w-3 h-3 text-white" />
                </span>
              ) : (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-slate-100 truncate group-hover:text-purple-300 transition-colors">
                  {chat.name}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 truncate font-medium">
                {chat.type === 'group'
                  ? `${chat.membersCount || 8} members`
                  : chat.type === 'ai'
                  ? 'xchord AI Assistant'
                  : 'Online • Tap to view profile'}
              </p>
            </div>
          </button>
        </div>

        {/* Right Header Actions: Call Icon & Three Dots Menu ONLY */}
        <div className="flex items-center space-x-2">
          {/* Call Icon Dropdown Trigger (User chooses Video or Audio on click) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCallMenu(!showCallMenu);
                setShowThreeDotsMenu(false);
              }}
              className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition-colors border border-slate-700/60 flex items-center justify-center"
              title="Start a Call"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Call Choice Popover */}
            {showCallMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Choose Call Type
                </div>
                <button
                  onClick={() => {
                    setShowCallMenu(false);
                    if (onStartCall) onStartCall(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Audio Call</span>
                </button>
                <button
                  onClick={() => {
                    setShowCallMenu(false);
                    if (onStartCall) onStartCall(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <Video className="w-4 h-4 text-sky-400" />
                  <span>Video Call</span>
                </button>
              </div>
            )}
          </div>

          {/* Three Dots Menu Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowThreeDotsMenu(!showThreeDotsMenu);
                setShowCallMenu(false);
              }}
              className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition-colors border border-slate-700/60 flex items-center justify-center"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4 text-slate-300" />
            </button>

            {/* Three Dots Menu Dropover */}
            {showThreeDotsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chat Settings
                </div>

                {/* Self-Destruct Submenu Toggle */}
                <button
                  onClick={() => setTimerSubMenuOpen(!timerSubMenuOpen)}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-amber-400" />
                    <span>Self-Destruct Timer</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400">
                    {chat.selfDestructTimer > 0 ? `${chat.selfDestructTimer}s` : 'Off'}
                  </span>
                </button>

                {/* Self-Destruct Options */}
                {timerSubMenuOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-amber-500/30 my-1">
                    {[
                      { label: 'Off', seconds: 0 },
                      { label: '5 Seconds', seconds: 5 },
                      { label: '30 Seconds', seconds: 30 },
                      { label: '1 Minute', seconds: 60 },
                      { label: '1 Hour', seconds: 3600 },
                    ].map((opt) => (
                      <button
                        key={opt.seconds}
                        onClick={() => {
                          onUpdateSelfDestruct(chat.id, opt.seconds);
                          setTimerSubMenuOpen(false);
                          setShowThreeDotsMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[11px] flex items-center justify-between ${
                          chat.selfDestructTimer === opt.seconds
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {chat.selfDestructTimer === opt.seconds && <CheckCheck className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Theme Switcher */}
                <div className="px-3 py-2 rounded-xl flex items-center justify-between text-slate-200 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-sky-400" />
                    <span>App Theme</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setTheme && setTheme('dark')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        theme === 'dark' ? 'bg-purple-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme && setTheme('emerald')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        theme === 'emerald' ? 'bg-teal-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Teal
                    </button>
                  </div>
                </div>

                {/* Wallpaper Option */}
                <button
                  onClick={() => {
                    setShowWallpaperModal(true);
                    setShowThreeDotsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2 text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span>Change Wallpaper</span>
                </button>

                {/* Security Fingerprint */}
                <button
                  onClick={() => {
                    onOpenEncryptionModal();
                    setShowThreeDotsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2 text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Encryption Keys</span>
                </button>

                {/* Ask xchord AI */}
                <button
                  onClick={() => {
                    onAskXchordAI(`Give advice on key privacy practices for chat "${chat.name}"`);
                    setShowThreeDotsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2 text-sky-400 font-bold hover:bg-slate-800 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask xchord AI</span>
                </button>

                <div className="my-1 border-t border-slate-800" />

                {/* Clear Chat History */}
                <button
                  onClick={() => {
                    if (onClearChat) {
                      onClearChat(chat.id);
                    }
                    setShowThreeDotsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2 text-rose-400 font-medium hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Clear Chat History</span>
                </button>

                {/* Block / Unblock Contact */}
                <button
                  onClick={() => {
                    setIsBlocked(!isBlocked);
                    setShowThreeDotsMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2 font-medium transition-colors ${
                    isBlocked
                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  <span>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Ephemeral Notice */}
      {chat.selfDestructTimer > 0 && (
        <div className="bg-amber-950/60 border-b border-amber-800/60 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200 z-10 relative">
          <div className="flex items-center space-x-2">
            <Timer className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Ephemeral Mode Active: Messages auto-destruct in {chat.selfDestructTimer}s</span>
          </div>
        </div>
      )}

      {/* Middle Canvas Container with Fixed Continuous Wallpaper Background */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Fixed Background Wallpaper Layer (Does not cut or jump when scrolling) */}
        <div
          className={`absolute inset-0 z-0 ${
            currentWp === 'telegram-light-doodle' || currentWp === 'clean-solid'
              ? 'bg-[#e6eef6] text-slate-900'
              : currentWp === 'telegram-doodle'
              ? 'bg-[#0e1621] text-slate-100'
              : currentWp === 'purple-nebula'
              ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-slate-100'
              : currentWp === 'midnight-blue'
              ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100'
              : currentWp === 'emerald-forest'
              ? 'bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 text-slate-100'
              : 'bg-[#0f172a] text-slate-100'
          }`}
        >
          {/* Custom Uploaded Image / Photo Gallery Wallpaper Background */}
          {currentWp.startsWith('data:image/') || currentWp.startsWith('http') || currentWp.startsWith('blob:') ? (
            <div
              className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
              style={{ backgroundImage: `url("${currentWp}")` }}
            >
              <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[0.5px]" />
            </div>
          ) : (
            <>
              {/* Telegram Vector Pattern Overlay */}
              {(currentWp === 'telegram-doodle' || currentWp === 'telegram-light-doodle' || currentWp === 'dark-doodle') && (
                <div
                  className={`absolute inset-0 pointer-events-none bg-repeat z-0 ${
                    currentWp === 'telegram-light-doodle' ? 'opacity-20' : 'opacity-15'
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 20 a 8 8 0 1 0 0.1 0' /%3E%3Cpath d='M45 15 l 10 10 m -10 0 l 10 -10' /%3E%3Cpath d='M80 25 q 10 -15 20 0 t -20 0' /%3E%3Cpath d='M15 75 c 5 -10 15 -10 20 0 c -5 10 -15 10 -20 0' /%3E%3Cpath d='M50 80 a 10 10 0 1 1 0.1 0' /%3E%3Cpath d='M85 75 l 8 -8 l 8 8 l -8 8 z' /%3E%3Cpath d='M30 45 h 15 v 10 h -15 z' /%3E%3Cpath d='M70 45 c 0 -8 12 -8 12 0 c 0 8 -12 8 -12 0' /%3E%3Cpath d='M100 95 a 6 6 0 1 0 0.1 0' /%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Scrollable Message List Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 relative z-10">
          {/* Date Capsule Badge matching Telegram style */}
          <div className="text-center my-1 relative z-10">
            <span className="inline-block px-3.5 py-1 rounded-full bg-slate-900/80 text-slate-200 font-medium text-[11px] border border-slate-700/50 shadow-md backdrop-blur-md">
              August 4
            </span>
          </div>

          {/* E2EE Security Badge */}
          <div className="text-center my-1 relative z-10">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] text-cyan-400 font-mono shadow-xs backdrop-blur-md">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>End-to-End Encrypted Channel</span>
            </span>
          </div>

          {/* Messages List with Compact Gaps and No Avatars beside bubbles */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const decryptedContent = decryptE2EEMessage(msg.content);

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-end group relative z-10 ${
                    isMe ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`max-w-[88%] sm:max-w-[78%] space-y-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender Name in group */}
                    {!isMe && chat.type === 'group' && (
                      <span className="text-[11px] font-bold text-sky-400 pl-1 block">
                        {msg.senderName}
                      </span>
                    )}

                    {/* Telegram Style Message Bubble with Tail */}
                    <div
                      className={`px-3.5 py-2 relative shadow-md text-sm transition-all leading-relaxed ${
                        isMe
                          ? 'bg-[#2b5278] text-white rounded-[18px] rounded-br-[4px] after:content-[""] after:absolute after:bottom-0 after:-right-[5px] after:w-0 after:h-0 after:border-l-[7px] after:border-l-[#2b5278] after:border-b-[7px] after:border-b-transparent after:border-t-[7px] after:border-t-transparent'
                          : 'bg-[#182533] text-slate-100 rounded-[18px] rounded-bl-[4px] border border-slate-700/50 after:content-[""] after:absolute after:bottom-0 after:-left-[5px] after:w-0 after:h-0 after:border-r-[7px] after:border-r-[#182533] after:border-b-[7px] after:border-b-transparent after:border-t-[7px] after:border-t-transparent'
                      }`}
                    >
                    {/* Reply Context snippet */}
                    {msg.replyTo && (
                      <div
                        className={`mb-1.5 p-2 rounded-lg text-xs border-l-3 ${
                          isMe
                            ? 'bg-black/20 border-sky-300 text-sky-100'
                            : 'bg-slate-900/80 border-sky-400 text-slate-200'
                        }`}
                      >
                        <span className="font-bold block text-[11px] text-sky-300">
                          {msg.replyTo.senderName}
                        </span>
                        <span className="truncate block text-[11px] opacity-90">
                          {msg.replyTo.content}
                        </span>
                      </div>
                    )}

                    {/* Text Message with Inline Telegram Bottom Meta */}
                    {msg.type === 'text' && (
                      <div className="whitespace-pre-wrap break-words font-normal text-[13.5px] leading-snug">
                        <span>{decryptedContent}</span>

                        {/* Inline Telegram Timestamp & Status Ticks */}
                        <span className="inline-flex items-center space-x-1 float-right ml-2 mt-1 select-none text-[10.5px] opacity-80 shrink-0 leading-none align-baseline">
                          {msg.selfDestructTimer > 0 && (
                            <span className="flex items-center space-x-0.5 text-amber-300 mr-0.5">
                              <Timer className="w-2.5 h-2.5" />
                              <span>{msg.selfDestructTimer}s</span>
                            </span>
                          )}
                          <span className={isMe ? 'text-sky-200' : 'text-slate-400'}>
                            {msg.timestamp}
                          </span>
                          {isMe && (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline-block" />
                          )}
                        </span>
                      </div>
                    )}

                    {/* Image Message */}
                    {msg.type === 'image' && msg.attachmentUrl && (
                      <div className="space-y-1.5">
                        <img
                          src={msg.attachmentUrl}
                          alt={msg.attachmentName || 'Shared image'}
                          onClick={() => setSelectedImage(msg.attachmentUrl!)}
                          className="rounded-xl max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity border border-white/10"
                        />
                        <div className="flex items-center justify-end space-x-1 text-[10.5px] opacity-80">
                          <span className={isMe ? 'text-sky-200' : 'text-slate-400'}>
                            {msg.timestamp}
                          </span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-300" />}
                        </div>
                      </div>
                    )}

                    {/* Voice Note Message */}
                    {msg.type === 'voice' && (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3 py-1">
                          <button
                            onClick={() => handleTogglePlayVoice(msg)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md ${
                              isMe ? 'bg-sky-400 text-slate-950 font-bold' : 'bg-sky-500 text-white font-bold'
                            }`}
                          >
                            {playingVoiceId === msg.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>

                          <div className="flex-1 space-y-1 min-w-[130px]">
                            <div className="flex items-center space-x-1 h-5">
                              {generateWaveformData(16).map((h, i) => (
                                <div
                                  key={i}
                                  style={{ height: `${h}%` }}
                                  className={`w-1 rounded-full transition-all ${
                                    playingVoiceId === msg.id
                                      ? 'bg-amber-300 animate-pulse'
                                      : isMe
                                      ? 'bg-white/80'
                                      : 'bg-emerald-400/80'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-[10px] opacity-80">
                              <span>Voice Note</span>
                              <span>{formatDuration(msg.voiceDuration || 10)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end space-x-1 text-[10.5px] opacity-80">
                          <span className={isMe ? 'text-sky-200' : 'text-slate-400'}>
                            {msg.timestamp}
                          </span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-300" />}
                        </div>
                      </div>
                    )}

                    {/* File Attachment Message */}
                    {msg.type === 'file' && (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3 p-2 rounded-xl bg-black/20 border border-white/10">
                          <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs truncate">{msg.attachmentName || 'Attachment'}</p>
                            <p className="text-[10px] opacity-70">{msg.attachmentSize || 'Cloud File'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end space-x-1 text-[10.5px] opacity-80">
                          <span className={isMe ? 'text-sky-200' : 'text-slate-400'}>
                            {msg.timestamp}
                          </span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-300" />}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Quick Actions on Hover */}
                  <div
                    className={`hidden group-hover:flex items-center space-x-1 text-slate-400 text-xs ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
                      title="Reply"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteMessage(msg.id)}
                      className="p-1 rounded hover:bg-slate-800 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>

      {/* Reply Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2 min-w-0">
            <CornerUpLeft className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-semibold text-purple-400 shrink-0">Replying to {replyingTo.senderName}:</span>
            <span className="truncate">{decryptE2EEMessage(replyingTo.content)}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Vault Picker Modal */}
      {showVaultPicker && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 p-6 flex flex-col justify-center items-center">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
                <HardDrive className="w-5 h-5" />
                <span>Select File from Vault</span>
              </div>
              <button onClick={() => setShowVaultPicker(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {vaultFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleShareVaultFile(file)}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-2xl flex items-center justify-between cursor-pointer border border-slate-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="font-semibold text-xs text-slate-200">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{file.sizeFormatted}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-sky-400 px-2.5 py-1 rounded-xl bg-sky-500/10">
                    Share
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Dock - Floating Telegram Pill Style matching uploaded screenshot 5 */}
      {isBlocked ? (
        <footer className="p-4 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl shrink-0 z-20 flex items-center justify-center">
          <div className="flex items-center space-x-2.5 text-slate-300 text-xs font-medium bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-full">
            <Ban className="w-4 h-4 text-amber-400 shrink-0" />
            <span>You have blocked this user. You cannot send messages.</span>
            <button
              onClick={() => setIsBlocked(false)}
              className="text-sky-400 hover:text-sky-300 font-bold underline ml-1 cursor-pointer transition-colors"
            >
              Unblock
            </button>
          </div>
        </footer>
      ) : (
        <footer className="p-3 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl shrink-0 z-20">
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-full px-3 py-1.5 shadow-2xl">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Emoji Toggle Icon */}
            <button
              onClick={() => setInputText((prev) => prev + ' 😊')}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
              title="Emoji Picker"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Attach Paperclip Icon */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
              title="Attach File or Image"
            >
              <Paperclip className="w-5 h-5 rotate-45" />
            </button>

            {/* Main Input Field */}
            <div className="flex-1 relative">
              {isRecordingVoice ? (
                <div className="flex items-center justify-between text-xs px-2 py-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-mono text-sky-400 font-bold">
                      Recording... {formatDuration(recordingSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsRecordingVoice(false)}
                      className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStopAndSendVoice}
                      className="px-3 py-1 rounded-full bg-sky-500 text-white font-bold text-[11px]"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Message"
                  className="w-full bg-transparent border-none text-slate-100 placeholder-slate-400 text-sm focus:outline-none px-2 font-normal"
                />
              )}
            </div>

            {/* Vault Picker trigger */}
            <button
              onClick={() => setShowVaultPicker(true)}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
              title="Attach from Vault"
            >
              <HardDrive className="w-4 h-4" />
            </button>

            {/* Circular Sky-Blue Voice / Send Button matching screenshot 5 */}
            {inputText.trim() ? (
              <button
                onClick={handleSend}
                className="p-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 transition-all active:scale-95 shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleStartVoiceRecording}
                className="p-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 transition-all active:scale-95 shrink-0"
                title="Record Voice Note"
              >
                <Mic className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>
        </footer>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-slate-950/95 z-50 p-6 flex flex-col justify-center items-center cursor-pointer"
        >
          <img
            src={selectedImage}
            alt="Full view"
            className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl object-contain"
          />
          <p className="text-xs text-slate-400 mt-4">Click anywhere to close preview</p>
        </div>
      )}

      {/* Wallpaper Picker Modal */}
      {showWallpaperModal && (
        <WallpaperModal
          currentWallpaper={currentWp}
          onSelectWallpaper={(wp) => onSelectWallpaper && onSelectWallpaper(wp)}
          onClose={() => setShowWallpaperModal(false)}
        />
      )}
    </div>
  );
};
