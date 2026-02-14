import { useState, useEffect, useCallback } from 'react';
import type { AISettings } from '../types';

const STORAGE_KEY = 'pyramid-ai-settings';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  routeThresholdMethodology: 2,
  routeThresholdFull: 5,
  routeKeywordsHighImpact: '战略,组织,跨团队,跨部门,公司级,体系,治理,转型',
  routeKeywordsUncertainty: '不确定,探索,复杂,冲突,取舍,长期,路线,范式',
  routeKeywordsExecute: '马上,今天,执行,落地,修复,脚本,页面,短期,快速',
};

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<AISettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const isConfigured = settings.apiKey.trim().length > 0;

  return { settings, updateSettings, isConfigured };
}
