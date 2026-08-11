import React from 'react';
import { ShieldCheck, AlertTriangle, X, KeyRound, Fingerprint } from 'lucide-react';
import { User } from '../types';

interface PasskeyModalProps {
  currentUser: User;
  onClose: () => void;
}

/**
 * Security & Recovery info modal.
 *
 * Unlike the old version of this modal, Pigion never stores or re-displays
 * your 12-word recovery phrase after account creation — matching how real
 * crypto wallets (Trust Wallet, MetaMask, etc.) work. It was shown to you
 * once, at signup. If it's lost, the account cannot be recovered; there is
 * no backend copy to restore from. This modal explains that model and shows
 * the (safe to share) public fingerprint used to verify your identity.
 */
export const PasskeyModal: React.FC<PasskeyModalProps> = ({ currentUser, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">Security & Recovery</h2>
              <p className="text-xs text-slate-400">How your Pigion identity works</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Your recovery phrase can't be shown again</span>
            It was displayed once, when you created this account, and is never stored by Pigion —
            not on our servers, not in your browser. There is no "forgot password" flow. If it's lost,
            this account cannot be recovered.
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Fingerprint className="w-4 h-4 text-blue-400" />
            <span>Your Public Key Fingerprint</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Safe to share — other people use this to verify they're really talking to you over E2EE.
          </p>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-sm text-blue-300 text-center tracking-wider">
            {currentUser.publicKeyFingerprint}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-400">
          <KeyRound className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            Logging in on a new device works the same way it did the first time — enter your 12-word
            phrase there. It derives the exact same keys, every time, on any device.
          </div>
        </div>
      </div>
    </div>
  );
};
