import React from 'react';
import {
  MessageSquare,
  Users,
  PhoneCall,
  UserPlus,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import { ActiveTab } from '../types';

interface LiquidNavBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadChatsCount?: number;
}

export const LiquidNavBar: React.FC<LiquidNavBarProps> = ({
  activeTab,
  setActiveTab,
  unreadChatsCount = 0,
}) => {
  const navItems = [
    { key: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadChatsCount },
    { key: 'rooms', label: 'Rooms', icon: Users },
    { key: 'calls', label: 'Calls', icon: PhoneCall },
    { key: 'contacts', label: 'Contacts', icon: UserPlus },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-gray-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl flex items-center justify-around select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key as ActiveTab)}
            className={`relative flex-1 py-2 flex flex-col items-center justify-center space-y-1 rounded-2xl transition-all cursor-pointer ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            {/* Active Liquid Fluid Pill Spring Animation */}
            {isActive && (
              <motion.div
                layoutId="liquidNavPill"
                className="absolute inset-0 bg-blue-100/80 dark:bg-blue-950/70 rounded-2xl border border-blue-300/60 dark:border-blue-800/60 shadow-xs"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}

            <div className="relative z-10 flex items-center justify-center">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-rose-500 text-white font-bold text-[8px] rounded-full ring-2 ring-white dark:ring-slate-900">
                  {item.badge}
                </span>
              ) : null}
            </div>

            <span className="text-[9px] sm:text-[10px] relative z-10 font-semibold truncate max-w-full px-0.5">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
