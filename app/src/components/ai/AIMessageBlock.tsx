import { useCallback, useState } from 'react';
import { Brain, Send, Sparkles, Copy, CheckCheck } from 'lucide-react';

interface Props {
  role: 'system' | 'user' | 'assistant';
  content: string;
  label?: string;
}

export function AIMessageBlock({ role, content, label }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  const roleConfig = {
    system: {
      label: label || 'System Prompt',
      color: 'text-amber-400',
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      icon: <Brain size={12} />,
    },
    user: {
      label: label || 'User Prompt',
      color: 'text-blue-400',
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/20',
      icon: <Send size={12} />,
    },
    assistant: {
      label: label || 'AI Response',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      icon: <Sparkles size={12} />,
    },
  };

  const cfg = roleConfig[role];

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/30">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
          {cfg.icon}
          {cfg.label}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <CheckCheck size={12} className="text-emerald-400" />
              <span className="text-emerald-400">已复制</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              复制
            </>
          )}
        </button>
      </div>
      <pre className="px-3 py-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words max-h-80 overflow-y-auto font-mono">
        {content}
      </pre>
    </div>
  );
}
