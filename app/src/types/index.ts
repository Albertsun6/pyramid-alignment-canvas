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
  description: string;
  coreIdea: string;
  applicability: string;
  steps: string;
  pros: string;
  cons: string;
  sources: string;
  selected: boolean;
  createdAt: string;
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
