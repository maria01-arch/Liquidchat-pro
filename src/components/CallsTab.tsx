import React, { useState } from 'react';
import { CallLog, User } from '../types';
import { Avatar } from './Avatar';
import { PageHeader } from './PageHeader';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  ShieldCheck,
  Search,
  Plus,
  Clock,
  Lock
} from 'lucide-react';
import { formatDuration } from '../utils/audio';

interface CallsTabProps {
  callLogs: CallLog[];
  users?: User[];
  contacts?: User[];
  onStartCall: (contact: User, isVideo: boolean) => void;
  onClearLogs?: () => void;
  currentUser: User;
  unreadNotifCount?: number;
  onOpenNotifications?: () => void;
  onOpenUserProfile?: () => void;
  theme?: 'dark' | 'light' | 'emerald';
  setTheme?: (t: 'dark' | 'light' | 'emerald') => void;
  onBackToChats?: () => void;
}

export const CallsTab: React.FC<CallsTabProps> = ({
  callLogs = [],
  users = [],
  contacts = [],
  onStartCall,
  currentUser,
  unreadNotifCount = 0,
  onOpenNotifications,
  onOpenUserProfile,
  theme = 'dark',
  setTheme,
  onBackToChats,
}) => {
  const userList = users.length > 0 ? users : contacts;
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCallUserPicker, setShowCallUserPicker] = useState(false);

  const filteredLogs = callLogs.filter((log) => {
    const matchesFilter = filter === 'all' || (filter === 'missed' && log.type === 'missed');
    const contactName = log.contactName || '';
    const query = searchQuery || '';
    const matchesSearch = contactName.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <PageHeader
        title="Secure Voice & Video Calls"
        subtitle="Zero-knowledge peer-to-peer calling with WebRTC encryption"
        icon={PhoneCall}
        badge="WebRTC E2EE"
        currentUser={currentUser}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifications={onOpenNotifications}
        onOpenUserProfile={onOpenUserProfile}
        theme={theme}
        setTheme={setTheme}
        onBackToChats={onBackToChats}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 space-y-6">
        {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <PhoneCall className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                E2EE Audio & Video Calls
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Zero-knowledge peer-to-peer audio and video calling with WebRTC encryption.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCallUserPicker(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start Call</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center space-x-4 text-xs font-semibold text-gray-600 dark:text-slate-300">
          <span className="flex items-center space-x-1 text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
            <span>End-to-End Encrypted</span>
          </span>
          <span className="text-gray-300 dark:text-slate-700">•</span>
          <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Peer-to-Peer WebRTC</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            All Calls ({callLogs.length})
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-colors ${
              filter === 'missed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            Missed ({callLogs.filter((c) => c.type === 'missed').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search call logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Call History List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800/60 overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Phone className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-700" />
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
              No call history found. Select a contact to initiate a secure call.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const user = userList.find((u) => u.id === log.contactId) || {
              id: log.contactId,
              username: log.contactName,
              avatar: log.contactAvatar,
              status: 'offline',
              publicKey: 'key_stub'
            };
            return (
              <div
                key={log.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="relative">
                    <Avatar
                      src={log.contactAvatar}
                      alt={log.contactName}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-gray-200 dark:ring-slate-800"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-900 rounded-full shadow-xs">
                      {log.type === 'incoming' && <PhoneIncoming className="w-3 h-3 text-emerald-500" />}
                      {log.type === 'outgoing' && <PhoneOutgoing className="w-3 h-3 text-blue-500" />}
                      {log.type === 'missed' && <PhoneMissed className="w-3 h-3 text-rose-500" />}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center space-x-1.5">
                      <span>{log.contactName}</span>
                      {log.isE2EE && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" title="End-to-End Encrypted" />
                      )}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                      <span className="capitalize">{log.type} {log.callType}</span>
                      <span>•</span>
                      <span>{log.timestamp}</span>
                      {log.duration ? (
                        <>
                          <span>•</span>
                          <span className="font-mono text-gray-400">{formatDuration(log.duration)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Call Action Triggers */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onStartCall(user, false)}
                    className="p-2.5 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-gray-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
                    title="Audio Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStartCall(user, true)}
                    className="p-2.5 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-gray-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
                    title="Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Start Call User Picker Modal */}
      {showCallUserPicker && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">
              Select Contact to Call
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {userList.map((user) => (
                <div
                  key={user.id}
                  className="p-3 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar src={user.avatar} alt={user.username} className="w-9 h-9 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100">
                        {user.username}
                      </h4>
                      <p className="text-[10px] text-gray-500 capitalize">{user.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setShowCallUserPicker(false);
                        onStartCall(user, false);
                      }}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                      title="Audio Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setShowCallUserPicker(false);
                        onStartCall(user, true);
                      }}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                      title="Video Call"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCallUserPicker(false)}
              className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
