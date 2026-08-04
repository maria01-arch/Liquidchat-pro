import React from 'react';
import { ShieldCheck, Lock, Bell, Moon, Sun, Key, Sparkles, UserCheck, HardDrive } from 'lucide-react';
import { User, NotificationItem } from '../types';

interface NavbarProps {
  currentUser: User;
  theme: 'dark' | 'light' | 'emerald';
  setTheme: (t: 'dark' | 'light' | 'emerald') => void;
  notifications: NotificationItem[];
  setShowPasskeyModal: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  unreadNotifCount: number;
  openVault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  theme,
  setTheme,
  notifications: _notifications,
  setShowPasskeyModal,
  setShowNotifications,
  setShowAuthModal,
  unreadNotifCount,
  openVault,
}) => {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-xs">
      {/* Brand Identity */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white">
              liquidchat
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              E2EE
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
            xchordlabs corp
          </p>
        </div>
      </div>

      {/* Center Status Pill */}
      <div className="hidden md:flex items-center space-x-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-3 py-1 text-xs">
        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>Zero-Knowledge E2EE</span>
        </div>
        <span className="text-gray-300 dark:text-slate-600">•</span>
        <button
          onClick={openVault}
          className="flex items-center space-x-1 text-gray-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
        >
          <HardDrive className="w-3.5 h-3.5 text-blue-500" />
          <span>Liquid Storage</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Theme Selector */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setTheme('light')}
            title="Clean Light Theme"
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'light' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            title="Dark Theme"
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'dark' ? 'bg-slate-700 text-slate-100 shadow-xs' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('emerald')}
            title="Emerald Theme"
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'emerald' ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Passkey Recovery Button */}
        <button
          onClick={() => setShowPasskeyModal(true)}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-800 transition-all"
          title="View 12-Word Recovery Passkey"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Passkey</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setShowNotifications(true)}
          className="relative p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-colors border border-gray-200 dark:border-slate-700"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
              {unreadNotifCount}
            </span>
          )}
        </button>

        {/* Current User Badge & Auth Switcher */}
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center space-x-2 pl-1.5 pr-2 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
          title="Account details or switch user"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className="w-6 h-6 rounded-lg object-cover ring-1 ring-blue-500"
          />
          <span className="text-xs font-medium text-gray-800 dark:text-slate-200 hidden sm:inline max-w-[90px] truncate">
            {currentUser.username}
          </span>
          <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    </header>
  );
};
