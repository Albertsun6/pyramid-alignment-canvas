import { LAYERS } from '../../data/layers';
import type { CanvasData, LayerConfig, LayerData } from '../../types';

export function serializeLayerData(layer: LayerConfig, data: LayerData | undefined): string {
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

export function buildUpperLayersContext(canvas: CanvasData, targetLayerId: number): string {
  const lines: string[] = [];
  for (let id = 6; id > targetLayerId; id--) {
    const layer = LAYERS.find((l) => l.id === id);
    if (!layer) continue;
    const text = serializeLayerData(layer, canvas.layers[id]);
    if (text !== '（未填写）') {
      lines.push(`=== 第${id}层：${layer.name}（${layer.nameEn}） ===\n${text}`);
    }
  }
  return lines.length > 0
    ? '以下是用户已填写的上层内容（从高到低）：\n\n' + lines.join('\n\n')
    : '用户尚未填写任何上层内容。';
}

export function buildAllLayersContext(canvas: CanvasData, excludeLayerId: number): string {
  const lines: string[] = [];
  for (let id = 6; id >= 0; id--) {
    if (id === excludeLayerId) continue;
    const layer = LAYERS.find((l) => l.id === id);
    if (!layer) continue;
    const text = serializeLayerData(layer, canvas.layers[id]);
    if (text !== '（未填写）') {
      lines.push(`=== 第${id}层：${layer.name}（${layer.nameEn}） ===\n${text}`);
    }
  }
  return lines.length > 0
    ? '以下是用户在其他层级已填写的内容：\n\n' + lines.join('\n\n')
    : '用户尚未填写任何其他层级的内容。';
}

export function buildTargetLayerPrompt(layer: LayerConfig): string {
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
${layer.fields
  .map((f) => (f.type === 'checklist' ? `  "${f.id}": ["选中项1", "选中项2"]` : `  "${f.id}": "你的回答"`))
  .join(',\n')}
}`;
}
