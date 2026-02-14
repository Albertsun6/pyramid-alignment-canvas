import type { GuideState } from './types';

interface Props {
  guide: GuideState;
}

export function ProcessGuideBar({ guide }: Props) {
  return (
    <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-cyan-300">{guide.title}</div>
          <div className="text-xs text-slate-400 mt-1">{guide.desc}</div>
        </div>
        {guide.actionLabel && guide.action && (
          <button
            onClick={guide.action}
            disabled={guide.actionDisabled}
            className={`w-full sm:w-auto shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              guide.actionDisabled
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            {guide.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
