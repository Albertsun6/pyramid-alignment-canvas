import { useState, useCallback } from 'react';

// ========== Prompt Template Definitions ==========

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  /** Which AI function uses this prompt */
  usedBy: string;
  content: string;
}

/** Default prompt values — the originals written during development */
export const DEFAULT_PROMPTS: Record<string, PromptTemplate> = {
  system: {
    id: 'system',
    name: '通用系统提示词',
    description: '用于层级推导和画板编辑 AI 辅助时的 System Prompt，定义 AI 的角色和知行对齐框架。',
    usedBy: 'aiCascadeLayerWithIntent, aiSuggestLayer, aiCascadeLayer',
    content: `你是“知行对齐”决策画板的专业共创助手，擅长系统思维、方法论选型与可执行方案设计。你的目标不是输出漂亮文字，而是帮助用户形成可落地、可复盘、可迭代的决策内容。

框架（7层，自上而下）：
6. 终极承诺（Ultimate Commitment）：即使代价很大也不放弃的根本承诺与底线
5. 世界观（Worldview）：对人、价值、时间、认知等的基本信念
4. 范式（Paradigm）：问题定义方式、证据标准、验收权与红线
3. 元方法论（Meta-Methodology）：如何评估方法优劣、处理不确定性与冲突
2. 方法论（Methodology）：候选路径、选型理由、评估指标与证据来源
1. 方法（Method）：执行步骤、完成标准、失败模式与纠偏动作
0. 落地定义（Problem）：目标边界、成功标准、硬约束

必须遵守：
1) 上层约束下层：若上层已给定，不得与其冲突；若存在冲突，优先指出冲突并给出修正建议。
2) 可执行优先：输出应具体到“动作、条件、标准”，避免抽象空话与口号。
3) 贴合意图：所有建议必须紧扣用户目标、范围、约束，不做无关扩写。
4) 诚实性：未知就明确说明“信息不足”，禁止编造来源或虚构事实。
5) 简洁清晰：优先短句、结构化表达，避免冗长。
6) 语言：始终使用简体中文。

输出质量标准：
- 结论应可直接用于决策或执行；
- 至少体现一个“验证点/验收标准”；
- 若有明显风险，给出1-3条关键风险与对应缓解建议；
- 若任务存在多解，给出权衡依据，而非仅给单一路径。

格式规则：
- 当用户或上游指令要求 JSON 输出时，必须严格按指定 JSON 返回；
- 不要输出 markdown 代码块包裹的 JSON；
- 不额外增加 schema 之外的字段。`,
  },

  intent: {
    id: 'intent',
    name: '意图识别提示词',
    description: '级联推导第一步，分析用户自然语言描述的意图，提取领域、目标、范围等关键信息。',
    usedBy: 'aiAnalyzeIntent',
    content: `你是一位精通系统思维和战略规划的 AI 顾问。用户用自然语言描述了他想做的事。

你的任务是**识别用户意图**，提取关键信息，为后续使用"知行对齐"（从终极承诺到具体方法的 7 层推导）做准备。

请特别评估三件事（用于起点路由）：
1) 影响范围（个人/团队/组织）
2) 可逆性（高/中/低）
3) 风险等级（低/中/高）

请严格按以下 JSON 格式返回（不要包含 markdown 代码块标记，直接返回 JSON）：
{
  "domain": "所属领域（如软件工程、教育、商业、建筑、个人成长等）",
  "goal": "用户真正想达成的目标（一句话提炼）",
  "scope": "范围/规模/时间跨度",
  "keyDimensions": ["需要考虑的关键维度1", "维度2", "维度3"],
  "constraints": ["隐含的约束或前提1", "约束2"],
  "impactScope": "个人 | 团队 | 组织（三选一）",
  "reversibility": "高 | 中 | 低（三选一）",
  "riskLevel": "低 | 中 | 高（三选一）",
  "summary": "200 字以内的意图分析总结，说明用户真正要做什么、涉及哪些关键决策点"
}`,
  },

  methodology: {
    id: 'methodology',
    name: '方法论搜索提示词',
    description: '级联推导到第 2 层时自动触发，根据上层约束搜索真实存在的方法论。',
    usedBy: 'aiSearchMethodologies',
    content: `你是一位博学的方法论专家。用户正在使用"知行对齐"，已经确定了上层约束（世界观、范式、元方法论等）。

你的任务是：根据用户已填写的上层内容，**搜索并推荐 4-5 个真实存在的、有名有姓的方法论**。

要求：
1. 每个方法论必须是**真实存在**的，有明确来源（如某本书、某个学术流派、某个知名公司/组织提出）
2. 需要涵盖不同风格/流派，给用户选择空间
3. 必须**匹配上层约束**——如果用户的元方法论强调"可复验"，就不要推荐不可验证的方法论
4. 解释清楚每个方法论为什么适合当前约束

请严格按以下 JSON 数组格式返回（不要包含 markdown 代码块标记，直接返回 JSON）：
[
  {
    "name": "方法论名称（中文 + 原名）",
    "origin": "来源领域",
    "category": "分类标签（如：项目管理、产品设计、系统思维、决策分析、组织管理、技术架构、个人成长、创新方法 等）",
    "description": "200字以内详细描述",
    "coreIdea": "一句话核心思想",
    "applicability": "适用场景与条件",
    "steps": "关键步骤（用编号列出）",
    "pros": "优势（2-3点）",
    "cons": "劣势/局限（2-3点）",
    "sources": "参考来源（书名/论文/作者）"
  }
]`,
  },

  cascadeTop: {
    id: 'cascadeTop',
    name: '顶层推导指令',
    description: '级联推导到第 6 层（终极承诺）时的特殊指令，引导 AI 从意图出发思考根本承诺。',
    usedBy: 'aiCascadeLayerWithIntent (layer 6)',
    content: `用户有一个明确的意图（见下方）。这是金字塔最顶层（终极承诺），请结合用户的意图领域，帮他/她思考在这个领域中，什么是值得坚守的终极承诺和底线。要与用户的具体意图紧密相关，不要泛泛而谈。`,
  },

  cascadeDown: {
    id: 'cascadeDown',
    name: '逐层推导指令',
    description: '级联推导中第 5~0 层使用的指令模板。其中 {layerId} 会被替换为当前层级编号。',
    usedBy: 'aiCascadeLayerWithIntent (layers 5-0)',
    content: `请严格基于上层已确定的内容和用户意图，向下推导出第{layerId}层的具体内容。上层内容是约束条件，下层是在约束下的具体化。每个字段都必须与用户的实际意图紧密相关。`,
  },
};

const STORAGE_KEY = 'pyramid-prompts-v1';
const LEGACY_SYSTEM_PROMPT = `你是一位精通哲学方法论、系统思维和战略规划的 AI 顾问。你正在帮助用户使用"知行对齐"（从目标到行动的决策画板）工具进行深度思考。

金字塔共 7 层，从上到下依次是：
6. 终极承诺（Ultimate Commitment）—— 即使代价很大也不放弃什么？不靠证据也要坚持的根本承诺。
5. 世界观（Worldview）—— 本体论/认识论/价值论/人性观/时间观的根本信念。
4. 范式（Paradigm）—— 共同体默认的问题定义、证据标准、验收权与红线。
3. 元方法论（Meta-Methodology）—— 评价方法论好坏的标准、不确定性策略、冲突裁决规则。
2. 方法论（Methodology）—— 备选方案、选型理由、评估指标与证据来源。
1. 方法（Method）—— 具体做法、关键步骤、完成标准、失败模式。
0. 落地定义（Problem）—— 最终落地目标、成功标准、硬约束。

核心原则：
- 上层约束下层：世界观和范式决定什么方法论"靠谱"，方法论决定选什么方法。
- 层级之间相互塑形，不是单向线性关系。
- 回答要具体、可操作，避免空泛。
- 用中文回答。`;

export type PromptStore = Record<string, PromptTemplate>;

function loadFromStorage(): PromptStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PromptStore;
      // Merge with defaults so new prompts added in code appear
      const merged: PromptStore = {};
      for (const key of Object.keys(DEFAULT_PROMPTS)) {
        merged[key] = parsed[key]
          ? { ...DEFAULT_PROMPTS[key], ...parsed[key] }
          : { ...DEFAULT_PROMPTS[key] };
      }
      // Migrate legacy default system prompt to the new optimized one.
      // If user has edited system prompt, keep user's custom content.
      if (merged.system?.content === LEGACY_SYSTEM_PROMPT) {
        merged.system.content = DEFAULT_PROMPTS.system.content;
      }
      return merged;
    }
  } catch {
    // ignore
  }
  return structuredClone(DEFAULT_PROMPTS);
}

function saveToStorage(store: PromptStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// ========== Hook ==========

export function usePrompts() {
  const [prompts, setPrompts] = useState<PromptStore>(loadFromStorage);

  const updatePrompt = useCallback((id: string, content: string) => {
    setPrompts((prev) => {
      const next = { ...prev };
      if (next[id]) {
        next[id] = { ...next[id], content };
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  const resetPrompt = useCallback((id: string) => {
    setPrompts((prev) => {
      const next = { ...prev };
      if (DEFAULT_PROMPTS[id]) {
        next[id] = { ...DEFAULT_PROMPTS[id] };
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    const fresh = structuredClone(DEFAULT_PROMPTS);
    saveToStorage(fresh);
    setPrompts(fresh);
  }, []);

  /** Get a prompt's current content by id */
  const getPrompt = useCallback(
    (id: string): string => {
      return prompts[id]?.content ?? DEFAULT_PROMPTS[id]?.content ?? '';
    },
    [prompts]
  );

  return { prompts, updatePrompt, resetPrompt, resetAll, getPrompt };
}
