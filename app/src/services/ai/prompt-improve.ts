import type { AISettings, AIMessage } from '../../types';
import { callChatAPI } from './client';

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
    let improved = rawText.trim();
    const fenceMatch = improved.match(/^```(?:\w+)?\s*\n([\s\S]*?)\n```$/);
    if (fenceMatch) improved = fenceMatch[1].trim();
    return { success: true, improved };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return { success: false, error: msg };
  }
}
