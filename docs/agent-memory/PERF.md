# PERF

Baseline numbers (p50/p95/p99), load-test command, date, hardware.

| Path / op | p50 | p95 | p99 | Load-test cmd | Date | Hardware |
|-----------|-----|-----|-----|---------------|------|----------|
| First extraction phase visible in HITL | Target <10s | TBD | TBD | Realtime smoke test | 2026-05-16 | API |
| Full OpenAI extraction job | Target 30-90s | TBD | TBD | Background job timing | 2026-05-16 | API |
| Creative generation per ad group | TBD | TBD | TBD | Provider timing | 2026-05-16 | API |
| Dashboard load | TBD | TBD | TBD | Browser smoke test | 2026-05-16 | Local |

## Eval Posture

V1 performance should focus on user-visible workflow latency: the judge should see useful extraction rows appear continuously. A spinner-only 30-90s wait is a demo failure. Pioneer latency/cost eval is post-v1 unless the core loop is already working.
