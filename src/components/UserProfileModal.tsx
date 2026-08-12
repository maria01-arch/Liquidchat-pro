import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X, Camera, ShieldCheck, Key, Check, UserCheck, Sparkles, Lock, Phone, Copy, ChevronDown } from 'lucide-react';
import { Avatar } from './Avatar';
import { COUNTRY_OPTIONS, type CountryOption } from '../utils/privateNumber';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onSaveProfile: (updated: Partial<User>) => void;
  /** Only provided when a real backend is configured — Private Number needs a server to be permanent/unique. */
  onClaimPrivateNumber?: (country: CountryOption) => void;
  privateNumberError?: string | null;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onSaveProfile,
  onClaimPrivateNumber,
  privateNumberError,
}) => {
  const [username, setUsername] = useState(user.username);
  const [customStatus, setCustomStatus] = useState(user.customStatus || 'Available for E2EE chat');
  const [avatar, setAvatar] = useState(user.avatar);
  const [status, setStatus] = useState<'online' | 'offline' | 'busy'>(user.status || 'online');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRY_OPTIONS[0]);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [numberCopied, setNumberCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (user.privateNumberDisplay) setClaiming(false);
  }, [user.privateNumberDisplay]);

  useEffect(() => {
    if (privateNumberError) setClaiming(false);
  }, [privateNumberError]);

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      username,
      customStatus,
      avatar,
      status,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-base text-gray-900 dark:text-slate-100">User Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              <Avatar
                src={avatar}
                alt={username}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/30 shadow-md"
              />
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-sm transition-transform active:scale-95">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Avatar Presets */}
            <div className="flex items-center space-x-2 pt-1">
              {AVATAR_PRESETS.map((pUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatar(pUrl)}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                    avatar === pUrl
                      ? 'border-blue-600 ring-2 ring-blue-500/20 scale-110'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={pUrl} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
              Username / Display Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-xs text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Status / About */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
              Bio / About Message
            </label>
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-3.5 py-2 bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-xs text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Online Presence */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
              Presence Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'online', label: 'Online', color: 'bg-emerald-500' },
                { key: 'busy', label: 'Busy', color: 'bg-rose-500' },
                { key: 'offline', label: 'Invisible', color: 'bg-gray-400' },
              ].map((st) => (
                <button
                  type="button"
                  key={st.key}
                  onClick={() => setStatus(st.key as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    status === st.key
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${st.color}`} />
                  <span className="capitalize">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* E2EE Public Key Info */}
          <div className="p-3 bg-gray-50 dark:bg-slate-950/60 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between text-gray-700 dark:text-slate-300 font-semibold">
              <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-Knowledge Keypair</span>
              </span>
              <span className="text-[10px] text-emerald-500 font-mono font-bold">ACTIVE</span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono truncate">
              Public Key: {user.signingPublicKey ? `${user.signingPublicKey.slice(0, 20)}…` : 'Not available'}
            </p>
          </div>

          {/* Private Number */}
          {onClaimPrivateNumber && (
            <div className="p-3 bg-gray-50 dark:bg-slate-950/60 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-semibold">
                <Phone className="w-3.5 h-3.5" />
                <span>Private Number</span>
              </div>

              {user.privateNumberDisplay ? (
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 dark:text-slate-400">
                    Share this so people can find and message you. It's permanent and can't be changed.
                  </p>
                  <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
                    <span className="font-mono text-sm text-gray-900 dark:text-slate-100">{user.privateNumberDisplay}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(user.privateNumberDisplay!);
                        setNumberCopied(true);
                        setTimeout(() => setNumberCopied(false), 1500);
                      }}
                      className="text-gray-400 hover:text-blue-500"
                    >
                      {numberCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 dark:text-slate-400">
                    Generate a permanent, phone-style number so people can reach you without Pigion showing an
                    open list of every user. Not a real phone number — nobody can call or text it.
                  </p>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCountryPickerOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-200"
                    >
                      <span>{selectedCountry.flag} {selectedCountry.name} ({selectedCountry.dialCode})</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    {countryPickerOpen && (
                      <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-lg">
                        {COUNTRY_OPTIONS.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setCountryPickerOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                          >
                            {c.flag} {c.name} ({c.dialCode})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {privateNumberError && (
                    <p className="text-[10px] text-red-500">{privateNumberError}</p>
                  )}

                  <button
                    type="button"
                    disabled={claiming}
                    onClick={() => {
                      setClaiming(true);
                      onClaimPrivateNumber(selectedCountry);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white shadow-xs transition-colors"
                  >
                    {claiming ? 'Generating…' : 'Generate My Private Number'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
