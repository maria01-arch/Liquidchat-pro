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
  Ban,
  Square,
  Check,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chat, Message, User, CloudFile, ChatWallpaper } from '../types';
// NOTE: messages are local-only demo state until the Supabase message
// pipeline is wired up (see src/utils/crypto.ts for the real E2EE that will
// apply once content actually leaves the device).

import { playSendSound, formatDuration, generateWaveformData, playVoiceSynthNote } from '../utils/audio';
import { WallpaperModal } from './WallpaperModal';
import { ImageEditorModal } from './ImageEditorModal';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  currentUser: User;
  onSendMessage: (chatId: string, content: string, type?: Message['type'], attachment?: Partial<Message>) => void;
  onUpdateSelfDestruct: (chatId: string, seconds: number) => void;
  onOpenEncryptionModal: () => void;
  onAskPigionAI: (prompt: string) => void;
  vaultFiles: CloudFile[];
  onSaveToVault: (file: Partial<CloudFile>) => void;
  onDeleteMessage: (msgId: string) => void;
  onToggleReaction?: (msgId: string, emoji: string) => void;
  onClearChat?: (chatId: string) => void;
  onBackToList?: () => void;
  wallpaper?: ChatWallpaper;
  onSelectWallpaper?: (wp: ChatWallpaper) => void;
  onStartCall?: (isVideo: boolean) => void;
  theme?: 'dark' | 'light' | 'emerald';
  setTheme?: (theme: 'dark' | 'light' | 'emerald') => void;
  onOpenProfile?: () => void;
  onOpenContactProfile?: (chat: Chat) => void;
  onOpenUrl?: (url: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  currentUser,
  onSendMessage,
  onUpdateSelfDestruct,
  onOpenEncryptionModal,
  onAskPigionAI,
  vaultFiles,
  onSaveToVault,
  onDeleteMessage,
  onToggleReaction,
  onClearChat,
  onBackToList,
  wallpaper,
  onSelectWallpaper,
  onStartCall,
  theme = 'dark',
  setTheme,
  onOpenProfile,
  onOpenContactProfile,
  onOpenUrl,
}) => {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showVaultPicker, setShowVaultPicker] = useState(false);

  // Reaction picker state & long press timer
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);
  const longPressTimerRef = useRef<any>(null);

  // Popover menus state
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [timerSubMenuOpen, setTimerSubMenuOpen] = useState(false);

  // Voice recording, local preview & playback state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVoicePreview, setRecordedVoicePreview] = useState<{
    url?: string;
    duration: number;
  } | null>(null);

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewPlaybackSpeed, setPreviewPlaybackSpeed] = useState<number>(1);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewSynthRef = useRef<{ stop: () => void } | null>(null);
  const previewIntervalRef = useRef<any>(null);

  const [pendingImage, setPendingImage] = useState<{
    url: string;
    fileName: string;
    fileSize: string;
  } | null>(null);

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const recordingTimerRef = useRef<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const activeSynthRef = useRef<{ stop: () => void } | null>(null);
  const activeAudioElemRef = useRef<HTMLAudioElement | null>(null);

  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const currentWp = wallpaper || 'telegram-doodle';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-expand textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 140)}px`;
    }
  }, [inputText]);

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

  const stopActiveVoicePlayback = () => {
    if (activeSynthRef.current) {
      activeSynthRef.current.stop();
      activeSynthRef.current = null;
    }
    if (activeAudioElemRef.current) {
      activeAudioElemRef.current.pause();
      activeAudioElemRef.current = null;
    }
  };

  const stopPreviewPlayback = () => {
    if (previewSynthRef.current) {
      previewSynthRef.current.stop();
      previewSynthRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
  };

  useEffect(() => {
    return () => {
      stopActiveVoicePlayback();
      stopPreviewPlayback();
    };
  }, []);

  const handleSend = () => {
    if (!inputText.trim() && !replyingTo) return;
    playSendSound();

    const replyData = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          content: replyingTo.content,
        }
      : undefined;

    onSendMessage(chat.id, inputText.trim(), 'text', { replyTo: replyData });
    setInputText('');
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        setPendingImage({
          url: event.target.result as string,
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartVoiceRecording = async () => {
    stopPreviewPlayback();
    setRecordedVoicePreview(null);
    setIsRecordingVoice(true);
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(100); // collect 100ms chunks
      }
    } catch (e) {
      console.warn('Microphone access unavailable or denied:', e);
    }
  };

  const handleCancelVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    stopPreviewPlayback();
    setRecordedVoicePreview(null);
  };

  const handleStopVoiceToPreview = async () => {
    setIsRecordingVoice(false);
    const duration = recordingSeconds || 1;
    setRecordingSeconds(0);

    let audioDataUrl: string | undefined = undefined;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const recorder = mediaRecorderRef.current;
      await new Promise<void>((resolve) => {
        recorder.onstop = () => {
          resolve();
        };
        try {
          recorder.stop();
        } catch (e) {
          resolve();
        }
      });

      if (recorder.stream) {
        recorder.stream.getTracks().forEach((track) => track.stop());
      }

      if (audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) {
          audioDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || '');
            reader.readAsDataURL(blob);
          });
        }
      }
    }

    setRecordedVoicePreview({
      url: audioDataUrl,
      duration: duration,
    });
  };

  const cyclePreviewSpeed = () => {
    const nextSpeed = previewPlaybackSpeed === 1 ? 1.5 : previewPlaybackSpeed === 1.5 ? 2 : 1;
    setPreviewPlaybackSpeed(nextSpeed);
    if (previewAudioRef.current) {
      previewAudioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleTogglePlayPreview = () => {
    if (!recordedVoicePreview) return;

    if (isPreviewPlaying) {
      stopPreviewPlayback();
      return;
    }

    stopPreviewPlayback();
    setIsPreviewPlaying(true);
    setPreviewProgress(0);

    const startTime = Date.now();
    previewIntervalRef.current = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000) * previewPlaybackSpeed;
      if (elapsed >= recordedVoicePreview.duration) {
        stopPreviewPlayback();
      } else {
        setPreviewProgress(elapsed);
      }
    }, 100);

    if (recordedVoicePreview.url) {
      try {
        const audio = new Audio(recordedVoicePreview.url);
        audio.playbackRate = previewPlaybackSpeed;
        previewAudioRef.current = audio;
        audio.play().catch(() => {
          const synth = playVoiceSynthNote(recordedVoicePreview.duration / previewPlaybackSpeed, () => {
            stopPreviewPlayback();
          });
          previewSynthRef.current = synth;
        });
        audio.onended = () => {
          stopPreviewPlayback();
        };
      } catch (e) {
        const synth = playVoiceSynthNote(recordedVoicePreview.duration / previewPlaybackSpeed, () => {
          stopPreviewPlayback();
        });
        previewSynthRef.current = synth;
      }
    } else {
      const synth = playVoiceSynthNote(recordedVoicePreview.duration / previewPlaybackSpeed, () => {
        stopPreviewPlayback();
      });
      previewSynthRef.current = synth;
    }
  };

  const handleSendRecordedVoicePreview = () => {
    if (!recordedVoicePreview) return;
    const { duration, url } = recordedVoicePreview;
    stopPreviewPlayback();
    playSendSound();

    onSendMessage(chat.id, 'Voice message', 'voice', {
      voiceDuration: duration,
      attachmentUrl: url,
    });

    setRecordedVoicePreview(null);
  };

  const handleTogglePlayVoice = (msg: Message) => {
    if (playingVoiceId === msg.id) {
      stopActiveVoicePlayback();
      setPlayingVoiceId(null);
      return;
    }

    stopActiveVoicePlayback();
    setPlayingVoiceId(msg.id);

    if (msg.attachmentUrl) {
      try {
        const audio = new Audio(msg.attachmentUrl);
        activeAudioElemRef.current = audio;
        audio.play().catch(() => {
          const synth = playVoiceSynthNote(msg.voiceDuration || 5, () => {
            setPlayingVoiceId(null);
          });
          activeSynthRef.current = synth;
        });
        audio.onended = () => {
          setPlayingVoiceId(null);
        };
      } catch (e) {
        const synth = playVoiceSynthNote(msg.voiceDuration || 5, () => {
          setPlayingVoiceId(null);
        });
        activeSynthRef.current = synth;
      }
    } else {
      const synth = playVoiceSynthNote(msg.voiceDuration || 5, () => {
        setPlayingVoiceId(null);
      });
      activeSynthRef.current = synth;
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
              <Avatar
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
                  ? 'Pigion AI Assistant'
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

                {/* Ask Pigion AI */}
                <button
                  onClick={() => {
                    onAskPigionAI(`Give advice on key privacy practices for chat "${chat.name}"`);
                    setShowThreeDotsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2 text-sky-400 font-bold hover:bg-slate-800 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask Pigion AI</span>
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
              const decryptedContent = msg.content;

              const startLongPress = () => {
                if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = setTimeout(() => {
                  setActiveReactionPickerMsgId(msg.id);
                }, 400);
              };

              const cancelLongPress = () => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                }
              };

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
                  <div className={`max-w-[88%] sm:max-w-[78%] space-y-0.5 relative ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender Name in group */}
                    {!isMe && chat.type === 'group' && (
                      <span className="text-[11px] font-bold text-sky-400 pl-1 block">
                        {msg.senderName}
                      </span>
                    )}

                    {/* Floating Emoji Reaction Picker Popover */}
                    <AnimatePresence>
                      {activeReactionPickerMsgId === msg.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setActiveReactionPickerMsgId(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 6 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`absolute z-50 -top-11 ${
                              isMe ? 'right-2' : 'left-2'
                            } flex items-center space-x-1 bg-slate-900/95 border border-slate-700/90 rounded-full px-2 py-1 shadow-2xl backdrop-blur-xl`}
                          >
                            {['❤️', '👍', '😂', '😮', '😢', '🔥', '🙏', '🎉'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleReaction?.(msg.id, emoji);
                                  setActiveReactionPickerMsgId(null);
                                }}
                                className="text-base sm:text-lg hover:scale-125 active:scale-95 transition-transform p-1 hover:bg-slate-800 rounded-full"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>

                    {/* Drag-to-reply container with gesture handling */}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: -70, right: 0 }}
                      dragElastic={0.15}
                      dragSnapToOrigin
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -40) {
                          setReplyingTo(msg);
                          playSendSound();
                        }
                      }}
                      onTouchStart={startLongPress}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onMouseDown={startLongPress}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setActiveReactionPickerMsgId(msg.id);
                      }}
                      className="relative touch-pan-y"
                    >
                      {/* Telegram Style Message Bubble with Tail */}
                      <div
                        className={`px-3.5 py-2 relative shadow-md text-sm transition-all leading-relaxed select-text ${
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

                        {/* Text Message with Stable Bottom Meta */}
                        {msg.type === 'text' && (
                          <div className="flex flex-col">
                            <div className="whitespace-pre-wrap break-words font-normal text-[13.5px] leading-snug pr-1">
                              {(() => {
                                const urlRegex = /(https?:\/\/[^\s]+)/g;
                                const parts = decryptedContent.split(urlRegex);
                                return parts.map((part, i) => {
                                  if (part.match(/^https?:\/\//i)) {
                                    return (
                                      <a
                                        key={i}
                                        href={part}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (onOpenUrl) {
                                            onOpenUrl(part);
                                          } else {
                                            window.open(part, '_blank', 'noopener,noreferrer');
                                          }
                                        }}
                                        className="text-sky-300 hover:text-sky-100 underline font-medium inline-flex items-center space-x-0.5 break-all cursor-pointer"
                                        title="Open Link in In-App Browser"
                                      >
                                        <span>{part}</span>
                                        <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-80" />
                                      </a>
                                    );
                                  }
                                  return <span key={i}>{part}</span>;
                                });
                              })()}
                            </div>
                            <div className="flex items-center justify-end space-x-1 mt-1 text-[10.5px] opacity-80 shrink-0 select-none">
                              {msg.selfDestructTimer > 0 && (
                                <span className="flex items-center space-x-0.5 text-amber-300 mr-1">
                                  <Timer className="w-2.5 h-2.5" />
                                  <span>{msg.selfDestructTimer}s</span>
                                </span>
                              )}
                              <span className={isMe ? 'text-sky-200' : 'text-slate-400'}>
                                {msg.timestamp}
                              </span>
                              {isMe && (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-300 shrink-0 inline-block" />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Image Message */}
                        {msg.type === 'image' && msg.attachmentUrl && (
                          <div className="space-y-1.5 relative group/img">
                            <img
                              src={msg.attachmentUrl}
                              alt={msg.attachmentName || 'Shared image'}
                              onClick={() => setSelectedImage(msg.attachmentUrl!)}
                              className="rounded-xl max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity border border-white/10"
                            />
                            <a
                              href={msg.attachmentUrl}
                              download={msg.attachmentName || 'Pigion-image.png'}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/75 hover:bg-slate-900 text-slate-200 hover:text-sky-300 backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg border border-white/15"
                              title="Download Image"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <div className="flex items-center justify-end space-x-1 mt-1 text-[10.5px] opacity-80 shrink-0 select-none">
                              <span className={isMe ? 'text-sky-200' : 'text-slate-400'}>
                                {msg.timestamp}
                              </span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />}
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
                            <div className="flex items-center justify-end space-x-1 mt-1 text-[10.5px] opacity-80 shrink-0 select-none">
                              <span className={isMe ? 'text-sky-200' : 'text-slate-400'}>
                                {msg.timestamp}
                              </span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />}
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
                            <div className="flex items-center justify-end space-x-1 mt-1 text-[10.5px] opacity-80 shrink-0 select-none">
                              <span className={isMe ? 'text-sky-200' : 'text-slate-400'}>
                                {msg.timestamp}
                              </span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Floating Reaction Badges with Spring Animation */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div
                          className={`absolute -bottom-2.5 ${
                            isMe ? 'right-2' : 'left-2'
                          } flex items-center space-x-1 z-20`}
                        >
                          {msg.reactions.map((r) => {
                            const userReacted = r.users.includes(currentUser.id);
                            return (
                              <motion.button
                                key={r.emoji}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleReaction?.(msg.id, r.emoji);
                                }}
                                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shadow-lg transition-all active:scale-90 border select-none ${
                                  userReacted
                                    ? 'bg-sky-500/30 border-sky-400 text-sky-200 backdrop-blur-md'
                                    : 'bg-slate-900/95 border-slate-700 text-slate-300 hover:bg-slate-800 backdrop-blur-md'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                {r.users.length > 1 && (
                                  <span className="text-[10px] font-mono font-bold">{r.users.length}</span>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
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
            <span className="truncate">{replyingTo.content}</span>
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
          {recordedVoicePreview ? (
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-sky-500/40 rounded-full px-3 py-1.5 shadow-2xl w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Trash button to discard preview */}
              <button
                onClick={() => {
                  stopPreviewPlayback();
                  setRecordedVoicePreview(null);
                }}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full transition-colors shrink-0"
                title="Discard Voice Note"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Voice Playback Player Pill */}
              <div className="flex-1 flex items-center space-x-2 bg-slate-800/80 rounded-full px-3 py-1.5 border border-slate-700/60 min-w-0">
                <button
                  onClick={handleTogglePlayPreview}
                  className="p-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white transition-all shrink-0 active:scale-95 shadow-xs"
                  title={isPreviewPlaying ? 'Pause Preview' : 'Play Preview'}
                >
                  {isPreviewPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Waveform Visualization Bars */}
                <div className="flex-1 flex items-center space-x-1 h-5 overflow-hidden">
                  {generateWaveformData(recordedVoicePreview.duration * 10)
                    .slice(0, 18)
                    .map((height, i) => {
                      const isPlayed =
                        i / 18 <= previewProgress / (recordedVoicePreview.duration || 1);
                      return (
                        <span
                          key={i}
                          style={{ height: `${Math.max(20, height)}%` }}
                          className={`w-1 rounded-full transition-colors duration-150 ${
                            isPlayed ? 'bg-sky-400' : 'bg-slate-600'
                          } ${isPreviewPlaying ? 'animate-pulse' : ''}`}
                        />
                      );
                    })}
                </div>

                {/* Timer Duration */}
                <span className="font-mono text-[11px] font-semibold text-slate-300 shrink-0">
                  {formatDuration(Math.floor(previewProgress))} / {formatDuration(recordedVoicePreview.duration)}
                </span>

                {/* Speed Toggle Button (1x, 1.5x, 2x) */}
                <button
                  onClick={cyclePreviewSpeed}
                  className="px-2 py-0.5 rounded-full bg-slate-700/80 hover:bg-slate-700 text-sky-300 hover:text-sky-200 text-[10.5px] font-mono font-bold transition-colors shrink-0 border border-slate-600/50 active:scale-95"
                  title="Change Playback Speed"
                >
                  {previewPlaybackSpeed}x
                </button>
              </div>

              {/* Send Voice Note Button */}
              <button
                onClick={handleSendRecordedVoicePreview}
                className="p-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 transition-all active:scale-95 shrink-0"
                title="Send Recorded Voice Note"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </div>
          ) : (
            <div className="flex items-end space-x-2 bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl px-3 py-1.5 shadow-2xl transition-all duration-150">
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
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors pb-2"
                title="Emoji Picker"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Attach Paperclip Icon */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors pb-2"
                title="Attach File or Image"
              >
                <Paperclip className="w-5 h-5 rotate-45" />
              </button>

              {/* Main Auto-Expanding Input Field */}
              <div className="flex-1 relative my-auto">
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
                        onClick={handleCancelVoiceRecording}
                        className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Cancel Recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleStopVoiceToPreview}
                        className="px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] flex items-center space-x-1 shadow-md shadow-sky-500/20"
                        title="Stop & Preview"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop & Preview</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Message"
                    className="w-full bg-transparent border-none text-slate-100 placeholder-slate-400 text-sm focus:outline-none px-2 font-normal resize-none overflow-y-auto leading-snug py-1 block"
                    style={{ minHeight: '26px', maxHeight: '140px' }}
                  />
                )}
              </div>

              {/* Vault Picker trigger */}
              <button
                onClick={() => setShowVaultPicker(true)}
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors hidden sm:block pb-2"
                title="Attach from Vault"
              >
                <HardDrive className="w-4 h-4" />
              </button>

              {/* Circular Sky-Blue Voice / Send Button */}
              <div className="pb-1">
                {inputText.trim() ? (
                  <button
                    onClick={handleSend}
                    className="p-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 transition-all active:scale-95 shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4 fill-current" />
                  </button>
                ) : isRecordingVoice ? (
                  <button
                    onClick={handleStopVoiceToPreview}
                    className="p-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 transition-all active:scale-95 shrink-0"
                    title="Finish & Preview Voice Note"
                  >
                    <Check className="w-4 h-4" />
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
            </div>
          )}
        </footer>
      )}

      {/* Image Editor Modal (Crop, Draw, Arrow, Download before send) */}
      {pendingImage && (
        <ImageEditorModal
          imageUrl={pendingImage.url}
          fileName={pendingImage.fileName}
          onSave={(editedDataUrl) => {
            onSendMessage(chat.id, 'Shared an image', 'image', {
              attachmentUrl: editedDataUrl,
              attachmentName: pendingImage.fileName,
              attachmentSize: pendingImage.fileSize,
            });
            setPendingImage(null);
          }}
          onClose={() => setPendingImage(null)}
        />
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 p-4 sm:p-6 flex flex-col justify-between items-center animate-in fade-in duration-200">
          <div className="w-full flex justify-between items-center z-10">
            <span className="text-xs text-slate-400 font-mono">Image View</span>
            <div className="flex items-center space-x-2">
              <a
                href={selectedImage}
                download="Pigion-image.png"
                className="p-2 rounded-xl bg-slate-800 text-sky-400 hover:bg-slate-700 hover:text-sky-300 transition-colors flex items-center space-x-1.5 text-xs font-semibold px-3 border border-slate-700/60"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <img
            src={selectedImage}
            alt="Full view"
            className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain my-auto border border-slate-800"
          />
          <p className="text-xs text-slate-400">Click close or press ESC to return</p>
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
