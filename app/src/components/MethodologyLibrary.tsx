import { useState, useRef, useCallback, useMemo } from 'react';
import type { Methodology, AISettings, CanvasData, LayerData } from '../types';
import type { PromptStore } from '../hooks/usePrompts';
import { aiSearchMethodologies, aiCreateMethodology } from '../services/ai';
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
  Plus,
  Tag,
  Filter,
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
            {typeof m.matchScore === 'number' && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  m.matchScore >= 75
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : m.matchScore >= 55
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-700 text-slate-300 border-slate-500/30'
                }`}
              >
                匹配分 {m.matchScore}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600/50">
              {m.origin}
            </span>
            {m.category && m.category !== '未分类' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Tag size={10} className="inline mr-0.5 -mt-0.5" />
                {m.category}
              </span>
            )}
            {m.aiGenerated && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI 定制
              </span>
            )}
            {m.selected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                已选定
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">{m.coreIdea}</p>
          {m.fitReasons && m.fitReasons.length > 0 && (
            <p className="text-xs text-emerald-400/90 mt-1">适配：{m.fitReasons.slice(0, 2).join('；')}</p>
          )}
          {m.conflicts && m.conflicts.length > 0 && (
            <p className="text-xs text-amber-400/90 mt-1">冲突：{m.conflicts[0]}</p>
          )}
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
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<{ topScore: number; avgTop3: number; low: boolean } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Derive categories from methodologies
  const categories = useMemo(() => {
    const cats = new Set<string>();
    methodologies.forEach((m) => {
      if (m.category && m.category !== '未分类') cats.add(m.category);
    });
    return Array.from(cats).sort();
  }, [methodologies]);

  // Filtered list
  const filteredMethodologies = useMemo(() => {
    if (!activeCategory) return methodologies;
    return methodologies.filter((m) => m.category === activeCategory);
  }, [methodologies, activeCategory]);

  const handleSearch = useCallback(async () => {
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
      const existingNames = new Set(methodologies.map((m) => m.name));
      const newOnes = result.methodologies.filter((m) => !existingNames.has(m.name));
      onUpdateMethodologies([...methodologies, ...newOnes]);
      setSearchMeta({
        topScore: result.topScore ?? 0,
        avgTop3: result.avgTop3 ?? 0,
        low: !!result.isLowConfidence,
      });

      const newIds = new Set(newOnes.map((m) => m.id));
      setExpandedIds((prev) => new Set([...prev, ...newIds]));
    } else {
      setError(result.error || '搜索失败');
      setSearchMeta(null);
    }

    setSearching(false);
  }, [aiSettings, canvas, customQuery, methodologies, onUpdateMethodologies, promptStore]);

  const handleCreate = useCallback(async () => {
    if (!aiConfigured) return;
    setCreating(true);
    setError(null);

    abortRef.current = new AbortController();
    const result = await aiCreateMethodology(
      aiSettings,
      canvas,
      undefined,
      abortRef.current.signal,
      promptStore
    );

    if (result.success && result.methodologies) {
      const existingNames = new Set(methodologies.map((m) => m.name));
      const newOnes = result.methodologies.filter((m) => !existingNames.has(m.name));
      onUpdateMethodologies([...methodologies, ...newOnes]);

      const newIds = new Set(newOnes.map((m) => m.id));
      setExpandedIds((prev) => new Set([...prev, ...newIds]));
    } else {
      setError(result.error || '创建失败');
    }

    setCreating(false);
  }, [aiConfigured, aiSettings, canvas, methodologies, onUpdateMethodologies, promptStore]);

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
    const primary = selectedMethodologies[0];
    const data = methodologyToLayerData(primary, selectedMethodologies);
    onApplyToLayer(data);
    onGoToLayer(2);
  }, [selectedMethodologies, onApplyToLayer, onGoToLayer]);

  const hasUpperContext =
    canvas.layers[3] || canvas.layers[4] || canvas.layers[5] || canvas.layers[6];

  const isBusy = searching || creating;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Library size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">方法论匹配</h2>
            <p className="text-sm text-slate-400">
              检索优先推荐（含匹配分与冲突提示），低置信度时可一键 AI 定制
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

      {/* Search + Create section */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
          <Search size={14} />
          <span>AI 方法论搜索 / 创建</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isBusy && handleSearch()}
            placeholder={'可选：输入搜索条件，如"敏捷开发"、"建筑领域"、"小团队适用"...'}
            className="flex-1 bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={isBusy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              isBusy
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
          <button
            onClick={handleCreate}
            disabled={isBusy || !aiConfigured}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              isBusy || !aiConfigured
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title="AI 根据上层约束创建定制化方法论"
          >
            {creating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Plus size={14} />
                AI 创建
              </>
            )}
          </button>
        </div>

        {!aiConfigured && (
          <p className="text-xs text-slate-500">未配置 AI 时仍可“检索推荐”，但“AI 创建”不可用</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">操作失败：</span>
            {error}
          </div>
        </div>
      )}

      {searchMeta && (
        <div
          className={`px-4 py-3 rounded-xl border text-sm ${
            searchMeta.low
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="font-medium">
            {searchMeta.low ? '当前结果为低置信度推荐' : '已返回高可用候选'}
          </div>
          <div className="text-xs mt-1 opacity-90">
            Top1 匹配分 {searchMeta.topScore} · Top3 平均分 {searchMeta.avgTop3}
            {searchMeta.low ? ' · 建议放宽约束再搜，或使用 AI 定制' : ''}
          </div>
        </div>
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Filter size={12} />
            分类：
          </div>
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeCategory === null
                ? 'bg-violet-600/20 text-violet-400 border-violet-500/30'
                : 'bg-slate-800/40 text-slate-500 border-slate-700/50 hover:text-slate-300'
            }`}
          >
            全部 ({methodologies.length})
          </button>
          {categories.map((cat) => {
            const count = methodologies.filter((m) => m.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  activeCategory === cat
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-800/40 text-slate-500 border-slate-700/50 hover:text-slate-300'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {filteredMethodologies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">
              {activeCategory ? `${activeCategory}` : '全部'} · 共 {filteredMethodologies.length} 个方法论
              {selectedMethodologies.length > 0 && (
                <span className="ml-2 text-violet-400">
                  · 已选定 {selectedMethodologies.length} 个
                </span>
              )}
            </h3>
          </div>

          {filteredMethodologies.map((m) => (
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
      {methodologies.length === 0 && !isBusy && !error && (
        <div className="text-center py-12 text-slate-500">
          <Library size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">暂无可用方法论</p>
          <p className="text-sm mt-1">
            搜索真实方法论，或让 AI 为你创建定制方法论
          </p>
        </div>
      )}

      {/* Filtered empty */}
      {methodologies.length > 0 && filteredMethodologies.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Tag size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            「{activeCategory}」分类下暂无方法论
          </p>
          <button
            onClick={() => setActiveCategory(null)}
            className="mt-2 text-xs text-blue-400 underline cursor-pointer"
          >
            查看全部
          </button>
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
                    {m.category && m.category !== '未分类' && (
                      <span className="text-xs text-blue-400 ml-1.5">({m.category})</span>
                    )}
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
