import { useMemo, useState } from 'react';
import type { SkillTemplate } from '../types';
import { Brain, Plus, Save, Trash2 } from 'lucide-react';

interface Props {
  builtInSkills: SkillTemplate[];
  customSkills: SkillTemplate[];
  onAddSkill: (skill: Omit<SkillTemplate, 'id' | 'builtIn'>) => void;
  onUpdateSkill: (id: string, patch: Partial<SkillTemplate>) => void;
  onDeleteSkill: (id: string) => void;
}

const PATH_OPTIONS: Array<{ id: 'method' | 'methodology' | 'full'; label: string }> = [
  { id: 'method', label: '方法优先' },
  { id: 'methodology', label: '方法论优先' },
  { id: 'full', label: '全流程推导' },
];

const EXAMPLE_SKILL_TEMPLATES: Array<{
  id: string;
  label: string;
  value: {
    name: string;
    description: string;
    tags: string;
    promptHints: string;
    preferredStartPath: 'method' | 'methodology' | 'full';
  };
}> = [
  {
    id: 'budget-first',
    label: '预算优先',
    value: {
      name: '预算优先',
      description: '先明确预算上限与成本结构，再给执行方案。',
      tags: '预算,成本,财务,ROI',
      promptHints: '先给预算上限和关键成本项\n每一步都要给出成本影响\n超预算时必须提供降级方案',
      preferredStartPath: 'methodology',
    },
  },
  {
    id: 'launch-fast',
    label: '快速上线',
    value: {
      name: '快速上线',
      description: '优先最小可上线方案，缩短从决策到交付的时间。',
      tags: '快速,上线,MVP,迭代',
      promptHints: '优先给出最小可用版本\n每个阶段限定时间盒\n先上线后优化，避免过度设计',
      preferredStartPath: 'method',
    },
  },
  {
    id: 'compliance-first',
    label: '合规优先',
    value: {
      name: '合规优先',
      description: '先识别合规边界与审计要求，再设计实施路径。',
      tags: '合规,审计,风控,治理',
      promptHints: '先列出合规红线和不可触碰项\n每个方案标注审计证据需求\n风险未闭环前不得进入执行阶段',
      preferredStartPath: 'full',
    },
  },
];

export function SkillsManager({
  builtInSkills,
  customSkills,
  onAddSkill,
  onUpdateSkill,
  onDeleteSkill,
}: Props) {
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    tags: '',
    promptHints: '',
    preferredStartPath: 'methodology' as 'method' | 'methodology' | 'full',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filteredBuiltIn = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return builtInSkills;
    return builtInSkills.filter((s) =>
      `${s.name} ${s.description} ${s.tags.join(' ')}`.toLowerCase().includes(q)
    );
  }, [builtInSkills, query]);

  const filteredCustom = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customSkills;
    return customSkills.filter((s) =>
      `${s.name} ${s.description} ${s.tags.join(' ')}`.toLowerCase().includes(q)
    );
  }, [customSkills, query]);

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    onAddSkill({
      name: draft.name.trim(),
      description: draft.description.trim(),
      tags: draft.tags
        .split(/[,\n，、；;]/)
        .map((x) => x.trim())
        .filter(Boolean),
      promptHints: draft.promptHints
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
      preferredStartPath: draft.preferredStartPath,
    });
    setDraft({
      name: '',
      description: '',
      tags: '',
      promptHints: '',
      preferredStartPath: 'methodology',
    });
  };

  const applyExampleTemplate = (templateId: string) => {
    const tpl = EXAMPLE_SKILL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setDraft(tpl.value);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm mb-3">
          <Brain size={15} />
          技能管理
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">管理你的 Skills</h2>
        <p className="text-sm text-slate-400">新增/编辑/删除自定义技能，系统将在意图阶段进行推荐并注入推导</p>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
        <h3 className="text-sm font-medium text-emerald-300">什么是技能（Skills）？</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          技能是“可复用的推导策略模板”。你选择技能后，系统会把该技能的约束提示自动注入后续 AI
          推导，帮助输出更贴合你的工作方式（如风险优先、证据驱动、快速试验）。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2.5">
            <div className="text-xs text-slate-300 font-medium mb-1">什么时候用</div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• 你希望 AI 输出遵循固定方法（例如先识别风险再给方案）</li>
              <li>• 团队希望形成统一的分析和决策风格</li>
              <li>• 同类问题反复出现，需要沉淀可复用模板</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 px-3 py-2.5">
            <div className="text-xs text-slate-300 font-medium mb-1">如何使用（推荐）</div>
            <ol className="text-xs text-slate-400 space-y-1">
              <li>1. 在本页新增或调整技能</li>
              <li>2. 进入“开始推导”，在意图确认阶段启用技能</li>
              <li>3. 确认起点路由后开始推导，观察输出是否更贴合</li>
              <li>4. 根据结果回到本页持续微调</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
        <div className="text-sm text-slate-300 font-medium">新增自定义技能</div>
        <div className="space-y-1">
          <div className="text-xs text-slate-400">示例模板（一键填入）</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SKILL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyExampleTemplate(tpl.id)}
                className="px-2.5 py-1 rounded-md text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            placeholder="技能名称（如：预算优先）"
            className="bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
          />
          <select
            value={draft.preferredStartPath}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                preferredStartPath: e.target.value as 'method' | 'methodology' | 'full',
              }))
            }
            className="bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            {PATH_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                起点建议：{p.label}
              </option>
            ))}
          </select>
        </div>
        <input
          value={draft.description}
          onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          placeholder="技能描述"
          className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
          <p className="text-[11px] text-slate-500 -mt-1">描述建议写“适用场景 + 目标”，便于后续推荐命中。</p>
        <input
          value={draft.tags}
          onChange={(e) => setDraft((p) => ({ ...p, tags: e.target.value }))}
          placeholder="标签（逗号分隔，如：预算,成本,财务）"
          className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
        <p className="text-[11px] text-slate-500 -mt-1">标签用于意图阶段自动推荐，建议 3-6 个高辨识关键词。</p>
        <textarea
          value={draft.promptHints}
          onChange={(e) => setDraft((p) => ({ ...p, promptHints: e.target.value }))}
          rows={3}
          placeholder={'提示约束（每行一条，如：\n先给预算上限\n每步输出成本指标）'}
          className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
        <p className="text-[11px] text-slate-500 -mt-1">
          提示约束会直接注入 AI 上下文，建议使用“必须/优先/避免”这类可执行表达。
        </p>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium cursor-pointer"
        >
          <Plus size={14} />
          新增技能
        </button>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索技能（名称/描述/标签）"
          className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">你的自定义技能（{filteredCustom.length}）</h3>
        {filteredCustom.length === 0 ? (
          <div className="text-sm text-slate-500 px-3 py-4 rounded-lg border border-slate-700/50 bg-slate-800/20">
            还没有自定义技能，先新增一个吧。
          </div>
        ) : (
          filteredCustom.map((skill) => {
            const editing = editingId === skill.id;
            return (
              <div key={skill.id} className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4 space-y-2">
                {editing ? (
                  <>
                    <input
                      value={skill.name}
                      onChange={(e) => onUpdateSkill(skill.id, { name: e.target.value })}
                      className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                    <input
                      value={skill.description}
                      onChange={(e) => onUpdateSkill(skill.id, { description: e.target.value })}
                      className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                    <input
                      value={skill.tags.join(', ')}
                      onChange={(e) =>
                        onUpdateSkill(skill.id, {
                          tags: e.target.value.split(/[,\n，、；;]/).map((x) => x.trim()).filter(Boolean),
                        })
                      }
                      className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                    <textarea
                      value={skill.promptHints.join('\n')}
                      rows={3}
                      onChange={(e) =>
                        onUpdateSkill(skill.id, {
                          promptHints: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean),
                        })
                      }
                      className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm text-white font-medium">{skill.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{skill.description}</div>
                      </div>
                      <div className="text-xs text-slate-500">
                        起点建议：{PATH_OPTIONS.find((p) => p.id === skill.preferredStartPath)?.label || '方法论优先'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skill.tags.map((t) => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 pt-1">
                  {editing ? (
                    <button
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs cursor-pointer"
                    >
                      <Save size={12} />
                      完成编辑
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingId(skill.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs cursor-pointer"
                    >
                      编辑
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteSkill(skill.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs cursor-pointer"
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">内置技能（{filteredBuiltIn.length}）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredBuiltIn.map((skill) => (
            <div key={skill.id} className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3">
              <div className="text-sm text-white font-medium">{skill.name}</div>
              <div className="text-xs text-slate-400 mt-1">{skill.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {skill.tags.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
