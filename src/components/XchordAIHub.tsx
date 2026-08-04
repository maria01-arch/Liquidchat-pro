import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { Bot, Sparkles, Send, ShieldCheck, ListTodo, MessageSquare, Lightbulb, RefreshCw, Copy, Check } from 'lucide-react';
import { User } from '../types';

interface XchordAIHubProps {
  onAskAI: (prompt: string, mode?: string) => Promise<string>;
  currentUser: User;
  unreadNotifCount?: number;
  onOpenNotifications?: () => void;
  onOpenUserProfile?: () => void;
  theme?: 'dark' | 'light' | 'emerald';
  setTheme?: (t: 'dark' | 'light' | 'emerald') => void;
  onBackToChats?: () => void;
}

export const XchordAIHub: React.FC<XchordAIHubProps> = ({
  onAskAI,
  currentUser,
  unreadNotifCount = 0,
  onOpenNotifications,
  onOpenUserProfile,
  theme = 'dark',
  setTheme,
  onBackToChats,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(
    `Hello! I am **xchord AI**, the official intelligent assistant for liquidchat crafted by **xchordlabs corp**.\n\nI can assist you with:\n• Generating tasks & action items from encrypted chats\n• Providing security & passkey advice\n• Summarizing long group conversations\n• Drafting smart replies & advice`
  );
  const [copied, setCopied] = useState(false);

  const handleSend = async (customPrompt?: string, mode?: string) => {
    const textToSubmit = customPrompt || prompt;
    if (!textToSubmit.trim() || loading) return;

    setLoading(true);
    try {
      const result = await onAskAI(textToSubmit, mode);
      setResponse(result);
      if (!customPrompt) setPrompt('');
    } catch {
      setResponse('Failed to communicate with xchord AI backend service.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      <PageHeader
        title="xchord AI Assistant"
        subtitle="Intelligent E2EE security analysis, smart responses & task execution"
        icon={Bot}
        badge="Gemini AI"
        currentUser={currentUser}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifications={onOpenNotifications}
        onOpenUserProfile={onOpenUserProfile}
        theme={theme}
        setTheme={setTheme}
        onBackToChats={onBackToChats}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950/50 border border-indigo-500/20 rounded-3xl p-6 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Bot className="w-7 h-7 text-indigo-400 animate-bounce" />
            <h1 className="text-xl font-bold text-slate-100">xchord AI • Workspace Assistant</h1>
          </div>
          <p className="text-xs text-slate-400">
            Powered by xchordlabs corp. Intelligent advice, task automation, and security analysis.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
          Gemini 3.6 Flash
        </span>
      </div>

      {/* Preset Capability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <ListTodo className="w-5 h-5 text-emerald-400" />,
            title: 'Task & Todo Generator',
            desc: 'Extract action items and todo items from recent messages.',
            prompt: 'Extract 5 clear action items and tasks for a software team building an encrypted app.',
            mode: 'task',
          },
          {
            icon: <ShieldCheck className="w-5 h-5 text-teal-400" />,
            title: 'Passkey & E2EE Audit',
            desc: 'Audit your security posture & passkey phrase storage.',
            prompt: 'Provide a 4-step checklist for managing a 12-word recovery passkey securely.',
            mode: 'security_advice',
          },
          {
            icon: <MessageSquare className="w-5 h-5 text-indigo-400" />,
            title: 'Group Chat Summarizer',
            desc: 'Summarize chat highlights and key decisions.',
            prompt: 'Summarize key points about liquidchat architecture, self-destruct timers, and Liquid Vault storage.',
            mode: 'summarize',
          },
          {
            icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
            title: 'Smart Reply Assistant',
            desc: 'Draft friendly or professional responses.',
            prompt: 'Suggest 3 professional replies confirming receipt of encrypted project documentation.',
            mode: 'smart_reply',
          },
        ].map((card, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(card.prompt, card.mode)}
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/30 rounded-3xl text-left transition-all space-y-2 group"
          >
            <div className="p-2 rounded-2xl bg-slate-950 w-fit border border-slate-800 group-hover:scale-110 transition-transform">
              {card.icon}
            </div>
            <h3 className="font-bold text-xs text-slate-100">{card.title}</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Response Display Area */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-lg relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>xchord AI Response Output</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto text-xs text-slate-200 leading-relaxed space-y-2 font-sans whitespace-pre-wrap">
          {loading ? (
            <div className="flex items-center justify-center h-full space-x-2 text-indigo-400 py-12">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="font-semibold">xchord AI is thinking...</span>
            </div>
          ) : (
            response
          )}
        </div>

        {/* Prompt Input */}
        <div className="pt-4 border-t border-slate-800 flex items-center space-x-2 mt-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask xchord AI anything about tasks, advice, or code..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!prompt.trim() || loading}
            className={`p-2.5 rounded-2xl font-bold transition-all ${
              prompt.trim() && !loading
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
