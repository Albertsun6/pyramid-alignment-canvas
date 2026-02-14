import { useState, useCallback } from 'react';
import type { AppMode } from './types';
import { LAYERS } from './data/layers';
import { useCanvas } from './hooks/useCanvas';
import { useAISettings } from './hooks/useAISettings';
import { usePrompts } from './hooks/usePrompts';
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
import { PenLine } from 'lucide-react';

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
  } = useCanvas();

  const { settings: aiSettings, updateSettings: updateAISettings, isConfigured: aiConfigured } = useAISettings();
  const { prompts, updatePrompt, resetPrompt, resetAll: resetAllPrompts } = usePrompts();

  const [mode, setMode] = useState<AppMode>('cascade');
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        canvasList={canvasList}
        activeId={activeId}
        mode={mode}
        onSelectCanvas={setActiveId}
        onCreateNew={createNew}
        onDelete={deleteCanvas}
        onModeChange={handleModeChange}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <input
                autoFocus
                value={activeCanvas.title}
                onChange={(e) => updateTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                className="bg-transparent border-b border-slate-500 text-white text-lg font-semibold px-1 py-0 focus:outline-none focus:border-blue-400"
              />
            ) : (
              <h2
                className="text-lg font-semibold text-white flex items-center gap-2 cursor-pointer hover:text-blue-300 transition-colors"
                onClick={() => setEditingTitle(true)}
              >
                {activeCanvas.title}
                <PenLine size={14} className="text-slate-500" />
              </h2>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              更新于 {new Date(activeCanvas.updatedAt).toLocaleString('zh-CN')}
            </span>
            <SettingsPanel
              settings={aiSettings}
              isConfigured={aiConfigured}
              onUpdate={updateAISettings}
            />
            <ExportButton canvas={activeCanvas} />
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
                onExit={() => handleModeChange('overview')}
                promptStore={prompts}
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

          {/* ===== Docs Mode ===== */}
          {mode === 'docs' && <DocsPanel />}
        </div>
      </main>
    </div>
  );
}

export default App;
