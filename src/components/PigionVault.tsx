import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { Avatar } from './Avatar';
import {
  HardDrive,
  Upload,
  Search,
  Star,
  Trash2,
  Share2,
  Download,
  FileText,
  Image as ImageIcon,
  Music,
  Code,
  FolderArchive,
  Check,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { CloudFile, FileCategory, Chat, User } from '../types';

interface PigionVaultProps {
  files: CloudFile[];
  onUploadFile: (file: Partial<CloudFile>) => void;
  onDeleteFile: (fileId: string) => void;
  onToggleFavorite: (fileId: string) => void;
  chats: Chat[];
  onShareToChat: (file: CloudFile, chatId: string) => void;
  currentUser: User;
  unreadNotifCount?: number;
  onOpenNotifications?: () => void;
  onOpenUserProfile?: () => void;
  theme?: 'dark' | 'light' | 'emerald';
  setTheme?: (t: 'dark' | 'light' | 'emerald') => void;
  onBackToChats?: () => void;
}

export const PigionVault: React.FC<PigionVaultProps> = ({
  files,
  onUploadFile,
  onDeleteFile,
  onToggleFavorite,
  chats,
  onShareToChat,
  currentUser,
  unreadNotifCount = 0,
  onOpenNotifications,
  onOpenUserProfile,
  theme = 'dark',
  setTheme,
  onBackToChats,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all' | 'favorite'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareFileModal, setShareFileModal] = useState<CloudFile | null>(null);

  // Storage calculation
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
  const percentUsed = Math.min(Math.round((totalBytes / (15 * 1024 * 1024 * 1024)) * 100), 100);

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategory === 'favorite') return file.isFavorite;
    if (selectedCategory !== 'all') return file.category === selectedCategory;
    return true;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;

      let category: FileCategory = 'document';
      if (uploaded.type.startsWith('image/')) category = 'image';
      else if (uploaded.type.startsWith('audio/')) category = 'audio';
      else if (uploaded.name.endsWith('.zip') || uploaded.name.endsWith('.tar')) category = 'archive';
      else if (uploaded.name.endsWith('.json') || uploaded.name.endsWith('.ts') || uploaded.name.endsWith('.js')) category = 'code';

      onUploadFile({
        name: uploaded.name,
        size: uploaded.size,
        sizeFormatted: `${(uploaded.size / (1024 * 1024)).toFixed(1)} MB`,
        mimeType: uploaded.type,
        url: base64,
        category,
      });
    };
    reader.readAsDataURL(uploaded);
  };

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-purple-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-cyan-400" />;
      case 'archive':
        return <FolderArchive className="w-5 h-5 text-amber-400" />;
      default:
        return <FileText className="w-5 h-5 text-teal-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <PageHeader
        title="Pigion Vault"
        subtitle="Zero-knowledge encrypted cloud drive & file storage"
        icon={HardDrive}
        badge="Drive E2EE"
        currentUser={currentUser}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifications={onOpenNotifications}
        onOpenUserProfile={onOpenUserProfile}
        theme={theme}
        setTheme={setTheme}
        onBackToChats={onBackToChats}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 space-y-6">
        {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Pigion Vault • Storage Drive</h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Integrated E2EE cloud file storage for all Pigion users. Store, sync, and share files securely.
            </p>
          </div>

          {/* Upload Button */}
          <label className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer transition-all self-start md:self-auto">
            <Upload className="w-4 h-4" />
            <span>Upload to Vault</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Quota Progress Bar */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between text-xs text-gray-600 dark:text-slate-300 font-medium">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Storage Usage</span>
            </span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
              {totalMB} MB ({totalGB} GB) of 15.0 GB used ({percentUsed}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-slate-800">
            <div
              style={{ width: `${Math.max(percentUsed, 3)}%` }}
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
          {[
            { key: 'all', label: 'All Files' },
            { key: 'favorite', label: 'Favorites' },
            { key: 'image', label: 'Images' },
            { key: 'document', label: 'Documents' },
            { key: 'audio', label: 'Audio' },
            { key: 'code', label: 'Code & Data' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search files in vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800">
            No files found matching your selected category or query.
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-blue-500/50 rounded-3xl p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-xs group"
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800">
                  {getCategoryIcon(file.category)}
                </div>
                <button
                  onClick={() => onToggleFavorite(file.id)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    file.isFavorite ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-gray-600'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate mb-0.5">{file.name}</h3>
                <p className="text-[11px] text-gray-400 dark:text-slate-400 font-mono">
                  {file.sizeFormatted} • {file.uploadedAt}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-300 transition-colors"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setShareFileModal(file)}
                    className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors"
                    title="Share to Chat or Group"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onDeleteFile(file.id)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Share File to Chat Modal */}
      {shareFileModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-gray-900 dark:text-slate-100 flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              <span>Share "{shareFileModal.name}" to Chat</span>
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    onShareToChat(shareFileModal, chat.id);
                    setShareFileModal(null);
                  }}
                  className="p-3 bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 rounded-2xl flex items-center justify-between cursor-pointer border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar src={chat.avatar} alt={chat.name} className="w-8 h-8 rounded-xl object-cover" />
                    <span className="font-bold text-xs text-gray-800 dark:text-slate-200">{chat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 px-2.5 py-1 rounded-xl bg-blue-50">
                    Send
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShareFileModal(null)}
              className="w-full py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
