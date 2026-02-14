import { useState, useCallback, useRef, useEffect } from 'react';
import { LAYERS } from '../data/layers';
import { LayerCard } from './LayerCard';
import {
  aiCascadeLayerWithIntent,
  aiAnalyzeIntent,
  aiSearchMethodologies,
} from '../services/ai';
import type {
  IntentAnalysis,
  MethodologySearchResult,
} from '../services/ai';
import type { CanvasData, LayerData, AISettings, Methodology, AIMessage } from '../types';
import type { PromptStore } from '../hooks/usePrompts';
import {
  Sparkles,
  Loader2,
  ChevronDown,
  Check,
  AlertTriangle,
  RotateCcw,
  ArrowDown,
  MessageSquareText,
  Brain,
  Library,
  Star,
  StarOff,
  ChevronUp,
  Send,
  Code2,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
} from 'lucide-react';

interface Props {
  canvas: CanvasData;
  aiSettings: AISettings;
  aiConfigured: boolean;
  onUpdateLayer: (layerId: number, data: LayerData) => void;
  onUpdateMethodologies?: (list: Methodology[]) => void;
  onExit: () => void;
  promptStore?: PromptStore;
}

// Cascade order: top-down (6 → 5 → 4 → 3 → 2 → 1 → 0)
const CASCADE_ORDER = [6, 5, 4, 3, 2, 1, 0];

type StepStatus = 'pending' | 'generating' | 'review' | 'confirmed' | 'error' | 'methodology-searching';
type Phase = 'intent-input' | 'intent-analyzing' | 'intent-confirmed' | 'cascading';

/** Records a single AI interaction */
interface AIInteraction {
  type: 'intent' | 'cascade' | 'methodology-search';
  layerId?: number;
  messages: AIMessage[];
  response: string;
  timestamp: string;
}

interface StepState {
  layerId: number;
  status: StepStatus;
  error?: string;
  aiSuggestion?: LayerData;
}

export function CascadeMode({
  canvas,
  aiSettings,
  aiConfigured,
  onUpdateLayer,
  onUpdateMethodologies,
  onExit,
  promptStore,
}: Props) {
  // === Phase 0: Intent ===
  const [phase, setPhase] = useState<Phase>('intent-input');
  const [intentInput, setIntentInput] = useState('');
  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);

  // === Phase 1: Cascade ===
  const [steps, setSteps] = useState<StepState[]>(
    CASCADE_ORDER.map((id) => ({ layerId: id, status: 'pending' }))
  );

  // === Methodology search state (for layer 2) ===
  const [searchedMethodologies, setSearchedMethodologies] = useState<Methodology[]>([]);
  const [methodologyExpanded, setMethodologyExpanded] = useState<Set<string>>(new Set());

  // === AI Interactions log ===
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [showPromptPanel, setShowPromptPanel] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const autoTriggeredRef = useRef<number | null>(null);

  // Find the current active step
  const activeIdx = steps.findIndex((s) => s.status !== 'confirmed');
  const isAllDone = activeIdx === -1 && phase === 'cascading';

  /** Add an interaction record */
  const addInteraction = useCallback((interaction: AIInteraction) => {
    setInteractions((prev) => [...prev, interaction]);
  }, []);

  // ==================== Intent Handlers ====================

  const handleAnalyzeIntent = useCallback(async () => {
    if (!intentInput.trim() || !aiConfigured) return;

    setPhase('intent-analyzing');
    setIntentError(null);

    abortRef.current = new AbortController();
    const result = await aiAnalyzeIntent(aiSettings, intentInput.trim(), abortRef.current.signal, promptStore);

    if (result.success && result.analysis) {
      setIntentAnalysis(result.analysis);
      setPhase('intent-confirmed');
    } else {
      setIntentError(result.error || '分析失败');
      setPhase('intent-input');
    }

    // Record interaction
    if (result.messages) {
      addInteraction({
        type: 'intent',
        messages: result.messages,
        response: result.rawText || result.error || '',
        timestamp: new Date().toISOString(),
      });
    }
  }, [intentInput, aiConfigured, aiSettings, addInteraction]);

  const handleStartCascade = useCallback(() => {
    setSteps(CASCADE_ORDER.map((id) => ({ layerId: id, status: 'pending' })));
    autoTriggeredRef.current = null;
    setPhase('cascading');
  }, []);

  const handleReAnalyze = useCallback(() => {
    setPhase('intent-input');
    setIntentAnalysis(null);
  }, []);

  // ==================== Core: AI Generate for a step ====================

  const doGenerate = useCallback(
    async (stepIdx: number) => {
      if (!intentAnalysis) return;
      const layerId = steps[stepIdx]?.layerId;
      if (layerId === undefined) return;

      setSteps((prev) =>
        prev.map((s, i) =>
          i === stepIdx ? { ...s, status: 'generating', error: undefined } : s
        )
      );

      abortRef.current = new AbortController();
      const result = await aiCascadeLayerWithIntent(
        aiSettings,
        canvas,
        layerId,
        intentAnalysis,
        abortRef.current.signal,
        promptStore
      );

      // Record interaction
      if (result.messages) {
        addInteraction({
          type: 'cascade',
          layerId,
          messages: result.messages,
          response: result.rawText || result.error || '',
          timestamp: new Date().toISOString(),
        });
      }

      if (result.success && result.data) {
        setSteps((prev) =>
          prev.map((s, i) =>
            i === stepIdx ? { ...s, status: 'review', aiSuggestion: result.data } : s
          )
        );
        onUpdateLayer(layerId, {
          ...(canvas.layers[layerId] || {}),
          ...result.data,
        });
      } else {
        setSteps((prev) =>
          prev.map((s, i) =>
            i === stepIdx
              ? { ...s, status: 'error', error: result.error || '未知错误' }
              : s
          )
        );
      }
    },
    [aiSettings, canvas, steps, onUpdateLayer, intentAnalysis, addInteraction]
  );

  // ==================== Core: Methodology search for layer 2 ====================

  const doMethodologySearch = useCallback(
    async (stepIdx: number) => {
      if (!intentAnalysis) return;

      setSteps((prev) =>
        prev.map((s, i) =>
          i === stepIdx ? { ...s, status: 'methodology-searching' } : s
        )
      );

      const ctrl = new AbortController();
      const result: MethodologySearchResult = await aiSearchMethodologies(
        aiSettings,
        canvas,
        undefined,
        ctrl.signal,
        intentAnalysis,
        promptStore
      );

      // Record interaction
      if (result.messages) {
        addInteraction({
          type: 'methodology-search',
          layerId: 2,
          messages: result.messages,
          response: result.rawText || result.error || '',
          timestamp: new Date().toISOString(),
        });
      }

      if (result.success && result.methodologies && result.methodologies.length > 0) {
        setSearchedMethodologies(result.methodologies);
        const ids = new Set(result.methodologies.map((m: Methodology) => m.id));
        setMethodologyExpanded(ids);

        if (onUpdateMethodologies) {
          onUpdateMethodologies(result.methodologies);
        }
      }

      setSteps((prev) =>
        prev.map((s, i) =>
          i === stepIdx ? { ...s, status: 'pending' } : s
        )
      );
    },
    [aiSettings, canvas, intentAnalysis, onUpdateMethodologies, addInteraction]
  );

  // ==================== Auto-trigger ====================

  useEffect(() => {
    if (phase !== 'cascading' || !aiConfigured || !intentAnalysis) return;
    if (activeIdx === -1) return;

    const step = steps[activeIdx];
    if (!step || step.status !== 'pending') return;
    if (autoTriggeredRef.current === activeIdx) return;
    autoTriggeredRef.current = activeIdx;

    const isMethodologyLayer = step.layerId === 2;

    if (isMethodologyLayer) {
      if (searchedMethodologies.length === 0) {
        doMethodologySearch(activeIdx);
      }
    } else {
      doGenerate(activeIdx);
    }
  }, [phase, activeIdx, steps, aiConfigured, intentAnalysis, doGenerate, doMethodologySearch, searchedMethodologies.length]);

  // ==================== User Actions ====================

  const handleConfirm = useCallback((stepIdx: number) => {
    autoTriggeredRef.current = null;
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx ? { ...s, status: 'confirmed' } : s
      )
    );
  }, []);

  const handleSkip = useCallback((stepIdx: number) => {
    autoTriggeredRef.current = null;
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx ? { ...s, status: 'confirmed' } : s
      )
    );
  }, []);

  const handleRetry = useCallback(
    (stepIdx: number) => { doGenerate(stepIdx); },
    [doGenerate]
  );

  const handleManualGenerate = useCallback(
    (stepIdx: number) => { doGenerate(stepIdx); },
    [doGenerate]
  );

  // ==================== Methodology handlers ====================

  const methodologyStepIdx = steps.findIndex((s) => s.layerId === 2);

  const handleSelectMethodology = useCallback((id: string) => {
    setSearchedMethodologies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  }, []);

  const handleApplyMethodology = useCallback(
    (m: Methodology) => {
      const allSelected = searchedMethodologies.filter((s) => s.selected);
      const altLines =
        allSelected.length > 1
          ? allSelected
              .map((s, i) => `${String.fromCharCode(65 + i)}: ${s.name} — ${s.coreIdea}`)
              .join('\n')
          : `A: ${m.name} — ${m.coreIdea}\nB: （待补充其他方案）`;

      const data: LayerData = {
        alternatives: altLines,
        reason: `选用「${m.name}」\n\n核心思想：${m.coreIdea}\n\n选型理由：${m.applicability}\n\n优势：${m.pros}\n\n局限：${m.cons}`,
        metrics: `基于「${m.name}」的关键步骤：\n${m.steps}`,
        evidence: m.sources,
      };

      onUpdateLayer(2, data);

      if (onUpdateMethodologies) {
        onUpdateMethodologies(searchedMethodologies);
      }

      setSteps((prev) =>
        prev.map((s, i) =>
          i === methodologyStepIdx ? { ...s, status: 'review', aiSuggestion: data } : s
        )
      );
    },
    [searchedMethodologies, onUpdateLayer, onUpdateMethodologies, methodologyStepIdx]
  );

  const handleResetMethodologySearch = useCallback(() => {
    setSearchedMethodologies([]);
    autoTriggeredRef.current = null;
    setSteps((prev) =>
      prev.map((s, i) =>
        i === methodologyStepIdx ? { ...s, status: 'pending' } : s
      )
    );
  }, [methodologyStepIdx]);

  const toggleMethodologyExpand = useCallback((id: string) => {
    setMethodologyExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ==================== Render ====================

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm mb-4">
          <Sparkles size={16} />
          AI 级联推导
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">告诉我你想做什么</h2>
        <p className="text-slate-400 text-sm">
          先描述你的意图，AI 分析后自动从终极承诺逐层推导到具体方法
        </p>
      </div>

      {/* ========== Prompt viewer toggle (always visible once there are interactions) ========== */}
      {interactions.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowPromptPanel((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              showPromptPanel
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
            }`}
          >
            <Code2 size={14} />
            {showPromptPanel ? '隐藏提示词' : '查看提示词'}
            <span className="px-1.5 py-0.5 bg-slate-700 rounded-md text-xs text-slate-300 ml-1">
              {interactions.length}
            </span>
          </button>
        </div>
      )}

      {/* ========== Prompt Panel (collapsible) ========== */}
      {showPromptPanel && interactions.length > 0 && (
        <div className="mb-8 animate-fade-in-up">
          <PromptPanel interactions={interactions} />
        </div>
      )}

      {/* ========== Phase: Intent Input ========== */}
      {phase === 'intent-input' && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
              <MessageSquareText size={16} />
              <span className="font-medium">第一步：描述你的意图</span>
            </div>
            <textarea
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAnalyzeIntent();
                }
              }}
              placeholder="用自然语言描述你想做什么。比如：&#10;&#10;• 我想为一个 10 人团队选择项目管理方法&#10;• 我要设计一套适合初创公司的产品开发流程&#10;• 我正在装修房子，需要一个决策框架&#10;• 我想建立个人知识管理体系"
              rows={5}
              className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors text-sm leading-relaxed resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-600">Ctrl+Enter 快速提交</p>
              <button
                onClick={handleAnalyzeIntent}
                disabled={!intentInput.trim() || !aiConfigured}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  !intentInput.trim() || !aiConfigured
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'
                }`}
              >
                <Send size={14} />
                分析意图
              </button>
            </div>
          </div>

          {intentError && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div><span className="font-medium">分析失败：</span>{intentError}</div>
            </div>
          )}

          {!aiConfigured && (
            <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              请先在右上角配置 AI API Key
            </div>
          )}
        </div>
      )}

      {/* ========== Phase: Analyzing ========== */}
      {phase === 'intent-analyzing' && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-4">
            <Brain size={28} className="text-violet-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 size={14} className="animate-spin" />
            正在分析你的意图...
          </div>
          <p className="text-xs text-slate-600 mt-2">识别领域、目标、范围和关键维度</p>
        </div>
      )}

      {/* ========== Phase: Intent Confirmed ========== */}
      {phase === 'intent-confirmed' && intentAnalysis && (
        <div className="space-y-4 animate-fade-in-up">
          <IntentCard
            input={intentInput}
            analysis={intentAnalysis}
            onReAnalyze={handleReAnalyze}
            onStartCascade={handleStartCascade}
          />
        </div>
      )}

      {/* ========== Phase: Cascading ========== */}
      {phase === 'cascading' && (
        <div className="space-y-0 animate-fade-in-up">
          {/* Compact intent banner */}
          {intentAnalysis && (
            <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Brain size={14} className="text-violet-400" />
                <span className="text-violet-300 font-medium">意图：</span>
                <span className="text-slate-300">{intentAnalysis.goal}</span>
                <span className="text-slate-600 mx-1">·</span>
                <span className="text-slate-500">{intentAnalysis.domain}</span>
              </div>
            </div>
          )}

          {/* Progress overview */}
          <div className="flex items-center justify-center gap-1 mb-8">
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
                      step.layerId
                    )}
                  </div>
                  {idx < steps.length - 1 && (
                    <ArrowDown size={12} className="text-slate-600 rotate-[-90deg]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const layer = LAYERS.find((l) => l.id === step.layerId)!;
              const isActive = idx === activeIdx;
              const isPast = step.status === 'confirmed';
              const isFuture = !isActive && !isPast && step.status === 'pending';
              const isMethodologyLayer = step.layerId === 2;
              const isSearching = step.status === 'methodology-searching';

              // Find interaction for this step
              const stepInteraction = interactions.find(
                (ia) =>
                  ia.layerId === step.layerId &&
                  (ia.type === 'cascade' || ia.type === 'methodology-search')
              );

              return (
                <div key={step.layerId}>
                  {idx > 0 && (
                    <div className="flex justify-center py-1">
                      <ChevronDown
                        size={20}
                        className={isPast ? 'text-slate-500' : 'text-slate-700'}
                      />
                    </div>
                  )}

                  {/* Collapsed confirmed step */}
                  {isPast && (
                    <div
                      className="rounded-xl p-4 border cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        background: layer.bgColor,
                        borderColor: layer.borderColor,
                        opacity: 0.7,
                      }}
                      onClick={() => {
                        autoTriggeredRef.current = idx;
                        setSteps((prev) =>
                          prev.map((s, i) =>
                            i === idx ? { ...s, status: 'review' } : s
                          )
                        );
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: layer.color }}
                        >
                          <Check size={14} />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-white">
                            {layer.id}. {layer.name}
                          </span>
                          <span className="text-xs text-slate-500 ml-2">
                            已确认 (点击可重新编辑)
                          </span>
                        </div>
                        {/* Mini prompt indicator */}
                        {stepInteraction && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                            <Code2 size={10} className="inline mr-1" />
                            有提示词
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Active step */}
                  {!isPast && !isFuture && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            第 {layer.id} 层：{layer.name}
                          </span>
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
                        <div className="flex items-center gap-2">
                          {step.status === 'pending' && isMethodologyLayer && searchedMethodologies.length > 0 && (
                            <button
                              onClick={() => handleManualGenerate(idx)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
                            >
                              <Sparkles size={13} />
                              跳过选择，AI 直接填写
                            </button>
                          )}
                          {step.status === 'pending' && (
                            <button
                              onClick={() => handleSkip(idx)}
                              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm transition-colors cursor-pointer"
                            >
                              跳过此层
                            </button>
                          )}
                          {step.status === 'review' && (
                            <>
                              <button
                                onClick={() =>
                                  isMethodologyLayer
                                    ? handleResetMethodologySearch()
                                    : handleManualGenerate(idx)
                                }
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
                              >
                                <RotateCcw size={13} />
                                重新生成
                              </button>
                              <button
                                onClick={() => handleConfirm(idx)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors cursor-pointer"
                              >
                                <Check size={14} />
                                确认，继续下一层
                              </button>
                            </>
                          )}
                          {step.status === 'error' && (
                            <>
                              <button
                                onClick={() => handleRetry(idx)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
                              >
                                <RotateCcw size={13} />
                                重试
                              </button>
                              <button
                                onClick={() => handleSkip(idx)}
                                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm transition-colors cursor-pointer"
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
                          expanded={methodologyExpanded}
                          onToggleExpand={toggleMethodologyExpand}
                          onSelect={handleSelectMethodology}
                          onApply={handleApplyMethodology}
                        />
                      )}

                      {isSearching && (
                        <div className="flex flex-col items-center py-10 text-slate-400 text-sm">
                          <Loader2 size={28} className="animate-spin text-violet-400 mb-3" />
                          <p className="font-medium">正在搜索匹配上层约束的真实方法论...</p>
                          <p className="text-xs text-slate-600 mt-1">搜索结果将自动保存到方法论库</p>
                        </div>
                      )}

                      {step.status === 'generating' && (
                        <div
                          className="rounded-xl border p-5 flex flex-col items-center py-10"
                          style={{ background: layer.bgColor, borderColor: layer.borderColor }}
                        >
                          <Loader2 size={28} className="animate-spin mb-3" style={{ color: layer.color }} />
                          <p className="text-sm text-slate-300 font-medium">
                            AI 正在基于上层已确认的内容推导第 {layer.id} 层...
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            使用意图上下文 + 上层约束进行推导
                          </p>
                        </div>
                      )}

                      {step.status === 'review' && (
                        <>
                          <LayerCard
                            layer={layer}
                            data={canvas.layers[step.layerId] || {}}
                            onChange={(d) => onUpdateLayer(step.layerId, d)}
                          />
                          {/* Inline prompt viewer for this step */}
                          {stepInteraction && (
                            <InlinePromptViewer interaction={stepInteraction} layerName={layer.name} />
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Future step */}
                  {isFuture && (
                    <div
                      className="rounded-xl p-4 border opacity-30"
                      style={{ background: layer.bgColor, borderColor: layer.borderColor }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500"
                          style={{ background: 'rgba(71, 85, 105, 0.3)' }}
                        >
                          {layer.id}
                        </div>
                        <span className="text-sm text-slate-500">
                          {layer.id}. {layer.name} — 等待上层确认后自动推导
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completion */}
          {isAllDone && (
            <div className="mt-8 text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-lg font-medium mb-4">
                <Check size={20} />
                全部层级已完成！
              </div>
              <p className="text-slate-400 text-sm mb-4">
                你已经从意图出发，经过终极承诺推导到了具体方法。可以导出画布或切换到自由填写模式继续调整。
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowPromptPanel(true)}
                  className="px-5 py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Code2 size={14} />
                  查看全部 {interactions.length} 条提示词
                </button>
                <button
                  onClick={onExit}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  返回自由填写模式
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Sub-Components ====================

function IntentCard({
  input,
  analysis,
  onReAnalyze,
  onStartCascade,
}: {
  input: string;
  analysis: IntentAnalysis;
  onReAnalyze: () => void;
  onStartCascade: () => void;
}) {
  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
          <MessageSquareText size={14} className="text-slate-400" />
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">你的意图</div>
          <div className="text-sm text-slate-300 leading-relaxed">{input}</div>
        </div>
      </div>

      <div className="border-t border-violet-500/20" />

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
          <Brain size={14} className="text-violet-400" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="text-xs text-violet-400 font-medium">AI 意图分析</div>
          <div className="grid grid-cols-2 gap-3">
            <AnalysisField label="领域" value={analysis.domain} />
            <AnalysisField label="范围" value={analysis.scope} />
          </div>
          <AnalysisField label="核心目标" value={analysis.goal} />

          {analysis.keyDimensions.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1.5">关键维度</div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keyDimensions.map((d, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.constraints.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1.5">隐含约束</div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.constraints.map((c, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-slate-800/50 px-3 py-2.5 text-sm text-slate-300 leading-relaxed">
            {analysis.summary}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onReAnalyze}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          重新描述
        </button>
        <button
          onClick={onStartCascade}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <Sparkles size={14} />
          确认，开始逐层推导
          <ArrowDown size={14} />
        </button>
      </div>
    </div>
  );
}

function AnalysisField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm text-slate-200">{value}</div>
    </div>
  );
}

// ==================== Inline Prompt Viewer (per step) ====================

function InlinePromptViewer({
  interaction,
  layerName,
}: {
  interaction: AIInteraction;
  layerName: string;
}) {
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
          <span className="text-xs text-cyan-600">
            {interaction.messages.length} 条消息
          </span>
        </div>
        <div className="flex items-center gap-2 text-cyan-600">
          {expanded ? <EyeOff size={14} /> : <Eye size={14} />}
          <span className="text-xs">{expanded ? '收起' : '展开'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-cyan-500/20 p-4 space-y-4">
          {interaction.messages.map((msg, i) => (
            <MessageBlock key={i} role={msg.role} content={msg.content} />
          ))}
          <MessageBlock role="assistant" content={interaction.response} label="AI 返回" />
        </div>
      )}
    </div>
  );
}

// ==================== Full Prompt Panel ====================

function PromptPanel({ interactions }: { interactions: AIInteraction[] }) {
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
      case 'cascade': {
        const layer = LAYERS.find((l) => l.id === ia.layerId);
        return layer
          ? { bg: 'bg-slate-800/50', border: 'border-slate-700/50', text: 'text-slate-300' }
          : { bg: 'bg-slate-800/50', border: 'border-slate-700/50', text: 'text-slate-400' };
      }
      case 'methodology-search':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' };
      default:
        return { bg: 'bg-slate-800/50', border: 'border-slate-700/50', text: 'text-slate-400' };
    }
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-cyan-500/20 bg-cyan-500/5">
        <div className="flex items-center gap-2 text-cyan-400 font-medium">
          <Code2 size={16} />
          AI 交互提示词记录
        </div>
        <p className="text-xs text-slate-500 mt-1">
          共 {interactions.length} 次 AI 交互，点击展开查看完整提示词和返回结果
        </p>
      </div>

      {/* Interaction list */}
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
                <span className={`text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text} border ${color.border} shrink-0`}>
                  {getTypeLabel(ia)}
                </span>
                <span className="text-xs text-slate-500 flex-1 truncate">
                  {ia.messages.length > 0 && ia.messages[ia.messages.length - 1].content.slice(0, 80)}...
                </span>
                <span className="text-xs text-slate-600">
                  {ia.messages.length} 条消息
                </span>
                {isOpen ? (
                  <ChevronUp size={14} className="text-slate-500 shrink-0" />
                ) : (
                  <ChevronDown size={14} className="text-slate-500 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4 animate-fade-in-up">
                  {ia.messages.map((msg, mi) => (
                    <MessageBlock key={mi} role={msg.role} content={msg.content} />
                  ))}
                  <MessageBlock role="assistant" content={ia.response} label="AI 返回" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== Message Block ====================

function MessageBlock({
  role,
  content,
  label,
}: {
  role: 'system' | 'user' | 'assistant';
  content: string;
  label?: string;
}) {
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

// ==================== Methodology Search Panel ====================

function MethodologySearchPanel({
  methodologies,
  expanded,
  onToggleExpand,
  onSelect,
  onApply,
}: {
  methodologies: Methodology[];
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onApply: (m: Methodology) => void;
}) {
  const selected = methodologies.filter((m) => m.selected);

  return (
    <div className="space-y-3 mb-4">
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Library size={16} className="text-violet-400" />
          <span className="text-violet-300 font-medium">
            找到 {methodologies.length} 个匹配的方法论（已存入方法论库）
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 ml-6">
          点击星标选定主方案，然后应用到方法论层
        </p>
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
                m.selected
                  ? 'text-violet-400 hover:text-violet-300'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {m.selected ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-white text-sm">{m.name}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                  {m.origin}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{m.coreIdea}</p>
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
        <button
          onClick={() => onApply(selected[0])}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <Check size={14} />
          应用「{selected[0].name}」到方法论层
        </button>
      )}
    </div>
  );
}
