# Changelog

## 0.2.9

- Added `xlarge` text mode with slightly larger diagram nodes.
- Added independent `mobile_scale` (0.90-1.30) for mobile typography.
- Added `layout_density`: `auto`, `compact` and `comfortable`; auto uses more of the available mobile card width.
- Added optional live electricity-price and feed-in-price display.
- Added optional daily grid-cost and feed-in-revenue entities.
- Added fixed import/export tariffs for estimated daily cost/revenue when dedicated cost sensors do not exist.
- Added battery BMS status plus daily min/max SOC detail entities and a compact derived battery diagnostic status.
- Added PV-system inverter temperature and optional PV-system/MPPT status entities.
- Added configurable high inverter-temperature diagnostics.
- Added optional stale-sensor diagnostics using Home Assistant entity update timestamps.

## 0.2.8

- Added estimated remaining battery charging time and discharge runtime in hours.
- Added configurable `target_soc`, `reserve_soc` and `estimate_min_power_w` per battery.
- Added optional `average_power` entity for smoother time estimates.
- Added expected target/reserve clock time and remaining energy to target/reserve.
- Added optional `max_charge_power_kw` and `max_discharge_power_kw` with live utilization percentage.
- Battery nodes now include a compact ETA when a reliable estimate can be calculated.
- Added a multi-battery overview with capacity-weighted SOC, total stored energy, aggregate charging/discharging power and common runtime estimate.
- Added a conservative PV-to-battery surplus indicator when batteries are charging without relevant grid import.
- Battery capacity can be inferred approximately from remaining energy and SOC when an explicit usable capacity is not configured.
- Added explanatory forecast notes to make clear that estimates assume approximately constant power.

## 0.2.7

- Added optional `daily_energy` and `daily_peak_power` entities to every MPPT/sub-PV input.
- MPPT detail rows now show daily production, daily kWh/kWp, daily share of the parent PV system and optional daily peak power.
- PV-system daily production can now fall back to the sum of MPPT daily-energy sensors when no parent daily-energy sensor exists.
- Added optional MPPT daily-underperformance diagnostics based on kWh/kWp.
- Clicking `Haus heute` now opens a daily energy-balance panel with PV, grid import/export, battery charge/discharge and house consumption.
- The daily energy-balance panel shows source/use totals and the remaining energy residual when all required sensors are available.
- Added heat-pump `daily_thermal_energy` and optional `daily_cop`; JAZ is calculated automatically when only electrical and thermal daily energy are configured.
- Improved drill-down from the `PV heute` system list into the corresponding PV-system detail panel.

## 0.2.6

- Added automatic daily Autarky and Eigenverbrauch metrics when the required daily energy sensors are configured.
- PV system total nodes are now clickable and open a dedicated detail panel with live power, daily energy, peak power, installed kWp, specific yield and MPPT breakdown.
- Added optional `installed_kwp` to PV systems and MPPTs for normalized W/kWp diagnostics.
- Added optional `daily_peak_power` to PV systems.
- Added a live PV share bar to every PV-system total node.
- Added configurable diagnostics for PV voltage-without-power, battery cell-voltage delta, battery temperature and optional relative MPPT underperformance.
- Added a central diagnostics panel and warning highlighting on affected PV/battery nodes.
- Added sensor-unavailable checks for key power, PV and battery entities.
- Heat-pump COP is calculated automatically from thermal/electrical power when no COP sensor is configured.
- Battery details now optionally calculate daily discharge/charge ratio and equivalent cycles when capacity and daily charge/discharge energy are available.
- Added optional night mode that visually de-emphasizes inactive PV sections.
- Added `cards`, `compact` and `auto` layouts for the daily summary.
- Added optional category/flow color overrides.
- PV daily breakdown now shows installed kWp, specific daily yield and daily peak power where configured.

## 0.2.5

- Reworked PV-system hierarchy: MPPT nodes are visually quieter while the system total is shown as a wider, stronger summary node with a `Gesamt` badge.
- MPPT nodes now use a distinct tracker icon so they are easier to distinguish from the parent PV system.
- Added an optional `daily_energy` entity to each PV system.
- Clicking `PV heute` now opens a detailed daily-production breakdown by PV system, including percentage shares when a total is available.
- Battery nodes are now expandable like the heat-pump node.
- Added optional battery detail entities for voltage, current, temperature, min/max cell voltage and temperature, SOH, cycle count, remaining energy and daily charge/discharge energy.
- Battery details automatically calculate and display the cell-voltage delta when min/max values are available.

## 0.2.4

- Reworked the center node: it now shows total current supply instead of repeating PV power.
- Added live energy-balance diagnostics.
- Added optional daily summary values and typography size modes.

## 0.2.3

- Added battery SOC fill bars, heat-pump status badges and active/idle/unavailable visual states.

## 0.2.2

- Improved mobile readability and semantic colors.

## 0.2.1

- Removed internal horizontal scrolling and added automatic house-power calculation.

## 0.2.0

- Dynamic PV systems, MPPTs, batteries and consumers.
