import React, { useState } from 'react';
import { Avatar } from './Avatar';
import {
  X,
  Phone,
  Video,
  ShieldCheck,
  Lock,
  Timer,
  Check,
  Bell,
  BellOff,
  Search,
  HardDrive,
  Trash2,
  Ban,
  Sparkles,
  Bot,
  UserCheck,
  Key,
  ExternalLink
} from 'lucide-react';
import { Chat, User, CloudFile } from '../types';
import { generateFingerprint, generateSessionFingerprint } from '../utils/crypto';

interface ContactProfileModalProps {
  chat: Chat;
  peerUser?: User | null;
  currentUser: User;
  onClose: () => void;
  onStartCall: (contact: User, isVideo: boolean) => void;
  onUpdateSelfDestruct: (chatId: string, seconds: number) => void;
  onOpenEncryptionModal: () => void;
  onAskAI?: (prompt: string) => void;
  vaultFiles?: CloudFile[];
}

export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({
  chat,
  peerUser,
  currentUser,
  onClose,
  onStartCall,
  onUpdateSelfDestruct,
  onOpenEncryptionModal,
  onAskAI,
  vaultFiles = [],
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showFullFingerprint, setShowFullFingerprint] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Compute recipient display name and avatar
  const displayName = peerUser?.username || chat.name || 'Chat Partner';
  const displayAvatar = peerUser?.avatar || chat.avatar;
  const statusText = peerUser?.status === 'online' ? 'Online' : peerUser?.customStatus || 'Available for E2EE Chat';
  const handle = peerUser ? `@${peerUser.username.toLowerCase().replace(/\s+/g, '_')}` : `#${chat.id}`;

  // Real session fingerprint when we have both parties' actual encryption
  // keys; falls back to the chat's stored fingerprint otherwise. (Previously
  // this referenced a `.publicKey` field that didn't exist on User — always
  // undefined, silently producing a meaningless fingerprint.)
  const fingerprint =
    peerUser?.encryptionPublicKey && currentUser.encryptionPublicKey
      ? generateSessionFingerprint(currentUser.encryptionPublicKey, peerUser.encryptionPublicKey)
      : chat.e2eFingerprint || generateFingerprint(chat.id);
  const formattedFingerprint = fingerprint.match(/.{1,4}/g)?.join(' : ') || fingerprint;

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const contactUserForCall: User = peerUser || {
    id: chat.id,
    username: displayName,
    avatar: displayAvatar,
    status: 'online',
    publicKey: chat.id,
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto relative">
        {/* Modal Header & Cover Gradient */}
        <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative p-4 flex items-start justify-between">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/20">
            <Lock className="w-3 h-3 text-cyan-300" />
            <span>End-to-End Encrypted Profile</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Main Info */}
        <div className="px-6 pt-0 pb-6 -mt-12 space-y-5">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative group">
              <Avatar
                src={displayAvatar}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl"
              />
              {chat.type === 'ai' ? (
                <span className="absolute bottom-1 right-1 p-1 bg-blue-600 text-white rounded-full ring-2 ring-slate-900 shadow-sm">
                  <Bot className="w-4 h-4" />
                </span>
              ) : (
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-sm" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center justify-center space-x-1.5">
                <span>{displayName}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              </h2>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{handle}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{statusText}</p>
            </div>
          </div>

          {/* Quick Action Pill Buttons */}
          <div className="grid grid-cols-4 gap-2 py-2 border-y border-gray-100 dark:border-slate-800">
            <button
              onClick={() => {
                onClose();
                onStartCall(contactUserForCall, false);
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-gray-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-5 h-5 text-emerald-500 mb-1" />
              <span className="text-[10px] font-bold">Audio</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onStartCall(contactUserForCall, true);
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-gray-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
            >
              <Video className="w-5 h-5 text-sky-500 mb-1" />
              <span className="text-[10px] font-bold">Video</span>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-gray-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
            >
              {isMuted ? (
                <BellOff className="w-5 h-5 text-rose-500 mb-1" />
              ) : (
                <Bell className="w-5 h-5 text-amber-500 mb-1" />
              )}
              <span className="text-[10px] font-bold">{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                if (onAskAI) onAskAI(`Provide privacy overview for contact ${displayName}`);
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-gray-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-purple-500 mb-1" />
              <span className="text-[10px] font-bold">AI Note</span>
            </button>
          </div>

          {/* Ephemeral Message Self-Destruct Timer */}
          <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-slate-200">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-amber-500" />
                <span>Self-Destruct Timer</span>
              </div>
              <span className="font-mono text-amber-500">
                {chat.selfDestructTimer > 0 ? `${chat.selfDestructTimer}s` : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 pt-1">
              {[
                { label: 'Off', sec: 0 },
                { label: '5s', sec: 5 },
                { label: '30s', sec: 30 },
                { label: '1m', sec: 60 },
                { label: '1h', sec: 3600 },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  onClick={() => onUpdateSelfDestruct(chat.id, opt.sec)}
                  className={`flex-1 py-1 rounded-xl text-[10px] font-bold transition-all ${
                    chat.selfDestructTimer === opt.sec
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* E2EE Security Key Verification */}
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200/60 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-blue-500" />
                <span>E2EE Safety Fingerprint</span>
              </div>
              <button
                onClick={handleCopyFingerprint}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-500" /> : <ExternalLink className="w-3 h-3" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>

            <p className="font-mono text-[10px] text-blue-800 dark:text-blue-200 bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-blue-200/50 dark:border-blue-900/50 break-all leading-relaxed">
              {formattedFingerprint}
            </p>
          </div>

          {/* Shared Vault Files Preview */}
          {vaultFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-slate-200">
                <div className="flex items-center space-x-1.5">
                  <HardDrive className="w-4 h-4 text-sky-500" />
                  <span>Shared Pigion Files</span>
                </div>
                <span className="text-[10px] text-gray-500">{vaultFiles.length} files</span>
              </div>

              <div className="flex space-x-2 overflow-x-auto pb-1">
                {vaultFiles.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="p-2 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-800 shrink-0 w-28 text-left space-y-1"
                  >
                    <p className="text-[10px] font-bold text-gray-800 dark:text-slate-200 truncate">{f.name}</p>
                    <p className="text-[9px] text-gray-500">{f.sizeFormatted}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone Options */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-rose-500 font-semibold">
            <button className="flex items-center space-x-1.5 hover:underline">
              <Ban className="w-4 h-4" />
              <span>Block Contact</span>
            </button>
            <button className="flex items-center space-x-1.5 hover:underline">
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
