"""
CRISP M/G/1 Pollaczek-Khinchine Delay Model & Kernel Penalty Calculator
Models the inflation of lock waiting times under memory.high throttling
and compares baseline queueing latency with CRISP deferral.
"""

import math
from dataclasses import dataclass
from typing import Dict, Any, List


def calculate_kernel_throttle_penalty_ms(
    overage_ratio: float, debt_pages: int = 64, charge_batch: int = 64
) -> Dict[str, Any]:
    """
    Calculates the memory.high sleep penalty according to Linux mm/memcontrol.c:
      T = min(2000 ms, 64 * rho^2 * (n / B) * 1000)
    where:
      rho = (usage - memory.high) / memory.high
      n = pages of debt
      B = charge batch (typically 64 pages in Linux 6.6)
    Sleep is skipped if calculated penalty <= 10 ms.
    """
    if overage_ratio <= 0.0 or debt_pages <= 0:
        return {
            "overage_ratio": overage_ratio,
            "calculated_ms": 0.0,
            "effective_sleep_ms": 0.0,
            "sleeps": False,
            "clamped": False,
        }

    # Formula: 64 * rho^2 * (debt / batch) in seconds -> convert to ms (* 1000)
    raw_seconds = 64.0 * (overage_ratio ** 2) * (debt_pages / float(charge_batch))
    raw_ms = raw_seconds * 1000.0

    clamped = raw_ms >= 2000.0
    effective_ms = min(2000.0, raw_ms)
    sleeps = effective_ms > 10.0  # Linux skips throttling if penalty <= 10ms

    return {
        "overage_ratio": overage_ratio,
        "overage_pct": round(overage_ratio * 100, 2),
        "calculated_ms": round(raw_ms, 2),
        "effective_sleep_ms": round(effective_ms, 2) if sleeps else 0.0,
        "sleeps": sleeps,
        "clamped": clamped,
    }


def generate_kernel_reference_table() -> List[Dict[str, Any]]:
    """
    Generates reference table matching Table 1 from the CRISP project specification.
    """
    overages = [0.01, 0.02, 0.03, 0.05, 0.10, 0.15, 0.18, 0.20]
    table = []
    for ov in overages:
        res = calculate_kernel_throttle_penalty_ms(ov, debt_pages=64, charge_batch=64)
        table.append(res)
    return table


@dataclass
class QueueingModelInput:
    arrival_rate_lambda: float       # Lock requests per second (e.g. 500)
    critical_section_mean_ms: float  # E[S] (e.g. 0.05 ms = 50 us)
    critical_section_cv: float       # Coefficient of variation for S (default 1.0 for exponential)
    throttle_prob_p: float           # Probability a lock-holder triggers memory.high (e.g. 0.05)
    throttle_delay_mean_ms: float    # E[D] reclaim + sleep (e.g. 50.0 ms)
    throttle_delay_cv: float         # Coefficient of variation for D (e.g. 0.5)


@dataclass
class QueueingPredictionResult:
    # Baseline (throttled inside lock)
    baseline_es_prime_ms: float
    baseline_es_prime_sq: float
    baseline_utilization_rho: float
    baseline_mean_wait_ms: float
    baseline_stable: bool

    # CRISP (deferred until after unlock)
    crisp_es_ms: float
    crisp_es_sq: float
    crisp_utilization_rho: float
    crisp_mean_wait_ms: float
    crisp_stable: bool

    # Comparison metrics
    wait_reduction_ratio: float
    wait_reduction_absolute_ms: float
    dominant_variance_term: float


def predict_mg1_lock_waits(params: QueueingModelInput) -> QueueingPredictionResult:
    """
    Calculates M/G/1 queueing delay under Pollaczek-Khinchine formula:
      E[W] = (lambda * E[S'^2]) / (2 * (1 - rho'))
    """
    lam = params.arrival_rate_lambda
    E_S = params.critical_section_mean_ms / 1000.0  # seconds
    cv_S = params.critical_section_cv
    Var_S = (cv_S * E_S) ** 2
    E_S_sq = Var_S + (E_S ** 2)

    p = params.throttle_prob_p
    E_D = params.throttle_delay_mean_ms / 1000.0  # seconds
    cv_D = params.throttle_delay_cv
    Var_D = (cv_D * E_D) ** 2
    E_D_sq = Var_D + (E_D ** 2)

    # 1. Baseline: delay D is experienced INSIDE the critical section
    # Service time S' = S + (D with prob p)
    # E[S'] = E[S] + p * E[D]
    # E[S'^2] = E[S^2] + 2 * p * E[S] * E[D] + p * E[D^2]
    E_S_prime = E_S + p * E_D
    E_S_prime_sq = E_S_sq + 2.0 * p * E_S * E_D + p * E_D_sq
    rho_baseline = lam * E_S_prime

    baseline_stable = rho_baseline < 1.0
    if baseline_stable and rho_baseline > 0.0:
        W_baseline_sec = (lam * E_S_prime_sq) / (2.0 * (1.0 - rho_baseline))
    else:
        # Unstable queue: capped high representation for JSON compliance
        W_baseline_sec = 999.0 if not baseline_stable else 0.0

    # 2. CRISP: delay D is deferred OUTSIDE the critical section
    # For waiting threads, critical section duration remains pure S
    rho_crisp = lam * E_S
    crisp_stable = rho_crisp < 1.0
    if crisp_stable and rho_crisp > 0.0:
        W_crisp_sec = (lam * E_S_sq) / (2.0 * (1.0 - rho_crisp))
    else:
        W_crisp_sec = 999.0 if not crisp_stable else 0.0

    # Metrics in milliseconds
    baseline_wait_ms = W_baseline_sec * 1000.0
    crisp_wait_ms = W_crisp_sec * 1000.0
    dominant_p_D2_term_ms2 = (p * E_D_sq) * 1e6

    reduction_ratio = (
        (baseline_wait_ms / crisp_wait_ms)
        if (crisp_wait_ms > 0 and baseline_wait_ms < 999000.0)
        else (100.0 if not baseline_stable and crisp_stable else 1.0)
    )

    return QueueingPredictionResult(
        baseline_es_prime_ms=round(E_S_prime * 1000.0, 4),
        baseline_es_prime_sq=round(E_S_prime_sq * 1e6, 4),
        baseline_utilization_rho=round(rho_baseline, 4),
        baseline_mean_wait_ms=round(baseline_wait_ms, 3),
        baseline_stable=baseline_stable,
        crisp_es_ms=round(E_S * 1000.0, 4),
        crisp_es_sq=round(E_S_sq * 1e6, 4),
        crisp_utilization_rho=round(rho_crisp, 4),
        crisp_mean_wait_ms=round(crisp_wait_ms, 3),
        crisp_stable=crisp_stable,
        wait_reduction_ratio=round(reduction_ratio, 2),
        wait_reduction_absolute_ms=round(max(0.0, baseline_wait_ms - crisp_wait_ms), 3),
        dominant_variance_term=round(dominant_p_D2_term_ms2, 2),
    )
