import { LAYERS } from '../../data/layers';
import type { PromptStore } from '../../hooks/usePrompts';
import type { AIMessage, AISettings, CanvasData } from '../../types';
import { retrieveMethodologies } from '../methodologyRetrieval';
import { callChatAPI } from './client';
import { buildUpperLayersContext, serializeLayerData } from './context';
import { parseMethodologyResponse } from './parsers';
import { p } from './prompt';
import type {
  CreateMethodologyResult,
  IntentAnalysis,
  MethodologySearchResult,
} from './types';

export async function aiSearchMethodologies(
  settings: AISettings,
  canvas: CanvasData,
  customQuery?: string,
  signal?: AbortSignal,
  intent?: IntentAnalysis,
  promptStore?: PromptStore
): Promise<MethodologySearchResult> {
  const retrieval = retrieveMethodologies(canvas, customQuery, intent, 5);
  if (retrieval.methodologies.length > 0) {
    return {
      success: true,
      methodologies: retrieval.methodologies,
      source: 'retrieval',
      topScore: retrieval.meta.topScore,
      avgTop3: retrieval.meta.avgTop3,
      isLowConfidence: retrieval.meta.isLowConfidence,
      rawText: `检索优先已命中 ${retrieval.methodologies.length} 个候选，Top1=${retrieval.meta.topScore}，Top3均值=${retrieval.meta.avgTop3}`,
    };
  }

  const context = buildUpperLayersContext(canvas, 2);
  const problemLayer = LAYERS.find((l) => l.id === 0);
  const problemData = canvas.layers[0];
  let problemContext = '';
  if (problemLayer && problemData) {
    const text = serializeLayerData(problemLayer, problemData);
    if (text !== '（未填写）') problemContext = `\n\n用户要解决的问题：\n${text}`;
  }

  let intentContext = '';
  if (intent) {
    intentContext = `\n\n用户的原始意图：
- 领域：${intent.domain}
- 目标：${intent.goal}
- 范围：${intent.scope}
- 关键维度：${intent.keyDimensions.join('、')}`;
  }

  const queryInstruction = customQuery ? `\n\n用户的额外搜索要求：${customQuery}` : '';
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
    return { success: true, methodologies, rawText, messages, source: 'ai', isLowConfidence: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg, messages };
  }
}

export async function aiCreateMethodology(
  settings: AISettings,
  canvas: CanvasData,
  intent?: IntentAnalysis,
  signal?: AbortSignal,
  _promptStore?: PromptStore
): Promise<CreateMethodologyResult> {
  const context = buildUpperLayersContext(canvas, 2);
  let intentContext = '';
  if (intent) {
    intentContext = `\n\n用户的原始意图：
- 领域：${intent.domain}
- 目标：${intent.goal}
- 范围：${intent.scope}
- 关键维度：${intent.keyDimensions.join('、')}
- 隐含约束：${intent.constraints.join('、')}`;
  }

  const systemPrompt = `你是一位资深的方法论设计专家。当现有方法论无法满足用户需求时，你可以基于用户的上层约束和意图，**创造性地设计 2-3 个定制化的方法论框架**。

设计原则：
1. 每个方法论都必须严格匹配用户上层约束（元方法论标准、范式要求、世界观偏好）
2. 要有清晰的理论基础，可以融合多个已有方法论的精华
3. 必须可操作——有明确的步骤和验收标准
4. 标注"AI 定制"来源，并说明参考了哪些现有理论
5. 为每个方法论指定一个分类标签

请严格按以下 JSON 数组格式返回（不要包含 markdown 代码块标记，直接返回 JSON）：
[
  {
    "name": "方法论名称（简洁有力）",
    "origin": "AI 定制 · 融合自: xxx + yyy",
    "category": "分类标签（如：项目管理、产品设计、系统思维、决策分析、组织管理、技术架构、个人成长、创新方法 等）",
    "description": "200字以内详细描述，包含设计思路和理论基础",
    "coreIdea": "一句话核心思想",
    "applicability": "精确匹配的适用场景",
    "steps": "关键步骤（用编号列出，5-8步）",
    "pros": "优势（2-3点）",
    "cons": "局限与风险（2-3点）",
    "sources": "参考的理论/方法论来源"
  }
]`;

  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `${context}${intentContext}\n\n现有的方法论搜索没有找到完全匹配的结果。请基于以上约束和意图，为用户设计 2-3 个定制化的方法论框架。`,
    },
  ];

  try {
    const rawText = await callChatAPI(settings, messages, signal);
    const methodologies = parseMethodologyResponse(rawText, true);
    return { success: true, methodologies, rawText, messages };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg, messages };
  }
}
