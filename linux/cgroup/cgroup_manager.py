"""
CRISP Linux cgroup v2 Controller & Telemetry Collector
Stores cgroup lifecycle, memory.high / memory.max configuration,
memory.events monitoring, and memory.reclaim interface.
"""

import os
import sys
import time
import subprocess
from dataclasses import dataclass
from typing import Dict, Any, Optional


@dataclass
class CgroupMemoryEvents:
    low: int = 0
    high: int = 0
    max: int = 0
    oom: int = 0
    oom_kill: int = 0


@dataclass
class CgroupStatus:
    available: bool
    path: str
    memory_current_bytes: int
    memory_high_bytes: int
    memory_max_bytes: int
    events: CgroupMemoryEvents
    message: str


class CrispCgroupManager:
    """
    Manages an isolated cgroup v2 subtree for reproducible memory pressure testing.
    """

    def __init__(self, cgroup_name: str = "crisp_bench", base_path: str = "/sys/fs/cgroup"):
        self.cgroup_name = cgroup_name
        self.base_path = base_path
        self.cgroup_path = os.path.join(base_path, cgroup_name)
        self.is_linux = sys.platform.startswith("linux")

    def is_cgroup_v2_available(self) -> bool:
        if not self.is_linux:
            return False
        try:
            res = subprocess.run(
                ["stat", "-fc", "%T", self.base_path],
                capture_output=True,
                text=True,
                check=False,
            )
            return "cgroup2fs" in res.stdout
        except Exception:
            return False

    def setup_bench_cgroup(
        self,
        memory_high_bytes: int = 100 * 1024 * 1024,  # 100 MB
        memory_max_bytes: int = 250 * 1024 * 1024,   # 250 MB
    ) -> bool:
        if not self.is_cgroup_v2_available():
            return False

        try:
            os.makedirs(self.cgroup_path, exist_ok=True)

            # Write memory.high
            with open(os.path.join(self.cgroup_path, "memory.high"), "w") as f:
                f.write(str(memory_high_bytes))

            # Write memory.max
            with open(os.path.join(self.cgroup_path, "memory.max"), "w") as f:
                f.write(str(memory_max_bytes))

            return True
        except PermissionError:
            print(f"[CgroupManager] Permission denied creating {self.cgroup_path}. Needs root / delegation.")
            return False
        except Exception as e:
            print(f"[CgroupManager] Error setting up cgroup: {e}")
            return False

    def attach_pid(self, pid: int) -> bool:
        try:
            procs_file = os.path.join(self.cgroup_path, "cgroup.procs")
            with open(procs_file, "w") as f:
                f.write(str(pid))
            return True
        except Exception as e:
            print(f"[CgroupManager] Could not attach PID {pid}: {e}")
            return False

    def read_events(self) -> CgroupMemoryEvents:
        events = CgroupMemoryEvents()
        events_file = os.path.join(self.cgroup_path, "memory.events")
        if not os.path.exists(events_file):
            return events

        try:
            with open(events_file, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) == 2:
                        k, v = parts[0], int(parts[1])
                        if k == "low": events.low = v
                        elif k == "high": events.high = v
                        elif k == "max": events.max = v
                        elif k == "oom": events.oom = v
                        elif k == "oom_kill": events.oom_kill = v
        except Exception:
            pass
        return events

    def read_current_usage_bytes(self) -> int:
        cur_file = os.path.join(self.cgroup_path, "memory.current")
        if not os.path.exists(cur_file):
            return 0
        try:
            with open(cur_file, "r") as f:
                return int(f.read().strip())
        except Exception:
            return 0

    def trigger_proactive_reclaim(self, target_bytes: int) -> bool:
        """
        B2 Workaround: Writes to memory.reclaim interface.
        """
        reclaim_file = os.path.join(self.cgroup_path, "memory.reclaim")
        if not os.path.exists(reclaim_file):
            return False
        try:
            with open(reclaim_file, "w") as f:
                f.write(str(target_bytes))
            return True
        except Exception:
            return False

    def cleanup(self) -> None:
        if os.path.exists(self.cgroup_path):
            try:
                os.rmdir(self.cgroup_path)
            except Exception:
                pass
