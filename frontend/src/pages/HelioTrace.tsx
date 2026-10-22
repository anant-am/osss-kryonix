import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Server,
  Layers,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface HelioTraceProps {
  onBackToOverview?: () => void;
}

interface ServiceNode {
  id: string;
  label: string;
  role: string;
  x: number; // percentage in 16:10 canvas
  y: number;
  status: 'idle' | 'converging' | 'healthy' | 'suspect' | 'impacted';
  p99: string;
  errorRate: string;
}

export const HelioTrace: React.FC<HelioTraceProps> = ({ onBackToOverview }) => {
  // Replay timeline state: 0 to 5000 ms
  const [replayTimeMs, setReplayTimeMs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Check user system reduced-motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 5 Nodes in topology
  const nodes: ServiceNode[] = [
    {
      id: 'web-edge',
      label: 'web edge',
      role: 'Ingress & TLS Termination',
      x: 14,
      y: 50,
      status: replayTimeMs >= 100 ? 'healthy' : 'idle',
      p99: '18ms',
      errorRate: '0.01%',
    },
    {
      id: 'orders-api',
      label: 'orders-api',
      role: 'Orchestration Gateway',
      x: 38,
      y: 50,
      status:
        replayTimeMs >= 2500
          ? 'suspect'
          : replayTimeMs >= 100
          ? 'converging'
          : 'idle',
      p99: replayTimeMs >= 3700 ? '1,840ms' : '42ms',
      errorRate: replayTimeMs >= 3700 ? '14.2%' : '0.04%',
    },
    {
      id: 'inventory',
      label: 'inventory',
      role: 'Stock Availability Engine',
      x: 62,
      y: 26,
      status: replayTimeMs >= 1200 ? 'healthy' : 'idle',
      p99: '12ms',
      errorRate: '0.00%',
    },
    {
      id: 'cart-cache',
      label: 'cart-cache',
      role: 'In-Memory Session Store',
      x: 62,
      y: 74,
      status: replayTimeMs >= 1200 ? 'healthy' : 'idle',
      p99: '4ms',
      errorRate: '0.00%',
    },
    {
      id: 'billing-worker',
      label: 'billing-worker',
      role: 'Async Settlement & Ledger',
      x: 86,
      y: 50,
      status: replayTimeMs >= 3700 ? 'impacted' : 'idle',
      p99: replayTimeMs >= 3700 ? '4,820ms' : '65ms',
      errorRate: replayTimeMs >= 3700 ? '22.8%' : '0.02%',
    },
  ];

  // Determine scenario stage
  const getStageDescription = () => {
    if (replayTimeMs < 1200) {
      return 'Phase 1: Ambient traffic converging from web edge into orders-api (0.0s – 1.2s)';
    } else if (replayTimeMs < 2500) {
      return 'Phase 2: Upstream paths to inventory and cart-cache verified healthy (1.2s – 2.5s)';
    } else if (replayTimeMs < 3700) {
      return 'Phase 3: Deploy v42.8 ignites with causal stall pulse propagating (2.5s – 3.7s)';
    } else {
      return 'Phase 4: billing-worker saturated under lock stall; scenario impact settled (3.7s – 5.0s)';
    }
  };

  // Main deterministic loop stepper
  const updateLoop = useCallback((timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }
    const delta = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    if (isPlaying && !isReducedMotion) {
      setReplayTimeMs((prev) => {
        const next = prev + delta;
        if (next >= 5000) {
          // Pause slightly at end then loop smoothly
          return 5000;
        }
        return next;
      });
    }

    animFrameRef.current = requestAnimationFrame(updateLoop);
  }, [isPlaying, isReducedMotion]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateLoop]);

  // Restart replay when button clicked
  const handleRestartReplay = () => {
    setReplayTimeMs(0);
    setIsPlaying(true);
    lastTimestampRef.current = null;
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setReplayTimeMs((prev) => Math.min(5000, prev + 500));
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    setReplayTimeMs((prev) => Math.max(0, prev - 500));
  };

  // Deterministic Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 960);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 540);

    // Art direction colors
    const colBg = '#03090d';
    const colCyan = '#43ced4';
    const colIce = '#e4f3f2';
    const colOrange = '#f27343';
    const colLavender = '#6d4a87';
    const colGray = '#677177';

    // Clear background
    ctx.fillStyle = colBg;
    ctx.fillRect(0, 0, width, height);

    // Subtle background coordinate grid (32px)
    ctx.strokeStyle = 'rgba(103, 113, 119, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Helper to calculate pixel coordinates
    const getPos = (n: ServiceNode) => ({
      x: (n.x / 100) * width,
      y: (n.y / 100) * height,
    });

    const webEdge = getPos(nodes[0]);
    const ordersApi = getPos(nodes[1]);
    const inventory = getPos(nodes[2]);
    const cartCache = getPos(nodes[3]);
    const billingWorker = getPos(nodes[4]);

    // Path definitions
    const edges = [
      { from: webEdge, to: ordersApi, type: 'ambient' },
      { from: ordersApi, to: inventory, type: 'branch' },
      { from: ordersApi, to: cartCache, type: 'branch' },
      { from: ordersApi, to: billingWorker, type: 'causal' },
    ];

    // Draw paths with directional non-color dash patterns
    edges.forEach((edge) => {
      ctx.beginPath();
      ctx.moveTo(edge.from.x, edge.from.y);
      ctx.lineTo(edge.to.x, edge.to.y);

      if (edge.type === 'causal' && replayTimeMs >= 2500) {
        // Causal path ignites with orange patterned signal
        ctx.strokeStyle = colOrange;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Flowing causal pulses traveling toward billing-worker
        const progress = Math.min(1, Math.max(0, (replayTimeMs - 2500) / 1200));
        const px = edge.from.x + (edge.to.x - edge.from.x) * progress;
        const py = edge.from.y + (edge.to.y - edge.from.y) * progress;

        ctx.fillStyle = colOrange;
        ctx.shadowColor = colOrange;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle =
          edge.type === 'ambient' && replayTimeMs >= 100
            ? colCyan
            : 'rgba(103, 113, 119, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw Nodes
    nodes.forEach((node) => {
      const pos = getPos(node);
      const isSuspect = node.status === 'suspect';
      const isImpacted = node.status === 'impacted';
      const isHealthy = node.status === 'healthy';

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = isImpacted
        ? 'rgba(242, 115, 67, 0.15)'
        : isSuspect
        ? 'rgba(109, 74, 135, 0.3)'
        : isHealthy
        ? 'rgba(67, 206, 212, 0.1)'
        : 'rgba(103, 113, 119, 0.08)';
      ctx.fill();

      // Core Node Box
      ctx.beginPath();
      ctx.rect(pos.x - 14, pos.y - 14, 28, 28);
      ctx.fillStyle = '#08131a';
      ctx.fill();
      ctx.strokeStyle = isImpacted
        ? colOrange
        : isSuspect
        ? colLavender
        : isHealthy
        ? colCyan
        : colGray;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node Label
      ctx.fillStyle = colIce;
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, pos.x, pos.y + 32);

      // Node Status / Telemetry
      ctx.fillStyle = isImpacted ? colOrange : isHealthy ? colCyan : colGray;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillText(`${node.p99} · ${node.status}`, pos.x, pos.y + 45);
    });

    // Deploy v42.8 Annotation Marker near orders-api -> billing-worker
    if (replayTimeMs >= 2500) {
      const midX = (ordersApi.x + billingWorker.x) / 2;
      const midY = (ordersApi.y + billingWorker.y) / 2 - 24;

      ctx.fillStyle = colOrange;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DEPLOY v42.8 (SUSPECT)', midX, midY);

      ctx.strokeStyle = colOrange;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(midX, midY + 4);
      ctx.lineTo(midX, midY + 18);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [replayTimeMs, nodes]);

  const isSettled = replayTimeMs >= 5000;

  return (
    <div
      className="min-h-screen bg-[#03090d] text-[#e4f3f2] font-sans flex flex-col p-4 md:p-6 select-none"
      data-preview-ready={isSettled ? 'true' : 'false'}
    >
      {/* QUIET STATUS HEADER */}
      <header className="border-b border-[#677177]/20 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#43ced4]/10 border border-[#43ced4]/30 flex items-center justify-center text-[#43ced4] font-mono font-bold text-xs">
            HT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-[#e4f3f2]">
                HelioTrace
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f27343]/20 text-[#f27343] border border-[#f27343]/40 font-bold uppercase">
                Scenario Replay
              </span>
            </div>
            <p className="text-[11px] text-[#677177] font-mono">
              Deterministic incident dependency replay &bull; Checkout latency spike with Suspect deploy v42.8
            </p>
          </div>
        </div>

        {/* Quiet Telemetry Chips - All visibly labeled simulated */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <div className="px-2.5 py-1 rounded bg-[#08131a] border border-[#677177]/30 flex items-center gap-1.5 text-[#677177]">
            <Clock className="w-3.5 h-3.5 text-[#43ced4]" />
            <span>08:42:13 (Simulated)</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#08131a] border border-[#677177]/30 text-[#e4f3f2]">
            <span className="text-[#677177]">Traffic:</span> 18.6k simulated checkouts
          </div>
          <div className="px-2.5 py-1 rounded bg-[#08131a] border border-[#43ced4]/30 text-[#43ced4]">
            87% scenario confidence
          </div>
          <div className="px-2.5 py-1 rounded bg-[#f27343]/10 border border-[#f27343]/30 text-[#f27343]">
            7% simulated blast radius
          </div>
          <div className="px-2.5 py-1 rounded bg-[#6d4a87]/20 border border-[#6d4a87]/40 text-[#e4f3f2]">
            Page 2 owners
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT: 16:10 DEPENDENCY CANVAS & INCIDENT RAIL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[460px]">
        {/* Canvas Workspace (8 Cols on Desktop) */}
        <div className="lg:col-span-8 flex flex-col bg-[#050e14] border border-[#677177]/30 rounded-2xl p-4 relative overflow-hidden shadow-2xl">
          {/* Canvas Top Bar */}
          <div className="flex items-center justify-between border-b border-[#677177]/20 pb-2 mb-2 font-mono text-xs">
            <span className="text-[#677177] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#43ced4]" />
              Topology Canvas (Deterministic 5-Sec Replay)
            </span>
            <span className="text-[11px] text-[#43ced4] font-semibold">
              {(replayTimeMs / 1000).toFixed(2)}s / 5.00s
            </span>
          </div>

          {/* Interactive HTML5 Canvas */}
          <div className="flex-1 w-full h-full relative min-h-[340px]">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Poster fallback overlay when reduced motion or end state */}
            {isReducedMotion && (
              <div className="absolute top-4 right-4 p-2 rounded bg-[#08131a]/90 border border-[#677177]/40 text-[10px] font-mono text-[#677177]">
                Static Poster Mode (Reduced Motion)
              </div>
            )}
          </div>

          {/* Active Phase Banner */}
          <div className="mt-2 p-2.5 rounded-xl bg-[#08131a] border border-[#677177]/20 font-mono text-xs text-[#e4f3f2] flex items-center justify-between">
            <span className="truncate">{getStageDescription()}</span>
            <span className="text-[10px] text-[#677177] uppercase shrink-0 ml-2 font-bold">
              Seed: 0x8f2a1
            </span>
          </div>
        </div>

        {/* Incident Rail & Accessible Event Log (4 Cols on Desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-3 font-mono text-xs">
          {/* Suspected Deploy Rail Card */}
          <div className="p-4 rounded-2xl bg-[#050e14] border border-[#f27343]/40 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#f27343]">
                Suspect Deploy Identified
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#f27343]/20 text-[#f27343] font-bold">
                v42.8
              </span>
            </div>
            <p className="text-[11px] text-[#e4f3f2]/90 font-sans leading-relaxed">
              Deploy <code className="text-[#f27343] font-mono">v42.8</code> to <strong className="text-white">orders-api</strong> introduced mutex contention during memory pressure, serializing downstream calls to <strong className="text-white">billing-worker</strong>.
            </p>
            <div className="pt-2 border-t border-[#677177]/20 flex justify-between text-[10px] text-[#677177]">
              <span>Causal Path: orders-api &rarr; billing</span>
              <span className="text-[#43ced4]">CRISP Fix Available</span>
            </div>
          </div>

          {/* Accessible Live Event Log */}
          <div className="flex-1 p-4 rounded-2xl bg-[#050e14] border border-[#677177]/30 flex flex-col space-y-2 overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#677177]/20 pb-2">
              <span className="font-bold text-[#e4f3f2] text-xs">Scenario Event Stream</span>
              <span className="text-[10px] text-[#677177]">Material Changes Only</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {[
                { time: '0.00s', msg: 'Ambient request ingress established', color: 'text-[#677177]', active: replayTimeMs >= 0 },
                { time: '1.20s', msg: 'inventory & cart-cache health validated', color: 'text-[#43ced4]', active: replayTimeMs >= 1200 },
                { time: '2.50s', msg: 'Deploy v42.8 triggered in orders-api', color: 'text-[#f27343]', active: replayTimeMs >= 2500 },
                { time: '3.10s', msg: 'cgroup memory.high throttle fires on mutex holder', color: 'text-[#f27343]', active: replayTimeMs >= 3100 },
                { time: '3.70s', msg: 'billing-worker thread pool stalled (p99 4,820ms)', color: 'text-[#f27343]', active: replayTimeMs >= 3700 },
                { time: '4.80s', msg: 'Scenario impact settled: 87% confidence', color: 'text-[#43ced4]', active: replayTimeMs >= 4800 },
              ].map((ev, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-[11px] transition-all ${
                    ev.active
                      ? 'bg-[#08131a] border-[#677177]/30 opacity-100'
                      : 'border-transparent opacity-30'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">{ev.time}</span>
                    <span className={ev.color}>&bull;</span>
                  </div>
                  <div className="text-[#e4f3f2] mt-0.5">{ev.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* REPLAY FOOTER CONTROLS */}
      <footer className="mt-4 p-4 rounded-2xl bg-[#050e14] border border-[#677177]/30 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        {/* Play / Pause & Scrubber Group */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Main Replay Action Control */}
          <button
            onClick={() => {
              if (replayTimeMs >= 5000) {
                handleRestartReplay();
              } else {
                setIsPlaying(!isPlaying);
              }
            }}
            data-preview-action="replay-toggle"
            className="px-4 py-2 rounded-xl bg-[#43ced4] hover:bg-[#43ced4]/90 text-[#03090d] font-bold flex items-center gap-2 transition active:scale-95 shrink-0"
            aria-label={isPlaying ? 'Pause replay' : 'Replay active incident'}
          >
            {isPlaying && replayTimeMs < 5000 ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Replay active incident</span>
              </>
            )}
          </button>

          {/* Step Back / Step Forward */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleStepBackward}
              className="p-2 rounded-lg bg-[#08131a] hover:bg-[#0f1e29] border border-[#677177]/40 text-[#e4f3f2] transition"
              title="Step backward 500ms"
              aria-label="Step backward"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleStepForward}
              className="p-2 rounded-lg bg-[#08131a] hover:bg-[#0f1e29] border border-[#677177]/40 text-[#e4f3f2] transition"
              title="Step forward 500ms"
              aria-label="Step forward"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRestartReplay}
              className="p-2 rounded-lg bg-[#08131a] hover:bg-[#0f1e29] border border-[#677177]/40 text-[#e4f3f2] transition"
              title="Restart Replay"
              aria-label="Restart Replay"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline Scrubber Bar */}
        <div className="flex-1 max-w-md w-full flex items-center gap-3">
          <span className="text-[10px] text-[#677177] shrink-0">0.0s</span>
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={replayTimeMs}
            onChange={(e) => {
              setIsPlaying(false);
              setReplayTimeMs(Number(e.target.value));
            }}
            className="w-full accent-[#43ced4] cursor-pointer"
            aria-label="Replay timeline scrubber"
          />
          <span className="text-[10px] text-[#677177] shrink-0">5.0s</span>
        </div>

        {/* Source Prompt & Overview Link */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-[#677177]">
            Source: <span className="text-[#e4f3f2]">HelioTrace Incident Replay Engine v1.0</span>
          </span>
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="px-3 py-1.5 rounded-lg bg-[#08131a] hover:bg-[#0f1e29] border border-[#43ced4]/40 text-[#43ced4] text-xs transition font-semibold"
            >
              &larr; Research Home
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default HelioTrace;
