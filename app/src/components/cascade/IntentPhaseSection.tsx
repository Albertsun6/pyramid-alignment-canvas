import { AlertTriangle, ArrowDown, Brain, Loader2, MessageSquareText, RotateCcw, Send, Sparkles } from 'lucide-react';
import type { IntentAnalysis } from '../../services/ai';
import type { Phase, RouteRecommendation, StartPath } from './types';
import type { SkillTemplate } from '../../types';

interface Props {
  phase: Phase;
  intentInput: string;
  setIntentInput: (value: string) => void;
  intentAnalysis: IntentAnalysis | null;
  intentError: string | null;
  recommendedSkills: SkillTemplate[];
  selectedSkills: SkillTemplate[];
  onToggleSkillSelection: (skillId: string) => void;
  routeRecommendation: RouteRecommendation | null;
  selectedStartPath: StartPath;
  onSelectStartPath: (path: StartPath) => void;
  aiConfigured: boolean;
  onAnalyzeIntent: () => void;
  onReAnalyze: () => void;
  onStartCascade: () => void;
}

export function IntentPhaseSection({
  phase,
  intentInput,
  setIntentInput,
  intentAnalysis,
  intentError,
  recommendedSkills,
  selectedSkills,
  onToggleSkillSelection,
  routeRecommendation,
  selectedStartPath,
  onSelectStartPath,
  aiConfigured,
  onAnalyzeIntent,
  onReAnalyze,
  onStartCascade,
}: Props) {
  if (phase === 'intent-input') {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <MessageSquareText size={16} />
            <span className="font-medium">第一步：描述你的意图</span>
          </div>
          <textarea
            value={intentInput}
            onChange={(e) => setIntentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                onAnalyzeIntent();
              }
            }}
            placeholder="用自然语言描述你想做什么。比如：&#10;&#10;• 我想为一个 10 人团队选择项目管理方法&#10;• 我要设计一套适合初创公司的产品开发流程&#10;• 我正在装修房子，需要一个决策框架&#10;• 我想建立个人知识管理体系"
            rows={5}
            className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors text-sm leading-relaxed resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-600">Ctrl+Enter 快速提交</p>
            <button
              onClick={onAnalyzeIntent}
              disabled={!intentInput.trim() || !aiConfigured}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                !intentInput.trim() || !aiConfigured
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white'
              }`}
            >
              <Send size={14} />
              分析意图
            </button>
          </div>
        </div>

        {intentError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">分析失败：</span>
              {intentError}
            </div>
          </div>
        )}

        {!aiConfigured && (
          <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            请先在右上角配置 AI API Key
          </div>
        )}
      </div>
    );
  }

  if (phase === 'intent-analyzing') {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-4">
          <Brain size={28} className="text-violet-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 size={14} className="animate-spin" />
          正在分析你的意图...
        </div>
        <p className="text-xs text-slate-600 mt-2">识别领域、目标、范围和关键维度</p>
      </div>
    );
  }

  if (phase === 'intent-confirmed' && intentAnalysis) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-300">
          即将开始新一轮推导：系统会自动创建新的推导画板，避免覆盖历史结果。
        </div>
        <IntentCard
          input={intentInput}
          analysis={intentAnalysis}
          recommendedSkills={recommendedSkills}
          selectedSkills={selectedSkills}
          onToggleSkillSelection={onToggleSkillSelection}
          routeRecommendation={routeRecommendation}
          selectedStartPath={selectedStartPath}
          onSelectStartPath={onSelectStartPath}
          onReAnalyze={onReAnalyze}
          onStartCascade={onStartCascade}
        />
      </div>
    );
  }

  return null;
}

function IntentCard({
  input,
  analysis,
  recommendedSkills,
  selectedSkills,
  onToggleSkillSelection,
  routeRecommendation,
  selectedStartPath,
  onSelectStartPath,
  onReAnalyze,
  onStartCascade,
}: {
  input: string;
  analysis: IntentAnalysis;
  recommendedSkills: SkillTemplate[];
  selectedSkills: SkillTemplate[];
  onToggleSkillSelection: (skillId: string) => void;
  routeRecommendation: RouteRecommendation | null;
  selectedStartPath: StartPath;
  onSelectStartPath: (path: StartPath) => void;
  onReAnalyze: () => void;
  onStartCascade: () => void;
}) {
  const options: { id: StartPath; label: string; desc: string }[] = [
    { id: 'method', label: '方法优先', desc: '先做可执行步骤，适合短周期低风险任务' },
    { id: 'methodology', label: '方法论优先', desc: '先统一选型标准，再进入执行' },
    { id: 'full', label: '全流程推导', desc: '从 L6 到 L0 完整对齐，适合复杂决策' },
  ];

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
          <MessageSquareText size={14} className="text-slate-400" />
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">你的意图</div>
          <div className="text-sm text-slate-300 leading-relaxed">{input}</div>
        </div>
      </div>

      <div className="border-t border-violet-500/20" />

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
          <Brain size={14} className="text-violet-400" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="text-xs text-violet-400 font-medium">AI 意图分析</div>
          <div className="grid grid-cols-2 gap-3">
            <AnalysisField label="领域" value={analysis.domain} />
            <AnalysisField label="范围" value={analysis.scope} />
          </div>
          <AnalysisField label="核心目标" value={analysis.goal} />

          {analysis.keyDimensions.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1.5">关键维度</div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keyDimensions.map((d, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.constraints.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1.5">隐含约束</div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.constraints.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(analysis.impactScope || analysis.reversibility || analysis.riskLevel) && (
            <div>
              <div className="text-xs text-slate-500 mb-1.5">路由评估</div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.impactScope && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    影响范围：{analysis.impactScope}
                  </span>
                )}
                {analysis.reversibility && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    可逆性：{analysis.reversibility}
                  </span>
                )}
                {analysis.riskLevel && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    风险：{analysis.riskLevel}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-slate-800/50 px-3 py-2.5 text-sm text-slate-300 leading-relaxed">
            {analysis.summary}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
        <div className="text-xs text-cyan-300 font-medium mb-2">推荐起点路由</div>
        {routeRecommendation && (
          <p className="text-xs text-slate-300 mb-3">
            系统推荐：<span className="text-cyan-300">{options.find((o) => o.id === routeRecommendation.recommendedPath)?.label}</span>
            {' '}· {routeRecommendation.reason}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelectStartPath(opt.id)}
              className={`text-left rounded-lg border px-3 py-2 transition-colors cursor-pointer ${
                selectedStartPath === opt.id
                  ? 'border-cyan-500/40 bg-cyan-500/10'
                  : 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <div className="text-sm text-white">{opt.label}</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="text-xs text-emerald-300 font-medium mb-2">Skills（可选）</div>
        <p className="text-xs text-slate-400 mb-2">选择技能后，系统会将对应约束注入后续 AI 推导。</p>
        {recommendedSkills.length > 0 ? (
          <div className="space-y-2">
            {recommendedSkills.map((skill) => {
              const selected = selectedSkills.some((s) => s.id === skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => onToggleSkillSelection(skill.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition-colors cursor-pointer ${
                    selected
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-white">{skill.name}</span>
                    <span className={`text-[11px] ${selected ? 'text-emerald-300' : 'text-slate-500'}`}>
                      {selected ? '已启用' : '未启用'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{skill.description}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-500">当前意图暂无明显匹配技能，可直接开始推导。</div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onReAnalyze}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          重新描述
        </button>
        <button
          onClick={onStartCascade}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <Sparkles size={14} />
          确认，按所选起点开始
          <ArrowDown size={14} />
        </button>
      </div>
    </div>
  );
}

function AnalysisField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm text-slate-200">{value}</div>
    </div>
  );
}
