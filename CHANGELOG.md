# Changelog

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
