import React, { useState } from 'react';
import { X, Search, MessageSquare, UserPlus, Loader2, ShieldCheck } from 'lucide-react';
import { Avatar } from './Avatar';
import { User } from '../types';

interface AddContactModalProps {
  onClose: () => void;
  onSearch: (number: string) => Promise<User | null>;
  onAddContact: (user: User) => void;
  onStartChat: (user: User) => void;
}

/**
 * Find someone by their Private Number — Pigion has no open, browsable
 * directory of every user, so this exact-match lookup is the only way to
 * discover an account (besides already sharing a chat with them).
 */
export const AddContactModal: React.FC<AddContactModalProps> = ({ onClose, onSearch, onAddContact, onStartChat }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<User | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setFound(null);
    try {
      const result = await onSearch(input.trim());
      setFound(result);
      setSearched(true);
      if (!result) setError("No account found with that number — double-check it and try again.");
    } catch {
      setError('Something went wrong searching for that number. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="mx-auto w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-2">
            <Search className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-lg text-slate-100">Find by Private Number</h2>
          <p className="text-xs text-slate-400">Pigion has no public directory — search by the number they shared with you.</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <input
            type="text"
            required
            placeholder="+1 415 555 0199"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSearched(false);
              setFound(null);
              setError(null);
            }}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-300">
            {error}
          </div>
        )}

        {searched && found && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar src={found.avatar} alt={found.username} className="w-12 h-12 rounded-2xl object-cover" />
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-100 truncate">{found.username}</h3>
                <span className="text-[10px] text-blue-400 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>E2EE verified account</span>
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  onAddContact(found);
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
              <button
                onClick={() => {
                  onStartChat(found);
                  onClose();
                }}
                className="flex-1 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
