import React from 'react';
import { PageHeader } from './PageHeader';
import { User as UserIcon, Key, ShieldCheck, Moon, Sparkles, Sun, HardDrive, BellRing, Lock, Info, Settings, Globe, Compass } from 'lucide-react';
import { Avatar } from './Avatar';
import { User } from '../types';

interface SettingsTabProps {
  currentUser: User;
  theme: 'dark' | 'light' | 'emerald';
  setTheme: (t: 'dark' | 'light' | 'emerald') => void;
  onOpenPasskeyModal: () => void;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
  unreadNotifCount?: number;
  onOpenNotifications?: () => void;
  onOpenUserProfile?: () => void;
  onBackToChats?: () => void;
  useInAppBrowser?: boolean;
  setUseInAppBrowser?: (val: boolean) => void;
  onOpenBrowser?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  currentUser,
  theme,
  setTheme,
  onOpenPasskeyModal,
  onOpenAuthModal,
  onLogout,
  unreadNotifCount = 0,
  onOpenNotifications,
  onOpenUserProfile,
  onBackToChats,
  useInAppBrowser = true,
  setUseInAppBrowser,
  onOpenBrowser,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <PageHeader
        title="Settings & Privacy"
        subtitle="Manage end-to-end encryption, passkey recovery, and preferences"
        icon={Settings}
        badge="Security E2EE"
        currentUser={currentUser}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifications={onOpenNotifications}
        onOpenUserProfile={onOpenUserProfile}
        theme={theme}
        setTheme={setTheme}
        onBackToChats={onBackToChats}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 space-y-6 max-w-4xl">
        {/* User Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Avatar src={currentUser.avatar} alt={currentUser.username} className="w-16 h-16 rounded-3xl object-cover ring-2 ring-emerald-500/40 shrink-0" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center space-x-2">
              <span>{currentUser.username}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono font-bold">
                E2EE ACTIVE
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">{currentUser.bio || 'Product Designer @ Pigion'}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">PublicKey Fingerprint: {currentUser.publicKeyFingerprint}</p>
          </div>
        </div>

        <button
          onClick={onOpenAuthModal}
          className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-semibold rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs"
        >
          Switch Account
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold rounded-2xl border border-red-500/20 shadow-xs"
          >
            Log Out
          </button>
        )}
      </div>

      {/* Passkey Security Box */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
          <Key className="w-5 h-5" />
          <span>12-Word Account Recovery Passkey</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
          Your recovery passkey string secures your zero-knowledge encryption keys across devices. You can use it to log into Pigion anywhere.
        </p>
        <button
          onClick={onOpenPasskeyModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-sm transition-all"
        >
          Manage Recovery Passkey
        </button>
      </div>

      {/* Theme & Visual Customization */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <span>Appearance & Fluid Atmosphere</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'dark', label: 'Midnight', icon: <Moon className="w-4 h-4 text-slate-300" /> },
            { id: 'emerald', label: 'Emerald Cyan', icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
            { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4 text-amber-500" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className={`p-4 rounded-2xl border text-left flex flex-col items-center justify-center space-y-2 transition-all ${
                theme === t.id
                  ? 'bg-blue-50 dark:bg-emerald-500/20 border-blue-500 dark:border-emerald-500/40 text-blue-600 dark:text-emerald-300 font-bold shadow-xs'
                  : 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {t.icon}
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* In-App Browser & Search Engine Settings */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 pr-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-sky-500" />
              <span>In-App Browser & Web Search Engine</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              When enabled, web links in conversations open inside Pigion's built-in secure browser instead of launching an external app.
            </p>
          </div>
          <button
            onClick={() => setUseInAppBrowser?.(!useInAppBrowser)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              useInAppBrowser ? 'bg-sky-500' : 'bg-gray-300 dark:bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                useInAppBrowser ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {onOpenBrowser && (
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-slate-400">Launch Inbuilt Web Browser & Search:</span>
            <button
              onClick={onOpenBrowser}
              className="px-3.5 py-1.5 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs rounded-xl border border-sky-200 dark:border-sky-500/30 transition-colors flex items-center space-x-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Open Search Engine</span>
            </button>
          </div>
        )}
      </div>

      {/* Corporate Info */}
      <div className="bg-white/80 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs text-xs text-gray-500 dark:text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-gray-900 dark:text-slate-200 font-bold">
          <Info className="w-4 h-4 text-emerald-500" />
          <span>About Pigion</span>
        </div>
        <p>
          <strong>Pigion</strong> is a modern, privacy-first WhatsApp & Telegram hybrid messaging platform.
          Features end-to-end encryption, ephemeral self-destructing messages, an integrated Pigion Vault for encrypted cloud file storage, voice notes, and Pigion AI.
        </p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
          Version 2.4.0 • Build pigion-2026-prod
        </p>
      </div>
      </div>
    </div>
  );
};
