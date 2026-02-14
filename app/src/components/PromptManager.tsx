import { useState, useCallback } from 'react';
import type { AISettings } from '../types';
import type { PromptStore } from '../hooks/usePrompts';
import { DEFAULT_PROMPTS } from '../hooks/usePrompts';
import { aiImprovePrompt } from '../services/ai';
import {
  Code2,
  Save,
  RotateCcw,
  Sparkles,
  Loader2,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Undo2,
  Wand2,
  Send,
  Copy,
  CheckCheck,
} from 'lucide-react';

interface Props {
  prompts: PromptStore;
  aiSettings: AISettings;
  aiConfigured: boolean;
  onUpdatePrompt: (id: string, content: string) => void;
  onResetPrompt: (id: string) => void;
  onResetAll: () => void;
}

const PROMPT_ORDER = ['system', 'intent', 'methodology', 'cascadeTop', 'cascadeDown'];

const PROMPT_ICONS: Record<string, string> = {
  system: '🏛️',
  intent: '🎯',
  methodology: '📚',
  cascadeTop: '⬆️',
  cascadeDown: '⬇️',
};

export function PromptManager({
  prompts,
  aiSettings,
  aiConfigured,
  onUpdatePrompt,
  onResetPrompt,
  onResetAll,
}: Props) {
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // AI improve state
  const [aiImproving, setAiImproving] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Diff state
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const openPrompt = useCallback(
    (id: string) => {
      if (activePromptId === id) {
        setActivePromptId(null);
        return;
      }
      setActivePromptId(id);
      setEditContent(prompts[id]?.content ?? '');
      setHasChanges(false);
      setShowAiPanel(false);
      setAiError(null);
      setSavedMessage(null);
    },
    [activePromptId, prompts]
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setEditContent(value);
      const original = prompts[activePromptId ?? '']?.content ?? '';
      setHasChanges(value !== original);
      setSavedMessage(null);
    },
    [prompts, activePromptId]
  );

  const handleSave = useCallback(() => {
    if (!activePromptId) return;
    onUpdatePrompt(activePromptId, editContent);
    setHasChanges(false);
    setSavedMessage('已保存');
    setTimeout(() => setSavedMessage(null), 2000);
  }, [activePromptId, editContent, onUpdatePrompt]);

  const handleReset = useCallback(() => {
    if (!activePromptId) return;
    onResetPrompt(activePromptId);
    setEditContent(DEFAULT_PROMPTS[activePromptId]?.content ?? '');
    setHasChanges(false);
    setSavedMessage('已恢复默认');
    setTimeout(() => setSavedMessage(null), 2000);
  }, [activePromptId, onResetPrompt]);

  const handleAiImprove = useCallback(async () => {
    if (!activePromptId || !aiConfigured) return;
    setAiImproving(true);
    setAiError(null);

    const promptName = prompts[activePromptId]?.name ?? activePromptId;
    const result = await aiImprovePrompt(
      aiSettings,
      promptName,
      editContent,
      aiInstruction.trim() || undefined
    );

    if (result.success && result.improved) {
      setEditContent(result.improved);
      setHasChanges(result.improved !== (prompts[activePromptId]?.content ?? ''));
      setSavedMessage(null);
    } else {
      setAiError(result.error || '优化失败');
    }
    setAiImproving(false);
  }, [activePromptId, aiConfigured, aiSettings, editContent, aiInstruction, prompts]);

  const isModified = useCallback(
    (id: string) => {
      return prompts[id]?.content !== DEFAULT_PROMPTS[id]?.content;
    },
    [prompts]
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm mb-4">
          <Code2 size={16} />
          高级设置
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">系统提示词</h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          查看和修改所有 AI 交互使用的提示词。修改后立即生效，也可以让 AI 帮你优化。
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
        <p className="text-xs text-cyan-200 leading-relaxed">
          <span className="font-medium">意图起点路由策略</span> 不在本页编辑。
          请点击右上角 <span className="font-medium">AI</span> 按钮，进入“AI 模型设置”后，在
          <span className="font-medium">「意图起点路由策略」</span>区块中调整阈值与预设（保守/平衡/激进）。
        </p>
      </div>

      {/* Global actions */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info size={12} />
          共 {PROMPT_ORDER.length} 个提示词
          {PROMPT_ORDER.some((id) => isModified(id)) && (
            <span className="text-amber-400">
              （{PROMPT_ORDER.filter((id) => isModified(id)).length} 个已修改）
            </span>
          )}
        </div>
        <button
          onClick={onResetAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 text-xs transition-colors cursor-pointer border border-slate-700/50"
        >
          <Undo2 size={12} />
          全部恢复默认
        </button>
      </div>

      {/* Prompt list */}
      <div className="space-y-3">
        {PROMPT_ORDER.map((id) => {
          const pt = prompts[id];
          if (!pt) return null;
          const isActive = activePromptId === id;
          const modified = isModified(id);

          return (
            <div
              key={id}
              className={`rounded-xl border transition-all ${
                isActive
                  ? 'border-cyan-500/40 bg-slate-800/40 ring-1 ring-cyan-500/10'
                  : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600/50'
              }`}
            >
              {/* Prompt header */}
              <button
                onClick={() => openPrompt(id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer"
              >
                <span className="text-xl">{PROMPT_ICONS[id] || '📝'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{pt.name}</h3>
                    {modified && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        已修改
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{pt.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-mono hidden sm:inline">
                    {pt.content.length} 字
                  </span>
                  {isActive ? (
                    <ChevronUp size={16} className="text-cyan-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-500" />
                  )}
                </div>
              </button>

              {/* Expanded editor */}
              {isActive && (
                <div className="px-5 pb-5 space-y-4 animate-fade-in-up">
                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>
                      使用于：<code className="text-slate-400">{pt.usedBy}</code>
                    </span>
                  </div>

                  {/* Textarea editor */}
                  <div className="relative">
                    <textarea
                      value={editContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      rows={Math.min(Math.max(editContent.split('\n').length + 2, 8), 24)}
                      className="w-full bg-slate-900/80 border border-slate-600/50 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono leading-relaxed resize-y focus:outline-none focus:border-cyan-500/50 transition-colors"
                      spellCheck={false}
                    />
                    <div className="absolute top-2 right-2">
                      <CopyButton text={editContent} />
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          hasChanges
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Save size={14} />
                        保存
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        恢复默认
                      </button>
                      {savedMessage && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <Check size={12} />
                          {savedMessage}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setShowAiPanel((v) => !v)}
                      disabled={!aiConfigured}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        showAiPanel
                          ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                          : aiConfigured
                          ? 'bg-violet-600 hover:bg-violet-500 text-white'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Wand2 size={14} />
                      AI 优化
                    </button>
                  </div>

                  {/* AI improve panel */}
                  {showAiPanel && (
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3 animate-fade-in-up">
                      <div className="flex items-center gap-2 text-sm text-violet-400 font-medium">
                        <Sparkles size={14} />
                        AI 提示词优化
                      </div>
                      <p className="text-xs text-slate-500">
                        可以直接点"优化"让 AI 自动改进，或输入具体修改要求。
                      </p>
                      <textarea
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        placeholder={'可选：输入你的修改要求，如：\n• 增加更严格的 JSON 格式约束\n• 让 AI 回答更简洁\n• 增加对某个领域的特殊处理\n留空则 AI 自动优化'}
                        rows={3}
                        className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAiImprove}
                          disabled={aiImproving || !aiConfigured}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                            aiImproving
                              ? 'bg-violet-600/30 text-violet-400'
                              : 'bg-violet-600 hover:bg-violet-500 text-white'
                          }`}
                        >
                          {aiImproving ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              AI 优化中...
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              {aiInstruction.trim() ? '按要求修改' : '自动优化'}
                            </>
                          )}
                        </button>
                        {!aiConfigured && (
                          <span className="text-xs text-amber-400 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            请先配置 AI API
                          </span>
                        )}
                      </div>
                      {aiError && (
                        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-1.5">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          {aiError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Character count and diff info */}
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {editContent.length} 字符 · {editContent.split('\n').length} 行
                    </span>
                    {modified && (
                      <span className="text-amber-500">
                        与默认版本不同（{Math.abs(editContent.length - (DEFAULT_PROMPTS[id]?.content.length ?? 0))} 字符差异）
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer tips */}
      <div className="mt-8 rounded-xl border border-slate-700/30 bg-slate-800/20 px-5 py-4">
        <h4 className="text-sm font-medium text-slate-300 mb-2">使用说明</h4>
        <ul className="text-xs text-slate-500 space-y-1.5">
          <li>• <strong className="text-slate-400">通用系统提示词</strong>：定义 AI 的角色和金字塔框架，在所有层级推导中使用</li>
          <li>• <strong className="text-slate-400">意图识别提示词</strong>：分析用户输入的自然语言描述，提取关键信息</li>
          <li>• <strong className="text-slate-400">方法论搜索提示词</strong>：搜索匹配上层约束的真实方法论</li>
          <li>• <strong className="text-slate-400">顶层/逐层推导指令</strong>：级联推导中每层使用的指令模板</li>
          <li>• 修改保存后<strong className="text-slate-400">立即生效</strong>，下次 AI 调用将使用修改后的提示词</li>
          <li>• 逐层推导指令中的 <code className="text-cyan-400 bg-slate-700 px-1 py-0.5 rounded">{'{layerId}'}</code> 会被自动替换为当前层级编号</li>
          <li>• 点击"恢复默认"可随时回到初始版本</li>
        </ul>
      </div>
    </div>
  );
}

// ========== Utility: Copy Button ==========

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer border border-slate-700/50"
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
  );
}
