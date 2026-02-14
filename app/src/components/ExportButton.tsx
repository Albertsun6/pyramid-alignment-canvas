import { LAYERS } from '../data/layers';
import type { CanvasData } from '../types';
import { Download } from 'lucide-react';

interface Props {
  canvas: CanvasData;
}

function canvasToMarkdown(canvas: CanvasData): string {
  const lines: string[] = [];
  lines.push(`# ${canvas.title}`);
  lines.push('');
  lines.push(`> 创建于 ${new Date(canvas.createdAt).toLocaleString('zh-CN')}`);
  lines.push(`> 更新于 ${new Date(canvas.updatedAt).toLocaleString('zh-CN')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const layer of LAYERS) {
    const data = canvas.layers[layer.id];
    lines.push(`## ${layer.id}. ${layer.name}（${layer.nameEn}）`);
    lines.push(`*${layer.subtitle} — ${layer.coreQuestion}*`);
    lines.push('');

    for (const field of layer.fields) {
      const value = data?.[field.id];
      lines.push(`### ${field.label}`);
      if (Array.isArray(value)) {
        lines.push(value.length > 0 ? value.map((v) => `- [x] ${v}`).join('\n') : '*（未填写）*');
        // Also list unchecked options
        if (field.options) {
          const unchecked = field.options.filter((o) => !value.includes(o));
          if (unchecked.length > 0) {
            lines.push(unchecked.map((v) => `- [ ] ${v}`).join('\n'));
          }
        }
      } else if (typeof value === 'string' && value.trim()) {
        lines.push(value);
      } else {
        lines.push('*（未填写）*');
      }
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function ExportButton({ canvas }: Props) {
  const handleExport = () => {
    const md = canvasToMarkdown(canvas);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${canvas.title || '金字塔画布'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors cursor-pointer"
      title="导出为 Markdown"
    >
      <Download size={14} />
      导出
    </button>
  );
}
