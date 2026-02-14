import { useCallback, useEffect, useMemo, useState } from 'react';
import { SKILL_LIBRARY } from '../data/skills';
import type { SkillTemplate } from '../types';

const STORAGE_KEY = 'zhixing-custom-skills-v1';

function loadCustomSkills(): SkillTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x.id === 'string' && typeof x.name === 'string');
  } catch {
    return [];
  }
}

export function useSkills() {
  const [customSkills, setCustomSkills] = useState<SkillTemplate[]>(loadCustomSkills);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customSkills));
  }, [customSkills]);

  const builtInSkills = useMemo(
    () => SKILL_LIBRARY.map((s) => ({ ...s, builtIn: true })),
    []
  );

  const allSkills = useMemo(
    () => [...builtInSkills, ...customSkills.map((s) => ({ ...s, builtIn: false }))],
    [builtInSkills, customSkills]
  );

  const addSkill = useCallback((skill: Omit<SkillTemplate, 'id' | 'builtIn'>) => {
    const item: SkillTemplate = {
      ...skill,
      id: crypto.randomUUID(),
      builtIn: false,
    };
    setCustomSkills((prev) => [item, ...prev]);
  }, []);

  const updateSkill = useCallback((id: string, patch: Partial<SkillTemplate>) => {
    setCustomSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, id: s.id, builtIn: false } : s))
    );
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setCustomSkills((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    builtInSkills,
    customSkills,
    allSkills,
    addSkill,
    updateSkill,
    deleteSkill,
  };
}
