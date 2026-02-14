import type { LayerConfig, DiagnosisOption, CanvasData } from '../types';

export const LAYERS: LayerConfig[] = [
  {
    id: 0,
    name: '问题卡',
    nameEn: 'Problem',
    subtitle: '30 秒锁定问题',
    coreQuestion: '我到底要解决什么问题？',
    color: 'var(--color-layer-0)',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(100, 116, 139, 0.4)',
    fields: [
      { id: 'problem', label: '要解决的问题', placeholder: '用一句话描述你面对的核心问题...', type: 'textarea' },
      { id: 'success', label: '成功长什么样', placeholder: '达成后的具体状态/指标...', type: 'textarea' },
      { id: 'constraints', label: '硬约束', placeholder: '时间/预算/法规/安全/伦理红线...', type: 'textarea' },
    ],
  },
  {
    id: 1,
    name: '方法',
    nameEn: 'Method',
    subtitle: '这一步怎么做？',
    coreQuestion: '我要做的具体动作和步骤是什么？',
    color: 'var(--color-layer-1)',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    fields: [
      { id: 'action', label: '当前采用的具体做法', placeholder: '我正在用什么方法/工具/步骤...', type: 'textarea' },
      { id: 'steps', label: '关键步骤顺序', placeholder: '1. ... 2. ... 3. ...', type: 'textarea' },
      { id: 'criteria', label: '完成标准 / 验收条件', placeholder: '做到什么程度算合格...', type: 'textarea' },
      { id: 'failure', label: '失败模式与补救', placeholder: '可能出错的地方以及补救方案...', type: 'textarea' },
    ],
  },
  {
    id: 2,
    name: '方法论',
    nameEn: 'Methodology',
    subtitle: '为什么选这套做法？',
    coreQuestion: '备选方案、选型理由与评估指标是什么？',
    color: 'var(--color-layer-2)',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    fields: [
      { id: 'alternatives', label: '备选方案（至少2个）', placeholder: 'A: ... / B: ... / C: ...', type: 'textarea' },
      { id: 'reason', label: '选型理由（适用条件+权衡）', placeholder: '为什么选当前方案而非其他...', type: 'textarea' },
      { id: 'metrics', label: '评估指标（最多5个，带权重）', placeholder: '指标1 (30%) / 指标2 (25%) / ...', type: 'textarea' },
      { id: 'evidence', label: '证据来源', placeholder: '规范/实验/案例/数据/专家共识...', type: 'textarea' },
    ],
  },
  {
    id: 3,
    name: '元方法论',
    nameEn: 'Meta-Methodology',
    subtitle: '用什么原则评价方法论？',
    coreQuestion: '我用什么标准判断方法论的好坏？',
    color: 'var(--color-layer-3)',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    fields: [
      {
        id: 'standards',
        label: '判断"好方法论"的标准',
        placeholder: '',
        type: 'checklist',
        options: ['可复验', '可迁移', '可审计', '成本可控', '风险可控', '可解释', '伦理正当'],
      },
      { id: 'standardsExtra', label: '其他标准（补充）', placeholder: '还有哪些你认为重要的标准...', type: 'text' },
      { id: 'uncertainty', label: '不确定性策略', placeholder: '保守系数/冗余/分阶段验证/可回滚/止损线...', type: 'textarea' },
      { id: 'priority', label: '冲突裁决规则（优先级排序）', placeholder: '例如：安全 > 合规 > 伦理 > 长期 > 短期 > 成本', type: 'textarea' },
    ],
  },
  {
    id: 4,
    name: '范式',
    nameEn: 'Paradigm',
    subtitle: '什么算问题、什么算答案？',
    coreQuestion: '我们默认的基本规则集与证据标准是什么？',
    color: 'var(--color-layer-4)',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    fields: [
      { id: 'definition', label: '我们默认的"好"是什么（一句话）', placeholder: '例如：安全与可维护性高于一次性美观', type: 'text' },
      { id: 'evidenceStd', label: '什么算可靠证据', placeholder: '规范/实验数据/用户研究/A-B测试/运维数据...', type: 'textarea' },
      { id: 'authority', label: '谁有最终验收权', placeholder: '工程师/用户/监管/社区/投资人...', type: 'text' },
      { id: 'redline', label: '不可触碰边界（红线）', placeholder: '绝对不能违反的底线...', type: 'textarea' },
    ],
  },
  {
    id: 5,
    name: '世界观',
    nameEn: 'Worldview',
    subtitle: '本体 / 认识 / 价值背景',
    coreQuestion: '我对世界、知识和价值的根本信念是什么？',
    color: 'var(--color-layer-5)',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    fields: [
      { id: 'ontology', label: '本体论（世界更像什么）', placeholder: '物质为主/信息为主/关系为主/...', type: 'text' },
      { id: 'epistemology', label: '认识论（我如何知道）', placeholder: '经验/理性/权威/共识/启示/...', type: 'text' },
      { id: 'values', label: '最看重的价值排序（前三）', placeholder: '1. ... 2. ... 3. ...', type: 'textarea' },
      { id: 'humanNature', label: '人性/社会假设（一句话）', placeholder: '人是理性的/情境的/利己利他混合的...', type: 'text' },
      { id: 'timeHorizon', label: '时间尺度', placeholder: '更重视当下/五年/一代人/更久', type: 'text' },
    ],
  },
  {
    id: 6,
    name: '终极承诺',
    nameEn: 'Ultimate Commitment',
    subtitle: '即使代价很大也不放弃什么？',
    coreQuestion: '我最根本的、不靠证据也要坚持的承诺是什么？',
    color: 'var(--color-layer-6)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    fields: [
      { id: 'commitment', label: '愿意为之付代价的终极承诺', placeholder: '例如：生命尊严不可交易...', type: 'textarea' },
      { id: 'bottomLine', label: '绝不愿意跨过的底线', placeholder: '我绝不会...', type: 'textarea' },
    ],
  },
];

export const DIAGNOSIS_OPTIONS: DiagnosisOption[] = [
  { text: '总在争具体步骤怎么做', layerId: 1 },
  { text: '总在争该用哪套方案', layerId: 2 },
  { text: '总在争"凭什么相信这个"', layerId: 3 },
  { text: '总在争"这到底算不算好"', layerId: 4 },
  { text: '总在争"什么更重要 / 人生意义"', layerId: 5 },
  { text: '感觉有不可调和的底线冲突', layerId: 6 },
];

export function createEmptyCanvas(): CanvasData {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: '未命名画布',
    createdAt: now,
    updatedAt: now,
    layers: {},
  };
}
