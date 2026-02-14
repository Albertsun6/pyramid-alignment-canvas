import { useState } from 'react';
import type { CanvasData, AppMode } from '../types';
import { Plus, FileText, Stethoscope, Trash2, PanelLeftClose, PanelLeftOpen, Sparkles, BookOpen, Library, GitBranch, Code2, Eye, Brain } from 'lucide-react';

interface Props {
  canvasList: CanvasData[];
  activeId: string;
  mode: AppMode;
  onSelectCanvas: (id: string) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
  onModeChange: (mode: AppMode) => void;
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
}

interface ModeItem {
  mode: AppMode;
  icon: typeof FileText;
  label: string;
  secondary?: boolean;
}

const MODE_ITEMS: ModeItem[] = [
  { mode: 'cascade', icon: Sparkles, label: '开始推导' },
  { mode: 'methodologies', icon: Library, label: '方法论匹配' },
  { mode: 'diagnosis', icon: Stethoscope, label: '卡点诊断' },
  { mode: 'flowchart', icon: GitBranch, label: '流程示意' },
  { mode: 'prompts', icon: Code2, label: '高级设置' },
  { mode: 'skills', icon: Brain, label: '技能管理', secondary: true },
  { mode: 'docs', icon: BookOpen, label: '帮助文档' },
  { mode: 'overview', icon: Eye, label: '画板总览', secondary: true },
];

interface CanvasGroup {
  label: string;
  items: CanvasData[];
}

function groupCanvasesByDate(list: CanvasData[]): CanvasGroup[] {
  const sorted = [...list].sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt).getTime();
    const tb = new Date(b.updatedAt || b.createdAt).getTime();
    return tb - ta;
  });

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 24 * 60 * 60 * 1000;

  const today: CanvasData[] = [];
  const yesterday: CanvasData[] = [];
  const earlier: CanvasData[] = [];

  for (const c of sorted) {
    const t = new Date(c.updatedAt || c.createdAt).getTime();
    if (t >= startToday) today.push(c);
    else if (t >= startYesterday) yesterday.push(c);
    else earlier.push(c);
  }

  const groups: CanvasGroup[] = [];
  if (today.length > 0) groups.push({ label: '今天', items: today });
  if (yesterday.length > 0) groups.push({ label: '昨天', items: yesterday });
  if (earlier.length > 0) groups.push({ label: '更早', items: earlier });
  return groups;
}

export function Sidebar({
  canvasList,
  activeId,
  mode,
  onSelectCanvas,
  onCreateNew,
  onDelete,
  onModeChange,
  mobile = false,
  open = false,
  onClose,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const canvasGroups = groupCanvasesByDate(canvasList);
  const primaryModeItems = MODE_ITEMS.filter((item) => !item.secondary);
  const secondaryModeItems = MODE_ITEMS.filter((item) => item.secondary);

  if (mobile) {
    return (
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <button
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-label="关闭侧边栏"
        />
        <aside
          className={`relative h-full w-[84%] max-w-xs border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-xl flex flex-col transition-transform ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-700/50 flex items-start justify-between">
            <div>
              <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span className="text-xl">△</span> 知行对齐
              </h1>
              <p className="text-xs text-slate-500 mt-1">Pyramid Alignment Canvas</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors cursor-pointer mt-0.5"
              title="关闭侧边栏"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>

          <div className="p-3 border-b border-slate-700/50">
            <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">模式</div>
            <div className="space-y-1">
              {primaryModeItems.map(({ mode: m, icon: Icon, label }) => (
                <button
                  key={m}
                  onClick={() => {
                    onModeChange(m);
                    onClose?.();
                  }}
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
              {secondaryModeItems.length > 0 && (
                <>
                  <div className="my-2 border-t border-slate-800/80" />
                  <div className="px-3 pt-1 pb-1 text-[11px] text-slate-600 uppercase tracking-wider">更多工具</div>
                  {secondaryModeItems.map(({ mode: m, icon: Icon, label }) => (
                    <button
                      key={m}
                      onClick={() => {
                        onModeChange(m);
                        onClose?.();
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        mode === m
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon size={15} />
                        {label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600/70 text-slate-500">
                        次级
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">画布列表</span>
              <button
                onClick={() => {
                  onCreateNew();
                  onClose?.();
                }}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="新建画布"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {canvasGroups.map((group) => (
                <div key={group.label}>
                  <div className="text-[11px] text-slate-600 uppercase tracking-wider mb-1 px-1">{group.label}</div>
                  <div className="space-y-1">
                    {group.items.map((c) => (
                      <div
                        key={c.id}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                          c.id === activeId
                            ? 'bg-slate-700/50 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                        onClick={() => {
                          onSelectCanvas(c.id);
                          onClose?.();
                        }}
                      >
                        <FileText size={13} className="shrink-0" />
                        <span className="truncate flex-1">{c.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(c.id);
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                          title="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    );
  }

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
        {MODE_ITEMS.map(({ mode: m, icon: Icon, label, secondary }) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              mode === m
                ? 'bg-blue-600/20 text-blue-400'
                : secondary
                ? 'text-slate-600 hover:bg-slate-800 hover:text-slate-400'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
            title={`${label}${secondary ? '（次级）' : ''}`}
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
                <span className="text-xl">△</span> 知行对齐
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
          {primaryModeItems.map(({ mode: m, icon: Icon, label }) => (
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
          {secondaryModeItems.length > 0 && (
            <>
              <div className="my-2 border-t border-slate-800/80" />
              <div className="px-3 pt-1 pb-1 text-[11px] text-slate-600 uppercase tracking-wider">更多工具</div>
              {secondaryModeItems.map(({ mode: m, icon: Icon, label }) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    mode === m
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={15} />
                    {label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600/70 text-slate-500">
                    次级
                  </span>
                </button>
              ))}
            </>
          )}
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
        <div className="space-y-3">
          {canvasGroups.map((group) => (
            <div key={group.label}>
              <div className="text-[11px] text-slate-600 uppercase tracking-wider mb-1 px-1">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((c) => (
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
          ))}
        </div>
      </div>
    </aside>
  );
}
