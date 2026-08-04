import React from 'react';
import { ShieldCheck, Lock, QrCode, CheckCircle2, X } from 'lucide-react';
import { Chat } from '../types';

interface EncryptionVerificationModalProps {
  chat: Chat;
  onClose: () => void;
}

export const EncryptionVerificationModal: React.FC<EncryptionVerificationModalProps> = ({ chat, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-center relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 animate-pulse" />
        </div>

        <div>
          <h2 className="font-bold text-base text-slate-100">End-to-End Encryption Verification</h2>
          <p className="text-xs text-slate-400 mt-1">
            Comparing safety keys with <span className="text-emerald-300 font-semibold">{chat.name}</span>
          </p>
        </div>

        {/* Fingerprint Hex Display */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Safety Key Fingerprint
          </p>
          <div className="font-mono text-base font-bold text-emerald-400 tracking-wider">
            {chat.e2eFingerprint}
          </div>
        </div>

        {/* QR Visual Matrix */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-2">
          <div className="w-32 h-32 bg-emerald-400/10 border border-emerald-500/30 rounded-2xl p-3 flex flex-col items-center justify-center">
            <QrCode className="w-24 h-24 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500">Scan QR to verify channel safety keys in person</span>
        </div>

        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-left">
            Messages, files, and voice notes in this chat are secured with AES-256 GCM zero-knowledge encryption.
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg transition-all"
        >
          Close & Confirm Verification
        </button>
      </div>
    </div>
  );
};
