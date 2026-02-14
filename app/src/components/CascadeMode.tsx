import { Sparkles, Code2 } from 'lucide-react';
import type { CanvasData, LayerData, AISettings, Methodology, SkillTemplate } from '../types';
import type { PromptStore } from '../hooks/usePrompts';
import { useCascadeFlow } from '../hooks/useCascadeFlow';
import { ProcessGuideBar } from './cascade/ProcessGuideBar';
import { IntentPhaseSection } from './cascade/IntentPhaseSection';
import { CascadePhaseSection } from './cascade/CascadePhaseSection';
import { AIPromptPanel } from './ai/AIPromptPanel';

interface Props {
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

export function CascadeMode({
  canvas,
  aiSettings,
  aiConfigured,
  onUpdateLayer,
  onUpdateMethodologies,
  onCreateRunBoard,
  onExit,
  promptStore,
  skillsLibrary,
}: Props) {
  const {
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
    interactions,
    showPromptPanel,
    setShowPromptPanel,
    searchedMethodologies,
    methodologySearchMeta,
    methodologyExpanded,
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
  } = useCascadeFlow({
    canvas,
    aiSettings,
    aiConfigured,
    onUpdateLayer,
    onUpdateMethodologies,
    onCreateRunBoard,
    onExit,
    promptStore,
    skillsLibrary,
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm mb-4">
          <Sparkles size={16} />
          开始推导
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">告诉我你想做什么</h2>
        <p className="text-slate-400 text-sm">先描述你的意图，AI 分析后自动从终极承诺逐层推导到具体方法</p>
      </div>

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

      {showPromptPanel && interactions.length > 0 && (
        <div className="mb-8 animate-fade-in-up">
          <AIPromptPanel interactions={interactions} />
        </div>
      )}

      <ProcessGuideBar guide={guide} />

      <IntentPhaseSection
        phase={phase}
        intentInput={intentInput}
        setIntentInput={setIntentInput}
        intentAnalysis={intentAnalysis}
        intentError={intentError}
        recommendedSkills={recommendedSkills}
        selectedSkills={selectedSkills}
        onToggleSkillSelection={toggleSkillSelection}
        routeRecommendation={routeRecommendation}
        selectedStartPath={selectedStartPath}
        onSelectStartPath={setSelectedStartPath}
        aiConfigured={aiConfigured}
        onAnalyzeIntent={handleAnalyzeIntent}
        onReAnalyze={handleReAnalyze}
        onStartCascade={handleStartCascade}
      />

      <CascadePhaseSection
        phase={phase}
        intentAnalysis={intentAnalysis}
        intentInput={intentInput}
        setIntentInput={setIntentInput}
        editingIntentInCascade={editingIntentInCascade}
        setEditingIntentInCascade={setEditingIntentInCascade}
        reAnalyzingIntent={reAnalyzingIntent}
        aiConfigured={aiConfigured}
        steps={steps}
        activeIdx={activeIdx}
        isAllDone={isAllDone}
        canvas={canvas}
        interactions={interactions}
        searchedMethodologies={searchedMethodologies}
        methodologySearchMeta={methodologySearchMeta}
        methodologyExpanded={methodologyExpanded}
        getStepLabel={getStepLabel}
        onReAnalyzeDuringCascade={handleReAnalyzeDuringCascade}
        onConfirm={handleConfirm}
        onSkip={handleSkip}
        onRetry={handleRetry}
        onManualGenerate={handleManualGenerate}
        onResetMethodologySearch={handleResetMethodologySearch}
        onSelectMethodology={handleSelectMethodology}
        onApplyMethodology={handleApplyMethodology}
        onToggleMethodologyExpand={toggleMethodologyExpand}
        onReopenConfirmedStep={reopenConfirmedStep}
        onMarkMethodologyReview={markMethodologyReviewFromCurrentData}
        onUpdateLayer={onUpdateLayer}
        onExit={onExit}
        onOpenPromptPanel={() => setShowPromptPanel(true)}
        interactionCount={interactions.length}
      />
    </div>
  );
}

