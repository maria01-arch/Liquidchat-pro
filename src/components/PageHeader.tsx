import React from 'react';
import { Sun, Moon, Sparkles, Bell, ArrowLeft } from 'lucide-react';
import { Avatar } from './Avatar';
import { User } from '../types';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  currentUser: User;
  unreadNotifCount?: number;
  onOpenNotifications?: () => void;
  onOpenUserProfile?: () => void;
  theme?: 'dark' | 'light' | 'emerald';
  setTheme?: (t: 'dark' | 'light' | 'emerald') => void;
  onBackToChats?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge = 'E2EE',
  currentUser,
  unreadNotifCount = 0,
  onOpenNotifications,
  onOpenUserProfile,
  theme = 'dark',
  setTheme,
  onBackToChats,
}) => {
  return (
    <header className="h-14 px-4 bg-white/90 dark:bg-slate-900/90 border-b border-gray-200/80 dark:border-slate-800/80 backdrop-blur-xl flex items-center justify-between shrink-0 z-30 select-none shadow-xs">
      {/* Left: Optional Mobile Back Arrow + Page Title & Icon */}
      <div className="flex items-center space-x-3 min-w-0">
        {onBackToChats && (
          <button
            onClick={onBackToChats}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-colors shrink-0 shadow-xs active:scale-95"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 text-blue-500" />
          </button>
        )}

        <div className="w-9 h-9 rounded-2xl bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-sm sm:text-base text-gray-900 dark:text-slate-100 truncate tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 uppercase tracking-wider shrink-0">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate hidden sm:block font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls: Notifications, Theme, & Logged-In User Profile */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Theme Quick Toggle */}
        {setTheme && (
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setTheme('light')}
              title="Light Theme"
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'light' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              title="Dark Theme"
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark' ? 'bg-slate-700 text-slate-100 shadow-xs' : 'text-gray-500 dark:text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('emerald')}
              title="Teal Theme"
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'emerald' ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-500 dark:text-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Notification Bell */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
        )}

        {/* Logged-In User Profile Avatar Button */}
        {onOpenUserProfile && (
          <button
            onClick={onOpenUserProfile}
            className="p-0.5 rounded-full hover:ring-2 ring-blue-500 transition-all cursor-pointer group"
            title={`Your Profile (${currentUser.username})`}
          >
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.username}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-slate-700 shadow-xs group-hover:scale-105 transition-transform"
            />
          </button>
        )}
      </div>
    </header>
  );
};
