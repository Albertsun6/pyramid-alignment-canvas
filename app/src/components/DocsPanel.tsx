import { useState, useRef, useEffect } from 'react';
import { DOCS } from '../data/docs';
import { ChevronRight, BookOpen } from 'lucide-react';

export function DocsPanel() {
  const [activeDocId, setActiveDocId] = useState(DOCS[0].id);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeDoc = DOCS.find((d) => d.id === activeDocId) ?? DOCS[0];

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeDocId, activeSectionIdx]);

  return (
    <div className="flex gap-6 max-w-6xl mx-auto h-[calc(100vh-120px)]">
      {/* Left: Table of Contents */}
      <nav className="w-64 shrink-0 overflow-y-auto pr-2">
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
          <BookOpen size={16} />
          <span className="font-medium">帮助文档</span>
        </div>

        <div className="space-y-3">
          {DOCS.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <div key={doc.id}>
                <button
                  onClick={() => {
                    setActiveDocId(doc.id);
                    setActiveSectionIdx(0);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>{doc.icon}</span>
                  <span>{doc.title}</span>
                </button>

                {/* Sub-sections */}
                {isActive && (
                  <div className="mt-1 ml-4 pl-3 border-l border-slate-700/50 space-y-0.5">
                    {doc.sections.map((sec, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSectionIdx(idx)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                          activeSectionIdx === idx
                            ? 'text-blue-400 bg-blue-600/10'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <ChevronRight
                          size={10}
                          className={`shrink-0 transition-transform ${
                            activeSectionIdx === idx ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="truncate">{sec.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Right: Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <span>{activeDoc.icon} {activeDoc.title}</span>
          <ChevronRight size={10} />
          <span className="text-slate-400">
            {activeDoc.sections[activeSectionIdx]?.title}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-6">
          {activeDoc.sections[activeSectionIdx]?.title}
        </h2>

        {/* Body content */}
        <div className="prose-custom">
          <RenderContent
            content={activeDoc.sections[activeSectionIdx]?.content ?? ''}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-700/50">
          {activeSectionIdx > 0 ? (
            <button
              onClick={() => setActiveSectionIdx(activeSectionIdx - 1)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors cursor-pointer"
            >
              ← {activeDoc.sections[activeSectionIdx - 1]?.title}
            </button>
          ) : (
            <div />
          )}
          {activeSectionIdx < activeDoc.sections.length - 1 ? (
            <button
              onClick={() => setActiveSectionIdx(activeSectionIdx + 1)}
              className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm transition-colors cursor-pointer"
            >
              {activeDoc.sections[activeSectionIdx + 1]?.title} →
            </button>
          ) : (
            // Jump to next doc category
            (() => {
              const currentIdx = DOCS.findIndex((d) => d.id === activeDocId);
              const nextDoc = DOCS[currentIdx + 1];
              if (nextDoc) {
                return (
                  <button
                    onClick={() => {
                      setActiveDocId(nextDoc.id);
                      setActiveSectionIdx(0);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm transition-colors cursor-pointer"
                  >
                    {nextDoc.icon} {nextDoc.title} →
                  </button>
                );
              }
              return <div />;
            })()
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Simple Markdown-like renderer =====
function RenderContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Table (lines starting with |)
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`t-${i}`} className="my-4 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {tableLines
                .filter((tl) => !tl.match(/^\|[\s-|]+$/)) // skip separator row
                .map((tl, ri) => {
                  const cells = tl
                    .split('|')
                    .filter((c) => c.trim() !== '');
                  const isHeader = ri === 0;
                  return (
                    <tr
                      key={ri}
                      className={
                        isHeader
                          ? 'border-b border-slate-600'
                          : 'border-b border-slate-700/50'
                      }
                    >
                      {cells.map((cell, ci) =>
                        isHeader ? (
                          <th
                            key={ci}
                            className="px-3 py-2 text-left text-slate-300 font-medium"
                          >
                            {cell.trim()}
                          </th>
                        ) : (
                          <td
                            key={ci}
                            className="px-3 py-2 text-slate-400"
                          >
                            <InlineFormat text={cell.trim()} />
                          </td>
                        )
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++; // skip opening ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre
          key={`c-${i}`}
          className="my-4 p-4 rounded-lg bg-slate-900/80 border border-slate-700/50 text-sm text-slate-300 overflow-x-auto font-mono"
        >
          {codeLines.join('\n')}
        </pre>
      );
      continue;
    }

    // Bullet point
    if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
      const bulletLines: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('•') || lines[i].trim().startsWith('- '))
      ) {
        bulletLines.push(lines[i].trim().replace(/^[•\-]\s*/, ''));
        i++;
      }
      elements.push(
        <ul key={`u-${i}`} className="my-3 space-y-1.5">
          {bulletLines.map((bl, bi) => (
            <li
              key={bi}
              className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed"
            >
              <span className="text-slate-600 mt-1.5 shrink-0">•</span>
              <InlineFormat text={bl} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const numLines: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        numLines.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
        i++;
      }
      elements.push(
        <ol key={`o-${i}`} className="my-3 space-y-1.5">
          {numLines.map((nl, ni) => (
            <li
              key={ni}
              className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed"
            >
              <span className="text-slate-500 shrink-0 font-mono text-xs mt-0.5 w-4 text-right">
                {ni + 1}.
              </span>
              <InlineFormat text={nl} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-slate-300 leading-relaxed my-3">
        <InlineFormat text={line} />
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

function InlineFormat({ text }: { text: string }) {
  // Handle **bold**, `code`, and plain text
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="text-white font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-slate-700/60 text-blue-300 text-xs font-mono"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
