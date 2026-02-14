import { LAYERS } from '../../data/layers';
import type { PromptStore } from '../../hooks/usePrompts';
import type { AIMessage, AISettings, CanvasData } from '../../types';
import { callChatAPI } from './client';
import { buildAllLayersContext, buildTargetLayerPrompt, buildUpperLayersContext } from './context';
import { parseLayerResponse } from './parsers';
import { p } from './prompt';
import type { AICallResult, IntentAnalysis } from './types';

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
  const cascadeInstruction =
    targetLayerId === 6
      ? p(promptStore, 'cascadeTop')
      : p(promptStore, 'cascadeDown').replace(/\{layerId\}/g, String(layer.id));
  const messages: AIMessage[] = [
    { role: 'system', content: p(promptStore, 'system') },
    { role: 'user', content: `${intentContext}\n\n---\n\n${context}\n\n---\n\n${cascadeInstruction}\n\n${targetPrompt}` },
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
    { role: 'user', content: `${context}\n\n---\n\n${targetPrompt}` },
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
  const cascadeInstruction =
    targetLayerId === 6
      ? '这是金字塔最顶层（终极承诺），用户需要你帮助他/她思考并明确自己最根本的承诺与底线。请提出有深度的建议。'
      : `请严格基于上层已确定的内容，向下推导出第${layer.id}层的具体内容。上层内容是约束条件，下层是在约束下的具体化。`;
  const messages: AIMessage[] = [
    { role: 'system', content: p(promptStore, 'system') },
    { role: 'user', content: `${context}\n\n---\n\n${cascadeInstruction}\n\n${targetPrompt}` },
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
