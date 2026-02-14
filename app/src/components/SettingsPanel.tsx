import { useEffect, useMemo, useState } from 'react';
import type { AISettings, AIProvider } from '../types';
import { Settings, X, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface Props {
  settings: AISettings;
  isConfigured: boolean;
  onUpdate: (partial: Partial<AISettings>) => void;
}

interface ProviderPreset {
  id: AIProvider;
  name: string;
  baseUrl: string;
  keyPlaceholder: string;
  keyHint: string;
  docsUrl: string;
  models: { value: string; label: string }[];
}

interface OpenRouterModelItem {
  id: string;
  name?: string;
  created?: number;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

interface OpenRouterModelsResponse {
  data?: OpenRouterModelItem[];
}

const OPENROUTER_RECOMMENDED: { value: string; label: string }[] = [
  { value: 'anthropic/claude-opus-4.6', label: 'Claude Opus 4.6（强推）' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4（推荐）' },
  { value: 'openai/gpt-5.2-codex', label: 'GPT-5.2-Codex（代码）' },
  { value: 'openai/gpt-4o', label: 'GPT-4o（通用）' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini（快速/便宜）' },
  { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
  { value: 'deepseek/deepseek-reasoner', label: 'DeepSeek R1' },
  { value: 'qwen/qwen3-max-thinking', label: 'Qwen3 Max Thinking' },
  { value: 'qwen/qwen3-coder-next', label: 'Qwen3 Coder Next' },
  { value: 'openrouter/free', label: 'OpenRouter Free Router（免费路由）' },
];

const OPENROUTER_VENDOR_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'google', label: 'Google' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'qwen', label: 'Qwen' },
  { id: 'meta-llama', label: 'Llama' },
  { id: 'openrouter', label: 'OpenRouter' },
] as const;

const ROUTE_PRESETS = {
  conservative: {
    label: '保守',
    thresholdMethodology: 1,
    thresholdFull: 4,
    highImpact: '战略,组织,跨团队,跨部门,公司级,体系,治理,转型',
    uncertainty: '不确定,探索,复杂,冲突,取舍,长期,路线,范式',
    execute: '马上,今天,执行,落地,修复,脚本,页面,短期',
  },
  balanced: {
    label: '平衡',
    thresholdMethodology: 2,
    thresholdFull: 5,
    highImpact: '战略,组织,跨团队,跨部门,公司级,体系,治理,转型',
    uncertainty: '不确定,探索,复杂,冲突,取舍,长期,路线,范式',
    execute: '马上,今天,执行,落地,修复,脚本,页面,短期,快速',
  },
  aggressive: {
    label: '激进',
    thresholdMethodology: 3,
    thresholdFull: 7,
    highImpact: '组织,战略,跨团队,跨部门,治理,转型,平台化,中台',
    uncertainty: '不确定,探索,复杂,冲突,取舍,长期,路线,范式,多目标',
    execute: '马上,今天,执行,快速,临时,试验,小步',
  },
} as const;

const PROVIDERS: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-...',
    keyHint: '从 platform.openai.com/api-keys 获取',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o（推荐）' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini（快速/便宜）' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-...',
    keyHint: '从 openrouter.ai/keys 获取，支持数百种模型',
    docsUrl: 'https://openrouter.ai/keys',
    models: OPENROUTER_RECOMMENDED,
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    keyPlaceholder: '你的 API Key...',
    keyHint: '输入兼容 OpenAI 格式的服务地址与密钥',
    docsUrl: '',
    models: [],
  },
];

export function SettingsPanel({ settings, isConfigured, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [customModel, setCustomModel] = useState(false);
  const [modelQuery, setModelQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState<(typeof OPENROUTER_VENDOR_FILTERS)[number]['id']>('all');
  const [openrouterModels, setOpenrouterModels] = useState<{ value: string; label: string }[]>([]);
  const [openrouterLoading, setOpenrouterLoading] = useState(false);
  const [openrouterError, setOpenrouterError] = useState<string | null>(null);

  const currentProvider = PROVIDERS.find((p) => p.id === settings.provider) ?? PROVIDERS[0];
  const modelList = useMemo(() => {
    if (settings.provider !== 'openrouter') return currentProvider.models;
    const map = new Map<string, { value: string; label: string }>();
    for (const m of OPENROUTER_RECOMMENDED) map.set(m.value, m);
    for (const m of openrouterModels) {
      if (!map.has(m.value)) map.set(m.value, m);
    }
    return Array.from(map.values());
  }, [settings.provider, currentProvider.models, openrouterModels]);
  const displayedModelList = useMemo(() => {
    if (settings.provider !== 'openrouter') return modelList;
    return modelList.slice(0, 120);
  }, [settings.provider, modelList]);
  const filteredModelList = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    return displayedModelList.filter((m) => {
      if (vendorFilter !== 'all' && !m.value.toLowerCase().startsWith(`${vendorFilter}/`)) {
        return false;
      }
      if (!q) return true;
      const label = m.label.toLowerCase();
      const value = m.value.toLowerCase();
      return label.includes(q) || value.includes(q);
    });
  }, [displayedModelList, modelQuery, vendorFilter]);
  const isModelInList = modelList.some((m) => m.value === settings.model);

  useEffect(() => {
    if (!open || settings.provider !== 'openrouter') return;
    let cancelled = false;
    const ctrl = new AbortController();
    const load = async () => {
      setOpenrouterLoading(true);
      setOpenrouterError(null);
      try {
        const res = await fetch('https://openrouter.ai/api/v1/models', { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as OpenRouterModelsResponse;
        const data = Array.isArray(json.data) ? json.data : [];
        const normalized = data
          .filter((m) => {
            const inMods = m.architecture?.input_modalities ?? [];
            const outMods = m.architecture?.output_modalities ?? [];
            const textIn = inMods.length === 0 || inMods.includes('text');
            const textOut = outMods.length === 0 || outMods.includes('text');
            return textIn && textOut;
          })
          .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
          .map((m) => ({
            value: m.id,
            label: m.name?.trim() || m.id,
          }));
        if (!cancelled) setOpenrouterModels(normalized);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '加载失败';
          setOpenrouterError(msg);
        }
      } finally {
        if (!cancelled) setOpenrouterLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [open, settings.provider]);

  const handleProviderChange = (providerId: AIProvider) => {
    const provider = PROVIDERS.find((p) => p.id === providerId)!;
    const update: Partial<AISettings> = {
      provider: providerId,
      baseUrl: provider.baseUrl,
    };
    // Auto-select first model if current model is not in new provider's list
    if (provider.models.length > 0 && !provider.models.some((m) => m.value === settings.model)) {
      update.model = provider.models[0].value;
    }
    setCustomModel(false);
    setModelQuery('');
    setVendorFilter('all');
    onUpdate(update);
  };

  const updateNumber = (key: 'routeThresholdMethodology' | 'routeThresholdFull', value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    onUpdate({ [key]: Math.max(-10, Math.min(20, Math.round(num))) });
  };

  const applyRoutePreset = (presetId: keyof typeof ROUTE_PRESETS) => {
    const preset = ROUTE_PRESETS[presetId];
    onUpdate({
      routeThresholdMethodology: preset.thresholdMethodology,
      routeThresholdFull: preset.thresholdFull,
      routeKeywordsHighImpact: preset.highImpact,
      routeKeywordsUncertainty: preset.uncertainty,
      routeKeywordsExecute: preset.execute,
    });
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
          isConfigured
            ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
            : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30'
        }`}
        title="AI 设置"
      >
        <Settings size={14} />
        AI
        {isConfigured ? (
          <CheckCircle size={12} />
        ) : (
          <AlertCircle size={12} />
        )}
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-800 rounded-t-2xl z-10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings size={18} />
                AI 模型设置
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Provider selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  服务商
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                        settings.provider === p.id
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                          : 'bg-slate-900/40 text-slate-400 border-slate-700/50 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={settings.apiKey}
                    onChange={(e) => onUpdate({ apiKey: e.target.value })}
                    placeholder={currentProvider.keyPlaceholder}
                    className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-xs text-slate-500">
                    {currentProvider.keyHint}
                  </p>
                  {currentProvider.docsUrl && (
                    <a
                      href={currentProvider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5"
                    >
                      获取 <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  密钥仅存储在本地浏览器，不会上传到任何服务器
                </p>
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={settings.baseUrl}
                  onChange={(e) => onUpdate({ baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {settings.provider !== 'custom' && (
                  <p className="text-xs text-slate-600 mt-1">
                    已自动填入，如有代理可自行修改
                  </p>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  模型
                </label>
                {settings.provider === 'openrouter' && (
                  <div className="mb-2 space-y-2">
                    <div className="text-xs text-slate-500">
                      {openrouterLoading
                        ? '正在同步 OpenRouter 最新模型列表...'
                        : openrouterError
                        ? `拉取最新模型失败（已回退推荐列表）：${openrouterError}`
                        : `已同步 OpenRouter 最新模型，共 ${modelList.length} 个可选（列表显示前 ${displayedModelList.length} 个）`}
                    </div>
                    <input
                      type="text"
                      value={modelQuery}
                      onChange={(e) => setModelQuery(e.target.value)}
                      placeholder="搜索模型名称或ID，例如 claude / gpt / qwen..."
                      className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {OPENROUTER_VENDOR_FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setVendorFilter(f.id)}
                          className={`px-2 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
                            vendorFilter === f.id
                              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                              : 'bg-slate-900/40 text-slate-500 border-slate-700/50 hover:text-slate-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Model list for providers with presets */}
                {filteredModelList.length > 0 && !customModel && (
                  <div className="space-y-1.5 mb-2">
                    {filteredModelList.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => onUpdate({ model: m.value })}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer border ${
                          settings.model === m.value
                            ? 'bg-blue-600/15 text-blue-300 border-blue-500/40'
                            : 'bg-slate-900/40 text-slate-400 border-slate-700/30 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        <span className="font-medium">{m.label}</span>
                        <span className="text-xs text-slate-600 ml-2">{m.value}</span>
                      </button>
                    ))}
                  </div>
                )}
                {settings.provider === 'openrouter' && !customModel && filteredModelList.length === 0 && (
                  <div className="text-xs text-slate-500 px-2 py-3 border border-slate-700/50 rounded-lg bg-slate-900/30">
                    未找到匹配模型，请尝试其他关键词或使用“自定义模型名”。
                  </div>
                )}

                {/* Custom model input */}
                {(customModel || !isModelInList || settings.provider === 'custom') && (
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) => onUpdate({ model: e.target.value })}
                    placeholder="输入模型名称，例如 anthropic/claude-sonnet-4"
                    className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                )}

                {/* Toggle custom input */}
                {modelList.length > 0 && (
                  <button
                    onClick={() => {
                      setCustomModel(!customModel);
                      if (customModel && modelList.length > 0) {
                        onUpdate({ model: modelList[0].value });
                      }
                    }}
                    className="text-xs text-slate-500 hover:text-slate-400 mt-1.5 cursor-pointer"
                  >
                    {customModel ? '← 返回预设列表' : '使用自定义模型名 →'}
                  </button>
                )}
              </div>

              {/* Intent routing strategy */}
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-cyan-300">意图起点路由策略</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    调整“方法优先 / 方法论优先 / 全流程”的推荐阈值和关键词命中规则。
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">策略预设</div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ROUTE_PRESETS) as Array<keyof typeof ROUTE_PRESETS>).map((id) => (
                      <button
                        key={id}
                        onClick={() => applyRoutePreset(id)}
                        className="px-2.5 py-1 rounded-md text-xs border border-slate-600/60 bg-slate-900/40 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {ROUTE_PRESETS[id].label}
                      </button>
                    ))}
                    <button
                      onClick={() => applyRoutePreset('balanced')}
                      className="px-2.5 py-1 rounded-md text-xs border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                    >
                      恢复默认（平衡）
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-slate-400">
                    方法论阈值（大于等于）
                    <input
                      type="number"
                      value={settings.routeThresholdMethodology}
                      onChange={(e) => updateNumber('routeThresholdMethodology', e.target.value)}
                      className="mt-1 w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    全流程阈值（大于等于）
                    <input
                      type="number"
                      value={settings.routeThresholdFull}
                      onChange={(e) => updateNumber('routeThresholdFull', e.target.value)}
                      className="mt-1 w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </label>
                </div>
                <label className="block text-xs text-slate-400">
                  高影响关键词（加分，逗号分隔）
                  <input
                    type="text"
                    value={settings.routeKeywordsHighImpact}
                    onChange={(e) => onUpdate({ routeKeywordsHighImpact: e.target.value })}
                    className="mt-1 w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  高不确定关键词（加分，逗号分隔）
                  <input
                    type="text"
                    value={settings.routeKeywordsUncertainty}
                    onChange={(e) => onUpdate({ routeKeywordsUncertainty: e.target.value })}
                    className="mt-1 w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  执行导向关键词（减分，逗号分隔）
                  <input
                    type="text"
                    value={settings.routeKeywordsExecute}
                    onChange={(e) => onUpdate({ routeKeywordsExecute: e.target.value })}
                    className="mt-1 w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </label>
              </div>

              {/* Status */}
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
                  isConfigured
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                }`}
              >
                {isConfigured ? (
                  <>
                    <CheckCircle size={14} className="shrink-0" />
                    <span>已配置 <strong>{currentProvider.name}</strong> / <code className="text-xs bg-slate-700/50 px-1 py-0.5 rounded">{settings.model}</code></span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} className="shrink-0" />
                    请输入 API Key 以启用 AI 功能
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700 flex justify-end sticky bottom-0 bg-slate-800 rounded-b-2xl">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
