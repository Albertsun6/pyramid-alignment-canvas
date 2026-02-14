import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LAYERS } from '../data/layers';
import {
  aiAnalyzeIntent,
  aiCascadeLayerWithIntent,
  aiCreateMethodology,
  aiSearchMethodologies,
} from '../services/ai';
import type { IntentAnalysis, MethodologySearchResult } from '../services/ai';
import type { AISettings, CanvasData, LayerData, Methodology } from '../types';
import type { SkillTemplate } from '../types';
import type { PromptStore } from './usePrompts';
import type {
  AIInteraction,
  GuideState,
  MethodologyMeta,
  Phase,
  RouteRecommendation,
  StartPath,
  StepState,
} from '../components/cascade/types';

const CASCADE_ORDER = [6, 5, 4, 3, 2, 1, 0];

function routeLabel(path: StartPath): string {
  if (path === 'method') return '方法优先';
  if (path === 'methodology') return '方法论优先';
  return '全流程推导';
}

function splitKeywords(raw: string | undefined, fallback: string[]): string[] {
  const text = (raw || '').trim();
  if (!text) return fallback;
  return text
    .split(/[,\n，、；;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function buildStepsByStartPath(path: StartPath): StepState[] {
  return CASCADE_ORDER.map((id) => {
    const skip =
      (path === 'methodology' && id >= 3) ||
      (path === 'method' && id >= 2);
    return { layerId: id, status: skip ? 'confirmed' : 'pending' };
  });
}

function recommendSkills(
  analysis: IntentAnalysis,
  userInput: string,
  skillsLibrary: SkillTemplate[]
): SkillTemplate[] {
  const text = `${analysis.domain} ${analysis.goal} ${analysis.scope} ${analysis.summary} ${analysis.keyDimensions.join(' ')} ${analysis.constraints.join(' ')} ${userInput}`.toLowerCase();

  const scored = skillsLibrary.map((skill) => {
    let score = 0;
    for (const tag of skill.tags) {
      if (text.includes(tag.toLowerCase())) score += 2;
    }
    if (analysis.riskLevel === '高' && skill.id === 'risk-first') score += 2;
    if (analysis.reversibility === '高' && skill.id === 'experiment-fast') score += 2;
    if (analysis.impactScope === '组织' && skill.id === 'stakeholder-align') score += 2;
    return { skill, score };
  })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.skill);

  return scored.slice(0, 3);
}

function buildIntentWithSkills(
  intent: IntentAnalysis,
  selectedSkills: SkillTemplate[]
): IntentAnalysis {
  if (selectedSkills.length === 0) return intent;
  const skillNames = selectedSkills.map((s) => s.name);
  const skillHints = selectedSkills.flatMap((s) => s.promptHints).slice(0, 6);
  return {
    ...intent,
    keyDimensions: [...intent.keyDimensions, ...skillNames.map((n) => `[技能] ${n}`)],
    constraints: [...intent.constraints, ...skillHints.map((h) => `[技能约束] ${h}`)],
    summary: `${intent.summary}\n\n技能偏好：${skillNames.join('、')}`,
  };
}

function recommendStartPath(
  analysis: IntentAnalysis,
  userInput: string,
  strategy: {
    thresholdMethodology: number;
    thresholdFull: number;
    highImpactKeywords: string[];
    uncertaintyKeywords: string[];
    executeKeywords: string[];
  }
): RouteRecommendation {
  const text = `${analysis.goal} ${analysis.scope} ${analysis.summary} ${analysis.keyDimensions.join(' ')} ${analysis.constraints.join(' ')} ${userInput}`.toLowerCase();
  let score = 0;

  if (strategy.highImpactKeywords.some((w) => text.includes(w))) score += 3;
  if (strategy.uncertaintyKeywords.some((w) => text.includes(w))) score += 2;
  if (analysis.constraints.length >= 3) score += 1;
  if (analysis.keyDimensions.length >= 4) score += 1;
  if (strategy.executeKeywords.some((w) => text.includes(w))) score -= 2;
  if (analysis.impactScope === '组织') score += 2;
  else if (analysis.impactScope === '团队') score += 1;
  if (analysis.reversibility === '低') score += 2;
  else if (analysis.reversibility === '中') score += 1;
  if (analysis.riskLevel === '高') score += 2;
  else if (analysis.riskLevel === '中') score += 1;

  if (score >= strategy.thresholdFull) {
    return {
      recommendedPath: 'full',
      reason: '该意图影响范围大且不确定性较高，建议先做全流程对齐再落方法。',
    };
  }
  if (score >= strategy.thresholdMethodology) {
    return {
      recommendedPath: 'methodology',
      reason: '该意图需要先统一选型标准，先做方法论匹配再进入执行更稳。',
    };
  }
  return {
    recommendedPath: 'method',
    reason: '该意图执行目标清晰、试错成本较低，适合先从方法入手快速推进。',
  };
}

export function hasLayerContent(data?: LayerData): boolean {
  if (!data) return false;
  return Object.values(data).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    return false;
  });
}

interface UseCascadeFlowParams {
  canvas: CanvasData;
  aiSettings: AISettings;
  aiConfigured: boolean;
  onUpdateLayer: (layerId: number, data: LayerData) => void;
  onUpdateMethodologies?: (list: Methodology[]) => void;
  onCreateRunBoard?: () => void;
  onExit: () => void;
  promptStore?: PromptStore;
  skillsLibrary: SkillTemplate[];
}

export function useCascadeFlow({
  canvas,
  aiSettings,
  aiConfigured,
  onUpdateLayer,
  onUpdateMethodologies,
  onCreateRunBoard,
  onExit,
  promptStore,
  skillsLibrary,
}: UseCascadeFlowParams) {
  const [phase, setPhase] = useState<Phase>('intent-input');
  const [intentInput, setIntentInput] = useState('');
  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [recommendedSkills, setRecommendedSkills] = useState<SkillTemplate[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [routeRecommendation, setRouteRecommendation] = useState<RouteRecommendation | null>(null);
  const [selectedStartPath, setSelectedStartPath] = useState<StartPath>('full');
  const [editingIntentInCascade, setEditingIntentInCascade] = useState(false);
  const [reAnalyzingIntent, setReAnalyzingIntent] = useState(false);
  const [steps, setSteps] = useState<StepState[]>(
    CASCADE_ORDER.map((id) => ({ layerId: id, status: 'pending' }))
  );
  const [searchedMethodologies, setSearchedMethodologies] = useState<Methodology[]>([]);
  const [methodologyExpanded, setMethodologyExpanded] = useState<Set<string>>(new Set());
  const [methodologySearchMeta, setMethodologySearchMeta] = useState<MethodologyMeta | null>(null);
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [showPromptPanel, setShowPromptPanel] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const autoTriggeredRef = useRef<number | null>(null);

  const activeIdx = steps.findIndex((s) => s.status !== 'confirmed');
  const isAllDone = activeIdx === -1 && phase === 'cascading';
  const activeStep = activeIdx >= 0 ? steps[activeIdx] : null;
  const activeLayer = activeStep ? LAYERS.find((l) => l.id === activeStep.layerId) : null;
  const methodologyStepIdx = steps.findIndex((s) => s.layerId === 2);
  const hasMethodologyData = hasLayerContent(canvas.layers[2]);
  const selectedSkills = useMemo(
    () => skillsLibrary.filter((s) => selectedSkillIds.includes(s.id)),
    [selectedSkillIds, skillsLibrary]
  );
  const effectiveIntent = useMemo(
    () => (intentAnalysis ? buildIntentWithSkills(intentAnalysis, selectedSkills) : null),
    [intentAnalysis, selectedSkills]
  );

  const routingStrategy = {
    thresholdMethodology: aiSettings.routeThresholdMethodology ?? 2,
    thresholdFull: aiSettings.routeThresholdFull ?? 5,
    highImpactKeywords: splitKeywords(aiSettings.routeKeywordsHighImpact, [
      '战略',
      '组织',
      '跨团队',
      '跨部门',
      '公司级',
      '体系',
      '治理',
      '转型',
    ]),
    uncertaintyKeywords: splitKeywords(aiSettings.routeKeywordsUncertainty, [
      '不确定',
      '探索',
      '复杂',
      '冲突',
      '取舍',
      '长期',
      '路线',
      '范式',
    ]),
    executeKeywords: splitKeywords(aiSettings.routeKeywordsExecute, [
      '马上',
      '今天',
      '执行',
      '落地',
      '修复',
      '脚本',
      '页面',
      '短期',
      '快速',
    ]),
  };

  const addInteraction = useCallback((interaction: AIInteraction) => {
    setInteractions((prev) => [...prev, interaction]);
  }, []);

  const handleAnalyzeIntent = useCallback(async () => {
    if (!intentInput.trim() || !aiConfigured) return;
    setPhase('intent-analyzing');
    setIntentError(null);
    abortRef.current = new AbortController();
    const result = await aiAnalyzeIntent(aiSettings, intentInput.trim(), abortRef.current.signal, promptStore);
    if (result.success && result.analysis) {
      setIntentAnalysis(result.analysis);
      const rec = recommendStartPath(result.analysis, intentInput.trim(), routingStrategy);
      setRouteRecommendation(rec);
      setSelectedStartPath(rec.recommendedPath);
      const skillRecs = recommendSkills(result.analysis, intentInput.trim(), skillsLibrary);
      setRecommendedSkills(skillRecs);
      setSelectedSkillIds(skillRecs.length > 0 ? [skillRecs[0].id] : []);
      setPhase('intent-confirmed');
    } else {
      setIntentError(result.error || '分析失败');
      setPhase('intent-input');
    }
    if (result.messages) {
      addInteraction({
        type: 'intent',
        messages: result.messages,
        response: result.rawText || result.error || '',
        timestamp: new Date().toISOString(),
      });
    }
  }, [intentInput, aiConfigured, aiSettings, promptStore, addInteraction, routingStrategy, skillsLibrary]);

  const handleStartCascade = useCallback(() => {
    onCreateRunBoard?.();
    setSteps(buildStepsByStartPath(selectedStartPath));
    autoTriggeredRef.current = null;
    setPhase('cascading');
  }, [onCreateRunBoard, selectedStartPath]);

  const handleReAnalyze = useCallback(() => {
    setPhase('intent-input');
    setIntentAnalysis(null);
    setRecommendedSkills([]);
    setSelectedSkillIds([]);
    setRouteRecommendation(null);
    setSelectedStartPath('full');
  }, []);

  const handleReAnalyzeDuringCascade = useCallback(async () => {
    if (!intentInput.trim() || !aiConfigured) return;
    setReAnalyzingIntent(true);
    setIntentError(null);
    abortRef.current = new AbortController();
    const result = await aiAnalyzeIntent(aiSettings, intentInput.trim(), abortRef.current.signal, promptStore);
    if (result.success && result.analysis) {
      setIntentAnalysis(result.analysis);
      const rec = recommendStartPath(result.analysis, intentInput.trim(), routingStrategy);
      setRouteRecommendation(rec);
      setSelectedStartPath(rec.recommendedPath);
      const skillRecs = recommendSkills(result.analysis, intentInput.trim(), skillsLibrary);
      setRecommendedSkills(skillRecs);
      setSelectedSkillIds(skillRecs.length > 0 ? [skillRecs[0].id] : []);
      setEditingIntentInCascade(false);
    } else {
      setIntentError(result.error || '意图重分析失败');
    }
    if (result.messages) {
      addInteraction({
        type: 'intent',
        messages: result.messages,
        response: result.rawText || result.error || '',
        timestamp: new Date().toISOString(),
      });
    }
    setReAnalyzingIntent(false);
  }, [intentInput, aiConfigured, aiSettings, promptStore, addInteraction, routingStrategy, skillsLibrary]);

  const doGenerate = useCallback(
    async (stepIdx: number) => {
      if (!effectiveIntent) return;
      const layerId = steps[stepIdx]?.layerId;
      if (layerId === undefined) return;
      setSteps((prev) =>
        prev.map((s, i) => (i === stepIdx ? { ...s, status: 'generating', error: undefined } : s))
      );
      abortRef.current = new AbortController();
      const result = await aiCascadeLayerWithIntent(
        aiSettings,
        canvas,
        layerId,
        effectiveIntent,
        abortRef.current.signal,
        promptStore
      );
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
          prev.map((s, i) => (i === stepIdx ? { ...s, status: 'review', aiSuggestion: result.data } : s))
        );
        onUpdateLayer(layerId, {
          ...(canvas.layers[layerId] || {}),
          ...result.data,
        });
      } else {
        setSteps((prev) =>
          prev.map((s, i) =>
            i === stepIdx ? { ...s, status: 'error', error: result.error || '未知错误' } : s
          )
        );
      }
    },
    [aiSettings, canvas, steps, onUpdateLayer, effectiveIntent, promptStore, addInteraction]
  );

  const doMethodologySearch = useCallback(
    async (stepIdx: number) => {
      if (!effectiveIntent) return;
      setSteps((prev) =>
        prev.map((s, i) => (i === stepIdx ? { ...s, status: 'methodology-searching' } : s))
      );
      const ctrl = new AbortController();
      const result: MethodologySearchResult = await aiSearchMethodologies(
        aiSettings,
        canvas,
        undefined,
        ctrl.signal,
        effectiveIntent,
        promptStore
      );
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
        setMethodologySearchMeta({
          topScore: result.topScore,
          avgTop3: result.avgTop3,
          low: result.isLowConfidence,
          source: result.source,
        });
        setMethodologyExpanded(new Set(result.methodologies.map((m) => m.id)));
        onUpdateMethodologies?.(result.methodologies);
        setSteps((prev) => prev.map((s, i) => (i === stepIdx ? { ...s, status: 'pending' } : s)));
        return;
      }
      addInteraction({
        type: 'methodology-search',
        layerId: 2,
        messages: result.messages || [],
        response: '搜索无结果，正在 AI 创建定制方法论...',
        timestamp: new Date().toISOString(),
      });
      const ctrl2 = new AbortController();
      const createResult = await aiCreateMethodology(
        aiSettings,
        canvas,
        effectiveIntent,
        ctrl2.signal,
        promptStore
      );
      if (createResult.messages) {
        addInteraction({
          type: 'methodology-search',
          layerId: 2,
          messages: createResult.messages,
          response: createResult.rawText || createResult.error || '',
          timestamp: new Date().toISOString(),
        });
      }
      if (createResult.success && createResult.methodologies && createResult.methodologies.length > 0) {
        setSearchedMethodologies(createResult.methodologies);
        setMethodologySearchMeta({ low: true, source: 'ai-create' });
        setMethodologyExpanded(new Set(createResult.methodologies.map((m) => m.id)));
        onUpdateMethodologies?.(createResult.methodologies);
        setSteps((prev) => prev.map((s, i) => (i === stepIdx ? { ...s, status: 'pending' } : s)));
        return;
      }
      autoTriggeredRef.current = null;
      setSteps((prev) => prev.map((s, i) => (i === stepIdx ? { ...s, status: 'pending' } : s)));
      doGenerate(stepIdx);
    },
    [aiSettings, canvas, effectiveIntent, onUpdateMethodologies, promptStore, doGenerate, addInteraction]
  );

  useEffect(() => {
    if (phase !== 'cascading' || !aiConfigured || !effectiveIntent) return;
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
  }, [
    phase,
    activeIdx,
    steps,
    aiConfigured,
    effectiveIntent,
    searchedMethodologies.length,
    doMethodologySearch,
    doGenerate,
  ]);

  useEffect(() => {
    if (phase !== 'cascading') return;
    if (methodologyStepIdx === -1) return;
    const step = steps[methodologyStepIdx];
    if (!step || step.status !== 'pending') return;
    if (!hasLayerContent(canvas.layers[2])) return;
    setSteps((prev) =>
      prev.map((s, i) =>
        i === methodologyStepIdx ? { ...s, status: 'review', aiSuggestion: canvas.layers[2] } : s
      )
    );
  }, [phase, methodologyStepIdx, steps, canvas.layers]);

  const handleConfirm = useCallback((stepIdx: number) => {
    autoTriggeredRef.current = null;
    setSteps((prev) => prev.map((s, i) => (i === stepIdx ? { ...s, status: 'confirmed' } : s)));
  }, []);

  const handleSkip = useCallback((stepIdx: number) => {
    autoTriggeredRef.current = null;
    setSteps((prev) => prev.map((s, i) => (i === stepIdx ? { ...s, status: 'confirmed' } : s)));
  }, []);

  const handleRetry = useCallback((stepIdx: number) => doGenerate(stepIdx), [doGenerate]);
  const handleManualGenerate = useCallback((stepIdx: number) => doGenerate(stepIdx), [doGenerate]);

  const handleSelectMethodology = useCallback((id: string) => {
    setSearchedMethodologies((prev) => prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m)));
  }, []);

  const handleApplyMethodology = useCallback(
    (m: Methodology, autoConfirm = false) => {
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
      onUpdateMethodologies?.(searchedMethodologies);
      if (autoConfirm) {
        autoTriggeredRef.current = null;
        setSteps((prev) =>
          prev.map((s, i) =>
            i === methodologyStepIdx ? { ...s, status: 'confirmed', aiSuggestion: data } : s
          )
        );
      } else {
        setSteps((prev) =>
          prev.map((s, i) => (i === methodologyStepIdx ? { ...s, status: 'review', aiSuggestion: data } : s))
        );
      }
    },
    [searchedMethodologies, onUpdateLayer, onUpdateMethodologies, methodologyStepIdx]
  );

  const handleResetMethodologySearch = useCallback(() => {
    setSearchedMethodologies([]);
    setMethodologySearchMeta(null);
    autoTriggeredRef.current = null;
    setSteps((prev) => prev.map((s, i) => (i === methodologyStepIdx ? { ...s, status: 'pending' } : s)));
  }, [methodologyStepIdx]);

  const toggleMethodologyExpand = useCallback((id: string) => {
    setMethodologyExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reopenConfirmedStep = useCallback((idx: number) => {
    autoTriggeredRef.current = idx;
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, status: 'review' } : s)));
  }, []);

  const markMethodologyReviewFromCurrentData = useCallback((idx: number) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, status: 'review', aiSuggestion: canvas.layers[2] } : s))
    );
  }, [canvas.layers]);

  const getStepLabel = useCallback((idx: number, layerId: number) => `步骤 ${idx + 1}（L${layerId}）`, []);

  const toggleSkillSelection = useCallback((skillId: string) => {
    setSelectedSkillIds((prev) => {
      if (prev.includes(skillId)) return prev.filter((id) => id !== skillId);
      return [...prev, skillId];
    });
  }, []);

  let guide: GuideState = { title: '', desc: '', actionLabel: null, action: null, actionDisabled: false };
  if (phase === 'intent-input') {
    guide = {
      title: '当前阶段：意图输入',
      desc: aiConfigured
        ? '请先输入你的目标意图，然后点击“分析意图”。'
        : '请先在右上角配置 AI Key，再开始意图分析。',
      actionLabel: aiConfigured ? '分析意图' : null,
      action: aiConfigured ? handleAnalyzeIntent : null,
      actionDisabled: !intentInput.trim(),
    };
  } else if (phase === 'intent-analyzing') {
    guide = {
      title: '当前阶段：意图分析中',
      desc: '系统正在提取领域、目标与约束，请稍候。',
      actionLabel: null,
      action: null,
    };
  } else if (phase === 'intent-confirmed') {
    guide = {
      title: '当前阶段：意图已确认',
      desc: `建议起点：${routeLabel(selectedStartPath)}。点击后先创建新推导画板再开始。`,
      actionLabel: `按「${routeLabel(selectedStartPath)}」开始`,
      action: handleStartCascade,
    };
  } else if (phase === 'cascading' && isAllDone) {
    guide = {
      title: '当前阶段：推导完成',
      desc: '全部层级已完成，可以返回画布总览继续微调。',
      actionLabel: '返回画布总览',
      action: onExit,
    };
  } else if (phase === 'cascading' && activeStep && activeLayer) {
    guide.title = `当前阶段：${getStepLabel(activeIdx, activeLayer.id)}「${activeLayer.name}」`;
    if (!aiConfigured && activeStep.status === 'pending') {
      guide = {
        ...guide,
        desc: '未配置 AI，无法自动推导。请先在右上角配置 AI Key。',
        actionLabel: null,
        action: null,
      };
    } else if (activeStep.status === 'pending') {
      if (activeLayer.id === 2) {
        if (searchedMethodologies.length > 0 && hasMethodologyData) {
          guide = {
            ...guide,
            desc: '已存在方法论内容，请进入确认并继续下一层。',
            actionLabel: '使用当前方法论并确认',
            action: () => markMethodologyReviewFromCurrentData(activeIdx),
          };
        } else if (searchedMethodologies.length > 0) {
          guide = {
            ...guide,
            desc: '请先在候选列表中选定并应用方法论。',
            actionLabel: null,
            action: null,
          };
        } else {
          guide = {
            ...guide,
            desc: '系统将先检索现有方法论，必要时再进行 AI 定制。',
            actionLabel: null,
            action: null,
          };
        }
      } else {
        guide = {
          ...guide,
          desc: '请继续当前层推导，或等待自动推导触发。',
          actionLabel: '继续推导当前层',
          action: () => handleManualGenerate(activeIdx),
        };
      }
    } else if (activeStep.status === 'review') {
      guide = {
        ...guide,
        desc: '请审阅当前层内容，确认后系统将自动进入下一层。',
        actionLabel: '确认并继续下一层',
        action: () => handleConfirm(activeIdx),
      };
    } else if (activeStep.status === 'error') {
      guide = {
        ...guide,
        desc: '当前层推导失败，可重试或跳过。',
        actionLabel: '重试当前层',
        action: () => handleRetry(activeIdx),
      };
    } else if (activeStep.status === 'generating' || activeStep.status === 'methodology-searching') {
      guide = {
        ...guide,
        desc: '系统处理中，请稍候。',
        actionLabel: null,
        action: null,
      };
    }
  }

  return {
    phase,
    intentInput,
    setIntentInput,
    intentAnalysis,
    intentError,
    recommendedSkills,
    selectedSkills,
    toggleSkillSelection,
    routeRecommendation,
    selectedStartPath,
    setSelectedStartPath,
    editingIntentInCascade,
    setEditingIntentInCascade,
    reAnalyzingIntent,
    steps,
    activeIdx,
    isAllDone,
    activeStep,
    activeLayer,
    searchedMethodologies,
    methodologyExpanded,
    methodologySearchMeta,
    interactions,
    showPromptPanel,
    setShowPromptPanel,
    hasMethodologyData,
    guide,
    getStepLabel,
    handleAnalyzeIntent,
    handleStartCascade,
    handleReAnalyze,
    handleReAnalyzeDuringCascade,
    handleConfirm,
    handleSkip,
    handleRetry,
    handleManualGenerate,
    handleSelectMethodology,
    handleApplyMethodology,
    handleResetMethodologySearch,
    toggleMethodologyExpand,
    reopenConfirmedStep,
    markMethodologyReviewFromCurrentData,
  };
}
