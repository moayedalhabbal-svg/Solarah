# Solarah Methodology

## Scope and status

The calculator is a high-level screening estimate, not a construction design,
utility application, financing case, or licensed-engineer certification.
`computeDesign(state)` is the calculation source used by the app. Its output
includes `assumptionsVersion: 2026.11-v1`.
Saved reports are recomputed from stored inputs only when their saved
assumptions version matches the current engine; older or unversioned reports
display their stored output snapshot instead.

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
specific site. Monthly bills and import/export tariffs are interpreted as USD.
Country selection only chooses the regional software tariff; these regional
values are **UNVERIFIED** and are not country utility quotations.
New reports store `currency: USD`. Historical reports retain their original
currency label and are shown as unconverted snapshots; they are not silently
relabelled as USD.

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

## Design alternatives and NPV

- **Full-offset** retains the current load-based array sizing.
- **Balanced** evaluates module counts at 30%, 40%, 50%, 60%, 70%, 80%, 90%,
  and 100% of full-offset sizing, rounding up to whole modules. It uses the
  same self-consumption, tariff, battery-shifting, and cost model, and selects
  the candidate with the greatest 25-year NPV. Including the 100% candidate
  means the selected NPV cannot be lower than full-offset.
- For a hybrid system, **Balanced PV, no battery** evaluates the same PV size
  as the selected balanced option with battery capacity and battery capex set
  to zero.
- `NPV = -initial_cost + sum(yearly_savings_t / (1 + discount_rate)^t)` for
  years 1–25. Yearly savings use the same 0.5% degradation as the projection;
  no replacements, O&M, taxes, financing, escalation, or salvage value are
  included.

| Parameter | Default | Source/status |
|---|---:|---|
| NPV discount rate | 8% nominal | **UNVERIFIED** planning rate; not a user-specific or market-verified cost of capital |
| Evaluation period | 25 years | Same software horizon as lifetime savings; not a product warranty |
| Alternative panel rounding | Round up to whole modules | Physical module-count arithmetic |

The NPV is an indicative scenario comparison, not a financing valuation.
At a flat tariff, batteries are priced for backup, not savings: the model
includes only energy shifted through the battery and does not value resilience
or outage protection.

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

These are not current supplier quotes or IRENA/NREL/BNEF benchmarks. Bills,
tariffs, capex, and savings are USD-only. Supporting other currencies would
require a verified FX source, rate timestamp, and conversion policy; that work
is out of scope. No historical stored currency is converted or represented as
a verified USD equivalent.

`systemCost`, `annualSavings`, and `lifetimeSavings` are denominated in USD.
`payback` is the first fractional year in which cumulative annual savings,
reduced by the modeled 0.5% yearly degradation, reach modeled capex. It is
`null` when the threshold is not reached within 25 years.
`lifetimeSavings` applies the same flat 0.5% annual generation/savings
degradation for 25 years, without discounting, replacements, O&M, escalation,
or taxes. The 0.5% degradation input is **UNVERIFIED** for a specific module or
climate. Neither metric is a bankable financial forecast.

The engine returns the year-by-year `annualProjection` used to render the
calculator charts and PDFs. Annual generation, savings, and CO₂ estimates
decline by the same degradation factor; cumulative savings and CO₂ are sums of
those projected annual values. Consumers must display this projection rather
than independently recreating the financial or emissions curves.

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
  energy model. The solar-yield chart's monthly allocation uses illustrative,
  **UNVERIFIED** weights for visualization only; it is not a site-specific
  monthly yield forecast and does not affect calculator outputs.
- Battery sizing is a fixed fraction of daily energy; it is not derived from
  a measured night-load profile or a selected product's warranty.
- The result should be reviewed by a qualified local PV engineer before
  procurement, permitting, financing, or installation.
- Admin affiliate-revenue estimates use assumed 2% conversion, USD 800 average
  order value, and 3% commission rates. They are **UNVERIFIED** business
  assumptions, not PV-system outputs or measured affiliate performance.
