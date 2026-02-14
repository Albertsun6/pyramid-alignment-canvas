import type { CanvasData } from '../types';
import { createClient } from '@supabase/supabase-js';

export interface PersistedState {
  canvasList: CanvasData[];
  activeId: string;
}

interface SupabaseStateRow {
  key: string;
  canvas_list_json: CanvasData[];
  active_id: string;
  updated_at?: string;
}

function getSupabaseConfig() {
  const env = (import.meta as {
    env?: { VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string };
  }).env;
  return {
    url: env?.VITE_SUPABASE_URL?.trim() || '',
    anonKey: env?.VITE_SUPABASE_ANON_KEY?.trim() || '',
  };
}

export function isRemotePersistenceConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function loadRemoteState(): Promise<PersistedState | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('app_state')
    .select('key, canvas_list_json, active_id, updated_at')
    .eq('key', 'global')
    .maybeSingle<SupabaseStateRow>();

  if (error || !data) {
    return null;
  }

  if (!Array.isArray(data.canvas_list_json) || typeof data.active_id !== 'string') {
    return null;
  }

  return { canvasList: data.canvas_list_json, activeId: data.active_id };
}

export async function saveRemoteState(state: PersistedState): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase 未配置');
  }

  const now = new Date().toISOString();
  const { error } = await client.from('app_state').upsert({
    key: 'global',
    canvas_list_json: state.canvasList,
    active_id: state.activeId,
    updated_at: now,
  });

  if (error) {
    throw new Error(`远端保存失败: ${error.message}`);
  }
}
