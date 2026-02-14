import { useState } from 'react';
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
    models: [
      { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4（推荐）' },
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
      { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
      { value: 'google/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro' },
      { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
      { value: 'deepseek/deepseek-reasoner', label: 'DeepSeek R1' },
      { value: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
      { value: 'qwen/qwen3-235b-a22b', label: 'Qwen3 235B' },
    ],
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

  const currentProvider = PROVIDERS.find((p) => p.id === settings.provider) ?? PROVIDERS[0];
  const modelList = currentProvider.models;
  const isModelInList = modelList.some((m) => m.value === settings.model);

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
    onUpdate(update);
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

                {/* Model list for providers with presets */}
                {modelList.length > 0 && !customModel && (
                  <div className="space-y-1.5 mb-2">
                    {modelList.map((m) => (
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
