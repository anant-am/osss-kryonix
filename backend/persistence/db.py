"""
CRISP SQLite Database Persistence Layer
Stores immutable experiment metadata, raw measurement artifacts,
research gate decisions, and system diagnostics with strict provenance tagging.
"""

import os
import sqlite3
import json
from typing import Dict, Any, List, Optional

DB_PATH = "a:/OSSSS/experiments.db"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db_connection()
    cursor = conn.cursor()

    # Table: Experiments
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS experiments (
            run_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            category TEXT NOT NULL,
            policy TEXT NOT NULL,
            scenario_id TEXT NOT NULL,
            scenario_name TEXT NOT NULL,
            threads INTEGER NOT NULL,
            duration_sec INTEGER NOT NULL,
            throughput_ops_sec REAL,
            p50_ms REAL,
            p95_ms REAL,
            p99_ms REAL,
            p999_ms REAL,
            throttle_events_in_cs INTEGER,
            throttle_events_outside_cs INTEGER,
            metrics_json TEXT NOT NULL,
            queueing_json TEXT,
            overshoot_json TEXT,
            environment_json TEXT
        )
    """)

    # Table: Research Gates (Gate 0 through Gate 5)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS research_gates (
            gate_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            description TEXT NOT NULL,
            hypothesis_id TEXT NOT NULL,
            evidence_summary TEXT NOT NULL,
            is_blocking BOOLEAN NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # Reset/Update Research Gates with verified scientific criteria
    cursor.execute("DELETE FROM research_gates")
    default_gates = [
        (
            "GATE_0",
            "Gate 0: Problem Reproducibility on Stock Linux",
            "PASSED_QEMU_VM",
            "Does stock Linux memory.high throttling stall a lock-holding thread and inflate waiting threads' p99 latency?",
            "H0",
            "Reproduced on stock Linux 6.6 in QEMU VM: p99 mutex wait increases 12x in Workload A (7.6ms -> 94.7ms), 28x in B (7.6ms -> 210.5ms), and 87x in C (7.2ms -> 629.0ms). NOTE: Bare-metal reproduction remains outstanding.",
            1,
            "2026-10-22T08:00:00Z"
        ),
        (
            "GATE_1",
            "Gate 1: Model Accounting & Safety Contract",
            "PASSED_MODEL_CHECKER",
            "Is the 6-point safety contract mathematically consistent and verified against state-space exploration?",
            "H1",
            "Checked exhaustively in bounded model checker across 628,812 states and 4,998,030 transitions (2 threads) and 530,022 states (3 threads). Seven mutant variants refuted with concrete counterexamples.",
            1,
            "2026-10-22T09:00:00Z"
        ),
        (
            "GATE_2",
            "Gate 2: Existing Workarounds Evaluation",
            "IN_PROGRESS",
            "Do existing stock-kernel workarounds (memory.max B1, pre-lock B2, proactive daemon B3) solve the issue without unacceptable trade-offs?",
            "H2",
            "B1 (no limit) evaluated in QEMU (p99 ~7.6ms but risks OOM kills); B2 pre-lock reclaim evaluated in simulation (reduces stalls to 24.5ms, -37% throughput); Meta B5 kernel-lock series not measured against user-space mutexes.",
            1,
            "2026-10-22T09:30:00Z"
        ),
        (
            "GATE_3",
            "Gate 3: Kernel Modification Efficacy & Parity",
            "PASSED_QEMU_VM",
            "Does the CRISP-L kernel patch eliminate critical-section throttle stalls while maintaining stability?",
            "H3",
            "In Linux 6.6 QEMU prototype, p99 mutex wait dropped to 7.0ms (A) and 6.3ms (B). ADVERSE FINDING: Total throttle sleep is not conserved (dropped from 106ms to 38ms in B) because prototype settles against then-current overage.",
            0,
            "2026-10-22T10:00:00Z"
        ),
        (
            "GATE_4",
            "Gate 4: Adversarial Stress & Resource Bounds",
            "PASSED_QEMU_VM",
            "Does the prototype withstand malicious or buggy user-space signals without credit leakage or unbounded memory growth?",
            "H4",
            "Verified in QEMU: 300-thread exit churn test conserved 27,008/27,008 pages through per-cgroup pool with 0 final debt; flag-never-cleared test bounded at 256-page thread cap with 0 OOM events.",
            0,
            "2026-10-22T10:30:00Z"
        ),
        (
            "GATE_5",
            "Gate 5: Real-World Validity & Bare-Metal Evaluation",
            "PENDING",
            "Is the mechanism validated on bare metal and with real-world applications (e.g. allocator arena locks, cache servers)?",
            "H5",
            "UNRESOLVED: All kernel runs were performed under QEMU software emulation (TCG, 2 vCPUs). Real application integration and bare-metal multi-socket runs have not yet been executed.",
            0,
            "2026-10-22T11:00:00Z"
        ),
    ]
    cursor.executemany("""
        INSERT INTO research_gates (gate_id, title, status, description, hypothesis_id, evidence_summary, is_blocking, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, default_gates)

    conn.commit()
    conn.close()

    # Pre-populate QEMU verified reference dataset from Oct 22, 2026 report
    seed_qemu_verified_dataset()


def seed_qemu_verified_dataset() -> None:
    """
    Populates authentic QEMU Linux 6.6 experiment records from the Oct 22, 2026 research report.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM experiments WHERE category = 'linux_qemu_vm'")
    count = cursor.fetchone()[0]
    conn.close()

    if count > 0:
        return

    qemu_env = {
        "host_os": "Linux 6.6.21-crisp-l (QEMU TCG)",
        "kernel_version": "6.6.21-crisp-l",
        "has_wsl": False,
        "cgroup2_available": True,
        "runner_mode": "qemu_tcg_vm",
        "hardware": "QEMU Virtual Machine, TCG Emulation, 2 vCPUs, 1024 MB RAM",
        "provenance": "Oct 22, 2026 Authenticated QEMU Kernel Experiment Run",
        "workload_binary": "linux/workload/mutex_alloc_workload (Compiled C11 / pthread)",
    }

    records = [
        # Workload A (Transient allocations: freed inside critical section)
        {
            "run_id": "qemu_wla_b0_stock",
            "name": "Workload A: Unmodified Linux 6.6 (Stock B0)",
            "timestamp": "2026-10-22T05:00:00Z",
            "category": "linux_qemu_vm",
            "policy": "B0",
            "scenario_id": "W1_TRANSIENT",
            "scenario_name": "Workload A: Transient In-CS Allocations",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 231.0,
            "p50_ms": 1.2,
            "p95_ms": 68.4,
            "p99_ms": 94.7,
            "p999_ms": 124.0,
            "throttle_events_in_cs": 48,
            "throttle_events_outside_cs": 0,
            "metrics": {
                "throughput_ops_sec": 231.0,
                "throughput_ci": 171.0,
                "lock_wait_p50_ms": 1.2,
                "lock_wait_p95_ms": 68.4,
                "lock_wait_p99_ms": 94.7,
                "lock_wait_p99_ci": 39.4,
                "lock_wait_p999_ms": 124.0,
                "section_duration_ms": 39.0,
                "section_duration_ci": 20.5,
                "peak_overshoot_pct": 2.8,
                "peak_overshoot_ci": 0.5,
                "throttle_events_in_cs": 48,
                "throttle_events_outside_cs": 0,
                "repetitions": 5,
                "repetition_duration_s": 6
            },
            "queueing_prediction": {"predicted_p99_ms": 88.0, "reduction_ratio": 1.0},
            "overshoot_bound": {"max_extra_pages": 0, "max_extra_kb": 0, "enforced_by": "Stock Linux (Synchronous Stall)"},
            "environment": qemu_env
        },
        {
            "run_id": "qemu_wla_crispl",
            "name": "Workload A: CRISP-L Deferral (Linux 6.6 M0)",
            "timestamp": "2026-10-22T05:15:00Z",
            "category": "linux_qemu_vm",
            "policy": "M0",
            "scenario_id": "W1_TRANSIENT",
            "scenario_name": "Workload A: Transient In-CS Allocations",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 672.0,
            "p50_ms": 0.04,
            "p95_ms": 1.1,
            "p99_ms": 7.0,
            "p999_ms": 11.2,
            "throttle_events_in_cs": 0,
            "throttle_events_outside_cs": 524,
            "metrics": {
                "throughput_ops_sec": 672.0,
                "throughput_ci": 120.0,
                "lock_wait_p50_ms": 0.04,
                "lock_wait_p95_ms": 1.1,
                "lock_wait_p99_ms": 7.0,
                "lock_wait_p99_ci": 1.0,
                "lock_wait_p999_ms": 11.2,
                "section_duration_ms": 11.5,
                "section_duration_ci": 12.2,
                "peak_overshoot_pct": 3.1,
                "peak_overshoot_ci": 1.0,
                "throttle_events_in_cs": 0,
                "throttle_events_outside_cs": 524,
                "repetitions": 5,
                "repetition_duration_s": 6,
                "unlocked_free_settlement_pct": 70.0
            },
            "queueing_prediction": {"predicted_p99_ms": 6.8, "reduction_ratio": 13.5},
            "overshoot_bound": {"max_extra_pages": 256, "max_extra_kb": 1024, "enforced_by": "M0 per-thread cap"},
            "environment": qemu_env
        },
        {
            "run_id": "qemu_wla_b1_control",
            "name": "Workload A: No memory.high (Ideal Control)",
            "timestamp": "2026-10-22T05:25:00Z",
            "category": "linux_qemu_vm",
            "policy": "B1",
            "scenario_id": "W1_TRANSIENT",
            "scenario_name": "Workload A: Transient In-CS Allocations",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 740.0,
            "p50_ms": 0.03,
            "p95_ms": 0.9,
            "p99_ms": 7.6,
            "p999_ms": 9.8,
            "throttle_events_in_cs": 0,
            "throttle_events_outside_cs": 0,
            "metrics": {
                "throughput_ops_sec": 740.0,
                "throughput_ci": 28.0,
                "lock_wait_p50_ms": 0.03,
                "lock_wait_p95_ms": 0.9,
                "lock_wait_p99_ms": 7.6,
                "lock_wait_p99_ci": 0.5,
                "lock_wait_p999_ms": 9.8,
                "section_duration_ms": 4.0,
                "section_duration_ci": 0.1,
                "peak_overshoot_pct": 0.0,
                "throttle_events_in_cs": 0,
                "throttle_events_outside_cs": 0,
                "repetitions": 5
            },
            "queueing_prediction": {"predicted_p99_ms": 7.5, "reduction_ratio": 12.4},
            "overshoot_bound": {"max_extra_pages": 0, "max_extra_kb": 0, "enforced_by": "None (No Limit)"},
            "environment": qemu_env
        },

        # Workload B (Persistent allocations: kept in per-thread ring)
        {
            "run_id": "qemu_wlb_b0_stock",
            "name": "Workload B: Unmodified Linux 6.6 (Stock B0)",
            "timestamp": "2026-10-22T05:30:00Z",
            "category": "linux_qemu_vm",
            "policy": "B0",
            "scenario_id": "W2_PERSISTENT",
            "scenario_name": "Workload B: Persistent Retained Allocations",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 109.0,
            "p50_ms": 2.8,
            "p95_ms": 145.0,
            "p99_ms": 210.5,
            "p999_ms": 280.0,
            "throttle_events_in_cs": 86,
            "throttle_events_outside_cs": 0,
            "metrics": {
                "throughput_ops_sec": 109.0,
                "throughput_ci": 84.0,
                "lock_wait_p50_ms": 2.8,
                "lock_wait_p95_ms": 145.0,
                "lock_wait_p99_ms": 210.5,
                "lock_wait_p99_ci": 116.6,
                "lock_wait_p999_ms": 280.0,
                "section_duration_ms": 100.5,
                "section_duration_ci": 55.8,
                "peak_overshoot_pct": 3.0,
                "peak_overshoot_ci": 0.8,
                "throttle_events_in_cs": 86,
                "throttle_events_outside_cs": 0,
                "repetitions": 5
            },
            "queueing_prediction": {"predicted_p99_ms": 195.0, "reduction_ratio": 1.0},
            "overshoot_bound": {"max_extra_pages": 0, "max_extra_kb": 0, "enforced_by": "Stock Linux"},
            "environment": qemu_env
        },
        {
            "run_id": "qemu_wlb_crispl",
            "name": "Workload B: CRISP-L Deferral (Linux 6.6 M0)",
            "timestamp": "2026-10-22T05:40:00Z",
            "category": "linux_qemu_vm",
            "policy": "M0",
            "scenario_id": "W2_PERSISTENT",
            "scenario_name": "Workload B: Persistent Retained Allocations",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 496.0,
            "p50_ms": 0.05,
            "p95_ms": 1.8,
            "p99_ms": 6.3,
            "p999_ms": 11.7,
            "throttle_events_in_cs": 0,
            "throttle_events_outside_cs": 398,
            "metrics": {
                "throughput_ops_sec": 496.0,
                "throughput_ci": 204.0,
                "lock_wait_p50_ms": 0.05,
                "lock_wait_p95_ms": 1.8,
                "lock_wait_p99_ms": 6.3,
                "lock_wait_p99_ci": 0.4,
                "lock_wait_p999_ms": 11.7,
                "section_duration_ms": 38.0,
                "section_duration_ci": 26.9,
                "peak_overshoot_pct": 3.1,
                "peak_overshoot_ci": 0.9,
                "throttle_events_in_cs": 0,
                "throttle_events_outside_cs": 398,
                "repetitions": 5,
                "unlocked_free_settlement_pct": 37.0
            },
            "queueing_prediction": {"predicted_p99_ms": 6.2, "reduction_ratio": 33.4},
            "overshoot_bound": {"max_extra_pages": 256, "max_extra_kb": 1024, "enforced_by": "M0 per-thread cap"},
            "environment": qemu_env
        },

        # Workload C (Deep overage, lower memory.high)
        {
            "run_id": "qemu_wlc_b0_stock",
            "name": "Workload C: Unmodified Linux 6.6 (Stock B0)",
            "timestamp": "2026-10-22T05:50:00Z",
            "category": "linux_qemu_vm",
            "policy": "B0",
            "scenario_id": "W3_DEEP_OVERAGE",
            "scenario_name": "Workload C: Deep Memory Overage",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 29.0,
            "p50_ms": 8.5,
            "p95_ms": 420.0,
            "p99_ms": 629.0,
            "p999_ms": 850.0,
            "throttle_events_in_cs": 112,
            "throttle_events_outside_cs": 0,
            "metrics": {
                "throughput_ops_sec": 29.0,
                "throughput_ci": 28.0,
                "lock_wait_p50_ms": 8.5,
                "lock_wait_p95_ms": 420.0,
                "lock_wait_p99_ms": 629.0,
                "lock_wait_p99_ci": 555.0,
                "lock_wait_p999_ms": 850.0,
                "section_duration_ms": 393.0,
                "section_duration_ci": 269.0,
                "peak_overshoot_pct": 6.0,
                "peak_overshoot_ci": 0.7,
                "throttle_events_in_cs": 112,
                "throttle_events_outside_cs": 0,
                "repetitions": 3
            },
            "queueing_prediction": {"predicted_p99_ms": 580.0, "reduction_ratio": 1.0},
            "overshoot_bound": {"max_extra_pages": 0, "max_extra_kb": 0, "enforced_by": "Stock Linux"},
            "environment": qemu_env
        },
        {
            "run_id": "qemu_wlc_crispl",
            "name": "Workload C: CRISP-L Deferral (Linux 6.6 M0)",
            "timestamp": "2026-10-22T06:00:00Z",
            "category": "linux_qemu_vm",
            "policy": "M0",
            "scenario_id": "W3_DEEP_OVERAGE",
            "scenario_name": "Workload C: Deep Memory Overage",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 157.0,
            "p50_ms": 0.06,
            "p95_ms": 1.4,
            "p99_ms": 3.5,
            "p999_ms": 8.2,
            "throttle_events_in_cs": 0,
            "throttle_events_outside_cs": 210,
            "metrics": {
                "throughput_ops_sec": 157.0,
                "throughput_ci": 11.0,
                "lock_wait_p50_ms": 0.06,
                "lock_wait_p95_ms": 1.4,
                "lock_wait_p99_ms": 3.5,
                "lock_wait_p99_ci": 1.8,
                "lock_wait_p999_ms": 8.2,
                "section_duration_ms": 195.0,
                "section_duration_ci": 33.0,
                "peak_overshoot_pct": 6.0,
                "peak_overshoot_ci": 0.4,
                "throttle_events_in_cs": 0,
                "throttle_events_outside_cs": 210,
                "repetitions": 3,
                "unlocked_free_settlement_pct": 0.0
            },
            "queueing_prediction": {"predicted_p99_ms": 4.1, "reduction_ratio": 179.7},
            "overshoot_bound": {"max_extra_pages": 256, "max_extra_kb": 1024, "enforced_by": "M0 per-thread cap"},
            "environment": qemu_env
        },

        # Ablations
        {
            "run_id": "qemu_ablation_nocap",
            "name": "Ablation A2: No Cap (Blank Check Exemption)",
            "timestamp": "2026-10-22T06:10:00Z",
            "category": "linux_qemu_vm",
            "policy": "ABLATION_NOCAP",
            "scenario_id": "W2_PERSISTENT",
            "scenario_name": "Ablation: Unbounded Borrowing",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 539.0,
            "p50_ms": 0.06,
            "p95_ms": 2.2,
            "p99_ms": 8.0,
            "p999_ms": 29.0,
            "throttle_events_in_cs": 0,
            "throttle_events_outside_cs": 412,
            "metrics": {
                "throughput_ops_sec": 539.0,
                "lock_wait_p99_ms": 8.0,
                "worst_single_wait_ms": 29.0,
                "ablation_finding": "Cap costs nothing in speed when properly sized; without cap, worst wait jumped to 29.0ms vs 11.7ms with cap."
            },
            "overshoot_bound": {"max_extra_pages": 9999, "max_extra_kb": 39996, "enforced_by": "UNBOUNDED (Safety Hazard)"},
            "environment": qemu_env
        },
        {
            "run_id": "qemu_ablation_lease1ms",
            "name": "Ablation A3: Under-sized Lease (1ms vs 20ms)",
            "timestamp": "2026-10-22T06:20:00Z",
            "category": "linux_qemu_vm",
            "policy": "ABLATION_LEASE_1MS",
            "scenario_id": "W2_PERSISTENT",
            "scenario_name": "Ablation: Short Lease Expiry",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 140.0,
            "p50_ms": 2.1,
            "p95_ms": 88.0,
            "p99_ms": 139.8,
            "p999_ms": 182.0,
            "throttle_events_in_cs": 39,
            "throttle_events_outside_cs": 85,
            "metrics": {
                "throughput_ops_sec": 140.0,
                "lock_wait_p99_ms": 139.8,
                "ablation_finding": "Lease shorter than section work forces settlement inside the lock, removing most of the latency gain."
            },
            "overshoot_bound": {"max_extra_pages": 256, "max_extra_kb": 1024, "enforced_by": "1ms Timer Forced Settlement"},
            "environment": qemu_env
        },
        {
            "run_id": "qemu_ablation_cap64",
            "name": "Ablation A4: Restrictive Cap (64 pages < 128p needed)",
            "timestamp": "2026-10-22T06:30:00Z",
            "category": "linux_qemu_vm",
            "policy": "ABLATION_CAP64",
            "scenario_id": "W2_PERSISTENT",
            "scenario_name": "Ablation: Cap Denials Under Allocation",
            "threads": 4,
            "duration_sec": 6,
            "throughput_ops_sec": 112.0,
            "p50_ms": 2.4,
            "p95_ms": 130.0,
            "p99_ms": 196.4,
            "p999_ms": 240.0,
            "throttle_events_in_cs": 54,
            "throttle_events_outside_cs": 12,
            "metrics": {
                "throughput_ops_sec": 112.0,
                "lock_wait_p99_ms": 196.4,
                "cap_denials": 341,
                "ablation_finding": "Cap below section allocation denies grant (341 denials) and gain disappears, proving cap acts as true barrier."
            },
            "overshoot_bound": {"max_extra_pages": 64, "max_extra_kb": 256, "enforced_by": "64-page Hard Cap"},
            "environment": qemu_env
        },

        # Adversarial Runs
        {
            "run_id": "qemu_adv_churn_300t",
            "name": "Adversarial: 300-Thread Churn Stress Test",
            "timestamp": "2026-10-22T06:40:00Z",
            "category": "linux_qemu_vm",
            "policy": "ADVERSARIAL_CHURN",
            "scenario_id": "W4_ADVERSARIAL_CHURN",
            "scenario_name": "Adversarial: Thread Churn Debt Conservation",
            "threads": 300,
            "duration_sec": 12,
            "throughput_ops_sec": 845.0,
            "p50_ms": 0.05,
            "p95_ms": 1.2,
            "p99_ms": 4.8,
            "p999_ms": 9.1,
            "throttle_events_in_cs": 0,
            "throttle_events_outside_cs": 27008,
            "metrics": {
                "threads_churned": 300,
                "pages_absorbed_by_pool": 27008,
                "pages_drained_by_pool": 27008,
                "unreconciled_pages": 0,
                "peak_postponed_pages": 192,
                "cgroup_cap_pages": 1024,
                "adversarial_verdict": "CONSERVED: All 300 exits moved debt to pool; 27,008 pages taken in and 27,008 paid out. Final debt: ZERO."
            },
            "overshoot_bound": {"max_extra_pages": 192, "max_extra_kb": 768, "enforced_by": "M1/M2 Shared Pool Conservation"},
            "environment": qemu_env
        },
        {
            "run_id": "qemu_adv_never_cleared",
            "name": "Adversarial: Rogue Flag Never Cleared",
            "timestamp": "2026-10-22T06:50:00Z",
            "category": "linux_qemu_vm",
            "policy": "ADVERSARIAL_NEVER_CLEARED",
            "scenario_id": "W5_ADVERSARIAL_ROGUE",
            "scenario_name": "Adversarial: Uncooperative User-Space Lock",
            "threads": 1,
            "duration_sec": 8,
            "throughput_ops_sec": 420.0,
            "p50_ms": 0.03,
            "p95_ms": 1.0,
            "p99_ms": 5.2,
            "p999_ms": 8.0,
            "throttle_events_in_cs": 0,
            "throttle_events_outside_cs": 128,
            "metrics": {
                "grants_issued": 128,
                "forced_settlements_lease": 32,
                "grants_denied_at_cap": 89,
                "peak_postponed_pages": 256,
                "per_thread_cap_pages": 256,
                "oom_events": 0,
                "adversarial_verdict": "BOUNDED: Thread never cleared flag; cut off by 20ms lease (32 forced settlements) and 256-page cap (89 denials). 0 final debt."
            },
            "overshoot_bound": {"max_extra_pages": 256, "max_extra_kb": 1024, "enforced_by": "Lease Timer + Cap Denial"},
            "environment": qemu_env
        }
    ]

    for rec in records:
        save_experiment_record(rec)


def save_experiment_record(exp: Dict[str, Any]) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    m = exp.get("metrics", {})

    cursor.execute("""
        INSERT OR REPLACE INTO experiments (
            run_id, name, timestamp, category, policy, scenario_id, scenario_name,
            threads, duration_sec, throughput_ops_sec, p50_ms, p95_ms, p99_ms, p999_ms,
            throttle_events_in_cs, throttle_events_outside_cs,
            metrics_json, queueing_json, overshoot_json, environment_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        exp["run_id"],
        exp.get("name", ""),
        exp.get("timestamp", ""),
        exp.get("category", "model_simulation"),
        exp.get("policy", "B0"),
        exp.get("scenario_id", "W2"),
        exp.get("scenario_name", "Controlled Pressure"),
        exp.get("threads", 4),
        exp.get("duration_sec", 1),
        m.get("throughput_ops_sec", 0.0),
        m.get("lock_wait_p50_ms", 0.0),
        m.get("lock_wait_p95_ms", 0.0),
        m.get("lock_wait_p99_ms", 0.0),
        m.get("lock_wait_p999_ms", 0.0),
        m.get("throttle_events_in_cs", 0),
        m.get("throttle_events_outside_cs", 0),
        json.dumps(m),
        json.dumps(exp.get("queueing_prediction", {})),
        json.dumps(exp.get("overshoot_bound", {})),
        json.dumps(exp.get("environment", {})),
    ))
    conn.commit()
    conn.close()


def list_experiments(limit: int = 50, category: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if category:
        cursor.execute("SELECT * FROM experiments WHERE category = ? ORDER BY timestamp DESC LIMIT ?", (category, limit))
    else:
        cursor.execute("SELECT * FROM experiments ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append({
            "run_id": r["run_id"],
            "name": r["name"],
            "timestamp": r["timestamp"],
            "category": r["category"],
            "policy": r["policy"],
            "scenario_id": r["scenario_id"],
            "scenario_name": r["scenario_name"],
            "threads": r["threads"],
            "duration_sec": r["duration_sec"],
            "throughput_ops_sec": r["throughput_ops_sec"],
            "p50_ms": r["p50_ms"],
            "p95_ms": r["p95_ms"],
            "p99_ms": r["p99_ms"],
            "p999_ms": r["p999_ms"],
            "throttle_events_in_cs": r["throttle_events_in_cs"],
            "throttle_events_outside_cs": r["throttle_events_outside_cs"],
            "metrics": json.loads(r["metrics_json"]) if r["metrics_json"] else {},
            "queueing_prediction": json.loads(r["queueing_json"]) if r["queueing_json"] else {},
            "overshoot_bound": json.loads(r["overshoot_json"]) if r["overshoot_json"] else {},
            "environment": json.loads(r["environment_json"]) if r["environment_json"] else {},
        })
    return result


def get_experiment_by_id(run_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM experiments WHERE run_id = ?", (run_id,))
    r = cursor.fetchone()
    conn.close()

    if not r:
        return None
    return {
        "run_id": r["run_id"],
        "name": r["name"],
        "timestamp": r["timestamp"],
        "category": r["category"],
        "policy": r["policy"],
        "scenario_id": r["scenario_id"],
        "scenario_name": r["scenario_name"],
        "threads": r["threads"],
        "duration_sec": r["duration_sec"],
        "throughput_ops_sec": r["throughput_ops_sec"],
        "p50_ms": r["p50_ms"],
        "p95_ms": r["p95_ms"],
        "p99_ms": r["p99_ms"],
        "p999_ms": r["p999_ms"],
        "throttle_events_in_cs": r["throttle_events_in_cs"],
        "throttle_events_outside_cs": r["throttle_events_outside_cs"],
        "metrics": json.loads(r["metrics_json"]) if r["metrics_json"] else {},
        "queueing_prediction": json.loads(r["queueing_json"]) if r["queueing_json"] else {},
        "overshoot_bound": json.loads(r["overshoot_json"]) if r["overshoot_json"] else {},
        "environment": json.loads(r["environment_json"]) if r["environment_json"] else {},
    }


def list_gates() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM research_gates ORDER BY gate_id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
