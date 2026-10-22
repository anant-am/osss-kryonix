import React from 'react';
import {
  Activity,
  Sliders,
  Scale,
  GitBranch,
  Gauge,
  Clock,
  CheckCircle2,
  BarChart3,
  BookOpen,
  GraduationCap,
  FileText,
  Settings,
  Sparkles,
} from 'lucide-react';

export type PageId =
  | 'overview'
  | 'portfolio'
  | 'lab'
  | 'before-after'
  | 'mechanism'
  | 'memory-pressure'
  | 'timeline'
  | 'tests'
  | 'evidence'
  | 'settings'
  | 'reports';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage }) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Research Home', icon: <Activity className="w-4 h-4" />, badge: 'Core' },
    { id: 'portfolio', label: 'Systems Portfolio', icon: <Sparkles className="w-4 h-4 text-amber-400" />, badge: 'Cards' },
    { id: 'lab', label: 'Experiment Lab', icon: <Sliders className="w-4 h-4" />, badge: 'Live' },
    { id: 'before-after', label: 'Results Comparison', icon: <Scale className="w-4 h-4" />, badge: 'Eval' },
    { id: 'mechanism', label: 'Mechanism Explorer', icon: <GitBranch className="w-4 h-4" />, badge: 'CRISP-L' },
    { id: 'memory-pressure', label: 'Memory Pressure', icon: <Gauge className="w-4 h-4" /> },
    { id: 'timeline', label: 'Thread Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'tests', label: 'Verification & Safety', icon: <CheckCircle2 className="w-4 h-4" />, badge: '6-Pt' },
    { id: 'evidence', label: 'Research & Prior Art', icon: <BookOpen className="w-4 h-4" />, badge: '6.5/10' },
    { id: 'settings', label: 'Environment & Setup', icon: <Settings className="w-4 h-4" />, badge: 'QEMU' },
    { id: 'reports', label: 'Reports & Provenance', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-crisp-cyan/10 border border-crisp-cyan/30 flex items-center justify-center text-crisp-cyan font-mono font-bold text-sm">
            CR
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">
              CRISP
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
              CRISP-L Systems Lab
            </div>
          </div>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-crisp-cyan/10 text-crisp-cyan border border-crisp-cyan/30">
          QEMU 6.6
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Research Workbench
        </div>
        {navItems.slice(0, 4).map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            active={currentPage === item.id}
            onClick={() => onSelectPage(item.id)}
          />
        ))}

        <div className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Kernel & Model Analysis
        </div>
        {navItems.slice(4, 7).map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            active={currentPage === item.id}
            onClick={() => onSelectPage(item.id)}
          />
        ))}

        <div className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Verification & Scientific Integrity
        </div>
        {navItems.slice(7, 9).map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            active={currentPage === item.id}
            onClick={() => onSelectPage(item.id)}
          />
        ))}

        <div className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Execution & Artifacts
        </div>
        {navItems.slice(9).map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            active={currentPage === item.id}
            onClick={() => onSelectPage(item.id)}
          />
        ))}
      </div>

      {/* Status Footer */}
      <div className="p-3 border-t border-dark-800 bg-dark-950/60">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-crisp-emerald animate-pulse"></span>
            Host Ready
          </span>
          <span className="font-mono text-[10px] text-slate-500">cgroup2fs</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500 truncate">
          Linux 6.18.33.2-standard
        </div>
      </div>
    </aside>
  );
};

const NavItemButton: React.FC<{
  item: { id: PageId; label: string; icon: React.ReactNode; badge?: string };
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
      active
        ? 'bg-crisp-cyan/10 text-crisp-cyan border border-crisp-cyan/20'
        : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
    }`}
  >
    <div className="flex items-center gap-2.5">
      <span className={active ? 'text-crisp-cyan' : 'text-slate-500'}>{item.icon}</span>
      <span>{item.label}</span>
    </div>
    {item.badge && (
      <span
        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
          active
            ? 'bg-crisp-cyan/20 text-crisp-cyan'
            : 'bg-dark-800 text-slate-400 border border-dark-700'
        }`}
      >
        {item.badge}
      </span>
    )}
  </button>
);
