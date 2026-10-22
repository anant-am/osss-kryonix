# CRISP-L: Chart Data Contracts and Scientific Provenance Specification

## 1. Provenance Integrity and Categorization

To maintain academic rigor and prevent simulated data from being misrepresented as physical kernel benchmarks, CRISP-L enforces strict provenance labeling across all visualization components. Every chart must declare its provenance tier via a visible tag:

| Provenance Tag | Source Description | Verifiability |
| :--- | :--- | :--- |
| `MEASURED (QEMU 6.6)` | Live kernel runs inside Linux 6.6 QEMU virtual machine with native cgroups v2 enabled. | Empirical, verifiable via QEMU serial output logs. |
| `MEASURED (WSL2)` | Benchmark runs on WSL2 host kernel (Linux 6.6/6.18) with user-space synthetic stress. | Empirical host measurements. |
| `MODEL (M/G/1)` | Analytical queueing predictions using Pollaczek-Khinchine formula ($W_q = \frac{\lambda E[S^2]}{2(1-\rho)}$). | Mathematical model derived from arrival rate and service variance. |
| `SIMULATION` | High-fidelity interactive model generated for browser exploration when backend is offline. | Algorithmic simulation, explicitly tagged to prevent confusion. |

---

## 2. Unit Formatter Standard (`src/utils/formatters.ts`)

All numerical values displayed in charts, tables, and tooltips must use the standardized formatting functions in `src/utils/formatters.ts`:

- **Latency**:
  - `formatLatency(ms: number)`: Formats with appropriate precision:
    - $< 1$ ms: Displays in microseconds (e.g. `450 µs`).
    - $1 \le \text{latency} < 1000$ ms: Displays in milliseconds with 1-2 decimal places (e.g. `7.0 ms`).
    - $\ge 1000$ ms: Displays in seconds (e.g. `1.85 s`).
- **Memory**:
  - `formatMemory(bytes: number)`: Automatically scales to `KB`, `MB`, or `GB` with boundary-aware thresholds ($1024$ multiplier).
- **Page Counts**:
  - `formatPages(pages: number)`: Scales to physical memory footprint ($4096 \text{ bytes/page}$).
- **Throughput**:
  - `formatThroughput(opsPerSec: number)`: Formats as integer `ops/s` with comma delimiters (e.g. `14,250 ops/s`).
- **Speedup**:
  - `formatSpeedup(factor: number)`: Formats as `X.X×` (e.g. `13.5×`).

---

## 3. Core Chart Data Schemas

### 3.1 Time-Series Memory Usage (`MemoryUsageChart.tsx`)
```typescript
interface MemoryUsageDataPoint {
  timestamp_ms: number;       // Elapsed experiment time in milliseconds
  physical_usage_bytes: number;// Actual cgroup memory footprint
  memory_high_bytes: number;   // cgroup v2 memory.high limit
  memory_max_bytes?: number;   // Hard cgroup v2 memory.max (OOM threshold)
  deferred_debt_pages?: number;// Pages deferred under CRISP-L lease
}
```

### 3.2 Latency Percentile Comparison (`LatencyComparisonChart.tsx`)
```typescript
interface LatencyPercentilePoint {
  metric: string;             // 'p50', 'p95', 'p99', 'p99.9'
  baseline_ms: number;        // Stock Linux (B0) latency
  crisp_ms: number;           // CRISP-L (M0) latency
  ablation_ms?: number;       // Optional ablation (e.g. 1ms lease or no-cap)
}
```

### 3.3 Debt Accounting Stacked Area (`DebtAccountingChart.tsx`)
```typescript
interface DebtAccountingPoint {
  timestamp_ms: number;       // Time in ms
  available_credits: number;  // Available budget under cap
  active_obligations: number; // Held inside active critical section
  settling_obligations: number;// Undergoing sleep outside critical section
  quarantined_obligations: number; // Stalled due to breach
}
```
*Verification Check:* At every sample index, $\sum \text{fields} = \text{Total Capacity} \pm 0.001$.

### 3.4 Multi-Thread Timeline Gantt (`ExecutionTimeline.tsx`)
```typescript
interface ThreadEvent {
  thread_id: number;          // Thread identifier (0..N-1)
  event_type: 'LOCK_WAIT' | 'IN_CS' | 'DEFERRED_STALL' | 'SETTLEMENT';
  start_ms: number;           // Start offset in milliseconds
  duration_ms: number;        // Duration in milliseconds
  detail?: string;            // Additional context (e.g., 'Alloc 4MB', 'Stall 18ms')
}
```
