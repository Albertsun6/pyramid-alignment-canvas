import type { PromptStore } from '../../hooks/usePrompts';
import type { AIMessage, AISettings } from '../../types';
import { callChatAPI } from './client';
import { p } from './prompt';
import type { IntentAnalysis, IntentResult } from './types';

export async function aiAnalyzeIntent(
  settings: AISettings,
  userInput: string,
  signal?: AbortSignal,
  promptStore?: PromptStore
): Promise<IntentResult> {
  const messages: AIMessage[] = [
    { role: 'system', content: p(promptStore, 'intent') },
    { role: 'user', content: `用户说：「${userInput}」\n\n请分析这个意图。` },
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
      impactScope: parsed.impactScope || '',
      reversibility: parsed.reversibility || '',
      riskLevel: parsed.riskLevel || '',
      summary: parsed.summary || '',
    };
    return { success: true, analysis, rawText, messages };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg, messages };
  }
}
