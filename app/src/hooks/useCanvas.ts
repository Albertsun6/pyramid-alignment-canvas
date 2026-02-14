import { useState, useEffect, useCallback } from 'react';
import type { CanvasData, LayerData, Methodology } from '../types';
import { createEmptyCanvas } from '../data/layers';

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
  const [canvasList, setCanvasList] = useState<CanvasData[]>(() => {
    const list = loadCanvasList();
    if (list.length === 0) {
      const empty = createEmptyCanvas();
      return [empty];
    }
    return list;
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const savedId = loadActiveId();
    const list = loadCanvasList();
    if (savedId && list.some((c) => c.id === savedId)) return savedId;
    if (list.length > 0) return list[0].id;
    return createEmptyCanvas().id;
  });

  const activeCanvas = canvasList.find((c) => c.id === activeId) ?? canvasList[0];

  // Persist
  useEffect(() => {
    saveCanvasList(canvasList);
  }, [canvasList]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

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

  const createNew = useCallback(() => {
    const newCanvas = createEmptyCanvas();
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
  };
}
