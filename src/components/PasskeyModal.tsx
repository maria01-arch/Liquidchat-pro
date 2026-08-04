import React, { useState } from 'react';
import { Key, ShieldCheck, Copy, Check, Download, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { generateUserPasskey } from '../utils/crypto';

interface PasskeyModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdatePasskey: (newPasskey: string) => void;
}

export const PasskeyModal: React.FC<PasskeyModalProps> = ({ currentUser, onClose, onUpdatePasskey }) => {
  const [copied, setCopied] = useState(false);
  const [passkey, setPasskey] = useState(currentUser.passkey);

  const words = passkey.split('-');

  const handleCopy = () => {
    navigator.clipboard.writeText(passkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    const newKey = generateUserPasskey();
    setPasskey(newKey);
    onUpdatePasskey(newKey);
  };

  const handleDownloadBackup = () => {
    const backupContent = JSON.stringify(
      {
        platform: 'liquidchat',
        company: 'xchordlabs corp',
        username: currentUser.username,
        recoveryPasskey: passkey,
        publicKeyFingerprint: currentUser.publicKeyFingerprint,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    );

    const blob = new Blob([backupContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquidchat_passkey_backup_${currentUser.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Key className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100 flex items-center space-x-2">
                <span>Account Recovery Passkey</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  12 WORDS
                </span>
              </h2>
              <p className="text-xs text-slate-400">by xchordlabs corp E2EE security engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Alert */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Keep this Passkey Safe!</span>
            Users can use this 12-word passkey to login and restore complete E2EE account access from any new device.
          </div>
        </div>

        {/* 12-Word Passkey Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs">
          {words.map((word, idx) => (
            <div key={idx} className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center space-x-1.5">
              <span className="text-[10px] text-slate-500 font-semibold w-4">{idx + 1}.</span>
              <span className="text-emerald-300 font-semibold truncate">{word}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 shadow-lg transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Passkey Copied!' : 'Copy Passkey'}</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-2xl flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Backup</span>
            </button>
          </div>

          <button
            onClick={handleRegenerate}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center space-x-1.5 border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate New Random Passkey</span>
          </button>
        </div>
      </div>
    </div>
  );
};
