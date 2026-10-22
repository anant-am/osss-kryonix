# CRISP — Research-Grade Operating Systems Laboratory
# Critical-Section-Aware Memory Reclaim and Throttling

.PHONY: help setup test lint build preflight model-test linux-baseline linux-workarounds linux-crisp results report clean

PYTHON ?= python
WSL ?= wsl

help:
	@echo "CRISP Build & Experiment Automation"
	@echo "========================================"
	@echo "Targets:"
	@echo "  setup              Install backend and frontend dependencies"
	@echo "  preflight          Run environment diagnostics (cgroup v2, WSL2, kernel)"
	@echo "  model-test         Run portable accounting invariants and fuzzing suite"
	@echo "  test               Run complete test suite across model and services"
	@echo "  build              Build Linux C benchmark harness and frontend bundle"
	@echo "  linux-baseline     Run stock Linux R0/B0 and B1 experiments"
	@echo "  linux-workarounds  Run R2/B2 (pre-lock) and B3 (proactive daemon) benchmarks"
	@echo "  linux-crisp        Run M0/M1/M2 mechanism evaluation"
	@echo "  results            Regenerate all scientific figures and benchmark artifacts"
	@echo "  report             Generate comprehensive systems research report"
	@echo "  clean              Remove transient build files and temporary test data"

setup:
	@echo "Setting up Python backend dependencies..."
	$(PYTHON) -m pip install -r backend/requirements.txt
	@echo "Setting up Node.js frontend dependencies..."
	cd frontend && npm install

preflight:
	$(PYTHON) scripts/preflight/diagnostic.py

model-test:
	$(PYTHON) -m unittest discover -s model/tests -p "test_*.py"

test: model-test
	$(PYTHON) -m unittest discover -s backend/tests -p "test_*.py"

build:
	@echo "Compiling Linux C workload in WSL/Linux..."
	-$(WSL) -u root bash -c "cd /mnt/a/OSSSS/linux/workload && gcc -O2 -pthread -Wall -Wextra mutex_alloc_workload.c -o mutex_alloc_workload" || gcc -O2 -pthread -Wall -Wextra linux/workload/mutex_alloc_workload.c -o linux/workload/mutex_alloc_workload.exe
	@echo "Building Frontend..."
	cd frontend && npm run build

linux-baseline:
	$(PYTHON) benchmarks/runner/experiment_runner.py --policy B0 --policy B1 --threads 4 --duration 5

linux-workarounds:
	$(PYTHON) benchmarks/runner/experiment_runner.py --policy B2 --policy B3 --threads 4 --duration 5

linux-crisp:
	$(PYTHON) benchmarks/runner/experiment_runner.py --policy M0 --policy M1 --policy M2 --threads 4 --duration 5

results:
	$(PYTHON) benchmarks/analysis/stats.py --generate-all

report:
	$(PYTHON) scripts/reproduce/generate_report.py

clean:
	-rm -rf frontend/dist .pytest_cache linux/workload/mutex_alloc_workload linux/workload/mutex_alloc_workload.exe
