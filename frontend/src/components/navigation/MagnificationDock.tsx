import React, { useState } from 'react';
import {
  Activity,
  Sliders,
  Scale,
  GitBranch,
  CheckCircle2,
  Sparkles,
  BookOpen,
  FileText,
  Settings,
} from 'lucide-react';
import { PageId } from '../Sidebar';

interface MagnificationDockProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
}

export const MagnificationDock: React.FC<MagnificationDockProps> = ({
  currentPage,
  onSelectPage,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dockItems: { id: PageId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'overview', label: 'Research Home', icon: <Activity className="w-5 h-5" />, color: 'text-cyan-400' },
    { id: 'portfolio', label: 'Stacking Portfolio', icon: <Sparkles className="w-5 h-5" />, color: 'text-amber-400' },
    { id: 'lab', label: 'Experiment Lab', icon: <Sliders className="w-5 h-5" />, color: 'text-emerald-400' },
    { id: 'before-after', label: 'Results Comparison', icon: <Scale className="w-5 h-5" />, color: 'text-purple-400' },
    { id: 'mechanism', label: 'Mechanism & Architecture', icon: <GitBranch className="w-5 h-5" />, color: 'text-blue-400' },
    { id: 'tests', label: 'Safety & Correctness', icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-teal-400' },
    { id: 'evidence', label: 'Prior Art & Evidence', icon: <BookOpen className="w-5 h-5" />, color: 'text-rose-400' },
    { id: 'reports', label: 'Reports & Artifacts', icon: <FileText className="w-5 h-5" />, color: 'text-slate-300' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 hidden sm:flex items-center gap-1.5 p-2 rounded-2xl bg-[#090d16]/90 backdrop-blur-xl border border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
      {dockItems.map((item, idx) => {
        const isActive = currentPage === item.id;
        const isHovered = hoveredIndex === idx;
        const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - idx) === 1;

        let scaleClass = 'scale-100';
        if (isHovered) scaleClass = 'scale-125 -translate-y-2';
        else if (isNeighbor) scaleClass = 'scale-110 -translate-y-1';

        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => onSelectPage(item.id)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center relative ${scaleClass} ${
                isActive
                  ? 'bg-slate-800/90 text-white shadow-lg ring-1 ring-cyan-400/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <span className={isActive ? item.color : 'text-slate-400 group-hover:text-white'}>
                {item.icon}
              </span>

              {/* Active Indicator Dot */}
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-cyan-400" />
              )}
            </button>

            {/* Tooltip */}
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-black/95 text-white text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none border border-slate-800 shadow-xl">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
