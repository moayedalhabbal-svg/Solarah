# Engineering Change Log

## Reference cases: original `main` vs audited `audit/v2`

The original calculation was run from a temporary worktree of `main` at
`8326ae9`; the audited calculation was run from this branch after the changes.
Both received the same inputs as the A-G test fixtures. A2 is included
separately because it deliberately uses a monthly bill instead of the
appliance-based Case A. Percentage change is `(audit/v2 - main) / main`.
`—` means unchanged at the reported precision; payback `>25 / not reached`
means the audited cumulative savings did not recover capex within 25 modeled
years, so a percentage is not defined.

### Sizing and emissions

| Case | Daily load kWh/day (main → audit; Δ%) | System kWp (main → audit; Δ%) | Panels (main → audit; Δ%) | Inverter kW (main → audit; Δ%) | Battery kWh (main → audit; Δ%) | CO₂ t/year (main → audit; Δ%) |
|---|---:|---:|---:|---:|---:|---:|
| A | 21.1 → 21.1 (0%) | 4.4 → 4.4 (0%) | 11 → 11 (0%) | 5.3 → 5.3 (0%) | 12.4 → 12.4 (0%) | 3.4 → 3.5 (+2.9%) |
| A2 | 194.4 → 194.4 (0%) | 39.6 → 39.6 (0%) | 99 → 99 (0%) | 47.5 → 47.5 (0%) | 114.4 → 114.4 (0%) | 31.6 → 31.9 (+0.9%) |
| B | 4,500 → 4,500 (0%) | 907.6 → 907.6 (0%) | 2,269 → 2,269 (0%) | 1,089.1 → 1,089.1 (0%) | 2,647.1 → 2,647.1 (0%) | 730.9 → 731.2 (+0.0%) |
| C | 2,400 → 2,400 (0%) | 484.0 → 484.0 (0%) | 1,210 → 1,210 (0%) | 580.8 → 580.8 (0%) | 1,411.8 → 1,411.8 (0%) | 389.8 → 389.9 (+0.0%) |
| D | 24.4 → 24.4 (0%) | 5.6 → 5.6 (0%) | 14 → 14 (0%) | 6.7 → 6.7 (0%) | 0 → 0 (0%) | 4.0 → 4.1 (+2.5%) |
| E | 13.3 → 13.3 (0%) | 5.6 → 5.6 (0%) | 14 → 14 (0%) | 6.7 → 6.7 (0%) | 0 → 0 (0%) | 2.2 → 2.3 (+4.5%) |
| F | 8,000 → 8,000 (0%) | 1,818.4 → 1,818.4 (0%) | 4,546 → 4,546 (0%) | 2,182.1 → 2,182.1 (0%) | 4,705.9 → 4,705.9 (0%) | 1,299.4 → 1,299.6 (+0.0%) |
| G | 66.7 → 66.7 (0%) | 13.6 → 13.6 (0%) | 34 → 34 (0%) | 16.3 → 16.3 (0%) | 39.2 → 39.2 (0%) | 10.8 → 11.0 (+1.9%) |

### Economics

| Case | System cost USD (main → audit; Δ%) | Annual savings* (main → audit; Δ%) | Payback years (main → audit; Δ%) |
|---|---:|---:|---:|
| A | $5,280 → $9,457 (+79.1%) | 462 → 393 (-14.9%) | 11.4 → >25 / not reached (N/A) |
| A2 | $47,520 → $85,743 (+80.4%) | 4,258 → 3,620 (-15.0%) | 11.2 → >25 / not reached (N/A) |
| B | $762,384 → $1,730,810 (+127.0%) | 174,788 → 95,825 (-45.2%) | 4.4 → 18.88 (+329.1%) |
| C | $406,560 → $923,039 (+127.0%) | 101,347 → 51,101 (-49.6%) | 4.0 → 18.88 (+372.0%) |
| D | $6,720 → $8,239 (+22.6%) | 2,677 → 937 (-65.0%) | 2.5 → 8.97 (+258.8%) |
| E | $6,720 → $8,239 (+22.6%) | 1,703 → 596 (-65.0%) | 3.9 → 14.29 (+266.4%) |
| F | $1,527,456 → $3,324,302 (+117.6%) | 597,491 → 432,341 (-27.6%) | 2.6 → 7.82 (+200.8%) |
| G | $16,320 → $29,423 (+80.3%) | 1,460 → 1,241 (-15.0%) | 11.2 → >25 / not reached (N/A) |

\* Annual-savings figures are the calculator's reported `annualSavings`.
Main's value includes its load-times-tariff estimate plus modeled demand-charge
savings for commercial/industrial cases. Audit savings use modeled
self-consumption and battery-shifted energy, with the default zero export
tariff and no demand-charge savings. Tariff values are the case inputs; cost
is denominated in USD. No currency conversion is implemented, so treat direct
cost/savings comparisons as indicative only.

### Explaining changes greater than 10%

- **System cost, all cases (+22.6% to +127.0%):** `main` estimated capex as
  installed kWp times one budget rate, with a large-system discount. `audit/v2`
  sums separate PV, inverter, battery, BOS, labour, and permit line items, with
  scale discounts on non-battery items. Those component rates and discounts
  remain **UNVERIFIED**; this comparison describes the model change, not a
  verified market-price increase.
- **Annual savings, all cases (-14.9% to -65.0%):** `main` credited the full
  daily load at the import tariff and also applied unverified commercial /
  industrial demand-charge assumptions. `audit/v2` counts modeled direct
  self-consumption and battery-shifted energy at the import tariff, gives
  exports zero credit by default, and removes demand-charge savings because
  no interval load or verified tariff schedule is available.
- **Payback, cases B-F (+200.8% to +372.0%):** the old output was simple
  capex divided by annual savings; the new output is the degradation-adjusted
  cumulative-savings crossing year. Cost increased while modeled annual
  savings decreased. Cases A, A2, and G do not recover modeled capex within
  25 years, so the new output is `null`, not a fabricated finite payback.
- Costs are explicitly shown in USD, while savings retain the input tariff
  currency. Payback and net profit are suppressed when those currencies differ;
  no exchange rate is invented. All reference cases here use the USD default.
- Daily load and system-sizing values are unchanged at the displayed
  precision. CO₂ changes are under 5%: `main` applied its factor to daily load
  times 365, while the audited engine applies the same unverified factor to
  modeled PV generation. Differences are primarily rounding / generation
  basis, not a newly verified emissions factor.
- Case A is the appliance-based Cairo reference (`bill=0`; 21.1 kWh/day).
  A2 separately exercises the $350 monthly-bill path. B/C provide deliberately
  large bill values but retain their commercial / industrial baselines. F is
  the mall reference at 8,000 kWh/day in South / Southeast Asia (5.5 peak-sun
  hours/day in the current unverified software defaults).

## Calculation consumers and wiring status

| File / surface | Change or status |
|---|---|
| `src/lib/calculator.js` | Sole sizing, component cost, energy-flow, savings, payback, CO₂, and 25-year projection implementation. |
| `src/lib/designConsumers.js` | Named consumer entry point to `computeDesign()`; maps saved legacy reports to their stored output snapshot only when original inputs are absent. |
| `src/pages/Calculator.jsx` | Uses the shared engine for expert and beginner results; persists complete input state and assumptions version; labels USD capex, shows no-payback/currency-mismatch status, and removes the unsupported CO₂ tree conversion. |
| `src/pages/SystemDesign.jsx` | Recomputes from saved input state through the shared consumer and displays engine results. |
| `src/components/SystemDiagram.jsx` | Uses the shared result for PV, inverter, and battery labels. |
| `src/components/SystemAssembly.jsx` | Uses the shared result for system and electrical sizing labels. |
| `src/components/InstallationSteps.jsx` | Uses the shared result for system-size messaging. |
| `src/components/SolarYieldChart.jsx` | Uses engine generation and annual projection values; removed its separate degradation / cumulative-savings calculation and fabricated 7,000 kWh fallback. Its illustrative monthly-weight chart is explicitly UNVERIFIED. |
| `src/lib/pdf.js` | Recomputes from saved input state; component cost breakdown and 25-year financial / CO₂ chart values come from the engine. Removed fabricated NPV, IRR, cost shares, monthly distributions, tree/car equivalences, and unverified source attributions. |
| `src/lib/supabase.js`, `supabase/schema.sql`, `supabase/migrations/20261101000000_add_report_design_inputs.sql` | Corrected saved-report field mapping; stores `design_inputs` and `assumptions_version`. Apply the migration to existing Supabase projects to enable these columns. |
| `src/pages/Dashboard.jsx` | Recomputes reports with saved inputs; explicitly labels legacy records as stored snapshots. |
| `src/pages/admin/AdminReports.jsx` | Recomputes reports from saved inputs; uses stored snapshots for legacy records and blocks reproducible PDF regeneration without original inputs. |
| `src/pages/admin/AdminUsers.jsx` | Uses the same report-output helper; labels legacy stored values. |
| `src/pages/admin/AdminOverview.jsx`, `src/pages/admin/AdminAffiliates.jsx`, `src/lib/affiliateEstimates.js` | Share one explicitly UNVERIFIED affiliate-conversion/revenue estimate; report activity uses saved design inputs where available. Revenue estimates are business assumptions, not solar-design outputs. |
| `src/lib/__tests__/affiliateEstimates.test.js` | Verifies the shared affiliate estimate output. |
| `src/components/Sunora.jsx` | Does not calculate design values; updated assistant guidance to avoid invented metrics and unsupported CO₂ equivalences. |
| `src/lib/__tests__/calculator.test.js` | Runs A-G through every registered consumer and verifies exact equality of sizing, cost, savings, payback, emissions, and projections. |

## Still UNVERIFIED

See [METHODOLOGY.md](./METHODOLOGY.md) for all calculator assumptions and
limitations. In particular, the regional peak-sun values, 400 W module size,
aggregate derate, tariffs, appliance/sector loads, daytime-load fractions,
battery round-trip efficiency and depth of discharge, cost rates and scale
discounts, 0.5% degradation, and 0.445 kg CO₂/kWh factor have no verified
site-specific primary source in this audit. Affiliate conversion, order-value,
and commission assumptions are also unverified. Component costs are USD while
user tariffs may be local currency; no conversion is implemented.
