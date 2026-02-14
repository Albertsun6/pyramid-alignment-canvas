import { useState, useRef, useCallback } from 'react';
import type { Methodology, AISettings, CanvasData, LayerData } from '../types';
import type { PromptStore } from '../hooks/usePrompts';
import { aiSearchMethodologies } from '../services/ai';
import {
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowRight,
  Sparkles,
  Library,
  Star,
  StarOff,
  RefreshCw,
} from 'lucide-react';

interface Props {
  canvas: CanvasData;
  aiSettings: AISettings;
  aiConfigured: boolean;
  methodologies: Methodology[];
  onUpdateMethodologies: (list: Methodology[]) => void;
  onApplyToLayer: (data: LayerData) => void;
  onGoToLayer: (layerId: number) => void;
  promptStore?: PromptStore;
}

/**
 * Format methodology into layer 2 fields
 */
function methodologyToLayerData(m: Methodology, allSelected: Methodology[]): LayerData {
  // Build alternatives text from all methodologies in library
  const altLines = allSelected.length > 1
    ? allSelected.map((s, i) => `${String.fromCharCode(65 + i)}: ${s.name} — ${s.coreIdea}`).join('\n')
    : `A: ${m.name} — ${m.coreIdea}\nB: （待补充其他方案）`;

  return {
    alternatives: altLines,
    reason: `选用「${m.name}」\n\n核心思想：${m.coreIdea}\n\n选型理由：${m.applicability}\n\n优势：${m.pros}\n\n局限：${m.cons}`,
    metrics: `基于「${m.name}」框架的关键步骤：\n${m.steps}`,
    evidence: m.sources,
  };
}

function MethodologyCard({
  m,
  onSelect,
  onRemove,
  expanded,
  onToggleExpand,
}: {
  m: Methodology;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border transition-all ${
        m.selected
          ? 'border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/20'
          : 'border-slate-700/50 bg-slate-800/30'
      }`}
    >
      {/* Card header */}
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Select star */}
        <button
          onClick={() => onSelect(m.id)}
          className={`mt-0.5 shrink-0 cursor-pointer transition-colors ${
            m.selected
              ? 'text-violet-400 hover:text-violet-300'
              : 'text-slate-600 hover:text-slate-400'
          }`}
          title={m.selected ? '取消选定' : '选定此方法论'}
        >
          {m.selected ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-white text-sm">{m.name}</h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600/50">
              {m.origin}
            </span>
            {m.selected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                已选定
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">{m.coreIdea}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleExpand(m.id)}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title={expanded ? '收起' : '展开详情'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onRemove(m.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
            title="移除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700/30 ml-9 space-y-3">
          <DetailBlock label="详细描述" text={m.description} />
          <DetailBlock label="适用场景" text={m.applicability} />
          <DetailBlock label="关键步骤" text={m.steps} />
          <div className="grid grid-cols-2 gap-3">
            <DetailBlock label="优势" text={m.pros} color="emerald" />
            <DetailBlock label="局限" text={m.cons} color="amber" />
          </div>
          <DetailBlock label="参考来源" text={m.sources} color="blue" />
        </div>
      )}
    </div>
  );
}

function DetailBlock({
  label,
  text,
  color = 'slate',
}: {
  label: string;
  text: string;
  color?: string;
}) {
  if (!text) return null;
  const colorMap: Record<string, string> = {
    slate: 'text-slate-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500',
  };
  return (
    <div>
      <div className={`text-xs font-medium mb-1 ${colorMap[color] || colorMap.slate}`}>
        {label}
      </div>
      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
        {text}
      </div>
    </div>
  );
}

export function MethodologyLibrary({
  canvas,
  aiSettings,
  aiConfigured,
  methodologies,
  onUpdateMethodologies,
  onApplyToLayer,
  onGoToLayer,
  promptStore,
}: Props) {
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async () => {
    if (!aiConfigured) return;
    setSearching(true);
    setError(null);

    abortRef.current = new AbortController();
    const result = await aiSearchMethodologies(
      aiSettings,
      canvas,
      customQuery.trim() || undefined,
      abortRef.current.signal,
      undefined,
      promptStore
    );

    if (result.success && result.methodologies) {
      // Append new results (avoid duplicates by name)
      const existingNames = new Set(methodologies.map((m) => m.name));
      const newOnes = result.methodologies.filter((m) => !existingNames.has(m.name));
      onUpdateMethodologies([...methodologies, ...newOnes]);

      // Auto-expand new ones
      const newIds = new Set(newOnes.map((m) => m.id));
      setExpandedIds((prev) => new Set([...prev, ...newIds]));
    } else {
      setError(result.error || '搜索失败');
    }

    setSearching(false);
  }, [aiConfigured, aiSettings, canvas, customQuery, methodologies, onUpdateMethodologies]);

  const handleSelect = useCallback(
    (id: string) => {
      onUpdateMethodologies(
        methodologies.map((m) =>
          m.id === id ? { ...m, selected: !m.selected } : m
        )
      );
    },
    [methodologies, onUpdateMethodologies]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onUpdateMethodologies(methodologies.filter((m) => m.id !== id));
    },
    [methodologies, onUpdateMethodologies]
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedMethodologies = methodologies.filter((m) => m.selected);

  const handleApply = useCallback(() => {
    if (selectedMethodologies.length === 0) return;
    // Apply the first selected one as primary, include all selected as alternatives
    const primary = selectedMethodologies[0];
    const data = methodologyToLayerData(primary, selectedMethodologies);
    onApplyToLayer(data);
    onGoToLayer(2);
  }, [selectedMethodologies, onApplyToLayer, onGoToLayer]);

  // Check if upper layers have content
  const hasUpperContext =
    canvas.layers[3] || canvas.layers[4] || canvas.layers[5] || canvas.layers[6];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Library size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">方法论库</h2>
            <p className="text-sm text-slate-400">
              基于上层约束搜索真实方法论，选定后应用到第 2 层
            </p>
          </div>
        </div>
        {selectedMethodologies.length > 0 && (
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            应用到方法论层
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Upper context check */}
      {!hasUpperContext && (
        <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">提示：</span>建议先填写上层（元方法论 / 范式 / 世界观 / 终极承诺），
            AI 才能准确匹配适合你的方法论。
            <button
              onClick={() => onGoToLayer(6)}
              className="ml-2 underline hover:text-amber-300 cursor-pointer"
            >
              去填写上层 →
            </button>
          </div>
        </div>
      )}

      {/* Search section */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
          <Search size={14} />
          <span>AI 方法论搜索</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !searching && handleSearch()}
            placeholder={'可选：输入额外搜索条件，如"敏捷开发"、"建筑领域"、"小团队适用"...'}
            className="flex-1 bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !aiConfigured}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              searching || !aiConfigured
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {searching ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                搜索中...
              </>
            ) : methodologies.length > 0 ? (
              <>
                <RefreshCw size={14} />
                继续搜索
              </>
            ) : (
              <>
                <Sparkles size={14} />
                搜索方法论
              </>
            )}
          </button>
        </div>

        {!aiConfigured && (
          <p className="text-xs text-slate-500">请先在右上角设置 AI API 密钥</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">搜索失败：</span>
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {methodologies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">
              共 {methodologies.length} 个方法论
              {selectedMethodologies.length > 0 && (
                <span className="ml-2 text-violet-400">
                  · 已选定 {selectedMethodologies.length} 个
                </span>
              )}
            </h3>
          </div>

          {methodologies.map((m) => (
            <MethodologyCard
              key={m.id}
              m={m}
              onSelect={handleSelect}
              onRemove={handleRemove}
              expanded={expandedIds.has(m.id)}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {methodologies.length === 0 && !searching && !error && (
        <div className="text-center py-12 text-slate-500">
          <Library size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">方法论库为空</p>
          <p className="text-sm mt-1">
            点击上方"搜索方法论"，AI 将根据你的上层约束推荐真实方法论
          </p>
        </div>
      )}

      {/* Apply instruction */}
      {selectedMethodologies.length > 0 && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-violet-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-violet-300 mb-1">
                已选定 {selectedMethodologies.length} 个方法论
              </div>
              <div className="text-sm text-slate-400 space-y-1">
                {selectedMethodologies.map((m, i) => (
                  <div key={m.id}>
                    {i === 0 ? '主方案：' : '备选：'}
                    <span className="text-slate-300">{m.name}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleApply}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                应用到方法论层（第 2 层）
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
