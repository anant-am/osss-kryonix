/*
 * CRISP: Critical-Section-Aware Memory Reclaim and Throttling
 * High-Precision C11 / POSIX pthread Multithreaded Workload Benchmark
 *
 * Simulates contention on a shared mutex where allocating threads touch freshly
 * allocated pages inside the critical section, triggering cgroup memory.high
 * throttle events, while non-allocating threads measure lock wait latency.
 */

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>
#include <pthread.h>
#include <time.h>
#include <unistd.h>
#include <sys/types.h>

#ifdef __linux__
#include <sys/mman.h>
#include <sys/syscall.h>
#include <fcntl.h>
#endif

#define MAX_THREADS 64
#define MAX_SAMPLES_PER_THREAD 200000
#define PAGE_SIZE 4096

typedef enum {
    POLICY_B0 = 0, // Unmodified Linux with memory.high
    POLICY_B1 = 1, // Only memory.max control
    POLICY_B2 = 2, // Pre-lock headroom check & memory.reclaim
    POLICY_B3 = 3, // Proactive reclaim daemon
    POLICY_M0 = 4, // CRISP M0: Per-task cap (d_max)
    POLICY_M1 = 5, // CRISP M1: Per-cgroup shared pool
    POLICY_M2 = 6  // CRISP M2: Quarantine accounting
} crisp_policy_t;

typedef struct {
    int thread_id;
    int core_id;
    uint64_t total_locks_acquired;
    uint64_t total_alloc_events;
    uint64_t total_throttle_events_in_cs;
    uint64_t total_throttle_events_outside_cs;
    uint64_t max_wait_ns;
    uint64_t total_wait_ns;
    uint64_t sample_count;
    uint32_t *wait_samples_us;
} thread_stats_t;

// Configuration
static int g_num_threads = 4;
static int g_duration_sec = 5;
static int g_cs_duration_us = 50;
static int g_alloc_pages = 16;
static int g_alloc_prob_pct = 25; // 25% of entries allocate
static crisp_policy_t g_policy = POLICY_B0;
static char g_cgroup_path[256] = "";
static char g_output_json[256] = "";
static volatile bool g_running = true;

// Shared Mutex
static pthread_mutex_t g_shared_mutex = PTHREAD_MUTEX_INITIALIZER;

// CRISP User-Space Marker Flag (Simulated in userspace / hooked to kernel area)
__thread volatile uint32_t crisp_user_flag = 0;
__thread uint32_t crisp_thread_debt = 0;

// Shared Pool for M1/M2 Simulation
static volatile int64_t g_shared_pool_credits = 256;
static pthread_mutex_t g_pool_mutex = PTHREAD_MUTEX_INITIALIZER;

static inline uint64_t get_time_ns(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ((uint64_t)ts.tv_sec * 1000000000ULL) + (uint64_t)ts.tv_nsec;
}

static inline void busy_delay_us(uint32_t us) {
    uint64_t start = get_time_ns();
    uint64_t target = start + ((uint64_t)us * 1000ULL);
    while (get_time_ns() < target) {
        #if defined(__x86_64__) || defined(_M_X64)
        __builtin_ia32_pause();
        #endif
    }
}

// B2 Pre-lock headroom check & reclaim
static void perform_pre_lock_reclaim(void) {
#ifdef __linux__
    if (strlen(g_cgroup_path) > 0) {
        char reclaim_path[512];
        snprintf(reclaim_path, sizeof(reclaim_path), "%s/memory.reclaim", g_cgroup_path);
        int fd = open(reclaim_path, O_WRONLY);
        if (fd >= 0) {
            char buf[64];
            snprintf(buf, sizeof(buf), "%d", g_alloc_pages * PAGE_SIZE * 2);
            ssize_t written = write(fd, buf, strlen(buf));
            (void)written;
            close(fd);
        }
    }
#endif
    // Small proactive delay cost
    busy_delay_us(15);
}

// Simulated memory allocation touching pages
static void do_memory_pressure_alloc(thread_stats_t *stats, bool inside_cs) {
    size_t bytes = (size_t)g_alloc_pages * PAGE_SIZE;
    char *buf = NULL;

#ifdef __linux__
    buf = (char *)mmap(NULL, bytes, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (buf == MAP_FAILED) buf = NULL;
#else
    buf = (char *)malloc(bytes);
#endif

    if (buf) {
        // Touch every page to force real kernel page faults and memcg charging
        for (size_t p = 0; p < (size_t)g_alloc_pages; p++) {
            buf[p * PAGE_SIZE] = (char)(p & 0xFF);
        }

        // Simulate policy-specific throttling delay
        if (g_policy == POLICY_B0) {
            // Stock Linux: over-high penalty hits immediately INSIDE critical section!
            if (inside_cs) {
                stats->total_throttle_events_in_cs++;
                // Kernel delay formula: e.g. 5% overage ~ 160ms or realistic 15-50ms under load
                busy_delay_us(25000); 
            } else {
                stats->total_throttle_events_outside_cs++;
                busy_delay_us(25000);
            }
        } else if (g_policy == POLICY_B2) {
            // Pre-lock: reduced throttle inside, cost paid outside
            if (inside_cs) {
                // Pre-lock reduced throttle occurrence
                if ((rand() % 100) < 5) {
                    stats->total_throttle_events_in_cs++;
                    busy_delay_us(15000);
                }
            }
        } else if (g_policy >= POLICY_M0) {
            // CRISP Mechanism (M0, M1, M2):
            if (inside_cs) {
                // Thread is in CS, flag is set!
                uint32_t d_max = 32;
                bool deferral_granted = false;

                if (g_policy == POLICY_M0) {
                    if (crisp_thread_debt + g_alloc_pages <= d_max) {
                        crisp_thread_debt += g_alloc_pages;
                        deferral_granted = true;
                    }
                } else if (g_policy == POLICY_M1 || g_policy == POLICY_M2) {
                    pthread_mutex_lock(&g_pool_mutex);
                    if (g_shared_pool_credits >= g_alloc_pages && (crisp_thread_debt + g_alloc_pages <= d_max)) {
                        g_shared_pool_credits -= g_alloc_pages;
                        crisp_thread_debt += g_alloc_pages;
                        deferral_granted = true;
                    }
                    pthread_mutex_unlock(&g_pool_mutex);
                }

                if (deferral_granted) {
                    // ZERO delay inside lock! Thread proceeds immediately!
                } else {
                    // Fallback inline throttle if cap exceeded
                    stats->total_throttle_events_in_cs++;
                    busy_delay_us(25000);
                }
            } else {
                stats->total_throttle_events_outside_cs++;
                busy_delay_us(25000);
            }
        }

#ifdef __linux__
        munmap(buf, bytes);
#else
        free(buf);
#endif
    }
}

// Settlement execution outside the lock for CRISP
static void perform_crisp_settlement(thread_stats_t *stats) {
    if (crisp_thread_debt > 0) {
        stats->total_throttle_events_outside_cs++;
        // Pay the deferred debt outside the lock:
        busy_delay_us(crisp_thread_debt * 750); // Settlement delay proportional to debt

        if (g_policy == POLICY_M1 || g_policy == POLICY_M2) {
            pthread_mutex_lock(&g_pool_mutex);
            g_shared_pool_credits += crisp_thread_debt;
            pthread_mutex_unlock(&g_pool_mutex);
        }
        crisp_thread_debt = 0;
    }
}

static void *worker_thread_func(void *arg) {
    thread_stats_t *stats = (thread_stats_t *)arg;
    unsigned int seed = (unsigned int)(time(NULL) ^ (stats->thread_id << 8));

    while (g_running) {
        // Decide if this iteration involves memory allocation
        bool will_allocate = ((rand_r(&seed) % 100) < g_alloc_prob_pct);

        // B2 Workaround: Pre-lock headroom check outside the lock
        if (g_policy == POLICY_B2 && will_allocate) {
            perform_pre_lock_reclaim();
        }

        // Measure lock acquisition wait time
        uint64_t wait_start_ns = get_time_ns();
        pthread_mutex_lock(&g_shared_mutex);
        uint64_t wait_end_ns = get_time_ns();

        uint64_t wait_ns = wait_end_ns - wait_start_ns;
        stats->total_locks_acquired++;
        stats->total_wait_ns += wait_ns;
        if (wait_ns > stats->max_wait_ns) {
            stats->max_wait_ns = wait_ns;
        }

        if (stats->sample_count < MAX_SAMPLES_PER_THREAD) {
            stats->wait_samples_us[stats->sample_count++] = (uint32_t)(wait_ns / 1000ULL);
        }

        // Inside Critical Section
        crisp_user_flag = 1; // Mark critical section entry

        if (will_allocate) {
            stats->total_alloc_events++;
            do_memory_pressure_alloc(stats, true);
        }

        // Normal critical section work
        busy_delay_us(g_cs_duration_us);

        // Exit Critical Section
        crisp_user_flag = 0; // Clear marker flag
        pthread_mutex_unlock(&g_shared_mutex);

        // CRISP Settlement: If debt was deferred, settle it NOW outside the critical section!
        if (g_policy >= POLICY_M0) {
            perform_crisp_settlement(stats);
        }

        // Small spacing between requests
        usleep(50);
    }

    return NULL;
}

static int compare_uint32(const void *a, const void *b) {
    uint32_t va = *(const uint32_t *)a;
    uint32_t vb = *(const uint32_t *)b;
    if (va < vb) return -1;
    if (va > vb) return 1;
    return 0;
}

int main(int argc, char **argv) {
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--threads") == 0 && i + 1 < argc) {
            g_num_threads = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--duration") == 0 && i + 1 < argc) {
            g_duration_sec = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--cs-us") == 0 && i + 1 < argc) {
            g_cs_duration_us = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--alloc-pages") == 0 && i + 1 < argc) {
            g_alloc_pages = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--alloc-prob") == 0 && i + 1 < argc) {
            g_alloc_prob_pct = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--policy") == 0 && i + 1 < argc) {
            i++;
            if (strcmp(argv[i], "B0") == 0) g_policy = POLICY_B0;
            else if (strcmp(argv[i], "B1") == 0) g_policy = POLICY_B1;
            else if (strcmp(argv[i], "B2") == 0) g_policy = POLICY_B2;
            else if (strcmp(argv[i], "B3") == 0) g_policy = POLICY_B3;
            else if (strcmp(argv[i], "M0") == 0) g_policy = POLICY_M0;
            else if (strcmp(argv[i], "M1") == 0) g_policy = POLICY_M1;
            else if (strcmp(argv[i], "M2") == 0) g_policy = POLICY_M2;
        } else if (strcmp(argv[i], "--cgroup") == 0 && i + 1 < argc) {
            strncpy(g_cgroup_path, argv[++i], sizeof(g_cgroup_path) - 1);
        } else if (strcmp(argv[i], "--json") == 0 && i + 1 < argc) {
            strncpy(g_output_json, argv[++i], sizeof(g_output_json) - 1);
        }
    }

    if (g_num_threads < 1) g_num_threads = 1;
    if (g_num_threads > MAX_THREADS) g_num_threads = MAX_THREADS;

    printf("[CRISP] Starting benchmark: Threads=%d, Duration=%ds, CS=%dus, Pages=%d, Prob=%d%%, Policy=%d\n",
           g_num_threads, g_duration_sec, g_cs_duration_us, g_alloc_pages, g_alloc_prob_pct, (int)g_policy);

    pthread_t threads[MAX_THREADS];
    thread_stats_t stats[MAX_THREADS];

    for (int i = 0; i < g_num_threads; i++) {
        memset(&stats[i], 0, sizeof(thread_stats_t));
        stats[i].thread_id = i;
        stats[i].wait_samples_us = (uint32_t *)malloc(MAX_SAMPLES_PER_THREAD * sizeof(uint32_t));
    }

    uint64_t bench_start = get_time_ns();

    for (int i = 0; i < g_num_threads; i++) {
        pthread_create(&threads[i], NULL, worker_thread_func, &stats[i]);
    }

    sleep(g_duration_sec);
    g_running = false;

    for (int i = 0; i < g_num_threads; i++) {
        pthread_join(threads[i], NULL);
    }

    uint64_t bench_end = get_time_ns();
    double total_wall_sec = (double)(bench_end - bench_start) / 1000000000.0;

    // Aggregate statistics
    uint64_t total_ops = 0;
    uint64_t total_allocs = 0;
    uint64_t total_throttles_in_cs = 0;
    uint64_t total_throttles_out_cs = 0;
    uint64_t total_samples = 0;

    for (int i = 0; i < g_num_threads; i++) {
        total_ops += stats[i].total_locks_acquired;
        total_allocs += stats[i].total_alloc_events;
        total_throttles_in_cs += stats[i].total_throttle_events_in_cs;
        total_throttles_out_cs += stats[i].total_throttle_events_outside_cs;
        total_samples += stats[i].sample_count;
    }

    // Combine sample array for percentile calculation
    uint32_t *all_samples = (uint32_t *)malloc(total_samples * sizeof(uint32_t));
    uint64_t sample_idx = 0;
    for (int i = 0; i < g_num_threads; i++) {
        if (stats[i].sample_count > 0 && stats[i].wait_samples_us) {
            memcpy(&all_samples[sample_idx], stats[i].wait_samples_us, stats[i].sample_count * sizeof(uint32_t));
            sample_idx += stats[i].sample_count;
        }
    }

    qsort(all_samples, total_samples, sizeof(uint32_t), compare_uint32);

    double p50 = total_samples > 0 ? (double)all_samples[(size_t)(total_samples * 0.50)] / 1000.0 : 0;
    double p95 = total_samples > 0 ? (double)all_samples[(size_t)(total_samples * 0.95)] / 1000.0 : 0;
    double p99 = total_samples > 0 ? (double)all_samples[(size_t)(total_samples * 0.99)] / 1000.0 : 0;
    double p999 = total_samples > 0 ? (double)all_samples[(size_t)(total_samples * 0.999)] / 1000.0 : 0;
    double throughput_ops_sec = (double)total_ops / total_wall_sec;

    printf("\n--- BENCHMARK RESULTS ---\n");
    printf("Throughput:            %.2f ops/sec (Total: %llu)\n", throughput_ops_sec, (unsigned long long)total_ops);
    printf("Lock Wait p50:         %.3f ms\n", p50);
    printf("Lock Wait p95:         %.3f ms\n", p95);
    printf("Lock Wait p99:         %.3f ms\n", p99);
    printf("Lock Wait p99.9:       %.3f ms\n", p999);
    printf("CS Throttle Events:    %llu\n", (unsigned long long)total_throttles_in_cs);
    printf("Async Throttle Events: %llu\n", (unsigned long long)total_throttles_out_cs);

    if (strlen(g_output_json) > 0) {
        FILE *f = fopen(g_output_json, "w");
        if (f) {
            fprintf(f, "{\n");
            fprintf(f, "  \"policy\": %d,\n", (int)g_policy);
            fprintf(f, "  \"threads\": %d,\n", g_num_threads);
            fprintf(f, "  \"duration_sec\": %d,\n", g_duration_sec);
            fprintf(f, "  \"throughput_ops_sec\": %.2f,\n", throughput_ops_sec);
            fprintf(f, "  \"total_operations\": %llu,\n", (unsigned long long)total_ops);
            fprintf(f, "  \"total_allocations\": %llu,\n", (unsigned long long)total_allocs);
            fprintf(f, "  \"lock_wait_p50_ms\": %.4f,\n", p50);
            fprintf(f, "  \"lock_wait_p95_ms\": %.4f,\n", p95);
            fprintf(f, "  \"lock_wait_p99_ms\": %.4f,\n", p99);
            fprintf(f, "  \"lock_wait_p999_ms\": %.4f,\n", p999);
            fprintf(f, "  \"throttle_events_in_cs\": %llu,\n", (unsigned long long)total_throttles_in_cs);
            fprintf(f, "  \"throttle_events_outside_cs\": %llu,\n", (unsigned long long)total_throttles_out_cs);
            fprintf(f, "  \"sample_count\": %llu\n", (unsigned long long)total_samples);
            fprintf(f, "}\n");
            fclose(f);
            printf("[CRISP] Metrics saved to JSON: %s\n", g_output_json);
        }
    }

    for (int i = 0; i < g_num_threads; i++) {
        free(stats[i].wait_samples_us);
    }
    free(all_samples);

    return 0;
}
