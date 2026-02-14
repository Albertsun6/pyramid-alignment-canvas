import type { PromptStore } from '../../hooks/usePrompts';
import { DEFAULT_PROMPTS } from '../../hooks/usePrompts';

export function p(store: PromptStore | undefined, id: string): string {
  return store?.[id]?.content ?? DEFAULT_PROMPTS[id]?.content ?? '';
}
