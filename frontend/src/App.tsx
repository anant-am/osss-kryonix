import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { SystemTourModal } from './components/SystemTourModal';
import { fetchStatus, runExperimentApi, SystemStatus } from './api';

// Pages
import { ResearchOverview } from './pages/ResearchOverview';
import { LiveExperimentLab } from './pages/LiveExperimentLab';
import { BeforeAfterComparison } from './pages/BeforeAfterComparison';
import { OSMechanismExplorer } from './pages/OSMechanismExplorer';
import { MemoryPressureExplorer } from './pages/MemoryPressureExplorer';
import { SchedulerTimeline } from './pages/SchedulerTimeline';
import { TestCorrectnessLab } from './pages/TestCorrectnessLab';
import { ResearchEvidence } from './pages/ResearchEvidence';
import { ReportsExports } from './pages/ReportsExports';
import { SettingsEnvironment } from './pages/SettingsEnvironment';
import { PortfolioShowcase } from './pages/PortfolioShowcase';
import { HelioTrace } from './pages/HelioTrace';

// Interactive Components
import { TubesBackground } from './components/TubesBackground';
import { MagnificationDock, DockItemData } from './components/MagnificationDock';
import {
  Activity,
  Sparkles,
  Radio,
  Sliders,
  Scale,
  GitBranch,
  CheckCircle2,
  Play,
  Flame,
  Settings,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isSystemTourOpen, setIsSystemTourOpen] = useState<boolean>(false);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);
  const [isTubesActive, setIsTubesActive] = useState<boolean>(false);
  const [comparisonPair, setComparisonPair] = useState<{ baselineId?: string; crispId?: string }>({});

  const loadStatus = async () => {
    try {
      const res = await fetchStatus();
      setStatus(res);
    } catch (e) {
      console.warn('Backend status check pending or loading...', e);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRunQuickBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      // Run B0 (Stock Linux baseline)
      const b0 = await runExperimentApi({
        scenario_id: 'W2',
        policy: 'B0',
        threads: 4,
        duration_sec: 3,
        name: 'Quick Benchmark — Stock Linux (B0)',
      });

      // Run M0 (CRISP Deferral)
      const m0 = await runExperimentApi({
        scenario_id: 'W2',
        policy: 'M0',
        threads: 4,
        duration_sec: 3,
        name: 'Quick Benchmark — CRISP Deferral (M0)',
      });

      setComparisonPair({ baselineId: b0.run_id, crispId: m0.run_id });
      await loadStatus();
      setCurrentPage('before-after');
    } catch (err: any) {
      alert(`Benchmark error: ${err.message || 'Execution failed'}`);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  const handleNavigateToComparison = (baselineId: string, crispId: string) => {
    setComparisonPair({ baselineId, crispId });
    setCurrentPage('before-after');
  };

  const pageHeaders: Record<PageId, { title: string; subtitle: string }> = {
    overview: {
      title: 'Research Home: CRISP-L Capped Deferral Workbench',
      subtitle: 'Critical-section-aware memory.high stall deferral in Linux 6.6 cgroups',
    },
    portfolio: {
      title: 'Systems Portfolio & Stacking Cards Showcase',
      subtitle: 'Deck-of-cards sticky scroll architecture, neural flowchart simulation, and latency tail collapse',
    },
    heliotrace: {
      title: 'HelioTrace: Deterministic Incident Dependency Replay',
      subtitle: 'Checkout latency spike investigation · Causal path topology & deploy v42.8 isolation',
    },
    lab: {
      title: 'Experiment Lab',
      subtitle: 'Live C workload execution, QEMU VM runs, and parameterized stress tests',
    },
    'before-after': {
      title: 'Results Comparison & Workload Evaluation',
      subtitle: 'Empirical evaluation of Stock Linux (B0) vs CRISP-L across Workloads A, B, C & Ablations',
    },
    mechanism: {
      title: 'Mechanism Explorer: CRISP-L State Automaton',
      subtitle: 'Interactive finite state machine, 4-state credit ledger automaton, and deferred settle ladder',
    },
    'memory-pressure': {
      title: 'Memory Pressure & Kernel Penalty Explorer',
      subtitle: 'Linux 6.6 mm/memcontrol.c throttle penalty calculation and proportional delay analysis',
    },
    timeline: {
      title: 'Thread Lock Convoy Timeline',
      subtitle: 'Swimlane trace comparison of lock-holder stalls vs post-critical-section settlement',
    },
    tests: {
      title: 'Verification & Safety Lab',
      subtitle: '6-point safety contract, bounded state-space model checker, and mutant refutations',
    },
    evidence: {
      title: 'Research & Prior Art',
      subtitle: 'Honest 6.5/10 novelty evaluation, kernel patch audit, and evidence-to-claim mapping',
    },
    settings: {
      title: 'Environment & Setup',
      subtitle: 'Linux 6.6 QEMU runner, cgroup v2 hierarchy, and kernel compatibility diagnostics',
    },
    reports: {
      title: 'Reports & Provenance',
      subtitle: 'Academic draft generation, statistical confidence intervals, and JSON/CSV provenance artifacts',
    },
  };

  const currentHeader = pageHeaders[currentPage] || {
    title: 'CRISP',
    subtitle: 'Operating Systems Research Laboratory',
  };

  const dockItems: DockItemData[] = [
    {
      icon: <Activity className="w-5 h-5 text-crisp-cyan" />,
      label: 'Home & Flowcharts',
      onClick: () => setCurrentPage('overview'),
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      label: 'Stacking Cards Deck',
      badge: 'Cards',
      onClick: () => setCurrentPage('portfolio'),
    },
    {
      icon: <Radio className="w-5 h-5 text-cyan-400" />,
      label: 'HelioTrace Replay',
      badge: 'Incident',
      onClick: () => setCurrentPage('heliotrace'),
    },
    {
      icon: <Sliders className="w-5 h-5 text-emerald-400" />,
      label: 'Experiment Lab',
      onClick: () => setCurrentPage('lab'),
    },
    {
      icon: <Scale className="w-5 h-5 text-blue-400" />,
      label: 'Results Comparison',
      onClick: () => setCurrentPage('before-after'),
    },
    {
      icon: <GitBranch className="w-5 h-5 text-purple-400" />,
      label: 'Mechanism Explorer',
      onClick: () => setCurrentPage('mechanism'),
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      label: 'Safety Contract',
      onClick: () => setCurrentPage('tests'),
    },
    {
      icon: <Flame className={`w-5 h-5 ${isTubesActive ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />,
      label: isTubesActive ? 'Disable 3D Tubes' : 'Enable 3D Tubes',
      badge: isTubesActive ? 'ON' : '3D',
      onClick: () => setIsTubesActive(!isTubesActive),
    },
    {
      icon: <Play className={`w-5 h-5 text-amber-400 ${isRunningBenchmark ? 'animate-spin' : ''}`} />,
      label: isRunningBenchmark ? 'Benchmarking...' : 'Run Workload',
      onClick: handleRunQuickBenchmark,
    },
  ];

  return (
    <div className="flex h-screen bg-dark-950 text-slate-100 font-sans overflow-hidden antialiased relative">
      {/* 3D Tubes Interactive Background Overlay */}
      {isTubesActive && (
        <TubesBackground
          isActive={isTubesActive}
          className="fixed inset-0 pointer-events-none z-0"
        />
      )}

      {/* 10-Page Sidebar Navigation */}
      <Sidebar currentPage={currentPage} onSelectPage={setCurrentPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Header Bar */}
        <Navbar
          pageTitle={currentHeader.title}
          pageSubtitle={currentHeader.subtitle}
          systemStatus={status}
          onOpenSystemTour={() => setIsSystemTourOpen(true)}
          onRunQuickBenchmark={handleRunQuickBenchmark}
          isRunningBenchmark={isRunningBenchmark}
          onOpenPortfolio={() => setCurrentPage('portfolio')}
          onOpenHelioTrace={() => setCurrentPage('heliotrace')}
        />

        {/* Scrollable Page Body */}
        <main className={`flex-1 overflow-y-auto ${currentPage === 'portfolio' || currentPage === 'heliotrace' ? 'p-0' : 'p-6'} bg-dark-950/90 pb-20`}>
          {currentPage === 'overview' && (
            <ResearchOverview
              status={status}
              onNavigate={(page: PageId) => setCurrentPage(page)}
              onRunQuickBench={handleRunQuickBenchmark}
              isRunningBenchmark={isRunningBenchmark}
            />
          )}

          {currentPage === 'portfolio' && (
            <PortfolioShowcase onNavigate={(page: PageId) => setCurrentPage(page)} />
          )}

          {currentPage === 'heliotrace' && (
            <HelioTrace onBackToOverview={() => setCurrentPage('overview')} />
          )}

          {currentPage === 'lab' && (
            <LiveExperimentLab onNavigateToComparison={handleNavigateToComparison} />
          )}

          {currentPage === 'before-after' && (
            <BeforeAfterComparison
              initialBaselineId={comparisonPair.baselineId}
              initialCrispId={comparisonPair.crispId}
            />
          )}

          {currentPage === 'mechanism' && <OSMechanismExplorer />}
          {currentPage === 'memory-pressure' && <MemoryPressureExplorer />}
          {currentPage === 'timeline' && <SchedulerTimeline />}
          {currentPage === 'tests' && <TestCorrectnessLab />}
          {currentPage === 'evidence' && <ResearchEvidence />}
          {currentPage === 'reports' && <ReportsExports />}
          {currentPage === 'settings' && <SettingsEnvironment />}
        </main>
      </div>

      {/* Magnification Dock Floating at Bottom Center Throughout the Application */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <MagnificationDock items={dockItems} />
      </div>

      {/* Executive System Tour Walkthrough Modal */}
      <SystemTourModal
        isOpen={isSystemTourOpen}
        onClose={() => setIsSystemTourOpen(false)}
        onNavigateToPage={(p) => setCurrentPage(p)}
      />
    </div>
  );
};

export default App;
