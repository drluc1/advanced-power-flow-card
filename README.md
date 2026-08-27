# Advanced Power Flow + Energy Analytics

One HACS dashboard package containing two Home Assistant Lovelace cards:

- `custom:advanced-power-flow-card` for live power flow, batteries, PV/MPPTs and consumers.
- `custom:energy-analytics-card` for Recorder / Long-Term-Statistics charts and kWh/kWp analysis.

## v0.3.0 highlights

- New Energy Analytics Card with 30-day, 12-month and 5-year views.
- Interactive energy bar chart for PV, house, grid, batteries, heat pump and wallbox.
- PV-system efficiency chart in kWh/kWp.
- Per-system and per-MPPT long-term analysis with kWh, kWh/kWp and production share.
- Selected-period detail panel with Autarky, Eigenverbrauch and heat-pump JAZ when data is available.
- Uses Home Assistant Long-Term Statistics directly; no separate database or backend integration is required.
- Both cards are delivered through the same `advanced-power-flow-card.js`.

See `example-energy-analytics.yaml` and `LONG-TERM-SENSORS.md` for setup.

## Existing Power Flow features

- Unlimited PV systems and MPPT/sub-PV inputs.
- New `xlarge` typography mode plus independent mobile scaling from 0.90 to 1.30.
- New adaptive layout-density modes: `auto`, `compact` and `comfortable`.
- Optional electricity-price, daily grid-cost and feed-in-revenue cards.
- Fixed tariffs can estimate daily import cost / export revenue from daily kWh.
- Extended battery health information with BMS status and daily min/max SOC.
- Extended PV health information with optional inverter temperature and system/MPPT status.
- Optional stale-sensor diagnostics based on Home Assistant `last_updated`.
- Battery charge-time and discharge-runtime estimates in hours when enough battery data is available.
- Configurable target SOC, reserve SOC and minimum power threshold for stable estimates.
- Optional smoothed/average battery-power entity for less jumpy forecasts.
- Expected target time (clock time) and remaining energy to target/reserve.
- Optional maximum charge/discharge power with live utilization percentage.
- Multi-battery overview with capacity-weighted SOC, stored energy, aggregate power and common runtime estimate.
- MPPT daily-energy, daily peak, kWh/kWp and daily-share analytics.
- Click a PV-system total node for live and daily MPPT analytics.
- Clicking `Haus heute` opens a daily energy balance for PV, grid, batteries and house consumption.
- Heat-pump live COP and daily performance factor/JAZ can be read directly or calculated.
- Automatic Autarky and Eigenverbrauch daily metrics.
- Automatic house consumption calculation when no house-power entity is configured.

## Build

```bash
npm install
npm run build
```

The HACS file is generated at:

```text
dist/advanced-power-flow-card.js
```

## PV systems

```yaml
solar:
  - name: Hausdach
    power: sensor.goodwe_pv_power
    daily_energy: sensor.goodwe_pv_energy_today
    daily_peak_power: sensor.goodwe_pv_peak_today
    installed_kwp: 5.94
    inverter_temperature: sensor.goodwe_inverter_temperature
    status: sensor.goodwe_status
    children:
      - name: MPPT 1 Gaube
        power: sensor.goodwe_pv1_power
        voltage: sensor.goodwe_pv1_voltage
        current: sensor.goodwe_pv1_current
        daily_energy: sensor.goodwe_pv1_energy_today
        daily_peak_power: sensor.goodwe_pv1_peak_today
        installed_kwp: 1.98
        status: sensor.goodwe_mppt1_status
      - name: MPPT 2 Garten
        power: sensor.goodwe_pv2_power
        voltage: sensor.goodwe_pv2_voltage
        current: sensor.goodwe_pv2_current
        daily_energy: sensor.goodwe_pv2_energy_today
        installed_kwp: 1.98
      - name: MPPT 3 Straße
        power: sensor.goodwe_pv3_power
        voltage: sensor.goodwe_pv3_voltage
        current: sensor.goodwe_pv3_current
        daily_energy: sensor.goodwe_pv3_energy_today
        installed_kwp: 1.98
```

`power` on the parent PV system is optional. If omitted, the card sums its MPPT powers.

Clicking the parent PV node opens live and daily MPPT details. Each MPPT can have `daily_energy`, `daily_peak_power` and `installed_kwp`; the card then calculates kWh/kWp and the MPPT share of the parent system. If a PV system has no own `daily_energy`, the card can sum all configured MPPT daily-energy entities instead.

## Daily metrics

```yaml
daily:
  pv_energy: sensor.pv_energy_today
  grid_import_energy: sensor.grid_import_today
  grid_export_energy: sensor.grid_export_today
  house_energy: sensor.house_energy_today
```

When enough values are available, the card automatically calculates:

```text
Autarkie = 1 - Netzbezug / Hausverbrauch
Eigenverbrauch = 1 - Einspeisung / PV-Erzeugung
```

These are standard energy-balance approximations. Grid-charged batteries or unusual metering topology can make them differ from vendor-specific statistics.

The daily display can be configured with:

```yaml
daily_layout: cards   # cards | compact | auto
```

## Diagnostics

```yaml
diagnostics:
  enabled: true
  pv_voltage_without_power_threshold: 80
  battery_cell_delta_warning: 0.05
  battery_temperature_low: 5
  battery_temperature_high: 45
  mppt_relative_warning_enabled: false
  mppt_relative_warning_ratio: 0.35
  mppt_daily_relative_warning_enabled: false
  mppt_daily_relative_warning_ratio: 0.35
  pv_temperature_high: 75
  stale_sensor_minutes: 0       # 0 = disabled
```

The card can flag:

- PV voltage present but no relevant power.
- Unavailable PV/battery/grid/house sensors.
- Excessive battery cell-voltage delta.
- Battery temperatures outside configured limits.
- Power-balance residuals when a measured house-power entity is configured.
- Optional relative MPPT underperformance.
- Excessive inverter temperature when configured.
- Optional stale-sensor warnings after a configurable number of minutes.
- Fault/error/alarm states from optional PV/MPPT/BMS status entities.

Relative MPPT diagnostics are **off by default** because different orientations/shading can make comparisons misleading. Live comparison uses W/kWp when possible. Daily comparison requires `daily_energy` and `installed_kwp` on all MPPTs and compares kWh/kWp.

## Batteries

```yaml
batteries:
  - name: Akku Pylontech
    power: sensor.battery_power
    soc: sensor.battery_soc
    positive_is_charging: true
    capacity_kwh: 9.6
    target_soc: 90
    reserve_soc: 10
    estimate_min_power_w: 100
    average_power: sensor.battery_power_5min
    max_charge_power_kw: 5.0
    max_discharge_power_kw: 5.0
    voltage: sensor.battery_voltage
    current: sensor.battery_current
    temperature: sensor.battery_temperature
    cell_min_voltage: sensor.battery_cell_min_voltage
    cell_max_voltage: sensor.battery_cell_max_voltage
    cell_min_temperature: sensor.battery_cell_min_temperature
    cell_max_temperature: sensor.battery_cell_max_temperature
    state_of_health: sensor.battery_soh
    status: sensor.battery_bms_status
    daily_min_soc: sensor.battery_min_soc_today
    daily_max_soc: sensor.battery_max_soc_today
    cycle_count: sensor.battery_cycles
    remaining_energy: sensor.battery_remaining_energy
    daily_charge_energy: sensor.battery_charge_today
    daily_discharge_energy: sensor.battery_discharge_today
```

When enough values are available, the card estimates battery charging or discharge runtime:

```text
charging time = energy still required to target SOC / charging power
runtime       = energy available above reserve SOC / discharge power
```

`remaining_energy` is treated as the battery's currently stored usable energy. If it is not configured, the card can calculate stored energy from `SOC × capacity_kwh`. If `capacity_kwh` is missing but `remaining_energy` and SOC are available, the capacity can be approximately inferred.

`average_power` is optional. When configured and available it is preferred for the forecast; otherwise the live `power` entity is used. `estimate_min_power_w` prevents meaningless very-long estimates at standby power. The calculated clock time and duration are estimates because BMS limits, changing loads, PV output and tapering near full SOC can change the real result.

With multiple batteries, opening any battery also shows a combined overview with capacity-weighted SOC, total stored energy, aggregate charge/discharge power and a common estimate when all required battery data is available.

When daily charge/discharge energy and `capacity_kwh` are available, the detail view additionally estimates equivalent daily cycles. The displayed discharge/charge ratio is not a true round-trip efficiency because the battery SOC can change during the day.

## Heat pump

```yaml
heat_pump:
  name: Wärmepumpe
  power: sensor.heatpump_power
  thermal_power: sensor.heatpump_thermal_power
  cop: sensor.heatpump_cop          # optional
  flow_temperature: sensor.heatpump_flow_temperature
  return_temperature: sensor.heatpump_return_temperature
  outdoor_temperature: sensor.heatpump_outdoor_temperature
  mode: sensor.heatpump_mode
  daily_energy: sensor.heatpump_electric_energy_today
  daily_thermal_energy: sensor.heatpump_thermal_energy_today
  daily_cop: sensor.heatpump_jaz_today   # optional
  part_of_house: true
```

If `cop` is omitted but both electrical and thermal power are available, the card calculates the live COP automatically. If `daily_cop` is omitted but electrical and thermal daily-energy sensors are available, the card calculates the daily performance factor/JAZ automatically.

## Daily energy balance

When `house_energy`, grid import/export and the daily charge/discharge energy of all configured batteries are available, clicking `Haus heute` opens a full daily energy balance:

```text
Sources: PV + grid import + battery discharge
Uses:    house + grid export + battery charge
```

The panel also shows the residual between both sides. It deliberately does not claim exact source-to-destination attribution (for example whether a battery was charged from PV or grid).

## House power

```yaml
house:
  name: Haus
```

With no `house.power` entity, the card calculates:

```text
Haus = PV + Netzbezug - Einspeisung + Batterieentladung - Batterieladung
```

Direct consumers with `part_of_house: false` are subtracted from that calculated house value.

## Electricity price and costs

```yaml
tariffs:
  import_price: sensor.current_electricity_price
  export_price: sensor.current_feed_in_price
  import_cost_today: sensor.grid_cost_today
  export_revenue_today: sensor.feed_in_revenue_today
  currency: "€"
```

If Home Assistant does not provide daily cost/revenue entities, fixed tariffs can be used instead:

```yaml
tariffs:
  fixed_import_price: 0.31
  fixed_export_price: 0.082
  currency: "€"
```

The fixed-price calculation uses the configured daily grid-import/export energy. A live dynamic price entity is shown as information only and is deliberately not multiplied by the entire day's energy.

## Display options

```yaml
text_size: xlarge           # small | normal | large | xlarge
mobile_scale: 1.08          # 0.90 ... 1.30; only applied on small displays
layout_density: auto        # auto | compact | comfortable
power_threshold: 5
balance_warning_threshold: 50
night_mode: true
```

`xlarge` also gives SVG nodes a little more vertical room. `mobile_scale` changes typography on narrow screens without forcing the desktop dashboard to use the same larger text. `layout_density: auto` uses tighter outer spacing on phones while keeping more breathing room on desktop.

Optional color overrides accept normal CSS colors:

```yaml
colors:
  solar: "#f4b400"
  grid: "#039be5"
  battery: "#43a047"
  heat_pump: "#fb8c00"
  consumer: "#03a9f4"
  flow: "#03a9f4"
```
