import type { AISettings, AIMessage, LayerConfig, LayerData, CanvasData, Methodology } from '../types';
import { LAYERS } from '../data/layers';
import type { PromptStore } from '../hooks/usePrompts';
import { DEFAULT_PROMPTS } from '../hooks/usePrompts';

// ========== Helper: get prompt content with fallback ==========

function p(store: PromptStore | undefined, id: string): string {
  return store?.[id]?.content ?? DEFAULT_PROMPTS[id]?.content ?? '';
}

// ========== Prompt Construction ==========

/**
 * Serialize a single layer's data into readable text
 */
function serializeLayerData(layer: LayerConfig, data: LayerData | undefined): string {
  if (!data) return '（未填写）';
  const parts: string[] = [];
  for (const field of layer.fields) {
    const val = data[field.id];
    if (Array.isArray(val) && val.length > 0) {
      parts.push(`【${field.label}】${val.join('、')}`);
    } else if (typeof val === 'string' && val.trim()) {
      parts.push(`【${field.label}】${val.trim()}`);
    }
  }
  return parts.length > 0 ? parts.join('\n') : '（未填写）';
}

/**
 * Build context from filled layers above the target layer (higher id = higher in pyramid)
 */
function buildUpperLayersContext(canvas: CanvasData, targetLayerId: number): string {
  const lines: string[] = [];
  for (let id = 6; id > targetLayerId; id--) {
    const layer = LAYERS.find((l) => l.id === id);
    if (!layer) continue;
    const data = canvas.layers[id];
    const text = serializeLayerData(layer, data);
    if (text !== '（未填写）') {
      lines.push(`=== 第${id}层：${layer.name}（${layer.nameEn}） ===\n${text}`);
    }
  }
  return lines.length > 0
    ? '以下是用户已填写的上层内容（从高到低）：\n\n' + lines.join('\n\n')
    : '用户尚未填写任何上层内容。';
}

/**
 * Build context from ALL filled layers (for single-layer AI assist)
 */
function buildAllLayersContext(canvas: CanvasData, excludeLayerId: number): string {
  const lines: string[] = [];
  for (let id = 6; id >= 0; id--) {
    if (id === excludeLayerId) continue;
    const layer = LAYERS.find((l) => l.id === id);
    if (!layer) continue;
    const data = canvas.layers[id];
    const text = serializeLayerData(layer, data);
    if (text !== '（未填写）') {
      lines.push(`=== 第${id}层：${layer.name}（${layer.nameEn}） ===\n${text}`);
    }
  }
  return lines.length > 0
    ? '以下是用户在其他层级已填写的内容：\n\n' + lines.join('\n\n')
    : '用户尚未填写任何其他层级的内容。';
}

/**
 * Build the target layer's field description for the AI to fill
 */
function buildTargetLayerPrompt(layer: LayerConfig): string {
  const fields = layer.fields.map((f) => {
    if (f.type === 'checklist' && f.options) {
      return `- "${f.label}"：从以下选项中选择适用的：[${f.options.join(', ')}]，返回逗号分隔的选中项`;
    }
    return `- "${f.label}"：${f.placeholder || '请填写'}`;
  });

  return `请为第${layer.id}层「${layer.name}（${layer.nameEn}）」填写以下字段：
核心问题：${layer.coreQuestion}

需要填写的字段：
${fields.join('\n')}

请严格按以下 JSON 格式返回（不要包含 markdown 代码块标记，直接返回 JSON）：
{
${layer.fields.map((f) => {
    if (f.type === 'checklist') {
      return `  "${f.id}": ["选中项1", "选中项2"]`;
    }
    return `  "${f.id}": "你的回答"`;
  }).join(',\n')}
}`;
}

// ========== API Call ==========

export interface AICallResult {
  success: boolean;
  data?: LayerData;
  rawText?: string;
  error?: string;
  /** The messages (prompt) sent to the AI */
  messages?: AIMessage[];
}

/**
 * Call OpenAI-compatible Chat Completions API
 */
async function callChatAPI(
  settings: AISettings,
  messages: AIMessage[],
  signal?: AbortSignal
): Promise<string> {
  const url = `${settings.baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${settings.apiKey}`,
  };

  if (settings.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Pyramid Alignment Canvas';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
    signal,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`API 请求失败 (${res.status}): ${errBody || res.statusText}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('API 返回为空');
  }
  return content;
}

/**
 * Parse AI response text into LayerData
 */
function parseLayerResponse(text: string, layer: LayerConfig): LayerData {
  let jsonStr = text.trim();

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const parsed = JSON.parse(jsonStr);
  const result: LayerData = {};

  for (const field of layer.fields) {
    const val = parsed[field.id];
    if (field.type === 'checklist') {
      if (Array.isArray(val)) {
        result[field.id] = val.filter((v: string) =>
          field.options?.includes(v)
        );
      } else if (typeof val === 'string') {
        const items = val.split(/[,，、]/).map((s: string) => s.trim());
        result[field.id] = items.filter((v: string) =>
          field.options?.includes(v)
        );
      }
    } else if (typeof val === 'string') {
      result[field.id] = val;
    }
  }

  return result;
}

// ========== Intent Analysis ==========

export interface IntentAnalysis {
  domain: string;
  goal: string;
  scope: string;
  keyDimensions: string[];
  constraints: string[];
  summary: string;
}

export interface IntentResult {
  success: boolean;
  analysis?: IntentAnalysis;
  rawText?: string;
  error?: string;
  messages?: AIMessage[];
}

/**
 * Analyze user intent from natural language input
 */
export async function aiAnalyzeIntent(
  settings: AISettings,
  userInput: string,
  signal?: AbortSignal,
  promptStore?: PromptStore
): Promise<IntentResult> {
  const messages: AIMessage[] = [
    { role: 'system', content: p(promptStore, 'intent') },
    {
      role: 'user',
      content: `用户说：「${userInput}」\n\n请分析这个意图。`,
    },
  ];

  try {
    const rawText = await callChatAPI(settings, messages, signal);
    let jsonStr = rawText.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const parsed = JSON.parse(jsonStr);
    const analysis: IntentAnalysis = {
      domain: parsed.domain || '',
      goal: parsed.goal || '',
      scope: parsed.scope || '',
      keyDimensions: Array.isArray(parsed.keyDimensions) ? parsed.keyDimensions : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
      summary: parsed.summary || '',
    };

    return { success: true, analysis, rawText, messages };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg, messages };
  }
}

/**
 * AI-fill a layer in cascade mode WITH intent context
 */
export async function aiCascadeLayerWithIntent(
  settings: AISettings,
  canvas: CanvasData,
  targetLayerId: number,
  intent: IntentAnalysis,
  signal?: AbortSignal,
  promptStore?: PromptStore
): Promise<AICallResult> {
  const layer = LAYERS.find((l) => l.id === targetLayerId);
  if (!layer) return { success: false, error: '未找到目标层级' };

  const context = buildUpperLayersContext(canvas, targetLayerId);
  const targetPrompt = buildTargetLayerPrompt(layer);

  const intentContext = `用户的意图：
- 领域：${intent.domain}
- 目标：${intent.goal}
- 范围：${intent.scope}
- 关键维度：${intent.keyDimensions.join('、')}
- 隐含约束：${intent.constraints.join('、')}
- 总结：${intent.summary}`;

  const cascadeInstruction = targetLayerId === 6
    ? p(promptStore, 'cascadeTop')
    : p(promptStore, 'cascadeDown').replace(/\{layerId\}/g, String(layer.id));

  const messages: AIMessage[] = [
    { role: 'system', content: p(promptStore, 'system') },
    {
      role: 'user',
      content: `${intentContext}\n\n---\n\n${context}\n\n---\n\n${cascadeInstruction}\n\n${targetPrompt}`,
    },
  ];

  try {
    const rawText = await callChatAPI(settings, messages, signal);
    const data = parseLayerResponse(rawText, layer);
    return { success: true, data, rawText, messages };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg, messages };
  }
}

// ========== Public API ==========

/**
 * AI-fill a single layer, using context from all other filled layers
 */
export async function aiSuggestLayer(
  settings: AISettings,
  canvas: CanvasData,
  targetLayerId: number,
  signal?: AbortSignal,
  promptStore?: PromptStore
): Promise<AICallResult> {
  const layer = LAYERS.find((l) => l.id === targetLayerId);
  if (!layer) return { success: false, error: '未找到目标层级' };

  const context = buildAllLayersContext(canvas, targetLayerId);
  const targetPrompt = buildTargetLayerPrompt(layer);

  const messages: AIMessage[] = [
    { role: 'system', content: p(promptStore, 'system') },
    {
      role: 'user',
      content: `${context}\n\n---\n\n${targetPrompt}`,
    },
  ];

  try {
    const rawText = await callChatAPI(settings, messages, signal);
    const data = parseLayerResponse(rawText, layer);
    return { success: true, data, rawText, messages };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg, messages };
  }
}

// ========== Methodology Search ==========

export interface MethodologySearchResult {
  success: boolean;
  methodologies?: Methodology[];
  rawText?: string;
  error?: string;
  messages?: AIMessage[];
}

/**
 * Parse AI response into Methodology objects
 */
function parseMethodologyResponse(text: string): Methodology[] {
  let jsonStr = text.trim();

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  const arrMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    jsonStr = arrMatch[0];
  }

  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) throw new Error('AI 返回的不是数组格式');

  return parsed.map((item: Record<string, string>) => ({
    id: crypto.randomUUID(),
    name: item.name || '未命名方法论',
    origin: item.origin || '',
    description: item.description || '',
    coreIdea: item.coreIdea || '',
    applicability: item.applicability || '',
    steps: item.steps || '',
    pros: item.pros || '',
    cons: item.cons || '',
    sources: item.sources || '',
    selected: false,
    createdAt: new Date().toISOString(),
  }));
}

/**
 * AI search for real-world methodologies based on upper layer constraints
 */
export async function aiSearchMethodologies(
  settings: AISettings,
  canvas: CanvasData,
  customQuery?: string,
  signal?: AbortSignal,
  intent?: IntentAnalysis,
  promptStore?: PromptStore
): Promise<MethodologySearchResult> {
  const context = buildUpperLayersContext(canvas, 2);

  const problemLayer = LAYERS.find((l) => l.id === 0);
  const problemData = canvas.layers[0];
  let problemContext = '';
  if (problemLayer && problemData) {
    const text = serializeLayerData(problemLayer, problemData);
    if (text !== '（未填写）') {
      problemContext = `\n\n用户要解决的问题：\n${text}`;
    }
  }

  let intentContext = '';
  if (intent) {
    intentContext = `\n\n用户的原始意图：
- 领域：${intent.domain}
- 目标：${intent.goal}
- 范围：${intent.scope}
- 关键维度：${intent.keyDimensions.join('、')}`;
  }

  const queryInstruction = customQuery
    ? `\n\n用户的额外搜索要求：${customQuery}`
    : '';

  const messages: AIMessage[] = [
    { role: 'system', content: p(promptStore, 'methodology') },
    {
      role: 'user',
      content: `${context}${problemContext}${intentContext}${queryInstruction}\n\n请基于以上约束，推荐 4-5 个真实存在的方法论。`,
    },
  ];

  try {
    const rawText = await callChatAPI(settings, messages, signal);
    const methodologies = parseMethodologyResponse(rawText);
    return { success: true, methodologies, rawText, messages };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg, messages };
  }
}

/**
 * AI-fill a layer in cascade mode: only use upper layers as context
 */
export async function aiCascadeLayer(
  settings: AISettings,
  canvas: CanvasData,
  targetLayerId: number,
  signal?: AbortSignal,
  promptStore?: PromptStore
): Promise<AICallResult> {
  const layer = LAYERS.find((l) => l.id === targetLayerId);
  if (!layer) return { success: false, error: '未找到目标层级' };

  const context = buildUpperLayersContext(canvas, targetLayerId);
  const targetPrompt = buildTargetLayerPrompt(layer);

  const cascadeInstruction = targetLayerId === 6
    ? '这是金字塔最顶层（终极承诺），用户需要你帮助他/她思考并明确自己最根本的承诺与底线。请提出有深度的建议。'
    : `请严格基于上层已确定的内容，向下推导出第${layer.id}层的具体内容。上层内容是约束条件，下层是在约束下的具体化。`;

  const messages: AIMessage[] = [
    { role: 'system', content: p(promptStore, 'system') },
    {
      role: 'user',
      content: `${context}\n\n---\n\n${cascadeInstruction}\n\n${targetPrompt}`,
    },
  ];

  try {
    const rawText = await callChatAPI(settings, messages, signal);
    const data = parseLayerResponse(rawText, layer);
    return { success: true, data, rawText, messages };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg, messages };
  }
}

// ========== AI Improve Prompt ==========

/**
 * Ask AI to improve/optimize a given prompt
 */
export async function aiImprovePrompt(
  settings: AISettings,
  promptName: string,
  promptContent: string,
  userInstruction?: string,
  signal?: AbortSignal
): Promise<{ success: boolean; improved?: string; error?: string }> {
  const systemMsg = `你是一位资深的 Prompt 工程师。你的任务是优化用户给你的 AI 提示词。

优化原则：
1. 保持原始意图和功能不变
2. 让指令更清晰、更具体
3. 减少歧义，增强约束
4. 保持 JSON 输出格式要求（如果原 prompt 包含的话）
5. 优化结构，让 AI 更容易遵循
6. 保持中文

请直接返回优化后的提示词文本，不要加任何解释、标题或 markdown 标记。`;

  const userMsg = userInstruction
    ? `以下是名为「${promptName}」的提示词：\n\n---\n${promptContent}\n---\n\n用户的修改要求：${userInstruction}\n\n请按要求优化这个提示词，直接返回优化后的完整文本。`
    : `以下是名为「${promptName}」的提示词：\n\n---\n${promptContent}\n---\n\n请优化这个提示词，直接返回优化后的完整文本。`;

  const messages: AIMessage[] = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: userMsg },
  ];

  try {
    const rawText = await callChatAPI(settings, messages, signal);
    // Strip any markdown fencing the AI might add despite instructions
    let improved = rawText.trim();
    const fenceMatch = improved.match(/^```(?:\w+)?\s*\n([\s\S]*?)\n```$/);
    if (fenceMatch) improved = fenceMatch[1].trim();
    return { success: true, improved };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg };
  }
}
