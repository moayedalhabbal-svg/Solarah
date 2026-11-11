# Solarah Methodology

## Scope

This document describes the current calculator assumptions used by the audit branch (`audit/v2`). It is intended for design-review, customer-facing reporting, and internal engineering sign-off. The model should be treated as a decision-support approximation, not as a licensed-engineer design certificate.

## 1. Load estimation

Residential loads are estimated from monthly bill or appliance inputs:
- If a monthly bill is supplied, daily energy demand is approximated as `bill / tariff / 30`.
- If no bill is supplied, appliance energy is estimated from `watts × hours / 1000` and summed across selected appliances.
- Commercial and industrial loads are taken from sector default daily-kWh baselines and adjusted for shift multiplier where applicable.

## 2. PV sizing

The array size is sized against a simplified daily-energy balance:
- `required_kWp = daily_kWh / (peak_sun_hours × 0.80 × 365)`
- `panels = ceil(required_kWp / 0.4)`
- `system_kWp = panels × 0.4`

This is a high-level approximation and should later be replaced with a site-year simulation using PVGIS/NREL data or a physics-based irradiance model.

## 3. Loss assumptions

The model currently applies a single default derate of `0.80` as a placeholder. This is a coarse simplification that is not equivalent to a verified loss budget. A production-ready version should explicitly model:
- temperature losses,
- soiling,
- wiring,
- mismatch and DC clipping,
- inverter efficiency,
- availability.

## 4. Financial model

Capex is now estimated using a component-based structure:
- PV module cost per kWp,
- inverter cost per kW,
- battery cost per kWh,
- BOS + labour + permit allowance,
- scale adjustment for large commercial and industrial sites.

The annual savings estimate is currently limited by the annual bill offset and is computed as:
- `self_consumption = 0.6–0.9` depending on battery and system type,
- `generation = system_kWp × peak_sun_hours × 365 × 0.80`,
- `annual_savings = generation × self_consumption × tariff + generation × (1 - self_consumption) × export_tariff`
- `annual_savings` is capped at `annual_bill × 0.95` when an annual bill is known.

This is intentionally conservative and prevents the calculator from claiming impossible savings.

## 5. Battery assumptions

Battery size is approximated as:
- `battery_kWh = (daily_kWh × 0.50) / 0.85` for hybrid and off-grid systems
- `battery_kWh = 0` for grid-tied-only systems

This remains a planning approximation, not a full battery-life model.

## 6. Emissions factor

CO2 output is estimated with a default factor of `0.445 kg/kWh` and is applied to annual generation. This factor should be replaced with country-specific values from IEA/Ember before public launch.

## 7. Risks and limitations

- Country tariffs in the beginner flow are coarse and may not reflect actual utility policy.
- Region-level peak-sun values are broad proxies and not site-specific.
- Roof area, shading restrictions, and wiring constraints are not yet modelled as hard engineering limits.
- PV yield and savings remain directional estimates pending a more rigorous irradiance and tariff validation step.

## 8. Recommended next engineering steps

1. Replace region-level constants with country-specific, customer-class tariff tables.
2. Add a proper irradiance model using PVGIS/NREL data.
3. Add explicit arithmetic for roof-area fit and DC string checks.
4. Add real IRR/NPV/LCOE calculation with debt assumptions and replacement cycles.
5. Add assumptions versioning and approval sign-off to every report.
