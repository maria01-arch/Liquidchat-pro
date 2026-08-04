import React, { useState } from 'react';
import { UserCheck, Key, ShieldCheck, Sparkles, X, ArrowRight } from 'lucide-react';
import { generateUserPasskey, generateFingerprint } from '../utils/crypto';
import { User } from '../types';

interface AuthModalProps {
  currentUser: User;
  onLoginOrCreate: (user: User) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ currentUser, onLoginOrCreate, onClose }) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [usernameInput, setUsernameInput] = useState('');
  const [passkeyInput, setPasskeyInput] = useState('');
  const [generatedPasskey, setGeneratedPasskey] = useState<string | null>(null);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    const newPasskey = generateUserPasskey();
    setGeneratedPasskey(newPasskey);

    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: usernameInput.trim(),
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      passkey: newPasskey,
      status: 'online',
      customStatus: '⚡ liquidchat E2EE active',
      createdAt: new Date().toISOString().split('T')[0],
      publicKeyFingerprint: generateFingerprint(usernameInput.trim()),
    };

    onLoginOrCreate(newUser);
  };

  const handlePasskeyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) return;

    // Simulate passkey derivation
    const userFromPasskey: User = {
      id: `usr_pass_${Date.now()}`,
      username: usernameInput.trim() || 'LiquidUser',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      passkey: passkeyInput.trim(),
      status: 'online',
      customStatus: '🔒 Restored via Passkey',
      createdAt: '2026-08-04',
      publicKeyFingerprint: generateFingerprint(passkeyInput.trim()),
    };

    onLoginOrCreate(userFromPasskey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div className="mx-auto w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-bold text-lg text-slate-100">liquidchat Account Access</h2>
          <p className="text-xs text-slate-400">by xchordlabs corp • Passwordless & Username-Only</p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setMode('signup')}
            className={`py-2 rounded-xl font-semibold transition-colors ${
              mode === 'signup' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => setMode('login')}
            className={`py-2 rounded-xl font-semibold transition-colors ${
              mode === 'login' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Passkey Login
          </button>
        </div>

        {mode === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Choose Username Only</label>
              <input
                type="text"
                required
                placeholder="e.g. CyberAlex"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {generatedPasskey && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1 text-xs">
                <span className="font-bold text-emerald-300 block">Generated Recovery Passkey:</span>
                <span className="font-mono text-emerald-400 text-[11px] break-all block">{generatedPasskey}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
            >
              <span>{generatedPasskey ? 'Continue to App' : 'Generate Account & Passkey'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasskeyLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Your Username</label>
              <input
                type="text"
                placeholder="e.g. AlexRider"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 mb-3"
              />

              <label className="block text-xs font-semibold text-slate-300 mb-1">Paste Your 12-Word Passkey</label>
              <textarea
                required
                rows={3}
                placeholder="liquid-7f9a-alpha-bravo-omega-92x8-titan-crypt..."
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
            >
              <Key className="w-4 h-4" />
              <span>Login via Passkey</span>
            </button>
          </form>
        )}

        {/* Current Active User Info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Active User: <strong className="text-slate-200">{currentUser.username}</strong></span>
          <span className="text-[10px] text-emerald-400 font-mono">E2EE Ready</span>
        </div>
      </div>
    </div>
  );
};
