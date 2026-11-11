# Solarah Engineering Audit Report

## Executive summary

The current Solarah calculator is usable as a rough feasibility tool, but it is not yet engineering-defensible. The most material issues are in the financial model and the physical assumptions: the cost model underestimates system capex because it omits battery, inverter, BOS and labour; savings are treated as if 100% of generated electricity offsets retail imports; and the regional constants are coarse proxies rather than site-specific engineering inputs. These issues materially affect the headline outputs (system sizing, cost, payback, savings) for residential, commercial and industrial reference cases.

The engineering risk is highest in:
- the cash-flow model for payback and lifetime savings,
- the sizing assumptions used for system kWp and battery size,
- the omitted cost components and tariff assumptions across countries and sectors.

The codebase is moving toward a usable design tool, but it should be treated as a prototype until the constants below are validated and the calculator is reconciled with a single source-of-truth compute object.

## Findings table

| ID | Severity | File:line | Evidence | Impact on reference cases | Proposed fix | Effort |
|---|---|---|---|---|---|---|
| F-01 | Critical | src/lib/calculator.js:74-93 | `systemCost = actualKW * cpp` and `annualSavings = annualKWh * tariff`; battery and inverter costs are excluded from capex, and savings ignore self-consumption/export split | Systems with battery are materially under-costed and payback is overstated; cases A, B, C, F especially affected | Replace unit-cost formula with component-based capex (PV + inverter + battery + BOS + labour + permits), and model self-consumption/export separately | High |
| F-02 | Critical | src/lib/calculator.js:133-160 | The calculation uses `dailyKWh / (sun * DERATE)` with `DERATE = 0.80` and then applies a temperature coefficient in `optimizeArray`; the model double-counts losses and uses a flat region delta-T | Overstates yield or misstates the loss budget; can distort case F and low-irradiance checks | Split derate into explicit loss elements (temperature, soiling, mismatch, wiring, inverter, availability) and calculate cell temp via NOCT or equivalent | High |
| F-03 | High | src/lib/calculator.js:74-93 | Savings assume all generated energy offsets imported energy at full retail tariff, with no export or load matching | Savings can exceed the real bill offset; overstates payback in grid-tied and hybrid systems | Add load/solar matching, battery shifting, export tariff, net-metering switch, and cap savings to `bill * selfConsumption + exportRevenue` | High |
| F-04 | High | src/lib/calculator.js:1-18; 20-31 | `PEAK_SUN` and `TARIFFS` are coarse region-wide proxies; a regional table cannot represent Egypt, Saudi Arabia, UAE, etc. accurately | Country-level payback differs materially; beginner mode and MENA use cases are not defensible | Replace region table with country-level tariffs and site-level irradiance values, with a flag for subsidised tiered tariffs | High |
| F-05 | High | src/lib/calculator.js:39-55 | Commercial and industrial baseline demand values are not independently benchmarked and may not reflect site load factors | Large commercial cases may have unrealistic kWh/day or peak demand assumptions | Validate against kWh/m²/yr and load-factor ranges; flag values outside 0.2-0.9 | Medium |
| F-06 | Medium | src/lib/calculator.js:172-224 | `optimizeArray` uses a flat regional delta-T and a simplistic tilt formula; no roof-area cap or area requirement check | Roof constraints are ignored; system can be oversized relative to roof or site geometry | Add required panel area + row spacing + tilt-aware area checks; warn/cap system size | Medium |
| F-07 | Medium | src/lib/calculator.js:237-284 | Battery recommendation is based on simple autonomy heuristics; it ignores DOD, cycle life, round-trip efficiency and actual night load | Off-grid batteries may be undersized or oversized; cost is misallocated | Use autonomy days, night-load sizing, DOD, round-trip efficiency and replacement model | Medium |
| F-08 | Medium | src/lib/calculator.js:302-350 | The code approximates `IRR` as `savings/cost` and returns a single payback number; this is not a true IRR | Financial outputs are misleading for financing and investor review | Use numeric IRR and NPV with discount rate, replacement cycles and O&M; add LCOE | Medium |
| F-09 | Medium | src/lib/calculator.js:114-120 | Hard-coded `CO2_FACTOR = 0.445` is a single global factor; actual grid emissions vary by country | Emissions numbers are not defensible for a country-level product | Replace with country-specific grid factors from IEA or Ember and label the source year | Low |
| F-10 | Low | src/lib/calculator.js:24-31 | Currency selector accepts multiple currencies but cost inputs are not converted; a USD cost can be displayed under local currency labels | Inconsistent unit reporting could mislead users | Centralize currency conversion and separate local-currency display from USD cost basis | Medium |

## Data validation table

| Constant | Current value | Verified value | Source | Year | Confidence |
|---|---:|---:|---|---:|---|
| North Africa / Middle East peak sun | 6.2 kWh/m²/day | Site dependent; Cairo ~5.5–6.0 kWh/m²/day; not a universal constant | PVGIS / NREL PVWatts / Global Solar Atlas | 2024 | Medium |
| South / Southeast Asia peak sun | 5.5 kWh/m²/day | Country/site dependent; varies 4.5–6.0+ kWh/m²/day | PVGIS / solar irradiance datasets | 2024 | Medium |
| `DERATE = 0.80` | 0.80 | Not a verified single value; loss budget is itemised: temperature, soiling, wiring, mismatch, inverter, availability | NREL PVWatts / IEC literature | 2024 | Medium |
| Grid CO2 factor | 0.445 kg/kWh | Country-specific: Egypt ~0.45–0.55, UAE ~0.42–0.62, Germany ~0.38, UK ~0.19, etc. | IEA / Ember | 2024 | Medium |
| LFP battery round-trip efficiency | Not explicitly modelled | ~90–95% usable round-trip efficiency | DOE / battery bench data / manufacturer datasheets | 2024 | High |
| LFP battery DoD | `DOD = 0.85` | Valid typical range for LFP, but should be tied to cycle life and application | User/industry battery design guidance | 2024 | High |
| O&M cost | Not included | Typically ~0.5–1% of capex/year for utility-scale or distributed PV | NREL / IRENA | 2024 | Medium |
| Inverter replacement | Not modelled | Typical replacement around year 12; depends on warranty and loading | Inverter manufacturers | 2024 | Medium |
| Battery replacement | Not modelled | Depends on throughput and cycle life; not a flat assumption | Battery OEMs / lifecycle studies | 2024 | Medium |
| Tariff assumptions | Static region-level tariff | Country and customer-class specific; highly tiered in Gulf & Egypt | National utility schedules | 2024 | Low |

## Assumptions that need engineer or founder decisions

1. Whether the product is intended as a rough consumer estimate or a finance-grade engineering design tool.
2. Which dispatch model should be used: self-consumption first, export-first, or net-metering behaviour.
3. Whether all countries in the beginner dropdown are to be represented by a single coarse region or by verified country-level tariffs and irradiance.
4. Whether the company wants to enable public marketing claims with a simple estimate or a conservative financial decision-support tool.
5. Whether to include grid-demand charge savings as a low-confidence revenue line or to omit them until a verified utility tariff is available.
6. Whether the product should show a single deterministic output or P50 / low / high range bands.
7. Whether the PDF and saved reports must be finance-grade or marketing-friendly.

## Key conclusion

The platform should not present a single number as a guaranteed engineering result until the assumptions above are formalized and the calculator is reconciled to defensible scientific and industry benchmarks. The current implementation is strong as a design exploration prototype, but material adjustments are required before it can support investor, bank, or scholarship review.
