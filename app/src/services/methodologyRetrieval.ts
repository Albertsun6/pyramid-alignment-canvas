import type { CanvasData, Methodology } from '../types';
import type { IntentAnalysis } from './ai';
import { METHODOLOGY_KB, type MethodologyKBItem } from '../data/methodology-kb';

export interface RetrievalMeta {
  topScore: number;
  avgTop3: number;
  isLowConfidence: boolean;
}

function norm(text: string): string {
  return text.toLowerCase();
}

function countHits(text: string, keywords: string[]): number {
  return keywords.reduce((acc, kw) => (text.includes(norm(kw)) ? acc + 1 : acc), 0);
}

function scoreByHits(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const hits = countHits(text, keywords);
  return Math.min(100, Math.round((hits / Math.min(keywords.length, 4)) * 100));
}

function extractContextText(canvas: CanvasData, customQuery?: string, intent?: IntentAnalysis): string {
  const parts: string[] = [];
  for (let i = 0; i <= 6; i++) {
    const layer = canvas.layers[i];
    if (!layer) continue;
    Object.values(layer).forEach((v) => {
      if (Array.isArray(v)) parts.push(v.join(' '));
      else if (typeof v === 'string') parts.push(v);
    });
  }
  if (customQuery) parts.push(customQuery);
  if (intent) {
    parts.push(intent.domain, intent.goal, intent.scope, intent.summary);
    parts.push(intent.keyDimensions.join(' '), intent.constraints.join(' '));
  }
  return norm(parts.join(' '));
}

function extractEvidencePreferenceText(canvas: CanvasData): string {
  const layer3 = canvas.layers[3];
  const layer4 = canvas.layers[4];
  const pieces: string[] = [];
  if (layer3) {
    const standards = layer3.standards;
    if (Array.isArray(standards)) pieces.push(standards.join(' '));
    if (typeof layer3.standardsExtra === 'string') pieces.push(layer3.standardsExtra);
  }
  if (layer4 && typeof layer4.evidenceStd === 'string') pieces.push(layer4.evidenceStd);
  return norm(pieces.join(' '));
}

function buildReasons(item: MethodologyKBItem, scores: { domain: number; problem: number; evidence: number; resource: number }): string[] {
  const reasons: string[] = [];
  if (scores.domain >= 50) reasons.push(`与当前领域高度相关（${item.category}）`);
  if (scores.problem >= 50) reasons.push('与当前问题类型匹配');
  if (scores.evidence >= 50) reasons.push(`证据风格匹配（${item.evidenceType}）`);
  if (scores.resource >= 50) reasons.push('资源/节奏约束可接受');
  if (reasons.length === 0) reasons.push('具备可迁移实践经验，可作为备选方案');
  return reasons.slice(0, 3);
}

function buildConflicts(item: MethodologyKBItem, evidenceText: string, contextText: string): string[] {
  const conflicts: string[] = [];
  const strictAudit = ['可复验', '可审计', '合规', '监管'].some((k) => evidenceText.includes(norm(k)));
  if (strictAudit && item.evidenceType === '定性') {
    conflicts.push('当前上层强调可复验/可审计，该方法论偏定性，需补充量化证据');
  }
  const strongSpeed = ['快速', '尽快', '短期', '一周', '两周'].some((k) => contextText.includes(norm(k)));
  const longCycle = ['平衡计分卡（BSC）', '六西格玛 DMAIC'].includes(item.name);
  if (strongSpeed && longCycle) {
    conflicts.push('当前强调短期见效，该方法落地周期可能偏长');
  }
  return conflicts.slice(0, 2);
}

function pickRisk(cons: string): string {
  const first = cons.split(/[；;。]/).map((s) => s.trim()).find(Boolean);
  return first || '落地前请先做小范围试点验证';
}

export function retrieveMethodologies(
  canvas: CanvasData,
  customQuery?: string,
  intent?: IntentAnalysis,
  limit = 5
): { methodologies: Methodology[]; meta: RetrievalMeta } {
  const contextText = extractContextText(canvas, customQuery, intent);
  const evidenceText = extractEvidencePreferenceText(canvas);

  const scored = METHODOLOGY_KB.map((item) => {
    const domain = scoreByHits(contextText, item.domainKeywords);
    const problem = scoreByHits(contextText, item.problemKeywords);
    const evidence = scoreByHits(contextText + ' ' + evidenceText, ['证据', '可复验', '可审计', '实验', '数据', item.evidenceType]);
    const resource = scoreByHits(contextText, item.constraintKeywords);
    const history = 50;
    const total = Math.round(0.3 * domain + 0.25 * problem + 0.2 * evidence + 0.15 * resource + 0.1 * history);
    return { item, total, scores: { domain, problem, evidence, resource } };
  })
    .filter((r) => r.total >= 35)
    .sort((a, b) => b.total - a.total);

  const picked = scored.slice(0, limit);
  const topScore = picked[0]?.total ?? 0;
  const avgTop3 = picked.length
    ? Math.round(picked.slice(0, 3).reduce((acc, cur) => acc + cur.total, 0) / Math.min(3, picked.length))
    : 0;
  const isLowConfidence = topScore < 75 || avgTop3 < 65;

  const methodologies: Methodology[] = picked.map(({ item, total, scores }) => {
    const conflicts = buildConflicts(item, evidenceText, contextText);
    return {
      id: crypto.randomUUID(),
      name: item.name,
      origin: item.origin,
      category: item.category,
      description: item.description,
      coreIdea: item.coreIdea,
      applicability: item.applicability,
      steps: item.steps,
      pros: item.pros,
      cons: item.cons,
      sources: item.sources,
      selected: false,
      createdAt: new Date().toISOString(),
      aiGenerated: false,
      matchScore: total,
      confidenceLevel: total >= 75 ? 'high' : total >= 55 ? 'medium' : 'low',
      fitReasons: buildReasons(item, scores),
      conflicts,
      riskNote: pickRisk(item.cons),
      evidenceType: item.evidenceType,
    };
  });

  return { methodologies, meta: { topScore, avgTop3, isLowConfidence } };
}

