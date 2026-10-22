/**
 * CRISP API Client & Types
 */

export interface SystemStatus {
  status: string;
  project: string;
  full_name: string;
  current_gate: string;
  gates: ResearchGate[];
  environment: {
    host_os: string;
    kernel_version: string;
    has_wsl: boolean;
    cgroup2_available: boolean;
    runner_mode: string;
  };
  total_experiments: number;
  latest_baseline_b0?: ExperimentRecord;
  latest_crisp_run?: ExperimentRecord;
  passing_tests: number;
  failing_tests: number;
}

export interface ResearchGate {
  gate_id: string;
  title: string;
  status: 'PASSED' | 'FAILED' | 'PENDING' | 'IN_PROGRESS' | 'PASSED_QEMU_VM' | 'PASSED_MODEL_CHECKER' | string;
  description: string;
  criterion?: string;
  hypothesis_id: string;
  evidence_summary: string;
  is_blocking: boolean;
  updated_at: string;
}

export interface PreflightCheck {
  name: string;
  passed: boolean;
  detail: string;
  required: boolean;
}

export interface PreflightResult {
  status: string;
  environment: any;
  checks: PreflightCheck[];
  timestamp: string;
}

export interface ExperimentMetrics {
  policy: string;
  threads: number;
  duration_sec: number;
  throughput_ops_sec: number;
  total_operations: number;
  total_allocations: number;
  lock_wait_p50_ms: number;
  lock_wait_p95_ms: number;
  lock_wait_p99_ms: number;
  lock_wait_p999_ms: number;
  throttle_events_in_cs: number;
  throttle_events_outside_cs: number;
  sample_count: number;
}

export interface ExperimentRecord {
  run_id: string;
  name: string;
  timestamp: string;
  category: 'linux_qemu_vm' | 'model_simulation' | 'wsl2_linux' | 'bare_metal' | 'stock_linux_measured' | 'recorded_demonstration_artifact';
  policy: string;
  scenario_id: string;
  scenario_name: string;
  threads: number;
  duration_sec: number;
  throughput_ops_sec: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  p999_ms: number;
  throttle_events_in_cs: number;
  throttle_events_outside_cs: number;
  metrics: ExperimentMetrics;
  queueing_prediction?: any;
  overshoot_bound?: {
    max_extra_pages: number;
    max_extra_kb: number;
    enforced_by: string;
  };
  environment?: any;
}

export interface ComparisonResult {
  baseline_policy: string;
  crisp_policy: string;
  scenario_name: string;
  threads: number;
  comparison: {
    lock_wait_p50_ms: { baseline: number; crisp: number };
    lock_wait_p95_ms: { baseline: number; crisp: number };
    lock_wait_p99_ms: { baseline: number; crisp: number; delta_ms: number; reduction_factor: number };
    lock_wait_p999_ms: { baseline: number; crisp: number };
    throughput_ops_sec: { baseline: number; crisp: number; delta_pct: number };
    throttle_events_in_cs: { baseline: number; crisp: number; eliminated: number };
    throttle_events_outside_cs: { baseline: number; crisp: number };
    memory_overshoot_pages: number;
    memory_overshoot_kb: number;
  };
  tradeoff_summary: string[];
}

export interface WorkloadScenario {
  id: string;
  name: string;
  description: string;
  threads: number;
  duration_sec: number;
  cs_duration_us: number;
  alloc_pages: number;
  alloc_prob_pct: number;
  memory_high_mb: number;
  memory_max_mb: number;
  swap_enabled: boolean;
}

export interface AutomatonStep {
  step: number;
  thread_id: string;
  from_state: string;
  to_state: string;
  action: string;
  detail: string;
  ledger_state: {
    available: number;
    active: number;
    settling: number;
    quarantined: number;
    invariant_valid: boolean;
  };
  virtual_time_us: number;
}

export interface AutomatonSimulation {
  stage: string;
  outcome: string;
  total_steps: number;
  final_ledger: any;
  trace: AutomatonStep[];
}

export interface TestSuiteResult {
  total_ran: number;
  passed: number;
  failed: number;
  errors: number;
  duration_ms: number;
  all_passed: boolean;
  tests: {
    test_name: string;
    passed: boolean;
    doc: string;
  }[];
}

const API_BASE = '/api';

export async function fetchStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function fetchPreflight(): Promise<PreflightResult> {
  const res = await fetch(`${API_BASE}/preflight`);
  if (!res.ok) throw new Error('Failed to fetch preflight');
  return res.json();
}

export interface SafetyProperty {
  id: string;
  name: string;
  contract: string;
  rule: string;
}

export interface MutantCounterexample {
  id: string;
  name: string;
  description: string;
  expected_violation: string;
  expected_steps: number;
  refuting_trace: Array<{ step: number | string; action: string; thread: number; detail: string }>;
}

export interface SafetyContractSummary {
  title: string;
  author: string;
  scope: string;
  properties: SafetyProperty[];
  model_checker_results: {
    variant_2_threads: {
      threads: number;
      explored_states: number;
      explored_transitions: number;
      violations_found: number;
      max_drain_steps: number;
      status: string;
    };
    variant_3_threads: {
      threads: number;
      explored_states: number;
      explored_transitions: number;
      violations_found: number;
      max_drain_steps: number;
      status: string;
    };
  };
  mutation_counterexamples: MutantCounterexample[];
}

export interface BoundedCheckResult {
  status: 'PASSED' | 'FAILED';
  threads_evaluated: number;
  max_depth_explored: number;
  states_explored: number;
  transitions_explored: number;
  violations_found: number;
  violations: Array<{ property: string; depth: number; path: string[]; message: string }>;
  duration_sec: number;
  verdict: string;
}

export async function fetchExperiments(limit: number = 50, category?: string): Promise<ExperimentRecord[]> {
  const q = new URLSearchParams({ limit: limit.toString() });
  if (category) q.set('category', category);
  const res = await fetch(`${API_BASE}/experiments?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch experiments');
  return res.json();
}

export async function fetchExperiment(id: string): Promise<ExperimentRecord> {
  const res = await fetch(`${API_BASE}/experiments/${id}`);
  if (!res.ok) throw new Error('Failed to fetch experiment');
  return res.json();
}

export async function runExperimentApi(params: {
  scenario_id: string;
  policy: string;
  threads: number;
  duration_sec: number;
  name?: string;
}): Promise<ExperimentRecord> {
  const res = await fetch(`${API_BASE}/experiments/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown execution error' }));
    throw new Error(err.detail || 'Execution failed');
  }
  return res.json();
}

export async function fetchComparison(baseId: string, crispId: string): Promise<ComparisonResult> {
  const res = await fetch(`${API_BASE}/experiments/compare/${baseId}/${crispId}`);
  if (!res.ok) throw new Error('Failed to fetch comparison');
  return res.json();
}

export async function fetchScenarios(): Promise<WorkloadScenario[]> {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function simulateModel(params: {
  stage?: string;
  cap?: number;
  pool?: number;
  pages?: number;
  overage?: number;
}): Promise<AutomatonSimulation> {
  const q = new URLSearchParams();
  if (params.stage) q.set('stage', params.stage);
  if (params.cap) q.set('cap', params.cap.toString());
  if (params.pool) q.set('pool', params.pool.toString());
  if (params.pages) q.set('pages', params.pages.toString());
  if (params.overage !== undefined) q.set('overage', params.overage.toString());

  const res = await fetch(`${API_BASE}/model/simulate?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to simulate automaton');
  return res.json();
}

export async function calcQueueing(params: any): Promise<any> {
  const res = await fetch(`${API_BASE}/model/queueing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Queueing calculation failed');
  return res.json();
}

export async function fetchPenaltyTable(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/model/penalty-table`);
  if (!res.ok) throw new Error('Failed to fetch penalty table');
  return res.json();
}

export async function fetchGates(): Promise<ResearchGate[]> {
  const res = await fetch(`${API_BASE}/gates`);
  if (!res.ok) throw new Error('Failed to fetch gates');
  return res.json();
}

export async function runTestSuite(): Promise<TestSuiteResult> {
  const res = await fetch(`${API_BASE}/tests/run`, { method: 'POST' });
  if (!res.ok) throw new Error('Test suite execution failed');
  return res.json();
}

export async function fetchSafetyContract(): Promise<SafetyContractSummary> {
  const res = await fetch(`${API_BASE}/safety-contract`);
  if (!res.ok) throw new Error('Failed to fetch safety contract');
  return res.json();
}

export async function runBoundedCheck(threads: number = 2, maxDepth: number = 12): Promise<BoundedCheckResult> {
  const res = await fetch(`${API_BASE}/checker/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threads, max_depth: maxDepth }),
  });
  if (!res.ok) throw new Error('Bounded model check execution failed');
  return res.json();
}
