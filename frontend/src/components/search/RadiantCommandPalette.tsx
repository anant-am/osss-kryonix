import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  ArrowRight,
  Play,
  Scale,
  GitBranch,
  ShieldCheck,
  FileText,
  Sparkles,
  X,
  Terminal,
  Activity,
} from 'lucide-react';
import { PageId } from '../Sidebar';

interface CommandItem {
  id: string;
  category: string;
  label: string;
  shortcut?: string;
  action: () => void;
  icon: React.ReactNode;
}

interface RadiantCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
  onRunBenchmark?: (scenario: string, policy: string) => void;
}

export const RadiantCommandPalette: React.FC<RadiantCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRunBenchmark,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'cmd-run-b0',
      category: 'Benchmark Runner',
      label: 'Run Stock Linux Baseline (W2, Policy B0, 4 Threads)',
      shortcut: 'B0',
      action: () => {
        if (onRunBenchmark) onRunBenchmark('W2', 'B0');
        onClose();
      },
      icon: <Play className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'cmd-run-m0',
      category: 'Benchmark Runner',
      label: 'Run CRISP-L Deferral (W2, Policy M0, 4 Threads)',
      shortcut: 'M0',
      action: () => {
        if (onRunBenchmark) onRunBenchmark('W2', 'M0');
        onClose();
      },
      icon: <Play className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'cmd-nav-portfolio',
      category: 'Navigation',
      label: 'Jump to Stacking Cards Systems Portfolio',
      shortcut: 'Cards',
      action: () => {
        onNavigate('portfolio');
        onClose();
      },
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'cmd-nav-before-after',
      category: 'Navigation',
      label: 'Jump to Results Comparison (B0 vs M0)',
      shortcut: 'Eval',
      action: () => {
        onNavigate('before-after');
        onClose();
      },
      icon: <Scale className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'cmd-nav-mechanism',
      category: 'Navigation',
      label: 'Jump to Mechanism Explorer & State Automaton',
      shortcut: 'FSM',
      action: () => {
        onNavigate('mechanism');
        onClose();
      },
      icon: <GitBranch className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'cmd-nav-tests',
      category: 'Navigation',
      label: 'Jump to Safety Contract & Model Checker',
      shortcut: 'Safety',
      action: () => {
        onNavigate('tests');
        onClose();
      },
      icon: <ShieldCheck className="w-4 h-4 text-teal-400" />,
    },
    {
      id: 'cmd-nav-reports',
      category: 'Navigation',
      label: 'Jump to Reports & Provenance Artifacts',
      shortcut: 'Export',
      action: () => {
        onNavigate('reports');
        onClose();
      },
      icon: <FileText className="w-4 h-4 text-slate-300" />,
    },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keyboard shortcuts (Ctrl+K / Cmd+K and Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
        } else if (e.key === 'Enter' && filtered[selectedIndex]) {
          e.preventDefault();
          filtered[selectedIndex].action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Radiant Modal Container with Conic Border Effect */}
      <div className="relative w-full max-w-xl rounded-2xl p-[1px] bg-gradient-to-r from-cyan-500 via-amber-500 to-emerald-500 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(89,184,255,0.2)] z-10 overflow-hidden">
        <div className="rounded-2xl bg-[#090d16] flex flex-col overflow-hidden">
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a research command or search experiments..."
              className="flex-1 bg-transparent border-none outline-none text-white text-sm font-mono placeholder:text-slate-500"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              ESC
            </span>
          </div>

          {/* Command Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                No matching research commands found for "{query}".
              </div>
            ) : (
              filtered.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition font-mono text-xs ${
                    selectedIndex === idx
                      ? 'bg-slate-800/90 text-white border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-1 rounded bg-slate-900 border border-slate-800">
                      {item.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.category}</div>
                    </div>
                  </div>
                  {item.shortcut && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer Hints */}
          <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Navigate: &uarr; &darr; &bull; Enter: Execute</span>
            <span>CRISP-L Command Bus</span>
          </div>
        </div>
      </div>
    </div>
  );
};
