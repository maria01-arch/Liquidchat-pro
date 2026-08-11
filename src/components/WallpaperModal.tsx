import React, { useRef, useState } from 'react';
import { ChatWallpaper } from '../types';
import { X, Check, Image as ImageIcon, Upload, Moon, Sun, Plus, Trash2 } from 'lucide-react';

interface WallpaperModalProps {
  currentWallpaper: ChatWallpaper;
  onSelectWallpaper: (wp: ChatWallpaper) => void;
  onClose: () => void;
}

export const WALLPAPER_OPTIONS: { id: string; name: string; previewBg: string; isDark: boolean }[] = [
  {
    id: 'telegram-doodle',
    name: 'Telegram Dark Doodle',
    previewBg: 'bg-slate-950 border-purple-500/30',
    isDark: true,
  },
  {
    id: 'telegram-light-doodle',
    name: 'Telegram Light Doodle',
    previewBg: 'bg-slate-200 border-sky-300',
    isDark: false,
  },
  {
    id: 'dark-doodle',
    name: 'Midnight Monogram',
    previewBg: 'bg-gray-900 border-gray-700',
    isDark: true,
  },
  {
    id: 'purple-nebula',
    name: 'Purple Nebula Gradient',
    previewBg: 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950',
    isDark: true,
  },
  {
    id: 'midnight-blue',
    name: 'Deep Midnight Blue',
    previewBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950',
    isDark: true,
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Cyber Forest',
    previewBg: 'bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950',
    isDark: true,
  },
  {
    id: 'clean-solid',
    name: 'Minimal Light Canvas',
    previewBg: 'bg-gray-100 border-gray-300',
    isDark: false,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    previewBg: 'bg-gradient-to-br from-purple-950 via-slate-900 to-rose-950',
    isDark: true,
  },
];

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  currentWallpaper,
  onSelectWallpaper,
  onClose,
}) => {
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [customWallpapers, setCustomWallpapers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pigion_custom_wallpapers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const updated = [dataUrl, ...customWallpapers.filter((w) => w !== dataUrl)];
        setCustomWallpapers(updated);
        try {
          localStorage.setItem('pigion_custom_wallpapers', JSON.stringify(updated.slice(0, 10)));
        } catch {
          // ignore quota error
        }
        onSelectWallpaper(dataUrl);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomWp = (e: React.MouseEvent, wpUrl: string) => {
    e.stopPropagation();
    const updated = customWallpapers.filter((w) => w !== wpUrl);
    setCustomWallpapers(updated);
    try {
      localStorage.setItem('pigion_custom_wallpapers', JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (currentWallpaper === wpUrl) {
      onSelectWallpaper('telegram-doodle');
    }
  };

  const isCustomActive = currentWallpaper.startsWith('data:image/') || currentWallpaper.startsWith('blob:') || currentWallpaper.startsWith('http');

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-sky-500" />
            <h2 className="font-bold text-base text-gray-900 dark:text-slate-100">
              Chat Wallpaper & Gallery
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400">
          Choose a wallpaper from Telegram presets or upload your custom background photo from your gallery.
        </p>

        {/* Gallery Upload Button */}
        <div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
          >
            <Upload className="w-4 h-4" />
            <span>Choose Wallpaper from Device Gallery</span>
          </button>
        </div>

        {/* Custom Uploaded Gallery Wallpapers */}
        {customWallpapers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Your Gallery Uploads</span>
              <span className="text-[10px] text-sky-400">{customWallpapers.length} saved</span>
            </div>
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
              {customWallpapers.map((customWp, idx) => {
                const isSelected = currentWallpaper === customWp;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectWallpaper(customWp);
                      onClose();
                    }}
                    className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group ${
                      isSelected ? 'border-sky-500 ring-4 ring-sky-500/20 scale-105' : 'border-slate-700/60 hover:border-slate-500'
                    }`}
                  >
                    <img src={customWp} alt="Custom Gallery Wallpaper" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 p-1 bg-sky-500 text-white rounded-full shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <button
                      onClick={(e) => handleRemoveCustomWp(e, customWp)}
                      className="absolute bottom-1.5 right-1.5 p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preset Wallpapers Grid */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400">Telegram Preset Wallpapers</div>
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {WALLPAPER_OPTIONS.map((wp) => {
              const isSelected = currentWallpaper === wp.id;
              return (
                <button
                  key={wp.id}
                  onClick={() => {
                    onSelectWallpaper(wp.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left relative overflow-hidden transition-all flex flex-col justify-between h-20 ${wp.previewBg} ${
                    isSelected
                      ? 'border-sky-500 ring-4 ring-sky-500/20 scale-[1.02]'
                      : 'border-transparent hover:border-gray-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        wp.isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {wp.name}
                    </span>
                    {isSelected && (
                      <span className="p-1 bg-sky-500 text-white rounded-full shadow-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 opacity-70">
                    {wp.isDark ? (
                      <Moon className="w-3 h-3 text-white" />
                    ) : (
                      <Sun className="w-3 h-3 text-gray-800" />
                    )}
                    <span className={`text-[10px] ${wp.isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {wp.id.includes('telegram') ? 'Telegram Style' : 'HD Wallpaper'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

