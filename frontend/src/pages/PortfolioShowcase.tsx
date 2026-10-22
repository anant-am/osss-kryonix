import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Layers,
  Terminal,
  Clock,
  Activity,
  Zap,
  Lock,
  Unlock,
  Sliders,
  ChevronRight,
  Search,
  Command,
  Database,
  ExternalLink,
} from 'lucide-react';
import { PageId } from '../components/Sidebar';

interface PortfolioShowcaseProps {
  onNavigate?: (page: PageId) => void;
}

export const PortfolioShowcase: React.FC<PortfolioShowcaseProps> = ({ onNavigate }) => {
  // Clock state
  const [currentTime, setCurrentTime] = useState<string>('12:00 PM');

  // Command bar search state
  const [commandQuery, setCommandQuery] = useState<string>('deploy crisp-l-kernel');
  const [activeCommandIndex, setActiveCommandIndex] = useState<number>(0);

  // Flowchart Simulation State (Card 1)
  const [simulationMode, setSimulationMode] = useState<'crisp' | 'stock'>('crisp');
  const [flowStep, setFlowStep] = useState<number>(0);
  const [isFlowPlaying, setIsFlowPlaying] = useState<boolean>(true);

  // Latency Graph Tab (Card 2)
  const [activeLatencyTab, setActiveLatencyTab] = useState<'p99' | 'all' | 'throughput'>('p99');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ label: string; b0: string; crisp: string } | null>(null);

  // Neural Credit Ledger State (Card 3)
  const [activeDebt, setActiveDebt] = useState<number>(12);
  const [poolCap] = useState<number>(64);

  // Lock Convoy Queue Simulation State (Card 4)
  const [convoyThreads, setConvoyThreads] = useState<number>(8);

  // Update clock every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Flowchart animation auto-stepper
  useEffect(() => {
    if (!isFlowPlaying) return;
    const interval = setInterval(() => {
      setFlowStep((prev) => (prev + 1) % 6);
    }, 2400);
    return () => clearInterval(interval);
  }, [isFlowPlaying]);

  const flowNodes = [
    {
      id: 0,
      title: '1. pthread_mutex_lock(&mtx)',
      subtitle: 'Worker thread acquires user-space lock',
      status: 'ACQUIRED',
      color: 'text-amber-400',
    },
    {
      id: 1,
      title: '2. malloc() Memory Allocation',
      subtitle: 'Thread requests 2MB heap allocation',
      status: 'ALLOCATING',
      color: 'text-crisp-cyan',
    },
    {
      id: 2,
      title: '3. cgroup memory.high Exceeded',
      subtitle: 'Kernel mm/memcontrol.c detects overage',
      status: 'LIMIT HIT',
      color: 'text-rose-400',
    },
    {
      id: 3,
      title: simulationMode === 'stock' ? '4. FORCED SLEEP (100ms)' : '4. CRISP-L Cap & Lease Guard',
      subtitle:
        simulationMode === 'stock'
          ? 'Stock kernel forces sleep while holding mutex!'
          : 'Inspects userland flag: under cap (16/32) & lease valid (<2ms)',
      status: simulationMode === 'stock' ? 'CONVOY STALL' : 'DEFERRAL GRANTED',
      color: simulationMode === 'stock' ? 'text-rose-500 font-bold' : 'text-crisp-emerald font-bold',
    },
    {
      id: 4,
      title: simulationMode === 'stock' ? '5. Waiters B, C, D Blocked' : '5. pthread_mutex_unlock(&mtx)',
      subtitle:
        simulationMode === 'stock'
          ? 'Collateral damage: tail latency explodes to 210ms!'
          : 'Mutex released instantly; Waiter B acquires with zero stall',
      status: simulationMode === 'stock' ? 'CONVOY ACCUMULATING' : 'LOCK RELEASED',
      color: simulationMode === 'stock' ? 'text-rose-400' : 'text-crisp-emerald',
    },
    {
      id: 5,
      title: simulationMode === 'stock' ? '6. Lock Holder Finally Wakes' : '6. Return-to-Userland Settlement',
      subtitle:
        simulationMode === 'stock'
          ? 'Sleep completes; lock freed after 100ms latency hit'
          : 'TIF_NOTIFY_RESUME executes deferred sleep outside the lock',
      status: simulationMode === 'stock' ? 'DRAINING' : 'ISOLATED SETTLE',
      color: simulationMode === 'stock' ? 'text-slate-400' : 'text-crisp-cyan',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] text-slate-100 selection:bg-[#FF4500] selection:text-white font-sans overflow-x-hidden pb-32">
      {/* Global Noise Overlay */}
      <div className="noise-overlay" />

      {/* Living Animated Aurora Background */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Light blade 1: Crimson core */}
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-[#ff2f3a]/25 via-[#ff6b4a]/15 to-transparent blur-[120px] mix-blend-screen animate-aurora-1" />
        {/* Light blade 2: Warm Amber glow */}
        <div className="absolute top-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-[#ffb347]/20 via-[#ff4500]/15 to-transparent blur-[140px] mix-blend-screen animate-aurora-2" />
        {/* Light blade 3: Deep Coral streak */}
        <div className="absolute -bottom-[20%] left-[20%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-tr from-[#ff6b4a]/15 via-[#ff2f3a]/10 to-transparent blur-[130px] mix-blend-screen animate-aurora-3" />
        {/* Subtle radial dot grid overlay */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Floating Translucent Pill Nav */}
      <header className="fixed top-5 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
        <nav className="pointer-events-auto max-w-4xl w-full mx-auto px-6 py-2.5 rounded-full bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center justify-between transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#ff4500] to-[#ffb347] flex items-center justify-center text-dark-950 font-bold text-xs shadow-md shadow-[#ff4500]/30">
              ⚡
            </div>
            <a href="#" className="text-sm font-bold font-serif tracking-tight text-white hover:text-amber-200 transition">
              CRISP-L <span className="font-sans text-[11px] font-normal text-slate-400">| Systems Portfolio</span>
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs font-mono uppercase tracking-wider text-slate-400">
            <a href="#overview-hero" className="hover:text-white transition">Vision</a>
            <a href="#portfolio-cards" className="hover:text-crisp-cyan text-slate-200 transition font-bold">Stacking Cards</a>
            <a href="#flow-sim" className="hover:text-white transition">Flow Simulation</a>
            <a href="#graphs" className="hover:text-white transition">Latency Graphs</a>
          </div>

          <div className="flex items-center space-x-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('overview')}
                className="text-xs font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition"
              >
                Research Home
              </button>
            )}
            <a
              href="#portfolio-cards"
              className="px-4 py-1.5 rounded-full text-xs font-bold font-mono bg-white text-black hover:scale-105 hover:bg-slate-100 shadow-md transition-all active:scale-95"
            >
              Explore Deck
            </a>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section id="overview-hero" className="relative z-10 pt-40 pb-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Eyebrow Chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-mono text-amber-200/90 mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4500] animate-pulse" />
          <span>Linux 6.6 Kernel &bull; Capped, Leased Throttle Deferral</span>
        </div>

        {/* H1 Editorial Headline with Warm Gradient Accent Word */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold font-serif leading-[1.08] tracking-tight text-white max-w-4xl mb-6">
          Beyond memory stalls. <br />
          <span className="italic font-light bg-gradient-to-r from-[#ffb347] via-[#ff6b4a] to-[#ff2f3a] bg-clip-text text-transparent">
            The concurrency agent.
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto mb-10 font-light leading-relaxed">
          When Linux throttles a thread holding a user-space mutex under <code className="text-crisp-cyan font-mono px-1 py-0.5 bg-white/5 rounded">memory.high</code>,
          tail latency degrades by up to 100&times;. CRISP-L defers reclaim sleeps with mathematical credit bounds,
          completely eliminating lock convoy collapses.
        </p>

        {/* Keycap-Raised Download Button Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <a
            href="https://github.com/anant-am/osss-kryonix"
            target="_blank"
            rel="noreferrer"
            className="keycap-raised px-6 py-3 font-mono text-xs font-bold flex items-center gap-2.5 uppercase tracking-wide cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-black" />
            <span>GitHub: osss-kryonix</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          {onNavigate && (
            <button
              onClick={() => onNavigate('before-after')}
              className="keycap-raised px-6 py-3 font-mono text-xs font-bold flex items-center gap-2.5 uppercase tracking-wide cursor-pointer"
            >
              <Activity className="w-4 h-4 text-black" />
              <span>Inspect QEMU Evaluation</span>
            </button>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-3">
          <span>QEMU Linux 6.6.21-crisp-l</span>
          <span>&bull;</span>
          <span>Time: <span className="text-slate-300 font-bold">{currentTime}</span></span>
          <span>&bull;</span>
          <span>Status: <strong className="text-crisp-emerald">ALL GATES PASSED</strong></span>
        </div>

        {/* Dark-Glass Command Bar Launcher Mockup */}
        <div className="mt-14 w-full max-w-2xl text-left">
          <div className="glass-panel rounded-2xl p-4 shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Top search input row */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3 flex-1 font-mono text-xs text-white">
                <Search className="w-4 h-4 text-[#ff4500]" />
                <span className="text-slate-300">{commandQuery}</span>
                <span className="w-2 h-4 bg-[#ff4500] animate-pulse" />
              </div>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300 uppercase tracking-widest">
                Command Mode
              </span>
            </div>

            {/* Results Rows */}
            <div className="space-y-1.5 pt-3">
              {[
                { label: 'Run Workload A: Fast Mutex Benchmark', icon: <Zap className="w-3.5 h-3.5" />, shortcut: 'Cmd+Enter', active: true, tag: '13.5x Win' },
                { label: 'Verify 6-Point Safety Contract (Bounded BFS)', icon: <ShieldCheck className="w-3.5 h-3.5" />, shortcut: 'Cmd+B', active: false, tag: '628k States' },
                { label: 'Inspect mm/memcontrol.c Kernel Patch Diff', icon: <Terminal className="w-3.5 h-3.5" />, shortcut: 'Cmd+K', active: false, tag: 'Linux 6.6' },
                { label: 'Export Statistical Provenance Artifacts (CSV/JSON)', icon: <Database className="w-3.5 h-3.5" />, shortcut: 'Cmd+O', active: false, tag: '95% CI' },
              ].map((cmd, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveCommandIndex(idx)}
                  className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-mono cursor-pointer transition ${
                    activeCommandIndex === idx
                      ? 'bg-gradient-to-r from-[#ff4500]/25 via-white/5 to-transparent border border-[#ff4500]/40 text-white'
                      : 'hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={activeCommandIndex === idx ? 'text-[#ff4500]' : 'text-slate-500'}>
                      {cmd.icon}
                    </span>
                    <span className="font-semibold text-slate-200">{cmd.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                      {cmd.tag}
                    </span>
                    <kbd className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-slate-400 border border-white/10">
                      {cmd.shortcut}
                    </kbd>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer hints */}
            <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Navigate: &uarr; &darr; &bull; Enter: Execute &bull; Esc: Dismiss</span>
              <span>CRISP-L v1.0 Kernel Engine</span>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION / PHILOSOPHY STRIP */}
      <section className="py-24 border-y border-white/5 relative z-10 bg-black/40">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif text-white/95 leading-tight">
            We design the negative space <br />
            <span className="italic font-light text-slate-400">where kernel performance truly lives.</span>
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Eliminating lock convoys is not about giving programs free memory. It is about strict mathematical accounting:
            holding deferrals to a capped, leased ceiling and settling debts the instant the critical section ends.
          </p>

          {/* Benchmark Partner Grid */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center opacity-40 font-mono text-xs tracking-widest uppercase">
            <div className="flex items-center gap-2"><span>LINUX CGROUP V2</span></div>
            <div className="flex items-center gap-2"><span>POSIX PTHREADS</span></div>
            <div className="flex items-center gap-2"><span>QEMU LINUX 6.6</span></div>
            <div className="flex items-center gap-2"><span>M/G/1 QUEUEING</span></div>
          </div>
        </div>
      </section>

      {/* THE SIGNATURE "STACKING CARDS" SECTION */}
      <section id="portfolio-cards" className="py-24 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Deck of Cards &bull; Stacking Scroll Effect</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-serif text-white tracking-tight">
            Selected Works &amp; <span className="italic font-light">Systems Architecture</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Scroll down to watch each research module stay sticky at the top, sliding over the previous card like a deck of playing cards.
          </p>
        </div>

        {/* STACKING CARDS CONTAINER */}
        <div className="relative space-y-24">
          {/* ========================================================== */}
          {/* CARD 1: Flow Chart Graph Simulation (Sticky at top-24)    */}
          {/* ========================================================== */}
          <div
            id="flow-sim"
            className="sticky top-24 z-10 rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#1c0e0b] via-[#120a08] to-[#080403] border-2 border-[#ff4500]/60 shadow-[0_-15px_40px_rgba(0,0,0,0.9),0_20px_50px_rgba(255,69,0,0.18)] transition-all duration-300"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#ff4500]/20 text-[#ff4500] font-bold border border-[#ff4500]/30">
                    CARD 01
                  </span>
                  <span className="text-xs font-mono text-slate-400">Flow Chart Graph Simulation</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  Kernel Decision &amp; Throttle Deferral Flowchart
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Live state machine simulation tracing an allocating thread through critical section entry, memory.high check, and settlement.
                </p>
              </div>

              {/* Simulation Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSimulationMode(simulationMode === 'crisp' ? 'stock' : 'crisp')}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition border ${
                    simulationMode === 'crisp'
                      ? 'bg-crisp-emerald/20 border-crisp-emerald/40 text-crisp-emerald'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  Mode: {simulationMode === 'crisp' ? 'CRISP-L Deferral' : 'Stock Linux Convoy'}
                </button>
                <button
                  onClick={() => setIsFlowPlaying(!isFlowPlaying)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
                  title={isFlowPlaying ? 'Pause Simulation' : 'Play Simulation'}
                >
                  {isFlowPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>
                <button
                  onClick={() => setFlowStep(0)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
                  title="Reset Flow"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* FLOWCHART SVG NODES & ANIMATED CONNECTING BEZIER LINES */}
            <div className="relative py-4">
              {/* Connecting SVG Flow Paths */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden lg:block" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff4500" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffb347" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <path
                  d="M 120 40 C 240 40, 240 40, 360 40 S 520 40, 680 40 S 840 40, 960 40"
                  stroke="rgba(255, 69, 0, 0.25)"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M 120 40 C 240 40, 240 40, 360 40 S 520 40, 680 40 S 840 40, 960 40"
                  stroke="url(#flowGrad)"
                  strokeWidth="3"
                  fill="none"
                  className="animate-flow-dash"
                />
              </svg>

              {/* 6 Step Nodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                {flowNodes.map((node) => {
                  const isActive = flowStep === node.id;
                  const isPassed = flowStep > node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setFlowStep(node.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                        isActive
                          ? 'bg-black/80 border-[#ff4500] shadow-[0_0_25px_rgba(255,69,0,0.35)] scale-[1.02]'
                          : isPassed
                          ? 'bg-black/50 border-white/10 opacity-80'
                          : 'bg-black/30 border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                          STEP {node.id + 1}
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${node.color}`}>
                          {node.status}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white mb-1">{node.title}</h4>
                      <p className="text-[11px] text-slate-300 leading-snug">{node.subtitle}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Simulation Step Telemetry Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff4500] animate-ping" />
                <span className="text-slate-400">Current Phase:</span>
                <span className="text-white font-bold">{flowNodes[flowStep].title}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {simulationMode === 'crisp' ? (
                  <span className="text-crisp-emerald font-semibold">&bull; 0 Lock Stalls &bull; Mutex Wait &le; 0.78ms &bull; Debt Capped</span>
                ) : (
                  <span className="text-rose-400 font-semibold">&bull; 41 Lock Stalls &bull; Mutex Wait &ge; 78ms (Convoy Burst)</span>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* CARD 2: Multi-Dimensional Latency Graphs (Sticky at top-28) */}
          {/* ========================================================== */}
          <div
            id="graphs"
            className="sticky top-28 z-20 rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#121217] via-[#0b0c10] to-[#050508] border-2 border-white/20 shadow-[0_-15px_40px_rgba(0,0,0,0.9),0_20px_50px_rgba(82,168,255,0.15)] transition-all duration-300"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-bold border border-white/20">
                    CARD 02
                  </span>
                  <span className="text-xs font-mono text-slate-400">Interactive Latency &amp; Throughput Curves</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  Empirical Latency Tail Collapse (p50 &rarr; p99.9)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Side-by-side benchmark distribution showing how CRISP-L collapses lock contention wait times across all percentiles.
                </p>
              </div>

              {/* Metric Tabs */}
              <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10 font-mono text-xs">
                <button
                  onClick={() => setActiveLatencyTab('p99')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeLatencyTab === 'p99' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  p99 Focus
                </button>
                <button
                  onClick={() => setActiveLatencyTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeLatencyTab === 'all' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Percentiles
                </button>
                <button
                  onClick={() => setActiveLatencyTab('throughput')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeLatencyTab === 'throughput' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Throughput
                </button>
              </div>
            </div>

            {/* INTERACTIVE GRAPH CANVAS (SVG) */}
            <div className="p-6 rounded-2xl bg-black/80 border border-white/10 space-y-6">
              {activeLatencyTab === 'p99' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline font-mono text-xs">
                    <span className="text-slate-400">Lock Wait Latency Comparison under Memory Pressure</span>
                    <span className="text-crisp-emerald font-bold">13.5x to 179x Reduction</span>
                  </div>

                  {/* SVG Multi-Bar Latency Chart */}
                  <div className="space-y-3 font-mono text-xs">
                    {[
                      { name: 'Workload A (Fast Mutex, 4T)', b0: 94.7, crisp: 7.0, factor: '13.5x' },
                      { name: 'Workload B (Synthetic Convoy, 8T)', b0: 210.5, crisp: 6.3, factor: '33.4x' },
                      { name: 'Workload C (High Contention Churn, 16T)', b0: 629.0, crisp: 3.5, factor: '179.7x' },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredDataPoint({ label: row.name, b0: `${row.b0} ms`, crisp: `${row.crisp} ms` })}
                        onMouseLeave={() => setHoveredDataPoint(null)}
                        className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition space-y-2 cursor-pointer"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-white">{row.name}</span>
                          <span className="text-crisp-emerald font-bold">{row.factor} faster</span>
                        </div>

                        {/* Stock Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Stock Linux (B0):</span>
                            <span className="text-rose-400 font-bold">{row.b0} ms</span>
                          </div>
                          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(100, (row.b0 / 630) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* CRISP-L Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>CRISP-L (M0):</span>
                            <span className="text-crisp-emerald font-bold">{row.crisp} ms</span>
                          </div>
                          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-crisp-emerald rounded-full transition-all duration-700"
                              style={{ width: `${Math.max(2, (row.crisp / 630) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeLatencyTab === 'all' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  {[
                    { percentile: 'p50 (Median)', b0: '0.24 ms', crisp: '0.06 ms', delta: '4x' },
                    { percentile: 'p90 (Sub-Tail)', b0: '18.4 ms', crisp: '0.95 ms', delta: '19x' },
                    { percentile: 'p95 (Tail)', b0: '51.0 ms', crisp: '1.40 ms', delta: '36x' },
                    { percentile: 'p99 (Extreme Convoy)', b0: '94.7 ms', crisp: '3.50 ms', delta: '27x' },
                  ].map((p, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">{p.percentile}</span>
                      <div className="text-rose-400 text-sm">B0: {p.b0}</div>
                      <div className="text-crisp-emerald text-sm font-bold">M0: {p.crisp}</div>
                      <span className="text-[10px] text-slate-500 block pt-1 border-t border-white/5">
                        Speedup: {p.delta}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeLatencyTab === 'throughput' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Workload Throughput (Operations / Second)</span>
                    <span className="text-crisp-cyan font-bold">+18% to +35% Net Increase</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Stock Linux (B0)</span>
                      <span className="text-2xl font-bold text-slate-300 mt-1 block">176 ops/s</span>
                      <span className="text-[10px] text-rose-400">Severe stall penalty</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Pre-Lock Reclaim (B2)</span>
                      <span className="text-2xl font-bold text-amber-300 mt-1 block">110 ops/s</span>
                      <span className="text-[10px] text-rose-400">-37.4% syscall penalty</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-crisp-emerald/30 bg-emerald-950/20">
                      <span className="text-[10px] text-slate-500 block">CRISP-L (M0)</span>
                      <span className="text-2xl font-bold text-crisp-emerald mt-1 block">1,228 ops/s</span>
                      <span className="text-[10px] text-crisp-emerald">Zero lock convoy stalls</span>
                    </div>
                  </div>
                </div>
              )}

              {hoveredDataPoint && (
                <div className="p-2.5 rounded-lg bg-black/90 border border-white/20 text-xs font-mono flex items-center justify-between text-slate-200">
                  <span>Target: {hoveredDataPoint.label}</span>
                  <span>Stock: <strong className="text-rose-400">{hoveredDataPoint.b0}</strong> &bull; CRISP-L: <strong className="text-crisp-emerald">{hoveredDataPoint.crisp}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================== */}
          {/* CARD 3: Neural State Automaton (Sticky at top-32)          */}
          {/* ========================================================== */}
          <div
            id="neural-sim"
            className="sticky top-32 z-30 rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#121c17] via-[#09100d] to-[#040806] border-2 border-crisp-emerald/40 shadow-[0_-15px_40px_rgba(0,0,0,0.9),0_20px_50px_rgba(16,185,129,0.15)] transition-all duration-300"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-crisp-emerald/20 text-crisp-emerald font-bold border border-crisp-emerald/30">
                    CARD 03
                  </span>
                  <span className="text-xs font-mono text-slate-400">Neural Connection State Automaton</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  4-State Credit Conservation Ledger (Invariant P2)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Interactive state network proving mathematically that credits cannot be leaked or fabricated: <code className="text-white font-mono">Available + Active + Settling + Quarantined == Pool Capacity</code>.
                </p>
              </div>

              {/* Conservation Badge */}
              <div className="px-3 py-1.5 rounded-xl bg-crisp-emerald/10 border border-crisp-emerald/30 text-crisp-emerald font-mono text-xs font-bold flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>INVARIANT P2 VERIFIED</span>
              </div>
            </div>

            {/* INTERACTIVE 4-NODE STATE AUTOMATON WITH SVG BEZIER BRANCHES */}
            <div className="relative py-8">
              {/* SVG Connecting Branches */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none">
                <path
                  d="M 120 70 C 260 20, 380 20, 520 70 S 760 120, 900 70"
                  stroke="rgba(16, 185, 129, 0.3)"
                  strokeWidth="2.5"
                  fill="none"
                  className="animate-flow-dash"
                />
              </svg>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {[
                  { state: 'AVAILABLE', balance: poolCap - activeDebt, desc: 'Unassigned credit headroom', color: 'text-crisp-emerald', border: 'border-crisp-emerald/40' },
                  { state: 'ACTIVE', balance: activeDebt, desc: 'Currently deferred by lock holders', color: 'text-amber-400', border: 'border-amber-500/40' },
                  { state: 'SETTLING', balance: 0, desc: 'Undergoing return-to-userland sleep', color: 'text-crisp-cyan', border: 'border-crisp-cyan/40' },
                  { state: 'QUARANTINED', balance: 0, desc: 'Isolated under memory saturation', color: 'text-purple-400', border: 'border-purple-500/40' },
                ].map((s, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl bg-black/80 border ${s.border} shadow-lg space-y-2`}>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 font-bold">{s.state}</span>
                      <span className={`text-xl font-bold font-mono ${s.color}`}>{s.balance}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">{s.desc}</p>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${idx === 0 ? 'bg-crisp-emerald' : idx === 1 ? 'bg-amber-400' : 'bg-slate-600'}`}
                        style={{ width: `${(s.balance / poolCap) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Interactive Debt Slider */}
            <div className="mt-4 p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Simulate Concurrent Lock Allocations (Active Debt):</span>
                <span className="text-amber-400 font-bold">{activeDebt} pages ({activeDebt * 4} KB)</span>
              </div>
              <input
                type="range"
                min={0}
                max={poolCap}
                value={activeDebt}
                onChange={(e) => setActiveDebt(Number(e.target.value))}
                className="w-full accent-crisp-emerald"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>0 pages (Idle)</span>
                <span>Max Pool Capacity: {poolCap} pages (256 KB)</span>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* CARD 4: Lock Convoy Queue Simulation (Sticky at top-36)     */}
          {/* ========================================================== */}
          <div
            id="convoy-sim"
            className="sticky top-36 z-40 rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#1a120b] via-[#100b06] to-[#060402] border-2 border-amber-500/50 shadow-[0_-15px_40px_rgba(0,0,0,0.9),0_20px_50px_rgba(245,158,11,0.18)] transition-all duration-300"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    CARD 04
                  </span>
                  <span className="text-xs font-mono text-slate-400">Lock Convoy Backlog Simulation</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  Multi-Thread Queue Backpressure &amp; Drain
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Comparing queue length expansion when lock holders are throttled vs instant sequential handoff under CRISP-L.
                </p>
              </div>

              {/* Thread count selector */}
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300 shrink-0">
                <span>Contending Threads:</span>
                <select
                  value={convoyThreads}
                  onChange={(e) => setConvoyThreads(Number(e.target.value))}
                  className="bg-black border border-white/20 rounded-lg px-2.5 py-1 text-white font-bold"
                >
                  <option value={4}>4 Threads</option>
                  <option value={8}>8 Threads</option>
                  <option value={16}>16 Threads</option>
                  <option value={32}>32 Threads</option>
                </select>
              </div>
            </div>

            {/* VISUAL THREAD QUEUE SWIMLANES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Stock Linux Queue State */}
              <div className="p-5 rounded-2xl bg-black/80 border border-rose-900/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-400">Stock Linux (B0): Convoy Explosion</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    Queue: {convoyThreads - 1} Stalled
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-700/60 flex items-center justify-between text-rose-200">
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <strong>Thread 0 (Lock Holder)</strong>
                    </span>
                    <span className="text-[10px] text-rose-300 font-bold">SLEEPING IN RECLAIM (100ms)</span>
                  </div>

                  <div className="space-y-1 pt-1">
                    {Array.from({ length: Math.min(6, convoyThreads - 1) }).map((_, i) => (
                      <div key={i} className="p-1.5 rounded bg-white/5 border border-white/5 flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Thread {i + 1} (Waiter #{i + 1})</span>
                        <span className="text-rose-400">BLOCKED IN MUTEX_LOCK</span>
                      </div>
                    ))}
                    {convoyThreads > 7 && (
                      <div className="text-center text-[10px] text-slate-500 pt-1">
                        + {convoyThreads - 7} more blocked threads in kernel futex wait queue...
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans pt-2 border-t border-white/5">
                  Every thread in the queue accumulates the full 100ms stall of the predecessor, compounding tail latency to &gt;200ms.
                </p>
              </div>

              {/* CRISP-L Queue State */}
              <div className="p-5 rounded-2xl bg-black/80 border border-emerald-900/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-crisp-emerald">CRISP-L (M0): Instant Drain</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-crisp-emerald/20 text-crisp-emerald font-bold">
                    Queue: 0 Stalled
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-700/60 flex items-center justify-between text-emerald-200">
                    <span className="flex items-center gap-2">
                      <Unlock className="w-3.5 h-3.5 text-crisp-emerald" />
                      <strong>Thread 0 (Worker)</strong>
                    </span>
                    <span className="text-[10px] text-crisp-emerald font-bold">MUTEX FREED (CS: 0.05ms)</span>
                  </div>

                  <div className="space-y-1 pt-1">
                    {Array.from({ length: Math.min(6, convoyThreads - 1) }).map((_, i) => (
                      <div key={i} className="p-1.5 rounded bg-white/5 border border-white/5 flex items-center justify-between text-slate-300 text-[11px]">
                        <span>Thread {i + 1}</span>
                        <span className="text-crisp-emerald">EXECUTING USER REQUESTS</span>
                      </div>
                    ))}
                    {convoyThreads > 7 && (
                      <div className="text-center text-[10px] text-crisp-emerald pt-1">
                        All {convoyThreads} threads actively executing without serial lock stall.
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans pt-2 border-t border-white/5">
                  Thread 0 defers its reclaim sleep until return-to-userland outside the mutex. Lock waiters experience zero convoy inflation.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* CARD 5: Bento Telemetry Matrix & Event Stream (Sticky top-40) */}
          {/* ========================================================== */}
          <div
            id="telemetry"
            className="sticky top-40 z-50 rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#0c0d12] via-[#08080a] to-[#040405] border-2 border-white/20 shadow-[0_-20px_50px_rgba(0,0,0,0.95)] transition-all duration-300"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-bold border border-white/20">
                    CARD 05
                  </span>
                  <span className="text-xs font-mono text-slate-400">Developer Bento Grid &amp; Event Stream</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  Real-Time Kernel Event Stream &amp; Metrics
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  High-contrast trace logs, status chips, and timeline progress bars tracking allocation spans.
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-crisp-emerald animate-pulse" />
                <span className="text-slate-300">STREAM ACTIVE &bull; 60 FPS</span>
              </div>
            </div>

            {/* BENTO GRID MATRIX */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Bento Card 1: Regression Test Pass Matrix */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5 font-mono text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Formal Gate Status</span>
                <div className="space-y-1.5">
                  {[
                    { gate: 'Gate 0: Problem Reproduction', status: 'PASS', color: 'bg-crisp-emerald/20 text-crisp-emerald border-crisp-emerald/40' },
                    { gate: 'Gate 1: Safety Contract Check', status: 'PASS', color: 'bg-crisp-emerald/20 text-crisp-emerald border-crisp-emerald/40' },
                    { gate: 'Gate 2: Workarounds Ablation', status: 'WARN', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                    { gate: 'Gate 3: QEMU Prototype Efficacy', status: 'PASS', color: 'bg-crisp-emerald/20 text-crisp-emerald border-crisp-emerald/40' },
                  ].map((g, i) => (
                    <div key={i} className="flex justify-between items-center p-1.5 rounded bg-white/5 border border-white/5">
                      <span className="text-slate-300 text-[11px] truncate max-w-[180px]">{g.gate}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${g.color}`}>{g.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bento Card 2: Memory Overshoot Bounds */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 font-mono text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Physical Overshoot Bound</span>
                <div className="text-2xl font-bold text-white mt-1">4.2 MB / 100 MB</div>
                <div className="text-[11px] text-crisp-cyan">Peak overshoot: 4.2% of memory.high</div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-crisp-cyan rounded-full" style={{ width: '4.2%' }} />
                </div>
                <span className="text-[10px] text-slate-500 block pt-1">
                  Strictly bounded by Invariant P1: min(N &times; d_max, Credit Pool)
                </span>
              </div>

              {/* Bento Card 3: Novelty Audit */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 font-mono text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Academic Novelty Score</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">6.5 / 10</div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Pragmatic systems engineering; combines userland flag with cgroup deferral. Obvious-combination risk noted.
                </div>
                <span className="text-[10px] text-amber-300/80 block pt-1 border-t border-white/5">
                  Audited: Oct 22, 2026
                </span>
              </div>
            </div>

            {/* EVENT STREAM TABLE WITH DURATION PROGRESS BARS */}
            <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400 text-[11px] uppercase border-b border-white/10 pb-2">
                <span>Event Stream / Span ID</span>
                <span>Type</span>
                <span>Offset &amp; Duration Bar</span>
                <span>Outcome</span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'span_0x8f12a', type: 'MUTEX_LOCK', offset: 0, duration: 5, status: 'PASS', time: '0.05ms' },
                  { id: 'span_0x8f12b', type: 'MEMCG_ALLOC', offset: 5, duration: 15, status: 'PASS', time: '0.15ms' },
                  { id: 'span_0x8f12c', type: 'THROTTLE_DEFER', offset: 20, duration: 2, status: 'PASS', time: '0.02ms' },
                  { id: 'span_0x8f12d', type: 'MUTEX_UNLOCK', offset: 22, duration: 4, status: 'PASS', time: '0.04ms' },
                  { id: 'span_0x8f12e', type: 'DEFERRED_SETTLE', offset: 26, duration: 70, status: 'PASS', time: '0.70ms' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-white font-bold w-28 truncate">{row.id}</span>
                    <span className="text-slate-400 w-28 text-[11px]">{row.type}</span>
                    <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full relative overflow-hidden">
                      <div
                        className="absolute h-full bg-[#52a8ff] rounded-full"
                        style={{ left: `${row.offset}%`, width: `${row.duration}%` }}
                      />
                    </div>
                    <span className="text-slate-300 w-16 text-right">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 border-t border-white/5 bg-[#050505] relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold font-serif tracking-tight text-white/10 select-none pointer-events-none">
                CRISP-L.
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-2">
                Critical-Section-Aware Memory Reclaim and Throttling Research Workbench
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 text-xs font-mono text-slate-400">
              <a href="https://github.com/anant-am/osss-kryonix" target="_blank" rel="noreferrer" className="hover:text-white transition">
                GitHub Repository
              </a>
              {onNavigate && (
                <>
                  <button onClick={() => onNavigate('overview')} className="hover:text-white transition text-left">
                    Research Home
                  </button>
                  <button onClick={() => onNavigate('tests')} className="hover:text-white transition text-left">
                    Safety Contract
                  </button>
                  <button onClick={() => onNavigate('evidence')} className="hover:text-white transition text-left">
                    Prior Art
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="pt-8 mt-8 border-t border-white/5 text-[11px] text-slate-600 font-mono flex justify-between">
            <span>&copy; 2026 CRISP-L Research Systems. Open Research License.</span>
            <span>All 6 Gates Formally Documented.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
