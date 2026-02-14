import type { AIMessage, LayerData } from '../../types';

export type StepStatus =
  | 'pending'
  | 'generating'
  | 'review'
  | 'confirmed'
  | 'error'
  | 'methodology-searching';

export type Phase = 'intent-input' | 'intent-analyzing' | 'intent-confirmed' | 'cascading';

export interface AIInteraction {
  type: 'intent' | 'cascade' | 'methodology-search';
  layerId?: number;
  messages: AIMessage[];
  response: string;
  timestamp: string;
}

export interface StepState {
  layerId: number;
  status: StepStatus;
  error?: string;
  aiSuggestion?: LayerData;
}

export interface MethodologyMeta {
  topScore?: number;
  avgTop3?: number;
  low?: boolean;
  source?: string;
}

export interface GuideState {
  title: string;
  desc: string;
  actionLabel: string | null;
  action: (() => void) | null;
  actionDisabled?: boolean;
}

export type StartPath = 'full' | 'methodology' | 'method';

export interface RouteRecommendation {
  recommendedPath: StartPath;
  reason: string;
}
