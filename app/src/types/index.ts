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

export type AppMode = 'cascade' | 'overview' | 'diagnosis' | 'methodologies' | 'flowchart' | 'prompts' | 'docs';

export type AIProvider = 'openai' | 'openrouter' | 'custom';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
