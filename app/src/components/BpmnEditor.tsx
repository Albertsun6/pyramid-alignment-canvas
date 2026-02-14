import { useEffect, useRef, useCallback, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

// Import bpmn-js styles
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

interface Props {
  xml: string;
  editable?: boolean;
  onXmlChange?: (xml: string) => void;
}

export function BpmnEditor({ xml, editable = false, onXmlChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<BpmnModeler | BpmnViewer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentModeRef = useRef<boolean>(editable);

  // Cleanup previous instance
  const destroyInstance = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }
  }, []);

  // Create and import diagram
  useEffect(() => {
    if (!containerRef.current) return;

    // Recreate instance if editable mode changed
    if (instanceRef.current && currentModeRef.current !== editable) {
      destroyInstance();
    }
    currentModeRef.current = editable;

    // Create new instance
    if (!instanceRef.current) {
      const BpmnClass = editable ? BpmnModeler : BpmnViewer;
      instanceRef.current = new BpmnClass({
        container: containerRef.current,
        keyboard: { bindTo: containerRef.current },
      }) as BpmnModeler | BpmnViewer;

      // Listen for changes in modeler mode
      if (editable && onXmlChange) {
        const modeler = instanceRef.current as BpmnModeler;
        modeler.on('commandStack.changed', async () => {
          try {
            const result = await modeler.saveXML({ format: true });
            if (result.xml) {
              onXmlChange(result.xml);
            }
          } catch {
            // ignore save errors during editing
          }
        });
      }
    }

    // Import XML
    const instance = instanceRef.current;
    setError(null);

    instance
      .importXML(xml)
      .then(() => {
        // Fit to viewport
        const canvas = instance.get('canvas') as { zoom: (type: string) => void };
        canvas.zoom('fit-viewport');
      })
      .catch((err: Error) => {
        setError(err.message || '无法加载 BPMN 图');
      });

    return () => {
      // Don't destroy on xml change, only on unmount or mode switch
    };
  }, [xml, editable, onXmlChange, destroyInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyInstance();
    };
  }, [destroyInstance]);

  return (
    <div className="relative w-full h-full">
      {error && (
        <div className="absolute top-2 left-2 right-2 z-10 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          BPMN 加载失败: {error}
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
