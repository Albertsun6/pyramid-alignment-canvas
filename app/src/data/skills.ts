import type { SkillTemplate } from '../types';

export const SKILL_LIBRARY: SkillTemplate[] = [
  {
    id: 'risk-first',
    name: '风险优先',
    description: '优先识别关键风险、失败模式和止损条件。',
    tags: ['风险', '不确定性', '合规', '高成本', '高影响'],
    preferredStartPath: 'full',
    promptHints: [
      '优先输出关键风险、触发条件与预警信号。',
      '每个方案都需要包含止损线和回退方案。',
      '在结论前明确高概率失败模式及缓解动作。',
    ],
  },
  {
    id: 'experiment-fast',
    name: '快速试验',
    description: '小步快跑，先做最小可验证方案再迭代。',
    tags: ['快速', '试验', '验证', 'MVP', '短期'],
    preferredStartPath: 'method',
    promptHints: [
      '优先给出最小可验证步骤，避免一次性大方案。',
      '每个阶段给出可量化验证指标与时间盒。',
      '先解决关键假设，再扩展范围。',
    ],
  },
  {
    id: 'stakeholder-align',
    name: '干系人对齐',
    description: '强调跨团队沟通、角色分工和协作边界。',
    tags: ['团队', '跨部门', '对齐', '协作', '沟通'],
    preferredStartPath: 'methodology',
    promptHints: [
      '输出中明确角色分工、决策权和协作接口。',
      '优先识别共识点/分歧点，并给出对齐动作。',
      '给出会议节奏、同步机制与冲突升级路径。',
    ],
  },
  {
    id: 'evidence-driven',
    name: '证据驱动',
    description: '强调数据与证据标准，减少主观拍脑袋。',
    tags: ['数据', '证据', '指标', '可复验', '分析'],
    preferredStartPath: 'methodology',
    promptHints: [
      '所有关键结论需绑定可验证指标和数据来源。',
      '区分定性与定量证据，并说明局限。',
      '避免仅凭经验判断，优先提出验证计划。',
    ],
  },
  {
    id: 'long-term',
    name: '长期主义',
    description: '关注长期收益、复利效应和可持续性。',
    tags: ['长期', '战略', '可持续', '复利', '路线图'],
    preferredStartPath: 'full',
    promptHints: [
      '同时给出短期动作与中长期路线图。',
      '优先考虑可持续性与长期副作用。',
      '识别短期收益与长期价值冲突并给出取舍原则。',
    ],
  },
];
