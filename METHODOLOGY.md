# Solarah Methodology

## Scope and status

The calculator is a high-level screening estimate, not a construction design,
utility application, financing case, or licensed-engineer certification.
`computeDesign(state)` is the calculation source used by the app. Its output
includes `assumptionsVersion: 2026.11-v1`.

## Load estimate

- Residential: a positive monthly bill takes precedence and implies
  `daily_kWh = monthly_bill / import_tariff / 30`. If the bill is zero, appliance
  energy is the sum of `rated_watts × daily_hours / 1000`. An empty or
  sub-1-kWh/day estimate falls back to 12 kWh/day.
- Commercial: use the selected business type's daily-kWh default.
- Industrial: use the selected type's daily-kWh default multiplied by the
  selected shift count.

The appliance ratings, daily hours, sector baselines, and 30-day month
conversion are software inputs, not verified meter data. **UNVERIFIED** for a
specific site.

## PV size and generation

- `required_kWp = daily_kWh / (peak_sun_hours × 0.80)`
- `panel_count = ceil(required_kWp / 0.4 kWp)`
- `installed_kWp = panel_count × 0.4 kWp`
- `annual_generation_kWh = installed_kWp × peak_sun_hours × 365 × 0.80`

The 400 W module size is the calculator's nominal module assumption.
`0.80` is a coarse aggregate performance factor, not a validated loss budget.
The regional peak-sun-hour values are broad software defaults. No primary,
site-specific source and publication year have been verified for these values;
they are **UNVERIFIED**. Use measured/site-specific PVGIS or NREL data before
relying on a yield estimate. Temperature, shading, orientation, clipping,
availability, and monthly irradiance are not independently modelled here.

## Energy matching and savings

The displayed annual energy flows are estimates derived from the generated
energy and daily load:

1. `daytime_load = daily_load × daytime_load_fraction`.
2. `direct_self_consumed = min(daily_generation, daytime_load)`.
3. If a battery is present, `battery_delivered` is the minimum of remaining
   load, PV surplus multiplied by round-trip efficiency, and nominal battery
   capacity multiplied by assumed depth of discharge.
4. `selfConsumedKWh = (direct_self_consumed + battery_delivered) × 365`.
5. `exportedKWh = (daily_generation - direct_self_consumed - battery_delivered / round_trip_efficiency) × 365`, floored at zero.
6. `importedKWh = (daily_load - daily_self_consumed) × 365`, floored at zero
   for grid-connected systems. Off-grid unmet load is reported separately as
   `unservedKWh`.
7. `annual_savings = selfConsumedKWh × import_tariff + exportedKWh × export_tariff`.

There is no bill-percentage cap. Savings are limited by the modeled energy
flows themselves. Demand-charge savings are not included because no site
interval-load or tariff schedule is available.

| Parameter | Default | Source/status |
|---|---:|---|
| Residential daytime load fraction | 0.35 | **UNVERIFIED** planning assumption; not based on site interval data |
| Commercial daytime load fraction | 0.65 | **UNVERIFIED** planning assumption; not based on site interval data |
| Industrial daytime load fraction | 0.65 | **UNVERIFIED** planning assumption; not based on site interval data |
| Battery round-trip efficiency | 0.92 | **UNVERIFIED** default; no specific battery model or source-year validated |
| Battery depth of discharge | 0.85 | **UNVERIFIED** software assumption; must match selected product warranty |
| Export tariff | 0 by default | Deliberately no export revenue without a user-entered or verified jurisdiction-specific rate; country net-metering rules have not been verified |
| Days per year | 365 | Calendar arithmetic; leap years are not separately modelled |

Users can set the expert-mode export tariff. A positive value must be checked
against the applicable utility tariff and net-metering rules; Solarah does not
currently provide a verified country rule table.

## Capex and financial outputs

Nominal component cost assumptions in the current software are:

| Item | Default rate | Source/status |
|---|---:|---|
| PV | USD 780/kWp | **UNVERIFIED** |
| Inverter | USD 210/kW | **UNVERIFIED** |
| Battery | USD 240/kWh | **UNVERIFIED** |
| BOS | USD 180/kWp | **UNVERIFIED** |
| Labour | USD 200/kWp | **UNVERIFIED** |
| Permits | USD 60/kWp | **UNVERIFIED** |
| Budget factors | 0.85 / 1.00 / 1.30 | **UNVERIFIED** economy / medium / premium multipliers |
| Scale discounts | 10% above 50 kWp; 18% above 200 kWp | **UNVERIFIED** |

These are not current supplier quotes or IRENA/NREL/BNEF benchmarks. The
calculator's cost basis is USD, while some UI tariff/currency inputs are in
local currency; currency conversion is not yet implemented. Do not compare
cost and savings as if they were in the same currency unless the inputs have
been normalized.

`payback` is the first fractional year in which cumulative annual savings,
reduced by the modeled 0.5% yearly degradation, reach the modeled capex. It is
`null` when the threshold is not reached within 25 years.
`lifetimeSavings` applies the same flat 0.5% annual generation/savings
degradation for 25 years, without discounting, replacements, O&M, escalation,
or taxes. The 0.5% degradation input is **UNVERIFIED** for a specific module or
climate. Neither metric is a bankable financial forecast.

## Emissions

The default grid emissions factor is 0.445 kg CO2/kWh. It is not country
specific, and no data source/year has been verified for this constant:
**UNVERIFIED**. Use a country- and year-specific official grid factor before
using emissions estimates in claims or reporting.

## Other assumptions and limitations

- Current region tariff and irradiance values, and beginner-flow country
  tariff values, are coarse software defaults with no verified publication
  year/source attached: **UNVERIFIED**.
- Tilt, azimuth, roof-area fit, shading, electrical string limits, monthly
  generation, and utility demand-charge response are not validated by this
  energy model.
- Battery sizing is a fixed fraction of daily energy; it is not derived from
  a measured night-load profile or a selected product's warranty.
- The result should be reviewed by a qualified local PV engineer before
  procurement, permitting, financing, or installation.
