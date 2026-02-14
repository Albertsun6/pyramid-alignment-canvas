import { useState, useEffect, useCallback } from 'react';
import type { AISettings } from '../types';

const STORAGE_KEY = 'pyramid-ai-settings';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
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
