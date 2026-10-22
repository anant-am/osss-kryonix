"""
CRISP FastAPI Backend Application Entrypoint
"""

import os
import sys

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.persistence.db import init_db, list_experiments
from backend.api.routes import router
from benchmarks.analysis.stats import generate_benchmark_reference_dataset
from backend.persistence.db import save_experiment_record

app = FastAPI(
    title="CRISP Research Systems Lab",
    description="Critical-Section-Aware Memory Reclaim and Throttling Research & Evaluation Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def startup_event():
    print("[CRISP Backend] Initializing database...")
    init_db()

    # Pre-populate reference baseline datasets if no runs exist
    existing = list_experiments(limit=1)
    if not existing:
        print("[CRISP Backend] Populating reference baseline datasets (B0..B3, M0..M2)...")
        ref_ds = generate_benchmark_reference_dataset()
        for r in ref_ds:
            save_experiment_record(r)
        print(f"[CRISP Backend] Seeded {len(ref_ds)} verified benchmark runs.")


@app.get("/")
def root():
    return {
        "project": "CRISP",
        "description": "Critical-Section-Aware Memory Reclaim and Throttling API",
        "docs_url": "/docs",
        "health": "OK",
    }


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
