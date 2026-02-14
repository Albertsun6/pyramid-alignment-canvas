import { useState } from 'react';
import type { CanvasData, AppMode } from '../types';
import { Plus, FileText, Stethoscope, Trash2, PanelLeftClose, PanelLeftOpen, Sparkles, BookOpen, Library, GitBranch, Code2, Eye } from 'lucide-react';

interface Props {
  canvasList: CanvasData[];
  activeId: string;
  mode: AppMode;
  onSelectCanvas: (id: string) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
  onModeChange: (mode: AppMode) => void;
}

const MODE_ITEMS: { mode: AppMode; icon: typeof FileText; label: string }[] = [
  { mode: 'cascade', icon: Sparkles, label: 'AI 级联推导' },
  { mode: 'overview', icon: Eye, label: '画布总览' },
  { mode: 'methodologies', icon: Library, label: '方法论库' },
  { mode: 'diagnosis', icon: Stethoscope, label: '一眼诊断' },
  { mode: 'flowchart', icon: GitBranch, label: '流程图' },
  { mode: 'prompts', icon: Code2, label: '提示词管理' },
  { mode: 'docs', icon: BookOpen, label: '文档中心' },
];

export function Sidebar({
  canvasList,
  activeId,
  mode,
  onSelectCanvas,
  onCreateNew,
  onDelete,
  onModeChange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <aside className="w-12 shrink-0 border-r border-slate-700/50 bg-slate-900/50 flex flex-col h-full items-center py-3 gap-3">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="展开侧边栏"
        >
          <PanelLeftOpen size={16} />
        </button>
        <div className="w-6 border-t border-slate-700" />
        {MODE_ITEMS.map(({ mode: m, icon: Icon }) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              mode === m
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
            title={MODE_ITEMS.find((i) => i.mode === m)?.label}
          >
            <Icon size={16} />
          </button>
        ))}
        <div className="w-6 border-t border-slate-700" />
        <button
          onClick={onCreateNew}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="新建画布"
        >
          <Plus size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-60 shrink-0 border-r border-slate-700/50 bg-slate-900/50 flex flex-col h-full">
      {/* Logo / Title */}
      <div className="p-4 border-b border-slate-700/50 flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <span className="text-xl">△</span> 金字塔对齐画布
          </h1>
          <p className="text-xs text-slate-500 mt-1">Pyramid Alignment Canvas</p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors cursor-pointer mt-0.5"
          title="折叠侧边栏"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      {/* Mode switcher */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">模式</div>
        <div className="space-y-1">
          {MODE_ITEMS.map(({ mode: m, icon: Icon, label }) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                mode === m
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider">画布列表</span>
          <button
            onClick={onCreateNew}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="新建画布"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {canvasList.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                c.id === activeId
                  ? 'bg-slate-700/50 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              }`}
              onClick={() => onSelectCanvas(c.id)}
            >
              <FileText size={13} className="shrink-0" />
              <span className="truncate flex-1">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                title="删除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
