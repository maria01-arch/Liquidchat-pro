import React, { useState } from 'react';
import { Chat, User } from '../types';
import { PageHeader } from './PageHeader';
import {
  Users,
  Plus,
  Search,
  Lock,
  Globe,
  ShieldCheck,
  Hash,
  MessageSquare,
  Sparkles,
  UserPlus
} from 'lucide-react';

interface RoomsTabProps {
  chats: Chat[];
  users?: User[];
  onSelectRoom: (chatId: string) => void;
  onOpenCreateRoomModal: () => void;
  currentUser: User;
  unreadNotifCount?: number;
  onOpenNotifications?: () => void;
  onOpenUserProfile?: () => void;
  theme?: 'dark' | 'light' | 'emerald';
  setTheme?: (t: 'dark' | 'light' | 'emerald') => void;
  onBackToChats?: () => void;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({
  chats,
  users: _users,
  onSelectRoom,
  onOpenCreateRoomModal,
  currentUser,
  unreadNotifCount = 0,
  onOpenNotifications,
  onOpenUserProfile,
  theme = 'dark',
  setTheme,
  onBackToChats,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'joined' | 'explore'>('joined');

  const roomChats = chats.filter((c) => c.type === 'group');

  const exploreRooms = [
    {
      id: 'pub-1',
      name: '⚡ Developer Core & Cryptography',
      topic: 'Open source discussion on WebCrypto and React architecture',
      membersCount: 142,
      avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150',
      isPublic: true,
    },
    {
      id: 'pub-2',
      name: '🌐 Global Privacy Advocates',
      topic: 'Zero-knowledge protocols and E2EE decentralization',
      membersCount: 89,
      avatar: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150',
      isPublic: true,
    },
    {
      id: 'pub-3',
      name: '🎨 UI/UX Design Craftsmen',
      topic: 'Tailwind CSS, visual motion, typography and spatial layout',
      membersCount: 67,
      avatar: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150',
      isPublic: true,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <PageHeader
        title="Rooms & Channels"
        subtitle="Zero-knowledge group channels and community rooms"
        icon={Users}
        badge="Group E2EE"
        currentUser={currentUser}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifications={onOpenNotifications}
        onOpenUserProfile={onOpenUserProfile}
        theme={theme}
        setTheme={setTheme}
        onBackToChats={onBackToChats}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                E2EE Rooms & Channels
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Private encrypted group rooms and public community channels with zero-knowledge keys.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCreateRoomModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setFilter('joined')}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-colors ${
              filter === 'joined'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            My Joined Rooms ({roomChats.length})
          </button>
          <button
            onClick={() => setFilter('explore')}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-colors ${
              filter === 'explore'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            Explore Public Rooms
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Content View */}
      {filter === 'joined' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomChats
            .filter((r) => (r.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
            .map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={room.avatar}
                      alt={room.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/30"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                        {room.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5 font-medium">
                        <Users className="w-3 h-3 text-blue-500" />
                        <span>{room.members.length} members</span>
                      </p>
                    </div>
                  </div>
                  <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>

                {room.topic && (
                  <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2 bg-gray-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                    {room.topic}
                  </p>
                )}

                <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-gray-400 truncate">
                    ID: {room.id}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                    <span>Open Room</span>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exploreRooms.map((eRoom) => (
            <div
              key={eRoom.id}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={eRoom.avatar}
                    alt={eRoom.name}
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                      {eRoom.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 flex items-center space-x-1 mt-0.5">
                      <Globe className="w-3 h-3 text-emerald-500" />
                      <span>{eRoom.membersCount} members online</span>
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800">
                {eRoom.topic}
              </p>

              <button
                onClick={onOpenCreateRoomModal}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join Room</span>
              </button>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};
