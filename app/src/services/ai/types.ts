import type { AIMessage, LayerData, Methodology } from '../../types';

export interface AICallResult {
  success: boolean;
  data?: LayerData;
  rawText?: string;
  error?: string;
  messages?: AIMessage[];
}

export interface IntentAnalysis {
  domain: string;
  goal: string;
  scope: string;
  keyDimensions: string[];
  constraints: string[];
  impactScope?: '个人' | '团队' | '组织' | string;
  reversibility?: '高' | '中' | '低' | string;
  riskLevel?: '低' | '中' | '高' | string;
  summary: string;
}

export interface IntentResult {
  success: boolean;
  analysis?: IntentAnalysis;
  rawText?: string;
  error?: string;
  messages?: AIMessage[];
}

export interface MethodologySearchResult {
  success: boolean;
  methodologies?: Methodology[];
  rawText?: string;
  error?: string;
  messages?: AIMessage[];
  source?: 'retrieval' | 'ai';
  topScore?: number;
  avgTop3?: number;
  isLowConfidence?: boolean;
}

export interface CreateMethodologyResult {
  success: boolean;
  methodologies?: Methodology[];
  rawText?: string;
  error?: string;
  messages?: AIMessage[];
}
