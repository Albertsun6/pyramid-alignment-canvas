import { useCallback, useState, useRef } from 'react';
import type { LayerConfig, LayerData, AISettings, CanvasData } from '../types';
import type { PromptStore } from '../hooks/usePrompts';
import { aiSuggestLayer } from '../services/ai';
import { Sparkles, Loader2, Check, AlertTriangle, Library } from 'lucide-react';

interface Props {
  layer: LayerConfig;
  data: LayerData;
  onChange: (data: LayerData) => void;
  // AI props (optional — if not provided, AI button won't show)
  aiSettings?: AISettings;
  aiConfigured?: boolean;
  canvas?: CanvasData;
  onGoToMethodologyLibrary?: () => void;
  promptStore?: PromptStore;
}

export function LayerCard({ layer, data, onChange, aiSettings, aiConfigured, canvas, onGoToMethodologyLibrary, promptStore }: Props) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDone, setAiDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleChange = useCallback(
    (fieldId: string, value: string | string[]) => {
      onChange({ ...data, [fieldId]: value });
    },
    [data, onChange]
  );

  const handleCheckToggle = useCallback(
    (fieldId: string, option: string) => {
      const current = (data[fieldId] as string[]) || [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      handleChange(fieldId, next);
    },
    [data, handleChange]
  );

  const handleAISuggest = useCallback(async () => {
    if (!aiSettings || !canvas) return;
    setAiLoading(true);
    setAiError(null);
    setAiDone(false);

    abortRef.current = new AbortController();
    const result = await aiSuggestLayer(aiSettings, canvas, layer.id, abortRef.current.signal, promptStore);

    if (result.success && result.data) {
      // Merge AI suggestion with existing data (AI fills empty fields, keeps user-filled ones)
      const merged = { ...data };
      for (const [key, val] of Object.entries(result.data)) {
        const existing = merged[key];
        const isEmpty = !existing || (typeof existing === 'string' && !existing.trim()) || (Array.isArray(existing) && existing.length === 0);
        if (isEmpty) {
          merged[key] = val;
        }
      }
      onChange(merged);
      setAiDone(true);
      setTimeout(() => setAiDone(false), 2000);
    } else {
      setAiError(result.error || '未知错误');
    }

    setAiLoading(false);
  }, [aiSettings, canvas, layer.id, data, onChange]);

  const handleAIOverwrite = useCallback(async () => {
    if (!aiSettings || !canvas) return;
    setAiLoading(true);
    setAiError(null);
    setAiDone(false);

    abortRef.current = new AbortController();
    const result = await aiSuggestLayer(aiSettings, canvas, layer.id, abortRef.current.signal, promptStore);

    if (result.success && result.data) {
      onChange(result.data);
      setAiDone(true);
      setTimeout(() => setAiDone(false), 2000);
    } else {
      setAiError(result.error || '未知错误');
    }

    setAiLoading(false);
  }, [aiSettings, canvas, layer.id, onChange]);

  const showAI = aiConfigured && aiSettings && canvas;

  return (
    <div
      className="rounded-xl p-5 animate-fade-in-up border"
      style={{
        background: layer.bgColor,
        borderColor: layer.borderColor,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: layer.color }}
          >
            {layer.id}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {layer.name}
              <span className="text-slate-400 text-sm font-normal ml-2">
                {layer.nameEn}
              </span>
            </h3>
            <p className="text-sm text-slate-400">{layer.subtitle}</p>
          </div>
        </div>

        {/* AI Buttons */}
        {showAI && (
          <div className="flex items-center gap-2">
            {aiLoading ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-sm">
                <Loader2 size={14} className="animate-spin" />
                AI 思考中...
              </div>
            ) : aiDone ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-sm">
                <Check size={14} />
                已填入
              </div>
            ) : (
              <>
                <button
                  onClick={handleAISuggest}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 text-sm transition-colors cursor-pointer border border-violet-500/30"
                  title="AI 补全空字段（保留已填内容）"
                >
                  <Sparkles size={14} />
                  AI 补全
                </button>
                <button
                  onClick={handleAIOverwrite}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 text-sm transition-colors cursor-pointer border border-slate-600/30"
                  title="AI 重写全部字段"
                >
                  AI 重写
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* AI Error */}
      {aiError && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">AI 调用失败：</span>
            {aiError}
          </div>
        </div>
      )}

      {/* Core Question */}
      <div
        className="mb-4 px-3 py-2 rounded-lg text-sm border"
        style={{
          background: 'rgba(0,0,0,0.2)',
          borderColor: layer.borderColor,
        }}
      >
        <span className="text-slate-500 mr-1">核心问题：</span>
        <span className="text-slate-300">{layer.coreQuestion}</span>
      </div>

      {/* Methodology Library shortcut — only for layer 2 */}
      {layer.id === 2 && onGoToMethodologyLibrary && (
        <div className="mb-4">
          <button
            onClick={onGoToMethodologyLibrary}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 text-sm font-medium transition-colors cursor-pointer"
          >
            <Library size={16} />
            打开方法论匹配 — 检索并应用方案
          </button>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        {layer.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {field.label}
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                value={(data[field.id] as string) || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-colors"
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                value={(data[field.id] as string) || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-colors"
              />
            )}

            {field.type === 'checklist' && field.options && (
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt) => {
                  const checked = ((data[field.id] as string[]) || []).includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => handleCheckToggle(field.id, opt)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all cursor-pointer ${
                        checked
                          ? 'bg-slate-700 border-slate-500 text-white'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {checked ? '✓ ' : ''}{opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
