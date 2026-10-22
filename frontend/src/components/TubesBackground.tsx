import React, { useEffect, useRef, useState } from 'react';

// Helper for random colors
const randomColors = (count: number) => {
  return new Array(count)
    .fill(0)
    .map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
};

interface TubesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  enableClickInteraction?: boolean;
  isActive?: boolean;
}

export function TubesBackground({
  children,
  className = '',
  enableClickInteraction = true,
  isActive = true,
}: TubesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const tubesRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive) return;

    let mounted = true;
    let cleanup: (() => void) | undefined;
    let animId: number;

    const initTubes = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;

      try {
        // Attempt loading tubes1 cursor from threejs-components
        // @ts-ignore
        const module = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
        const TubesCursor = module.default;

        if (!mounted || !canvas) return;

        const app = TubesCursor(canvas, {
          tubes: {
            colors: ['#00e5ff', '#ffb347', '#ff2f3a'],
            lights: {
              intensity: 220,
              colors: ['#00f0ff', '#ff6b4a', '#ffb347', '#6d4a87'],
            },
          },
        });

        tubesRef.current = app;
        setIsLoaded(true);

        const handleResize = () => {
          if (app && typeof app.resize === 'function') {
            app.resize();
          }
        };

        window.addEventListener('resize', handleResize);
        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          if (app && typeof app.destroy === 'function') {
            try { app.destroy(); } catch (_) {}
          }
        };
      } catch (err) {
        // Graceful high-performance Canvas 2D fallback with neon particle curves
        if (!mounted || !canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
          if (!canvas) return;
          width = canvas.width = window.innerWidth;
          height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Neon tubes particle simulation
        const points: { x: number; y: number; vx: number; vy: number; hue: number }[] = [];
        let mouseX = width / 2;
        let mouseY = height / 2;

        for (let i = 0; i < 18; i++) {
          points.push({
            x: mouseX + (Math.random() - 0.5) * 200,
            y: mouseY + (Math.random() - 0.5) * 200,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            hue: 180 + i * 10,
          });
        }

        const handleMouseMove = (e: MouseEvent) => {
          mouseX = e.clientX;
          mouseY = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const render = () => {
          ctx.fillStyle = 'rgba(5, 7, 10, 0.12)';
          ctx.fillRect(0, 0, width, height);

          // Connect points with glowing Bézier ribbons
          ctx.lineWidth = 3;
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            // gravitate smoothly toward mouse
            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            p.vx += dx * 0.001;
            p.vy += dy * 0.001;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.x += p.vx;
            p.y += p.vy;

            const next = points[(i + 1) % points.length];
            const xc = (p.x + next.x) / 2;
            const yc = (p.y + next.y) / 2;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.quadraticCurveTo(p.x, p.y, xc, yc);
            ctx.strokeStyle = `hsla(${p.hue}, 90%, 60%, 0.45)`;
            ctx.shadowColor = `hsla(${p.hue}, 100%, 65%, 0.8)`;
            ctx.shadowBlur = 15;
            ctx.stroke();
          }

          animId = requestAnimationFrame(render);
        };

        render();
        setIsLoaded(true);

        cleanup = () => {
          cancelAnimationFrame(animId);
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('mousemove', handleMouseMove);
        };
      }
    };

    initTubes();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
      cancelAnimationFrame(animId);
    };
  }, [isActive]);

  const handleClick = () => {
    if (!enableClickInteraction) return;

    if (tubesRef.current?.tubes?.setColors) {
      const colors = randomColors(3);
      const lightsColors = randomColors(4);
      tubesRef.current.tubes.setColors(colors);
      tubesRef.current.tubes.setLightsColors(lightsColors);
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-[400px] overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {isActive && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block pointer-events-auto z-0"
          style={{ touchAction: 'none' }}
        />
      )}

      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

export default TubesBackground;
