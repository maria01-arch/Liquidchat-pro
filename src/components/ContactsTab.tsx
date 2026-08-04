import React from 'react';
import { PageHeader } from './PageHeader';
import { User as UserIcon, MessageSquare, ShieldCheck, Key, UserCheck, UserPlus } from 'lucide-react';
import { User } from '../types';

interface ContactsTabProps {
  users: User[];
  currentUser: User;
  onStartChat: (user: User) => void;
  unreadNotifCount?: number;
  onOpenNotifications?: () => void;
  onOpenUserProfile?: () => void;
  theme?: 'dark' | 'light' | 'emerald';
  setTheme?: (t: 'dark' | 'light' | 'emerald') => void;
  onBackToChats?: () => void;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({
  users,
  currentUser,
  onStartChat,
  unreadNotifCount = 0,
  onOpenNotifications,
  onOpenUserProfile,
  theme = 'dark',
  setTheme,
  onBackToChats,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      <PageHeader
        title="Encrypted Contacts"
        subtitle="Verified user directory on zero-knowledge network"
        icon={UserPlus}
        badge="Directory E2EE"
        currentUser={currentUser}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifications={onOpenNotifications}
        onOpenUserProfile={onOpenUserProfile}
        theme={theme}
        setTheme={setTheme}
        onBackToChats={onBackToChats}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-teal-400" />
            <span>Liquid Network Directory</span>
          </h1>
          <p className="text-xs text-slate-400">
            Verified E2EE users registered on liquidchat. Click any contact to launch an encrypted channel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isSelf = u.id === currentUser.id;
          return (
            <div
              key={u.id}
              className="bg-slate-900 border border-slate-800 hover:border-teal-500/30 rounded-3xl p-5 flex items-center justify-between space-x-4 transition-all shadow-md"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="relative shrink-0">
                  <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-700" />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                      u.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-100 truncate flex items-center space-x-1.5">
                    <span>{u.username}</span>
                    {isSelf && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                        YOU
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">{u.customStatus || u.bio}</p>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    FP: {u.publicKeyFingerprint.slice(0, 11)}...
                  </span>
                </div>
              </div>

              {!isSelf && (
                <button
                  onClick={() => onStartChat(u)}
                  className="px-3.5 py-2 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold text-xs border border-teal-500/30 transition-colors shrink-0 flex items-center space-x-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
