import { useState } from 'react';
import { Code2, Eye, EyeOff } from 'lucide-react';
import { AIMessageBlock } from './AIMessageBlock';
import type { AIInteraction } from '../cascade/types';

interface Props {
  interaction: AIInteraction;
}

export function InlineAIPromptViewer({ interaction }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-cyan-500/10 transition-colors"
      >
        <div className="flex items-center gap-2 text-cyan-400">
          <Code2 size={14} />
          <span className="font-medium">
            {interaction.type === 'methodology-search'
              ? '方法论搜索提示词'
              : `第 ${interaction.layerId ?? '?'} 层推导提示词`}
          </span>
          <span className="text-xs text-cyan-600">{interaction.messages.length} 条消息</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-600">
          {expanded ? <EyeOff size={14} /> : <Eye size={14} />}
          <span className="text-xs">{expanded ? '收起' : '展开'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-cyan-500/20 p-4 space-y-4">
          {interaction.messages.map((msg, i) => (
            <AIMessageBlock key={i} role={msg.role} content={msg.content} />
          ))}
          <AIMessageBlock role="assistant" content={interaction.response} label="AI 返回" />
        </div>
      )}
    </div>
  );
}
