# CRISP-L: UI/UX Design System and Accessibility Guidelines

## 1. Visual Philosophy: Professional Systems Engineering

The CRISP-L user interface is designed specifically for operating systems researchers, kernel engineers, and technical evaluators. It prioritizes information density, data clarity, responsive latency, and dark-first ergonomics.

### Key Design Tenets
1. **Zero Fluff**: Avoid generic marketing aesthetics. Every widget displays actionable kernel metrics, memory boundaries, or state transitions.
2. **Deterministic Layouts**: Prevent layout shifting during data streaming with explicit chart aspect ratios and fallback skeletons.
3. **Rigorous Typography**: Use monospaced fonts (`JetBrains Mono`, `Fira Code`, or native monospace) for addresses, memory sizes, hex dumps, and percentiles.

---

## 2. Color Palette and Token System

```css
/* Core Dark Palette */
--bg-dark-950: #06090e;      /* Deep terminal slate */
--bg-dark-900: #0b101b;      /* Primary container surface */
--bg-dark-850: #101726;      /* Elevated cards & interactive panels */
--bg-dark-800: #172136;      /* Hover states & borders */
--border-dark-700: #1f2e4d;  /* Structural divider line */

/* Semantic Research Accents */
--crisp-cyan: #38bdf8;       /* Primary CRISP mechanism / active lease */
--crisp-emerald: #10b981;    /* Invariants satisfied / verified gate */
--crisp-amber: #f59e0b;      /* Memory pressure warnings / throttle approach */
--crisp-rose: #f43f5e;       /* Lock convoys / stock kernel stall / failure */
--crisp-purple: #a855f7;     /* Comparative analysis / ablation studies */
```

---

## 3. Motion and Three.js Fallbacks

Modern fluid animations are integrated selectively to communicate complex systems concepts without distracting from data inspection:

1. **Three.js Spline Background (`TubesBackground.tsx`)**:
   - Renders 3 subtle wireframe Catmull-Rom spline curves conveying memory reclaim conduits.
   - Low-power mode: `powerPreference: 'low-power'` to protect GPU resources on developer laptops.
   - **`prefers-reduced-motion` compliance**: If the user has enabled reduced motion in OS settings, WebGL rendering is completely bypassed in favor of a static CSS gradient.
2. **Stacking Cards Sticky Scroll (`PortfolioShowcase.tsx`)**:
   - Implements native CSS sticky positioning (`sticky top-20`) for buttery-smooth scrolling without expensive JavaScript scroll listeners.
3. **Floating Magnification Dock (`MagnificationDock.tsx`)**:
   - Smooth exponential curve scaling on mouse hover, providing one-click access across all 10 laboratory pages.
4. **Radiant Command Palette (`RadiantCommandPalette.tsx`)**:
   - Accessible via standard `Cmd+K` / `Ctrl+K` key combinations with keyboard navigation (`Up`, `Down`, `Enter`, `Escape`).

---

## 4. Accessibility & Web Standards

- **Color Contrast**: All text meets WCAG 2.1 AA standards ($4.5:1$ contrast ratio against dark backgrounds).
- **Interactive Focus States**: Focus rings (`ring-2 ring-crisp-cyan/50`) ensure complete keyboard navigability.
- **Screen Reader Context**: Descriptive `aria-label` tags on all icon-only buttons and modal controls.
- **Proven Data Provenance**: Badges are programmatically readable and do not rely on color alone to convey tier (e.g. text labels `MEASURED`, `MODEL`, `SIMULATION`).
