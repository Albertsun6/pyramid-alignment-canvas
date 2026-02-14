import { useState, useCallback } from 'react';
import type { AppMode } from './types';
import { LAYERS } from './data/layers';
import { useCanvas } from './hooks/useCanvas';
import { useAISettings } from './hooks/useAISettings';
import { usePrompts } from './hooks/usePrompts';
import { useSkills } from './hooks/useSkills';
import { Sidebar } from './components/Sidebar';
import { PyramidView } from './components/PyramidView';
import { LayerCard } from './components/LayerCard';
import { DiagnosisMode } from './components/DiagnosisMode';
import { CascadeMode } from './components/CascadeMode';
import { MethodologyLibrary } from './components/MethodologyLibrary';
import { DocsPanel } from './components/DocsPanel';
import { FlowchartPanel } from './components/FlowchartPanel';
import { PromptManager } from './components/PromptManager';
import { ExportButton } from './components/ExportButton';
import { SettingsPanel } from './components/SettingsPanel';
import { SkillsManager } from './components/SkillsManager';
import { PenLine, Loader2, CloudOff, RefreshCw, CheckCircle2, PanelLeftOpen } from 'lucide-react';

function App() {
  const {
    canvasList,
    activeCanvas,
    activeId,
    setActiveId,
    updateLayerData,
    updateTitle,
    updateMethodologies,
    createNew,
    deleteCanvas,
    saveState,
    saveError,
    lastSyncedAt,
    retryRemoteSync,
  } = useCanvas();

  const { settings: aiSettings, updateSettings: updateAISettings, isConfigured: aiConfigured } = useAISettings();
  const { prompts, updatePrompt, resetPrompt, resetAll: resetAllPrompts } = usePrompts();
  const { builtInSkills, customSkills, allSkills, addSkill, updateSkill, deleteSkill } = useSkills();

  const [mode, setMode] = useState<AppMode>('cascade');
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Track which stateful modes have been activated (keep-alive)
  const [activatedModes, setActivatedModes] = useState<Set<AppMode>>(new Set(['cascade']));

  const handleModeChange = useCallback((newMode: AppMode) => {
    setActivatedModes((prev) => {
      const next = new Set(prev);
      next.add(newMode);
      return next;
    });
    setMode(newMode);
  }, []);

  const handleGoToLayer = useCallback((layerId: number) => {
    handleModeChange('overview');
    setActiveLayerId(layerId);
  }, [handleModeChange]);

  const handleCreateRunBoard = useCallback(() => {
    const stamp = new Date().toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/\//g, '-');
    createNew(`推导画板 ${stamp}`);
  }, [createNew]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar
          canvasList={canvasList}
          activeId={activeId}
          mode={mode}
          onSelectCanvas={setActiveId}
          onCreateNew={createNew}
          onDelete={deleteCanvas}
          onModeChange={handleModeChange}
        />
      </div>
      <Sidebar
        mobile
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        canvasList={canvasList}
        activeId={activeId}
        mode={mode}
        onSelectCanvas={setActiveId}
        onCreateNew={createNew}
        onDelete={deleteCanvas}
        onModeChange={(m) => {
          handleModeChange(m);
          setMobileSidebarOpen(false);
        }}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="打开菜单"
            >
              <PanelLeftOpen size={16} />
            </button>
            {editingTitle ? (
              <input
                autoFocus
                value={activeCanvas.title}
                onChange={(e) => updateTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                className="bg-transparent border-b border-slate-500 text-white text-base sm:text-lg font-semibold px-1 py-0 focus:outline-none focus:border-blue-400 w-full"
              />
            ) : (
              <h2
                className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 cursor-pointer hover:text-blue-300 transition-colors min-w-0 truncate"
                onClick={() => setEditingTitle(true)}
              >
                <span className="truncate">{activeCanvas.title}</span>
                <PenLine size={14} className="text-slate-500" />
              </h2>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <span className="hidden sm:block text-xs text-slate-500 order-3 sm:order-none w-full sm:w-auto">
              更新于 {new Date(activeCanvas.updatedAt).toLocaleString('zh-CN')}
            </span>
            <div
              className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 order-1 sm:order-none ${
                saveState === 'saved'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : saveState === 'syncing'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : saveState === 'error'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-slate-700/30 text-slate-400 border-slate-600/40'
              }`}
              title={saveError || '画布自动保存状态'}
            >
              {saveState === 'syncing' && (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span className="whitespace-nowrap sm:hidden">保存中</span>
                  <span className="whitespace-nowrap hidden sm:inline">云端保存中...</span>
                </>
              )}
              {saveState === 'saved' && (
                <>
                  <CheckCircle2 size={12} />
                  <span className="whitespace-nowrap sm:hidden">已保存</span>
                  <span className="whitespace-nowrap hidden sm:inline">已云端保存</span>
                  {lastSyncedAt ? <span className="hidden sm:inline"> {new Date(lastSyncedAt).toLocaleTimeString('zh-CN')}</span> : ''}
                </>
              )}
              {saveState === 'error' && (
                <>
                  <CloudOff size={12} />
                  <span className="whitespace-nowrap sm:hidden">保存失败</span>
                  <span className="whitespace-nowrap hidden sm:inline">云端保存失败（已本地保存）</span>
                  <button
                    onClick={retryRemoteSync}
                    className="ml-1 inline-flex items-center gap-1 underline hover:text-amber-200 cursor-pointer"
                  >
                    <RefreshCw size={10} />
                    重试
                  </button>
                </>
              )}
              {saveState === 'local-only' && (
                <>
                  <CloudOff size={12} />
                  <span className="whitespace-nowrap sm:hidden">仅本地保存</span>
                  <span className="whitespace-nowrap hidden sm:inline">仅本地保存（未配置云端）</span>
                </>
              )}
              {saveState === 'idle' && '准备保存...'}
            </div>
            <div className="order-2 sm:order-none"><SettingsPanel
              settings={aiSettings}
              isConfigured={aiConfigured}
              onUpdate={updateAISettings}
            /></div>
            <div className="order-2 sm:order-none"><ExportButton canvas={activeCanvas} /></div>
          </div>
        </header>

        <div className="p-6">
          {/* ===== Cascade Mode (keep-alive, default) ===== */}
          {activatedModes.has('cascade') && (
            <div style={{ display: mode === 'cascade' ? undefined : 'none' }}>
              <CascadeMode
                canvas={activeCanvas}
                aiSettings={aiSettings}
                aiConfigured={aiConfigured}
                onUpdateLayer={updateLayerData}
                onUpdateMethodologies={updateMethodologies}
                onCreateRunBoard={handleCreateRunBoard}
                onExit={() => handleModeChange('overview')}
                promptStore={prompts}
                skillsLibrary={allSkills}
              />
            </div>
          )}

          {/* ===== Overview Mode: Pyramid + Layer editing ===== */}
          {mode === 'overview' && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-80 shrink-0">
                <div className="lg:sticky lg:top-20">
                  <PyramidView
                    canvas={activeCanvas}
                    activeLayerId={activeLayerId}
                    onSelectLayer={setActiveLayerId}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {activeLayerId !== null ? (
                  <LayerCard
                    layer={LAYERS.find((l) => l.id === activeLayerId)!}
                    data={activeCanvas.layers[activeLayerId] || {}}
                    onChange={(d) => updateLayerData(activeLayerId, d)}
                    aiSettings={aiSettings}
                    aiConfigured={aiConfigured}
                    canvas={activeCanvas}
                    onGoToMethodologyLibrary={() => handleModeChange('methodologies')}
                    promptStore={prompts}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <p className="text-lg mb-2">点击左侧金字塔选择一个层级</p>
                    <p className="text-sm text-slate-600">查看或编辑该层级的内容</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== Methodology Library (keep-alive) ===== */}
          {activatedModes.has('methodologies') && (
            <div style={{ display: mode === 'methodologies' ? undefined : 'none' }}>
              <MethodologyLibrary
                canvas={activeCanvas}
                aiSettings={aiSettings}
                aiConfigured={aiConfigured}
                methodologies={activeCanvas.methodologies || []}
                onUpdateMethodologies={updateMethodologies}
                onApplyToLayer={(data) => updateLayerData(2, data)}
                onGoToLayer={handleGoToLayer}
                promptStore={prompts}
              />
            </div>
          )}

          {/* ===== Diagnosis Mode ===== */}
          {mode === 'diagnosis' && (
            <DiagnosisMode onGoToLayer={handleGoToLayer} />
          )}

          {/* ===== Flowchart Mode ===== */}
          {mode === 'flowchart' && <FlowchartPanel />}

          {/* ===== Prompt Manager ===== */}
          {mode === 'prompts' && (
            <PromptManager
              prompts={prompts}
              aiSettings={aiSettings}
              aiConfigured={aiConfigured}
              onUpdatePrompt={updatePrompt}
              onResetPrompt={resetPrompt}
              onResetAll={resetAllPrompts}
            />
          )}

          {/* ===== Skills Manager ===== */}
          {mode === 'skills' && (
            <SkillsManager
              builtInSkills={builtInSkills}
              customSkills={customSkills}
              onAddSkill={addSkill}
              onUpdateSkill={updateSkill}
              onDeleteSkill={deleteSkill}
            />
          )}

          {/* ===== Docs Mode ===== */}
          {mode === 'docs' && <DocsPanel />}
        </div>
      </main>
    </div>
  );
}

export default App;
