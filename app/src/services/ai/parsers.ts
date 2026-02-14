import type { LayerConfig, LayerData, Methodology } from '../../types';

function unwrapJson(text: string): string {
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  return jsonStr;
}

export function parseLayerResponse(text: string, layer: LayerConfig): LayerData {
  let jsonStr = unwrapJson(text);
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];
  const parsed = JSON.parse(jsonStr);
  const result: LayerData = {};
  for (const field of layer.fields) {
    const val = parsed[field.id];
    if (field.type === 'checklist') {
      if (Array.isArray(val)) {
        result[field.id] = val.filter((v: string) => field.options?.includes(v));
      } else if (typeof val === 'string') {
        result[field.id] = val
          .split(/[,，、]/)
          .map((s: string) => s.trim())
          .filter((v: string) => field.options?.includes(v));
      }
    } else if (typeof val === 'string') {
      result[field.id] = val;
    }
  }
  return result;
}

export function parseMethodologyResponse(text: string, aiGenerated = false): Methodology[] {
  let jsonStr = unwrapJson(text);
  const arrMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrMatch) jsonStr = arrMatch[0];
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) throw new Error('AI 返回的不是数组格式');
  return parsed.map((item: Record<string, string>) => ({
    id: crypto.randomUUID(),
    name: item.name || '未命名方法论',
    origin: item.origin || '',
    category: item.category || '未分类',
    description: item.description || '',
    coreIdea: item.coreIdea || '',
    applicability: item.applicability || '',
    steps: item.steps || '',
    pros: item.pros || '',
    cons: item.cons || '',
    sources: item.sources || '',
    selected: false,
    createdAt: new Date().toISOString(),
    aiGenerated,
  }));
}
