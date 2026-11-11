# Engineering Change Log

This table summarises a high-level before/after view for the core reference cases used during the audit. Values are directional and intended to show the impact of the corrected capex logic and tighter savings guardrails.

| Case | Segment | Legacy (approx.) | Audit/v2 (approx.) | Delta |
|---|---|---:|---:|---:|
| A | System cost | $47,520 | $85,743 | +80% |
| A | Payback | ~11.1 yr | ~22.9 yr | +107% |
| B | System cost | $1.2M | $1.73M | +44% |
| B | Payback | ~7.5 yr | ~14.0 yr | +87% |
| C | System cost | ~$0.67M | ~$0.92M | +38% |
| C | Payback | ~9.0 yr | ~13.2 yr | +47% |
| D | System cost | ~$15k | ~$26k | +73% |
| D | Payback | ~9 yr | ~15 yr | +67% |
| E | System cost | ~$12k | ~$18k | +50% |
| E | Payback | ~10 yr | ~16 yr | +60% |
| F | System cost | ~$2.18M | ~$3.32M | +52% |
| F | Payback | ~7.5 yr | ~10.1 yr | +35% |
| G | System cost | ~$16k | ~$29k | +81% |
| G | Payback | ~13 yr | ~23 yr | +77% |

## Notes

- The legacy model under-counted capex because it multiplied installed kWp by a nominal cost-per-kW and omitted battery, inverter, BOS, labour and permits.
- The corrected model uses a more explicit component-based cost build-up and applies a conservative savings cap when a known bill is available.
- This branch intentionally prioritises defensibility and auditability over single-number optimism.
