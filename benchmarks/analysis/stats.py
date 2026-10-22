"""
CRISP Statistical Analysis and Metric Aggregator
Calculates percentiles, confidence intervals, trade-off radar metrics,
and generates structured CSV/JSON exports for systems research reports.
"""

import os
import sys
import json
import math
import glob
from dataclasses import dataclass
from typing import Dict, Any, List, Optional

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)


def calculate_mean_std_ci(samples: List[float], confidence_level: float = 0.95) -> Dict[str, float]:
    n = len(samples)
    if n == 0:
        return {"mean": 0.0, "std": 0.0, "ci_low": 0.0, "ci_high": 0.0, "count": 0}
    mean = sum(samples) / float(n)
    if n == 1:
        return {"mean": mean, "std": 0.0, "ci_low": mean, "ci_high": mean, "count": 1}

    variance = sum((x - mean) ** 2 for x in samples) / float(n - 1)
    std = math.sqrt(variance)

    # 95% standard normal approximation z = 1.96
    z = 1.96 if confidence_level == 0.95 else 2.576
    margin = z * (std / math.sqrt(n))

    return {
        "mean": round(mean, 4),
        "std": round(std, 4),
        "ci_low": round(max(0.0, mean - margin), 4),
        "ci_high": round(mean + margin, 4),
        "count": n,
    }


def compare_baseline_vs_crisp(
    baseline_result: Dict[str, Any], crisp_result: Dict[str, Any]
) -> Dict[str, Any]:
    b_m = baseline_result.get("metrics", {})
    c_m = crisp_result.get("metrics", {})

    b_p99 = b_m.get("lock_wait_p99_ms", 0.0)
    c_p99 = c_m.get("lock_wait_p99_ms", 0.0)
    b_tp = b_m.get("throughput_ops_sec", 1.0)
    c_tp = c_m.get("throughput_ops_sec", 1.0)

    # Absolute and Relative differences
    p99_delta_ms = c_p99 - b_p99
    p99_reduction_ratio = (b_p99 / c_p99) if c_p99 > 0 else 1.0
    throughput_gain_pct = ((c_tp - b_tp) / b_tp) * 100.0 if b_tp > 0 else 0.0

    # Throttle events in CS
    b_cs_throttle = b_m.get("throttle_events_in_cs", 0)
    c_cs_throttle = c_m.get("throttle_events_in_cs", 0)
    cs_throttle_eliminated = b_cs_throttle - c_cs_throttle

    # Memory Overshoot
    overshoot_pages = crisp_result.get("overshoot_bound", {}).get("max_extra_pages", 128)
    overshoot_kb = overshoot_pages * 4

    # Honest Trade-off Assessment
    tradeoffs = [
        f"Lock Wait p99 reduced from {round(b_p99, 2)}ms to {round(c_p99, 2)}ms ({round(p99_reduction_ratio, 1)}x improvement).",
        f"Critical-section throttle events eliminated: {b_cs_throttle} -> {c_cs_throttle}.",
        f"Throughput changed by {round(throughput_gain_pct, 1)}% ({round(b_tp, 1)} -> {round(c_tp, 1)} ops/sec).",
        f"Trade-off: Allowed bounded memory overshoot up to {overshoot_pages} pages ({overshoot_kb} KB) above memory.high.",
        "Hard memory.max limit and OOM killer semantics remain completely unmodified.",
    ]

    return {
        "baseline_policy": baseline_result.get("policy", "B0"),
        "crisp_policy": crisp_result.get("policy", "M0"),
        "scenario_name": baseline_result.get("scenario_name", "Controlled Pressure"),
        "threads": baseline_result.get("threads", 4),
        "comparison": {
            "lock_wait_p50_ms": {"baseline": b_m.get("lock_wait_p50_ms"), "crisp": c_m.get("lock_wait_p50_ms")},
            "lock_wait_p95_ms": {"baseline": b_m.get("lock_wait_p95_ms"), "crisp": c_m.get("lock_wait_p95_ms")},
            "lock_wait_p99_ms": {"baseline": b_p99, "crisp": c_p99, "delta_ms": round(p99_delta_ms, 3), "reduction_factor": round(p99_reduction_ratio, 2)},
            "lock_wait_p999_ms": {"baseline": b_m.get("lock_wait_p999_ms"), "crisp": c_m.get("lock_wait_p999_ms")},
            "throughput_ops_sec": {"baseline": b_tp, "crisp": c_tp, "delta_pct": round(throughput_gain_pct, 2)},
            "throttle_events_in_cs": {"baseline": b_cs_throttle, "crisp": c_cs_throttle, "eliminated": cs_throttle_eliminated},
            "throttle_events_outside_cs": {"baseline": b_m.get("throttle_events_outside_cs", 0), "crisp": c_m.get("throttle_events_outside_cs", 0)},
            "memory_overshoot_pages": overshoot_pages,
            "memory_overshoot_kb": overshoot_kb,
        },
        "tradeoff_summary": tradeoffs,
    }


def generate_benchmark_reference_dataset() -> List[Dict[str, Any]]:
    """
    Generates reference comparison suite for B0, B1, B2, B3, M0, M1, M2 on standard workload W2.
    """
    from benchmarks.runner.experiment_runner import run_experiment
    results = []
    policies = ["B0", "B1", "B2", "B3", "M0", "M1", "M2"]

    for pol in policies:
        res = run_experiment(scenario_id="W2", policy=pol, threads=4, duration_sec=1, custom_name=f"Verified Benchmark {pol}")
        results.append(res)

    return results


def export_results_to_csv(results: List[Dict[str, Any]], csv_path: str) -> None:
    headers = [
        "run_id", "policy", "scenario_id", "threads", "duration_sec",
        "throughput_ops_sec", "p50_ms", "p95_ms", "p99_ms", "p999_ms",
        "throttle_in_cs", "throttle_out_cs", "category"
    ]
    with open(csv_path, "w") as f:
        f.write(",".join(headers) + "\n")
        for r in results:
            m = r.get("metrics", {})
            row = [
                r.get("run_id", ""),
                r.get("policy", ""),
                r.get("scenario_id", ""),
                str(r.get("threads", 4)),
                str(r.get("duration_sec", 1)),
                str(m.get("throughput_ops_sec", 0.0)),
                str(m.get("lock_wait_p50_ms", 0.0)),
                str(m.get("lock_wait_p95_ms", 0.0)),
                str(m.get("lock_wait_p99_ms", 0.0)),
                str(m.get("lock_wait_p999_ms", 0.0)),
                str(m.get("throttle_events_in_cs", 0)),
                str(m.get("throttle_events_outside_cs", 0)),
                r.get("category", ""),
            ]
            f.write(",".join(row) + "\n")


if __name__ == "__main__":
    print("[CRISP Stats] Generating benchmark suite across B0..B3 and M0..M2...")
    ds = generate_benchmark_reference_dataset()
    csv_file = "a:/OSSSS/benchmarks/results/benchmark_summary.csv"
    export_results_to_csv(ds, csv_file)
    print(f"[CRISP Stats] Saved reference CSV to {csv_file}")
