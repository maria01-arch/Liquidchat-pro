import React from 'react';
import { Bell, Check, X, HardDrive, ShieldCheck, Bot, MessageSquare } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onClearAll: () => void;
  onSelectNotifChat: (chatId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onClose,
  onClearAll,
  onSelectNotifChat,
}) => {
  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ai':
        return <Bot className="w-4 h-4 text-indigo-400" />;
      case 'storage':
        return <HardDrive className="w-4 h-4 text-cyan-400" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-teal-400" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col p-4 select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
          <Bell className="w-4 h-4" />
          <span>Real-time Activity Notifications</span>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-2">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No recent notifications.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.linkChatId) onSelectNotifChat(n.linkChatId);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                n.read
                  ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                  : 'bg-slate-950 border-emerald-500/30 text-slate-100 shadow-md'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs truncate">{n.title}</h4>
                    <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.body}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-slate-800">
        <button
          onClick={onClearAll}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
        >
          Clear All Notifications
        </button>
      </div>
    </div>
  );
};
