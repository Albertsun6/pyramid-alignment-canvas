export interface LayerField {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'checklist';
  options?: string[]; // for checklist type
}

export interface LayerConfig {
  id: number;
  name: string;
  nameEn: string;
  subtitle: string;
  coreQuestion: string;
  color: string;
  bgColor: string;
  borderColor: string;
  fields: LayerField[];
}

export interface LayerData {
  [fieldId: string]: string | string[];
}

export interface Methodology {
  id: string;
  name: string;
  origin: string;
  category: string; // e.g. '项目管理', '产品设计', '系统思维', '决策分析' etc.
  description: string;
  coreIdea: string;
  applicability: string;
  steps: string;
  pros: string;
  cons: string;
  sources: string;
  selected: boolean;
  createdAt: string;
  /** true if this methodology was AI-created (not found via search) */
  aiGenerated?: boolean;
  /** Retrieval-first matching score (0-100) */
  matchScore?: number;
  /** Confidence label for retrieval result */
  confidenceLevel?: 'high' | 'medium' | 'low';
  /** Why this methodology fits current constraints */
  fitReasons?: string[];
  /** Potential conflicts with current constraints */
  conflicts?: string[];
  /** One key risk for quick scan */
  riskNote?: string;
  /** Qualitative hint of evidence style */
  evidenceType?: '定量' | '定性' | '混合';
}

export interface CanvasData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  layers: { [layerId: number]: LayerData };
  methodologies?: Methodology[];
}

export interface DiagnosisOption {
  text: string;
  layerId: number;
}

export type AppMode =
  | 'cascade'
  | 'overview'
  | 'diagnosis'
  | 'methodologies'
  | 'flowchart'
  | 'prompts'
  | 'skills'
  | 'docs';

export type AIProvider = 'openai' | 'openrouter' | 'custom';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  // Intent routing strategy (start path recommendation)
  routeThresholdMethodology: number; // score >= methodology and < full
  routeThresholdFull: number; // score >= full
  routeKeywordsHighImpact: string; // comma-separated keywords
  routeKeywordsUncertainty: string; // comma-separated keywords
  routeKeywordsExecute: string; // comma-separated keywords
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  // Suggested start route preference
  preferredStartPath?: 'method' | 'methodology' | 'full';
  // Extra constraints/hints injected into AI context
  promptHints: string[];
  builtIn?: boolean;
}
