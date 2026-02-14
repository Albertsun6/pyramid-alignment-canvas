import { useState } from 'react';
import { DIAGNOSIS_OPTIONS, LAYERS } from '../data/layers';
import { AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';

interface Props {
  onGoToLayer: (layerId: number) => void;
}

export function DiagnosisMode({ onGoToLayer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const result = selected !== null ? LAYERS.find((l) => l.id === selected) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-4">
          <AlertTriangle size={16} />
          卡点诊断
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">卡住了？找到根因在哪一层</h2>
        <p className="text-slate-400">选择最接近你当前困境的描述</p>
      </div>

      <div className="space-y-3">
        {DIAGNOSIS_OPTIONS.map((opt) => {
          const isSelected = selected === opt.layerId;
          const layer = LAYERS.find((l) => l.id === opt.layerId)!;
          return (
            <button
              key={opt.layerId}
              onClick={() => setSelected(opt.layerId)}
              className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: layer.color }}
                >
                  {layer.id}
                </span>
                <div>
                  <div className="text-sm font-medium text-white">{opt.text}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    → 第 {layer.id} 层「{layer.name}」不一致
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Result */}
      {result && (
        <div
          className="mt-6 p-5 rounded-xl border animate-fade-in-up"
          style={{
            background: result.bgColor,
            borderColor: result.borderColor,
          }}
        >
          <h3 className="text-lg font-bold text-white mb-2">
            诊断结果：第 {result.id} 层「{result.name}」需要对齐
          </h3>
          <p className="text-sm text-slate-300 mb-1">
            <span className="text-slate-500">核心问题：</span>
            {result.coreQuestion}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            建议回到此层的画布卡片，逐字段确认各方理解是否一致。
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onGoToLayer(result.id)}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1 cursor-pointer transition-colors"
              style={{ background: result.color }}
            >
              前往第 {result.id} 层 <ArrowRight size={14} />
            </button>
            <button
              onClick={() => setSelected(null)}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={14} /> 重选
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
