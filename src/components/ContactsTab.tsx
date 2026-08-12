import React from 'react';
import { PageHeader } from './PageHeader';
import { User as UserIcon, MessageSquare, ShieldCheck, Key, UserCheck, UserPlus } from 'lucide-react';
import { Avatar } from './Avatar';
import { User } from '../types';

interface ContactsTabProps {
  users: User[];
  currentUser: User;
  onStartChat: (user: User) => void;
  onOpenAddContactModal?: () => void;
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
  onOpenAddContactModal,
  unreadNotifCount = 0,
  onOpenNotifications,
  onOpenUserProfile,
  theme = 'dark',
  setTheme,
  onBackToChats,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <PageHeader
        title="Encrypted Contacts"
        subtitle={onOpenAddContactModal ? 'Your private address book' : 'Verified user directory on zero-knowledge network'}
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

      {onOpenAddContactModal && (
        <div className="px-5 pt-4">
          <button
            onClick={onOpenAddContactModal}
            className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-semibold rounded-2xl flex items-center justify-center space-x-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Contact by Private Number</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span>{onOpenAddContactModal ? 'My Contacts' : 'Pigion Network Directory'}</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {onOpenAddContactModal
              ? "People you've added by Private Number. Pigion never shows an open list of every user."
              : 'Verified E2EE users registered on Pigion. Click any contact to launch an encrypted channel.'}
          </p>
        </div>
      </div>

      {users.filter((u) => u.id !== currentUser.id).length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 text-center">
          <UserPlus className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">No contacts yet</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {onOpenAddContactModal
              ? 'Add someone using their Private Number to start chatting.'
              : 'Start a conversation to see contacts here.'}
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isSelf = u.id === currentUser.id;
          return (
            <div
              key={u.id}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-teal-500/50 rounded-3xl p-5 flex items-center justify-between space-x-4 transition-all shadow-xs hover:shadow-md"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="relative shrink-0">
                  <Avatar src={u.avatar} alt={u.username} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-gray-200 dark:ring-slate-700" />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      u.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate flex items-center space-x-1.5">
                    <span>{u.username}</span>
                    {isSelf && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        YOU
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{u.customStatus || u.bio}</p>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono block mt-1">
                    FP: {u.publicKeyFingerprint.slice(0, 11)}...
                  </span>
                </div>
              </div>

              {!isSelf && (
                <button
                  onClick={() => onStartChat(u)}
                  className="px-3.5 py-2 rounded-2xl bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-semibold text-xs border border-teal-200 dark:border-teal-500/30 transition-colors shrink-0 flex items-center space-x-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      )}
      </div>
    </div>
  );
};
