import { LAYERS } from '../data/layers';
import type { CanvasData } from '../types';

interface Props {
  canvas: CanvasData;
  activeLayerId: number | null;
  onSelectLayer: (id: number) => void;
}

export function PyramidView({ canvas, activeLayerId, onSelectLayer }: Props) {
  // Reversed: top of pyramid = highest layer
  const reversed = [...LAYERS].reverse();
  const totalLayers = reversed.length;

  function getLayerFillPercent(layerId: number): number {
    const layer = LAYERS.find((l) => l.id === layerId);
    if (!layer) return 0;
    const data = canvas.layers[layerId];
    if (!data) return 0;
    const filled = layer.fields.filter((f) => {
      const val = data[f.id];
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === 'string' && val.trim().length > 0;
    });
    return Math.round((filled.length / layer.fields.length) * 100);
  }

  return (
    <div className="flex flex-col items-center gap-1 py-4 select-none">
      <div className="text-xs text-slate-500 mb-2 tracking-widest uppercase">
        Pyramid Alignment Canvas
      </div>
      {reversed.map((layer, idx) => {
        const widthPercent = 30 + ((idx / (totalLayers - 1)) * 70);
        const fillPercent = getLayerFillPercent(layer.id);
        const isActive = activeLayerId === layer.id;

        return (
          <button
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className="relative group transition-all duration-300 rounded-md cursor-pointer border"
            style={{
              width: `${widthPercent}%`,
              minWidth: '140px',
              maxWidth: '100%',
              background: isActive ? layer.bgColor : 'rgba(30, 41, 59, 0.6)',
              borderColor: isActive ? layer.borderColor : 'rgba(71, 85, 105, 0.3)',
              padding: '8px 12px',
            }}
          >
            {/* Fill progress bar */}
            <div
              className="absolute inset-0 rounded-md opacity-20 transition-all duration-500"
              style={{
                width: `${fillPercent}%`,
                background: layer.color,
              }}
            />
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: layer.color }}
                />
                <span className="text-sm font-medium text-slate-200 truncate">
                  {layer.id}. {layer.name}
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {layer.nameEn}
                </span>
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {fillPercent}%
              </span>
            </div>
            <div className="relative text-xs text-slate-400 mt-0.5 text-left truncate">
              {layer.coreQuestion}
            </div>
          </button>
        );
      })}
    </div>
  );
}
