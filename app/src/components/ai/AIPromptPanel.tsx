import { useState } from 'react';
import { ChevronDown, ChevronUp, Code2 } from 'lucide-react';
import { LAYERS } from '../../data/layers';
import { AIMessageBlock } from './AIMessageBlock';
import type { AIInteraction } from '../cascade/types';

interface Props {
  interactions: AIInteraction[];
}

export function AIPromptPanel({ interactions }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const getTypeLabel = (ia: AIInteraction) => {
    switch (ia.type) {
      case 'intent':
        return '意图识别';
      case 'cascade': {
        const layer = LAYERS.find((l) => l.id === ia.layerId);
        return layer ? `第 ${layer.id} 层：${layer.name}` : `第 ${ia.layerId} 层`;
      }
      case 'methodology-search':
        return '方法论搜索';
      default:
        return 'AI 交互';
    }
  };

  const getTypeColor = (ia: AIInteraction) => {
    switch (ia.type) {
      case 'intent':
        return { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' };
      case 'cascade':
        return { bg: 'bg-slate-800/50', border: 'border-slate-700/50', text: 'text-slate-300' };
      case 'methodology-search':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' };
      default:
        return { bg: 'bg-slate-800/50', border: 'border-slate-700/50', text: 'text-slate-400' };
    }
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-cyan-500/20 bg-cyan-500/5">
        <div className="flex items-center gap-2 text-cyan-400 font-medium">
          <Code2 size={16} />
          AI 交互提示词记录
        </div>
        <p className="text-xs text-slate-500 mt-1">
          共 {interactions.length} 次 AI 交互，点击展开查看完整提示词和返回结果
        </p>
      </div>
      <div className="divide-y divide-slate-800/80">
        {interactions.map((ia, idx) => {
          const isOpen = expandedIdx === idx;
          const color = getTypeColor(ia);
          const time = new Date(ia.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          return (
            <div key={idx}>
              <button
                onClick={() => setExpandedIdx(isOpen ? null : idx)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                <span className="text-xs text-slate-600 font-mono w-16 shrink-0">{time}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text} border ${color.border} shrink-0`}
                >
                  {getTypeLabel(ia)}
                </span>
                <span className="text-xs text-slate-500 flex-1 truncate">
                  {ia.messages.length > 0 && ia.messages[ia.messages.length - 1].content.slice(0, 80)}...
                </span>
                <span className="text-xs text-slate-600">{ia.messages.length} 条消息</span>
                {isOpen ? (
                  <ChevronUp size={14} className="text-slate-500 shrink-0" />
                ) : (
                  <ChevronDown size={14} className="text-slate-500 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-4 animate-fade-in-up">
                  {ia.messages.map((msg, mi) => (
                    <AIMessageBlock key={mi} role={msg.role} content={msg.content} />
                  ))}
                  <AIMessageBlock role="assistant" content={ia.response} label="AI 返回" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
