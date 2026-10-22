"""
CRISP Benchmark Workload Scenario Definitions (W1 to W12)
"""

from dataclasses import dataclass
from typing import Dict, Any, List


@dataclass
class WorkloadScenario:
    id: str
    name: str
    description: str
    threads: int
    duration_sec: int
    cs_duration_us: int
    alloc_pages: int
    alloc_prob_pct: int
    memory_high_mb: int
    memory_max_mb: int
    swap_enabled: bool


SCENARIOS: Dict[str, WorkloadScenario] = {
    "W1": WorkloadScenario(
        id="W1",
        name="No Memory Pressure Baseline",
        description="Establish baseline lock wait latency and throughput with ample headroom.",
        threads=4,
        duration_sec=3,
        cs_duration_us=50,
        alloc_pages=4,
        alloc_prob_pct=5,
        memory_high_mb=500,
        memory_max_mb=1000,
        swap_enabled=False,
    ),
    "W2": WorkloadScenario(
        id="W2",
        name="Controlled Memory Pressure",
        description="Threads actively allocate freshly faulted pages under tight memory.high (overage ~5%).",
        threads=4,
        duration_sec=3,
        cs_duration_us=50,
        alloc_pages=16,
        alloc_prob_pct=25,
        memory_high_mb=100,
        memory_max_mb=250,
        swap_enabled=False,
    ),
    "W3": WorkloadScenario(
        id="W3",
        name="Short Critical Sections",
        description="Micro-critical section (10us). Tests whether deferral accounting overhead is justified.",
        threads=4,
        duration_sec=3,
        cs_duration_us=10,
        alloc_pages=8,
        alloc_prob_pct=15,
        memory_high_mb=100,
        memory_max_mb=250,
        swap_enabled=False,
    ),
    "W4": WorkloadScenario(
        id="W4",
        name="Long Critical Sections",
        description="Long critical section (250us). Evaluates lock-convoy cascading latency inflation.",
        threads=4,
        duration_sec=3,
        cs_duration_us=250,
        alloc_pages=32,
        alloc_prob_pct=30,
        memory_high_mb=100,
        memory_max_mb=250,
        swap_enabled=False,
    ),
    "W5": WorkloadScenario(
        id="W5",
        name="Thread Scaling Sweep",
        description="Evaluate contention scaling from 2 up to 16 threads.",
        threads=8,
        duration_sec=3,
        cs_duration_us=50,
        alloc_pages=16,
        alloc_prob_pct=25,
        memory_high_mb=100,
        memory_max_mb=250,
        swap_enabled=False,
    ),
    "W6": WorkloadScenario(
        id="W6",
        name="Headroom Sensitivity Sweep",
        description="Sweep overage ratios from 1% up to 18% to evaluate throttle curve inflection.",
        threads=4,
        duration_sec=3,
        cs_duration_us=50,
        alloc_pages=16,
        alloc_prob_pct=25,
        memory_high_mb=80,
        memory_max_mb=250,
        swap_enabled=False,
    ),
    "W7": WorkloadScenario(
        id="W7",
        name="Reclaimable vs Unreclaimable",
        description="Tests performance when anonymous memory pressure resists easy page-cache eviction.",
        threads=4,
        duration_sec=3,
        cs_duration_us=50,
        alloc_pages=24,
        alloc_prob_pct=40,
        memory_high_mb=90,
        memory_max_mb=200,
        swap_enabled=True,
    ),
    "W8": WorkloadScenario(
        id="W8",
        name="Concurrent Memory Release",
        description="Tests accounting integrity when concurrent threads uncharge and free memory.",
        threads=6,
        duration_sec=3,
        cs_duration_us=50,
        alloc_pages=16,
        alloc_prob_pct=20,
        memory_high_mb=100,
        memory_max_mb=250,
        swap_enabled=False,
    ),
    "W9": WorkloadScenario(
        id="W9",
        name="Per-Thread Cap Boundary",
        description="Forces allocations below, exactly at, and above the configured cap d_max.",
        threads=4,
        duration_sec=3,
        cs_duration_us=50,
        alloc_pages=40,  # Exceeds cap 32 -> triggers fallback
        alloc_prob_pct=50,
        memory_high_mb=100,
        memory_max_mb=250,
        swap_enabled=False,
    ),
    "W10": WorkloadScenario(
        id="W10",
        name="Multi-Thread Pool Contention",
        description="Stress tests M1 shared atomic pool with 16 competing threads.",
        threads=16,
        duration_sec=3,
        cs_duration_us=50,
        alloc_pages=16,
        alloc_prob_pct=30,
        memory_high_mb=100,
        memory_max_mb=300,
        swap_enabled=False,
    ),
    "W11": WorkloadScenario(
        id="W11",
        name="Thread Churn & Exit Path",
        description="Evaluates debt reconciliation when threads exit immediately after deferring debt.",
        threads=8,
        duration_sec=3,
        cs_duration_us=50,
        alloc_pages=16,
        alloc_prob_pct=25,
        memory_high_mb=100,
        memory_max_mb=250,
        swap_enabled=False,
    ),
    "W12": WorkloadScenario(
        id="W12",
        name="Interruption & Safety Limits",
        description="Tests cancellation and cgroup cleanup under abnormal termination.",
        threads=4,
        duration_sec=2,
        cs_duration_us=50,
        alloc_pages=16,
        alloc_prob_pct=20,
        memory_high_mb=100,
        memory_max_mb=250,
        swap_enabled=False,
    ),
}


def get_scenario(scenario_id: str) -> WorkloadScenario:
    return SCENARIOS.get(scenario_id, SCENARIOS["W2"])


def list_scenarios() -> List[Dict[str, Any]]:
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "threads": s.threads,
            "duration_sec": s.duration_sec,
            "cs_duration_us": s.cs_duration_us,
            "alloc_pages": s.alloc_pages,
            "alloc_prob_pct": s.alloc_prob_pct,
            "memory_high_mb": s.memory_high_mb,
            "memory_max_mb": s.memory_max_mb,
            "swap_enabled": s.swap_enabled,
        }
        for s in SCENARIOS.values()
    ]
