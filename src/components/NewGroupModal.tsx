import React, { useState } from 'react';
import { Users, Lock, Timer, Plus, X, Check } from 'lucide-react';
import { User } from '../types';

interface NewGroupModalProps {
  availableUsers: User[];
  currentUser: User;
  onClose: () => void;
  onCreateGroup: (name: string, topic: string, memberIds: string[], timerSeconds: number) => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  availableUsers,
  currentUser,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([currentUser.id]);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  const toggleUser = (userId: string) => {
    if (userId === currentUser.id) return;
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateGroup(name.trim(), topic.trim(), selectedUserIds, timerSeconds);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 relative"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base">
            <Users className="w-5 h-5" />
            <span>Create Secure E2EE Group Chat</span>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Liquid Security Core 🔒"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Topic / Description</label>
            <input
              type="text"
              placeholder="e.g. End-to-end encrypted discussion channel"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Default Self-Destruct Timer</label>
            <select
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value={0}>Off (Normal Persistence)</option>
              <option value={5}>5 Seconds</option>
              <option value={30}>30 Seconds</option>
              <option value={60}>1 Minute</option>
              <option value={3600}>1 Hour</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Group Members</label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 p-1">
              {availableUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer border transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-100'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <img src={u.avatar} alt={u.username} className="w-7 h-7 rounded-xl object-cover" />
                      <span className="font-semibold text-xs">{u.username}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all"
        >
          Create Encrypted Group
        </button>
      </form>
    </div>
  );
};
