import React, { useState } from 'react';
import { Key, ShieldCheck, X, ArrowRight, AlertTriangle, Copy, Check, Loader2 } from 'lucide-react';
import { signUpWithNewWallet, loginWithMnemonic } from '../utils/auth';
import type { PigionIdentity } from '../utils/wallet';
import { User } from '../types';

interface AuthModalProps {
  onLoginOrCreate: (user: User, identity: PigionIdentity) => void;
  onClose: () => void;
  /** When true, hides the close button — used for the forced login gate (no demo fallback once a real backend is configured). */
  mandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginOrCreate, onClose, mandatory }) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [usernameInput, setUsernameInput] = useState('');
  const [passphraseInput, setPassphraseInput] = useState('');
  const [revealedMnemonic, setRevealedMnemonic] = useState<string | null>(null);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pendingIdentity, setPendingIdentity] = useState<PigionIdentity | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { identity, user } = await signUpWithNewWallet(usernameInput.trim());
      setRevealedMnemonic(identity.mnemonic);
      setPendingUser(user);
      setPendingIdentity(identity);
    } catch (err) {
      // Supabase/PostgREST errors are plain objects (not real Error
      // instances), so `err instanceof Error` misses them — check for a
      // .message property on anything, or the real error gets hidden
      // behind a generic message.
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err && typeof (err as any).message === 'string'
          ? (err as any).message
          : 'Could not create your account. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterReveal = () => {
    if (!pendingUser || !pendingIdentity || !confirmedSaved) return;
    onLoginOrCreate(pendingUser, pendingIdentity);
    onClose();
  };

  const handlePassphraseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphraseInput.trim() || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { user, identity } = await loginWithMnemonic(passphraseInput.trim());
      onLoginOrCreate(user, identity);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'Invalid recovery phrase.'
          ? 'That 12-word phrase is not valid — double check the spelling and word order.'
          : 'Login failed. Check your phrase and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!revealedMnemonic) return;
    navigator.clipboard.writeText(revealedMnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        {!revealedMnemonic && !mandatory && (
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-1">
          <div className="mx-auto w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg text-slate-100">Pigion Account Access</h2>
          <p className="text-xs text-slate-400">Encrypted. Private. Yours. — no email, no password.</p>
        </div>

        {revealedMnemonic ? (
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200 leading-relaxed">
                This 12-word phrase <strong>is</strong> your account. Anyone with it can log in as you.
                We never store it, and there is no "forgot password" — if you lose it, the account is
                unrecoverable. Write it down and keep it somewhere safe.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              {revealedMnemonic.split(' ').map((word, i) => (
                <div key={i} className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-600 font-mono">{i + 1}.</span>
                  <span className="font-mono text-blue-300">{word}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-2xl flex items-center justify-center space-x-1.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Phrase'}</span>
            </button>

            <label className="flex items-start space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedSaved}
                onChange={(e) => setConfirmedSaved(e.target.checked)}
                className="mt-0.5"
              />
              <span>I've saved my 12-word phrase somewhere safe.</span>
            </label>

            <button
              onClick={handleContinueAfterReveal}
              disabled={!confirmedSaved}
              className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-400 hover:to-purple-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
            >
              <span>Continue to Pigion</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={`py-2 rounded-xl font-semibold transition-colors ${
                  mode === 'signup' ? 'bg-blue-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
              <button
                onClick={() => { setMode('login'); setError(null); }}
                className={`py-2 rounded-xl font-semibold transition-colors ${
                  mode === 'login' ? 'bg-blue-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Log In with Phrase
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-300">
                {error}
              </div>
            )}

            {mode === 'signup' ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Choose Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CyberAlex"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>
                    <span>Generate Account & Recovery Phrase</span>
                    <ArrowRight className="w-4 h-4" />
                  </>)}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePassphraseLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Your 12-Word Phrase</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="apple orbit velvet nebula falcon ..."
                    value={passphraseInput}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>
                    <Key className="w-4 h-4" />
                    <span>Log In</span>
                  </>)}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
