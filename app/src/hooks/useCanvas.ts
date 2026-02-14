import { useState, useEffect, useCallback } from 'react';
import type { CanvasData, LayerData, Methodology } from '../types';
import { createEmptyCanvas } from '../data/layers';
import { isRemotePersistenceConfigured, loadRemoteState, saveRemoteState } from '../services/persistence';

const STORAGE_KEY = 'pyramid-canvas-list';
const ACTIVE_KEY = 'pyramid-active-canvas';

function loadCanvasList(): CanvasData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCanvasList(list: CanvasData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function useCanvas() {
  const [saveState, setSaveState] = useState<'idle' | 'syncing' | 'saved' | 'error' | 'local-only'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [canvasList, setCanvasList] = useState<CanvasData[]>(() => {
    const list = loadCanvasList();
    if (list.length > 0) return list;
    const empty = createEmptyCanvas();
    return [empty];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const savedId = loadActiveId();
    const list = loadCanvasList();
    if (savedId && list.some((c) => c.id === savedId)) return savedId;
    if (list.length > 0) return list[0].id;
    return createEmptyCanvas().id;
  });
  const [hydrated, setHydrated] = useState(false);

  const activeCanvas = canvasList.find((c) => c.id === activeId) ?? canvasList[0];

  // Initial hydrate: remote first, local as fallback
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await loadRemoteState();
        if (cancelled || !remote) {
          setHydrated(true);
          return;
        }
        const list = remote.canvasList.length > 0 ? remote.canvasList : [createEmptyCanvas()];
        const nextActiveId =
          remote.activeId && list.some((c) => c.id === remote.activeId)
            ? remote.activeId
            : list[0].id;
        setCanvasList(list);
        setActiveId(nextActiveId);
      } catch {
        // Ignore remote errors; keep local data
      } finally {
        if (!cancelled) {
          if (!isRemotePersistenceConfigured()) {
            setSaveState('local-only');
          } else {
            setSaveState('saved');
          }
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to localStorage
  useEffect(() => {
    saveCanvasList(canvasList);
  }, [canvasList]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  // Persist to remote DB with debounce
  useEffect(() => {
    if (!hydrated) return;
    if (!isRemotePersistenceConfigured()) {
      setSaveState('local-only');
      setSaveError(null);
      return;
    }

    setSaveState('syncing');
    const timer = setTimeout(() => {
      void saveRemoteState({ canvasList, activeId })
        .then(() => {
          setSaveState('saved');
          setSaveError(null);
          setLastSyncedAt(new Date().toISOString());
        })
        .catch((err) => {
          const msg = err instanceof Error ? err.message : '云端保存失败';
          setSaveState('error');
          setSaveError(msg);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [canvasList, activeId, hydrated]);

  const retryRemoteSync = useCallback(async () => {
    if (!isRemotePersistenceConfigured()) {
      setSaveState('local-only');
      return;
    }
    setSaveState('syncing');
    setSaveError(null);
    try {
      await saveRemoteState({ canvasList, activeId });
      setSaveState('saved');
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : '云端保存失败';
      setSaveState('error');
      setSaveError(msg);
    }
  }, [canvasList, activeId]);

  const updateLayerData = useCallback(
    (layerId: number, data: LayerData) => {
      setCanvasList((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                updatedAt: new Date().toISOString(),
                layers: { ...c.layers, [layerId]: data },
              }
            : c
        )
      );
    },
    [activeId]
  );

  const updateTitle = useCallback(
    (title: string) => {
      setCanvasList((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, title, updatedAt: new Date().toISOString() }
            : c
        )
      );
    },
    [activeId]
  );

  const createNew = useCallback((title?: string) => {
    const newCanvas = createEmptyCanvas();
    if (title?.trim()) {
      newCanvas.title = title.trim();
    }
    setCanvasList((prev) => [newCanvas, ...prev]);
    setActiveId(newCanvas.id);
    return newCanvas;
  }, []);

  const updateMethodologies = useCallback(
    (methodologies: Methodology[]) => {
      setCanvasList((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, updatedAt: new Date().toISOString(), methodologies }
            : c
        )
      );
    },
    [activeId]
  );

  const deleteCanvas = useCallback(
    (id: string) => {
      setCanvasList((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        if (filtered.length === 0) {
          const empty = createEmptyCanvas();
          setActiveId(empty.id);
          return [empty];
        }
        if (id === activeId) {
          setActiveId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeId]
  );

  return {
    canvasList,
    activeCanvas,
    activeId,
    setActiveId,
    updateLayerData,
    updateTitle,
    updateMethodologies,
    createNew,
    deleteCanvas,
    saveState,
    saveError,
    lastSyncedAt,
    retryRemoteSync,
  };
}
