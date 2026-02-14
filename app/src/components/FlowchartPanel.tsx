import { useState, useCallback } from 'react';
import { BPMN_FLOWS, type BpmnFlow } from '../data/bpmn-flows';
import { BpmnEditor } from './BpmnEditor';
import {
  GitBranch,
  Eye,
  Pencil,
  Download,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';

export function FlowchartPanel() {
  const [activeFlowId, setActiveFlowId] = useState<string>(BPMN_FLOWS[0].id);
  const [editable, setEditable] = useState(false);
  const [customXmls, setCustomXmls] = useState<Record<string, string>>({});

  const activeFlow = BPMN_FLOWS.find((f) => f.id === activeFlowId)!;
  const currentXml = customXmls[activeFlowId] || activeFlow.xml;

  const handleXmlChange = useCallback(
    (xml: string) => {
      setCustomXmls((prev) => ({ ...prev, [activeFlowId]: xml }));
    },
    [activeFlowId]
  );

  const handleReset = useCallback(() => {
    setCustomXmls((prev) => {
      const next = { ...prev };
      delete next[activeFlowId];
      return next;
    });
  }, [activeFlowId]);

  const handleExportSvg = useCallback(() => {
    // Export current XML as downloadable file
    const blob = new Blob([currentXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFlow.name}-流程图.bpmn`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentXml, activeFlow.name]);

  const isModified = !!customXmls[activeFlowId];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <GitBranch size={20} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">流程图（BPMN 2.0）</h2>
          <p className="text-sm text-slate-400">
            每种使用模式的标准业务流程图，支持查看和编辑
          </p>
        </div>
      </div>

      {/* Flow selector tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {BPMN_FLOWS.map((flow: BpmnFlow) => (
          <button
            key={flow.id}
            onClick={() => setActiveFlowId(flow.id)}
            className={`px-3 py-2 rounded-lg text-sm transition-all cursor-pointer border ${
              flow.id === activeFlowId
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 font-medium'
                : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300'
            }`}
          >
            {flow.name}
          </button>
        ))}
      </div>

      {/* Active flow info + controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <ChevronRight size={14} className="text-slate-600" />
          <span className="text-slate-300 font-medium">{activeFlow.name}</span>
          <span className="text-slate-600">—</span>
          <span>{activeFlow.description}</span>
          {isModified && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              已修改
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View / Edit toggle */}
          <div className="flex rounded-lg border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => setEditable(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                !editable
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'bg-slate-800/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Eye size={12} />
              查看
            </button>
            <button
              onClick={() => setEditable(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors cursor-pointer border-l border-slate-700/50 ${
                editable
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'bg-slate-800/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Pencil size={12} />
              编辑
            </button>
          </div>

          {isModified && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs transition-colors cursor-pointer"
              title="恢复原始流程"
            >
              <RotateCcw size={12} />
              重置
            </button>
          )}

          <button
            onClick={handleExportSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs transition-colors cursor-pointer"
            title="下载 BPMN 文件"
          >
            <Download size={12} />
            导出
          </button>
        </div>
      </div>

      {/* BPMN Canvas */}
      <div
        className="flex-1 rounded-xl border border-slate-700/50 overflow-hidden"
        style={{ background: '#fff', minHeight: '450px' }}
      >
        <BpmnEditor
          key={`${activeFlowId}-${editable}`}
          xml={currentXml}
          editable={editable}
          onXmlChange={handleXmlChange}
        />
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-emerald-500 inline-block" />
          开始事件
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-blue-400 bg-blue-400/20 inline-block" />
          用户任务
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-violet-400 bg-violet-400/20 inline-block" />
          AI 服务任务
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rotate-45 border border-amber-400 bg-amber-400/10 inline-block" />
          决策网关
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-red-400 bg-red-400/30 inline-block" />
          结束事件
        </span>
      </div>
    </div>
  );
}
