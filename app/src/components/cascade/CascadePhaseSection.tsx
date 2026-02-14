import { LAYERS } from '../../data/layers';
import { LayerCard } from '../LayerCard';
import type { IntentAnalysis } from '../../services/ai';
import type { CanvasData, LayerData, Methodology } from '../../types';
import type { AIInteraction, MethodologyMeta, Phase, StepState } from './types';
import {
  AlertTriangle,
  ArrowDown,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Library,
  Loader2,
  Pencil,
  RotateCcw,
  Sparkles,
  Star,
  StarOff,
} from 'lucide-react';
import { InlineAIPromptViewer } from '../ai/InlineAIPromptViewer';

interface Props {
  phase: Phase;
  intentAnalysis: IntentAnalysis | null;
  intentInput: string;
  setIntentInput: (value: string) => void;
  editingIntentInCascade: boolean;
  setEditingIntentInCascade: (value: boolean) => void;
  reAnalyzingIntent: boolean;
  aiConfigured: boolean;
  steps: StepState[];
  activeIdx: number;
  isAllDone: boolean;
  canvas: CanvasData;
  interactions: AIInteraction[];
  searchedMethodologies: Methodology[];
  methodologySearchMeta: MethodologyMeta | null;
  methodologyExpanded: Set<string>;
  getStepLabel: (idx: number, layerId: number) => string;
  onReAnalyzeDuringCascade: () => void;
  onConfirm: (stepIdx: number) => void;
  onSkip: (stepIdx: number) => void;
  onRetry: (stepIdx: number) => void;
  onManualGenerate: (stepIdx: number) => void;
  onResetMethodologySearch: () => void;
  onSelectMethodology: (id: string) => void;
  onApplyMethodology: (m: Methodology, autoConfirm?: boolean) => void;
  onToggleMethodologyExpand: (id: string) => void;
  onReopenConfirmedStep: (idx: number) => void;
  onMarkMethodologyReview: (idx: number) => void;
  onUpdateLayer: (layerId: number, data: LayerData) => void;
  onExit: () => void;
  onOpenPromptPanel: () => void;
  interactionCount: number;
}

function hasLayerContent(data?: LayerData): boolean {
  if (!data) return false;
  return Object.values(data).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    return false;
  });
}

export function CascadePhaseSection({
  phase,
  intentAnalysis,
  intentInput,
  setIntentInput,
  editingIntentInCascade,
  setEditingIntentInCascade,
  reAnalyzingIntent,
  aiConfigured,
  steps,
  activeIdx,
  isAllDone,
  canvas,
  interactions,
  searchedMethodologies,
  methodologySearchMeta,
  methodologyExpanded,
  getStepLabel,
  onReAnalyzeDuringCascade,
  onConfirm,
  onSkip,
  onRetry,
  onManualGenerate,
  onResetMethodologySearch,
  onSelectMethodology,
  onApplyMethodology,
  onToggleMethodologyExpand,
  onReopenConfirmedStep,
  onMarkMethodologyReview,
  onUpdateLayer,
  onExit,
  onOpenPromptPanel,
  interactionCount,
}: Props) {
  if (phase !== 'cascading') return null;

  return (
    <div className="space-y-0 animate-fade-in-up">
      {intentAnalysis && (
        <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          {!editingIntentInCascade ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Brain size={14} className="text-violet-400 shrink-0" />
                <span className="text-violet-300 font-medium shrink-0">意图：</span>
                <span className="text-slate-300 truncate">{intentAnalysis.goal}</span>
                <span className="text-slate-600 mx-1 shrink-0">·</span>
                <span className="text-slate-500 truncate">{intentAnalysis.domain}</span>
              </div>
              <button
                onClick={() => setEditingIntentInCascade(true)}
                className="self-start sm:self-auto text-xs px-2.5 py-1 rounded-lg border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Pencil size={11} />
                编辑意图
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                rows={3}
                className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                placeholder="修改意图后重新分析，后续推导将使用新的意图上下文"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onReAnalyzeDuringCascade}
                  disabled={!intentInput.trim() || !aiConfigured || reAnalyzingIntent}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    !intentInput.trim() || !aiConfigured || reAnalyzingIntent
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {reAnalyzingIntent ? '重新分析中...' : '保存并重新分析'}
                </button>
                <button
                  onClick={() => setEditingIntentInCascade(false)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-300 border border-slate-700/60 hover:border-slate-600 transition-colors cursor-pointer"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto pb-1 mb-8">
        <div className="flex items-center justify-start sm:justify-center gap-1 min-w-max">
          {steps.map((step, idx) => {
            const layer = LAYERS.find((l) => l.id === step.layerId)!;
            const isGenerating = step.status === 'generating' || step.status === 'methodology-searching';
            const isStepActive = step.status === 'review' || isGenerating;
            return (
              <div key={step.layerId} className="flex items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    step.status === 'confirmed'
                      ? 'text-white'
                      : isStepActive
                      ? 'text-white animate-pulse-glow'
                      : step.status === 'error'
                      ? 'text-white opacity-70'
                      : 'text-slate-500 opacity-40'
                  }`}
                  style={{
                    background:
                      step.status === 'confirmed' || isStepActive
                        ? layer.color
                        : step.status === 'error'
                        ? '#ef4444'
                        : 'rgba(71, 85, 105, 0.3)',
                  }}
                  title={`${layer.name} - ${step.status}`}
                >
                  {step.status === 'confirmed' ? (
                    <Check size={14} />
                  ) : isGenerating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < steps.length - 1 && <ArrowDown size={12} className="text-slate-600 rotate-[-90deg]" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const layer = LAYERS.find((l) => l.id === step.layerId)!;
          const isActive = idx === activeIdx;
          const isPast = step.status === 'confirmed';
          const isFuture = !isActive && !isPast && step.status === 'pending';
          const isMethodologyLayer = step.layerId === 2;
          const hasMethodologyData = isMethodologyLayer && hasLayerContent(canvas.layers[2]);
          const isSearching = step.status === 'methodology-searching';

          const stepInteraction = interactions.find(
            (ia) =>
              ia.layerId === step.layerId &&
              (ia.type === 'cascade' || ia.type === 'methodology-search')
          );

          return (
            <div key={step.layerId}>
              {idx > 0 && (
                <div className="flex justify-center py-1">
                  <ChevronDown size={20} className={isPast ? 'text-slate-500' : 'text-slate-700'} />
                </div>
              )}

              {isPast && (
                <div
                  className="rounded-xl p-4 border cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: layer.bgColor, borderColor: layer.borderColor, opacity: 0.7 }}
                  onClick={() => onReopenConfirmedStep(idx)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: layer.color }}
                    >
                      <Check size={14} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">{getStepLabel(idx, layer.id)} {layer.name}</span>
                      <span className="text-xs text-slate-500 ml-2">已确认 (点击可重新编辑)</span>
                    </div>
                    {stepInteraction && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                        <Code2 size={10} className="inline mr-1" />
                        有提示词
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!isPast && !isFuture && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{getStepLabel(idx, layer.id)}：{layer.name}</span>
                      {step.status === 'generating' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" />
                          AI 基于上层结果推导中...
                        </span>
                      )}
                      {isSearching && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" />
                          搜索方法论中...
                        </span>
                      )}
                      {step.status === 'review' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          请审阅并确认
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {step.status === 'pending' && isMethodologyLayer && searchedMethodologies.length > 0 && (
                        <button
                          onClick={() => onManualGenerate(idx)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
                        >
                          <Sparkles size={13} />
                          跳过选择，AI 直接填写
                        </button>
                      )}
                      {step.status === 'pending' && isMethodologyLayer && hasMethodologyData && (
                        <button
                          onClick={() => onMarkMethodologyReview(idx)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-sm transition-colors cursor-pointer border border-violet-500/30"
                        >
                          <Check size={13} />
                          使用当前方法论，进入确认
                        </button>
                      )}
                      {step.status === 'pending' && (
                        <button
                          onClick={() => onSkip(idx)}
                          className="w-full sm:w-auto px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm transition-colors cursor-pointer"
                        >
                          跳过此层
                        </button>
                      )}
                      {step.status === 'review' && (
                        <>
                          <button
                            onClick={() => (isMethodologyLayer ? onResetMethodologySearch() : onManualGenerate(idx))}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
                          >
                            <RotateCcw size={13} />
                            重新生成
                          </button>
                          <button
                            onClick={() => onConfirm(idx)}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors cursor-pointer"
                          >
                            <Check size={14} />
                            确认，继续下一层
                          </button>
                        </>
                      )}
                      {step.status === 'error' && (
                        <>
                          <button
                            onClick={() => onRetry(idx)}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
                          >
                            <RotateCcw size={13} />
                            重试
                          </button>
                          <button
                            onClick={() => onSkip(idx)}
                            className="w-full sm:w-auto px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm transition-colors cursor-pointer"
                          >
                            跳过
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {step.status === 'error' && step.error && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      {step.error}
                    </div>
                  )}

                  {isMethodologyLayer && step.status === 'pending' && searchedMethodologies.length > 0 && (
                    <MethodologySearchPanel
                      methodologies={searchedMethodologies}
                      meta={methodologySearchMeta}
                      expanded={methodologyExpanded}
                      onToggleExpand={onToggleMethodologyExpand}
                      onSelect={onSelectMethodology}
                      onApply={onApplyMethodology}
                      onApplyAndConfirm={(m) => onApplyMethodology(m, true)}
                    />
                  )}

                  {isSearching && (
                    <div className="flex flex-col items-center py-10 text-slate-400 text-sm">
                      <Loader2 size={28} className="animate-spin text-violet-400 mb-3" />
                      <p className="font-medium">正在搜索匹配上层约束的真实方法论...</p>
                      <p className="text-xs text-slate-600 mt-1">搜索结果将自动保存到方法论匹配列表</p>
                    </div>
                  )}

                  {step.status === 'generating' && (
                    <div className="rounded-xl border p-5 flex flex-col items-center py-10" style={{ background: layer.bgColor, borderColor: layer.borderColor }}>
                      <Loader2 size={28} className="animate-spin mb-3" style={{ color: layer.color }} />
                      <p className="text-sm text-slate-300 font-medium">
                        AI 正在基于上层已确认的内容推导 {getStepLabel(idx, layer.id)}...
                      </p>
                      <p className="text-xs text-slate-500 mt-1">使用意图上下文 + 上层约束进行推导</p>
                    </div>
                  )}

                  {step.status === 'review' && (
                    <>
                      <LayerCard
                        layer={layer}
                        data={canvas.layers[step.layerId] || {}}
                        onChange={(d) => onUpdateLayer(step.layerId, d)}
                      />
                      {stepInteraction && <InlineAIPromptViewer interaction={stepInteraction} />}
                    </>
                  )}
                </div>
              )}

              {isFuture && (
                <div className="rounded-xl p-4 border opacity-30" style={{ background: layer.bgColor, borderColor: layer.borderColor }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500"
                      style={{ background: 'rgba(71, 85, 105, 0.3)' }}
                    >
                      {layer.id}
                    </div>
                    <span className="text-sm text-slate-500">
                      {getStepLabel(idx, layer.id)} {layer.name} — 等待上层确认后自动推导
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAllDone && (
        <div className="mt-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-lg font-medium mb-4">
            <Check size={20} />
            全部层级已完成！
          </div>
          <p className="text-slate-400 text-sm mb-4">
            你已经从意图出发，经过终极承诺推导到了具体方法。可以导出画布或切换到画布总览继续调整。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenPromptPanel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Code2 size={14} />
              查看全部 {interactionCount} 条提示词
            </button>
            <button
              onClick={onExit}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              返回画布总览
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MethodologySearchPanel({
  methodologies,
  meta,
  expanded,
  onToggleExpand,
  onSelect,
  onApply,
  onApplyAndConfirm,
}: {
  methodologies: Methodology[];
  meta: MethodologyMeta | null;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onApply: (m: Methodology) => void;
  onApplyAndConfirm: (m: Methodology) => void;
}) {
  const selected = methodologies.filter((m) => m.selected);
  return (
    <div className="space-y-3 mb-4">
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Library size={16} className="text-violet-400" />
          <span className="text-violet-300 font-medium">
            {methodologies.some((m) => m.aiGenerated)
              ? `AI 创建了 ${methodologies.length} 个定制方法论（已加入方法论匹配）`
              : `找到 ${methodologies.length} 个匹配的方法论（已加入方法论匹配）`}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 ml-6">点击星标选定主方案，然后应用到方法论层</p>
        {meta && (
          <p className={`text-xs mt-2 ml-6 ${meta.low ? 'text-amber-300' : 'text-emerald-300'}`}>
            {meta.low ? '低置信度推荐' : '高可用候选'} · Top1 {meta.topScore ?? '-'} · Top3均值 {meta.avgTop3 ?? '-'}
          </p>
        )}
      </div>

      {methodologies.map((m) => (
        <div
          key={m.id}
          className={`rounded-xl border transition-all ${
            m.selected
              ? 'border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/20'
              : 'border-slate-700/50 bg-slate-800/30'
          }`}
        >
          <div className="px-4 py-3 flex items-start gap-3">
            <button
              onClick={() => onSelect(m.id)}
              className={`mt-0.5 shrink-0 cursor-pointer transition-colors ${
                m.selected ? 'text-violet-400 hover:text-violet-300' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {m.selected ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
            </button>
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
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">{m.origin}</span>
                {m.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {m.category}
                  </span>
                )}
                {m.aiGenerated && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    AI 定制
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1">{m.coreIdea}</p>
              {m.fitReasons && m.fitReasons.length > 0 && (
                <p className="text-xs text-emerald-400/90 mt-1">适配：{m.fitReasons.slice(0, 2).join('；')}</p>
              )}
              {m.conflicts && m.conflicts.length > 0 && (
                <p className="text-xs text-amber-400/90 mt-1">冲突：{m.conflicts[0]}</p>
              )}
            </div>
            <button
              onClick={() => onToggleExpand(m.id)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer shrink-0"
            >
              {expanded.has(m.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          {expanded.has(m.id) && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-700/30 ml-9 space-y-2 text-sm">
              <div>
                <span className="text-slate-500 text-xs">详细描述：</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{m.description}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">适用场景：</span>
                <p className="text-slate-300 mt-0.5">{m.applicability}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">关键步骤：</span>
                <p className="text-slate-300 mt-0.5 whitespace-pre-line">{m.steps}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-emerald-500 text-xs">优势：</span>
                  <p className="text-slate-300 mt-0.5">{m.pros}</p>
                </div>
                <div>
                  <span className="text-amber-500 text-xs">局限：</span>
                  <p className="text-slate-300 mt-0.5">{m.cons}</p>
                </div>
              </div>
              <div>
                <span className="text-blue-500 text-xs">参考来源：</span>
                <p className="text-slate-300 mt-0.5">{m.sources}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {selected.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => onApply(selected[0])}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <Check size={14} />
            应用「{selected[0].name}」
          </button>
          <button
            onClick={() => onApplyAndConfirm(selected[0])}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <Check size={14} />
            应用并继续下一层
          </button>
        </div>
      )}
    </div>
  );
}
