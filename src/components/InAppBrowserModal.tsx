import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Home,
  ExternalLink,
  X,
  Lock,
  Sparkles,
  Shield,
  ArrowRight,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InAppBrowserModalProps {
  initialUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InAppBrowserModal: React.FC<InAppBrowserModalProps> = ({
  initialUrl,
  isOpen,
  onClose,
}) => {
  const DEFAULT_SEARCH_HOME = 'https://www.google.com/search?igu=1';

  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialUrl && initialUrl.trim() !== '') {
        const formatted = formatSearchOrUrl(initialUrl);
        setCurrentUrl(formatted);
        setUrlInput(initialUrl);
        setHistory([formatted]);
        setHistoryIndex(0);
      } else {
        setCurrentUrl(DEFAULT_SEARCH_HOME);
        setUrlInput('https://google.com');
        setHistory([DEFAULT_SEARCH_HOME]);
        setHistoryIndex(0);
      }
    }
  }, [isOpen, initialUrl]);

  if (!isOpen) return null;

  const formatSearchOrUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return DEFAULT_SEARCH_HOME;

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // Check if it's a domain name (e.g. wikipedia.org, github.com)
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Otherwise treat as search query
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}&igu=1`;
  };

  const handleNavigate = (targetUrlString: string) => {
    const formatted = formatSearchOrUrl(targetUrlString);
    setIsLoading(true);
    setCurrentUrl(formatted);
    setUrlInput(targetUrlString);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(formatted);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setIframeKey((prev) => prev + 1);

    setTimeout(() => setIsLoading(false), 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(urlInput);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevUrl = history[prevIndex];
      setCurrentUrl(prevUrl);
      setUrlInput(prevUrl);
      setIframeKey((prev) => prev + 1);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextUrl = history[nextIndex];
      setCurrentUrl(nextUrl);
      setUrlInput(nextUrl);
      setIframeKey((prev) => prev + 1);
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleHome = () => {
    handleNavigate('https://google.com');
  };

  const handleOpenExternal = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
        {/* Top Navigation & Address Bar */}
        <div className="h-16 px-3 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between space-x-2 shrink-0 z-10 shadow-lg">
          {/* Navigation Buttons */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handleGoBack}
              disabled={historyIndex <= 0}
              className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleGoForward}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Forward"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleReload}
              className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              title="Refresh Page"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              onClick={handleHome}
              className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors hidden sm:block"
              title="Search Home"
            >
              <Home className="w-4 h-4 text-sky-400" />
            </button>
          </div>

          {/* Search / URL Address Bar */}
          <form onSubmit={handleFormSubmit} className="flex-1 max-w-2xl relative">
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Search Google or enter URL (e.g. wikipedia.org)..."
                className="w-full bg-slate-950/80 text-slate-100 text-xs sm:text-sm rounded-2xl pl-9 pr-20 py-2 border border-slate-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          {/* Top Right Action Tools */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handleOpenExternal}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors flex items-center space-x-1.5 text-xs font-semibold px-3 border border-slate-700/60"
              title="Open in External Browser"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">Open External</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 transition-colors"
              title="Close Browser"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser Quick Search Shortcuts Bar */}
        <div className="h-10 px-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0 text-xs text-slate-400">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider shrink-0 flex items-center space-x-1">
            <Compass className="w-3 h-3" />
            <span>Shortcuts:</span>
          </span>
          {[
            { label: 'Google', url: 'https://google.com' },
            { label: 'Wikipedia', url: 'https://wikipedia.org' },
            { label: 'DuckDuckGo', url: 'https://duckduckgo.com' },
            { label: 'GitHub', url: 'https://github.com' },
            { label: 'Tech News', url: 'https://news.ycombinator.com' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.url)}
              className="px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-sky-500/20 hover:text-sky-300 text-[11px] font-medium transition-colors shrink-0 border border-slate-700/50"
            >
              {item.label}
            </button>
          ))}
          <div className="ml-auto text-[10px] text-slate-500 font-mono hidden md:flex items-center space-x-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>LiquidChat In-App Browser Sandbox</span>
          </div>
        </div>

        {/* Main Browser Canvas / iFrame View */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
          {isLoading && (
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 animate-pulse z-20" />
          )}

          {currentUrl ? (
            <iframe
              key={iframeKey}
              src={currentUrl}
              title="In-App Web View"
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-xl">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">LiquidChat Inbuilt Search Engine</h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Search the web or view links securely without leaving LiquidChat. Type a query above or click any link in your conversations.
              </p>
            </div>
          )}

          {/* Bottom Security & X-Frame Warning Helper */}
          <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <div className="flex items-center space-x-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="truncate font-mono text-[10.5px]">
                URL: {currentUrl}
              </span>
            </div>
            <button
              onClick={handleOpenExternal}
              className="text-sky-400 hover:text-sky-300 font-bold hover:underline shrink-0 ml-2 flex items-center space-x-1"
            >
              <span>Site restricted in iframe? Open External</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
