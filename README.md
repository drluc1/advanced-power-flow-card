# Advanced Power Flow Card

Flexible Home Assistant Lovelace power-flow card with dynamic PV systems, MPPTs, batteries, grid, house load, heat pump and additional consumers.

## v0.2.7 highlights

- Unlimited PV systems and MPPT/sub-PV inputs.
- MPPTs can now have their own daily-energy and daily-peak entities.
- Automatic MPPT specific daily yield in kWh/kWp and daily share of the parent PV system.
- Optional daily MPPT underperformance diagnostics based on kWh/kWp.
- Click a PV-system total node for live and daily MPPT analytics.
- Clicking `Haus heute` opens a daily energy balance for PV, grid, batteries and house consumption.
- Heat-pump daily performance factor/JAZ can be read directly or calculated from thermal/electrical daily energy.
- Automatic Autarky and Eigenverbrauch daily metrics.
- Battery detail panels with cell voltages, temperature, SOH, cycles and daily energy.
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
    children:
      - name: MPPT 1 Gaube
        power: sensor.goodwe_pv1_power
        voltage: sensor.goodwe_pv1_voltage
        current: sensor.goodwe_pv1_current
        daily_energy: sensor.goodwe_pv1_energy_today
        daily_peak_power: sensor.goodwe_pv1_peak_today
        installed_kwp: 1.98
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
```

The card can flag:

- PV voltage present but no relevant power.
- Unavailable PV/battery/grid/house sensors.
- Excessive battery cell-voltage delta.
- Battery temperatures outside configured limits.
- Power-balance residuals when a measured house-power entity is configured.
- Optional relative MPPT underperformance.

Relative MPPT diagnostics are **off by default** because different orientations/shading can make comparisons misleading. Live comparison uses W/kWp when possible. Daily comparison requires `daily_energy` and `installed_kwp` on all MPPTs and compares kWh/kWp.

## Batteries

```yaml
batteries:
  - name: Akku Pylontech
    power: sensor.battery_power
    soc: sensor.battery_soc
    positive_is_charging: true
    capacity_kwh: 9.6
    voltage: sensor.battery_voltage
    current: sensor.battery_current
    temperature: sensor.battery_temperature
    cell_min_voltage: sensor.battery_cell_min_voltage
    cell_max_voltage: sensor.battery_cell_max_voltage
    cell_min_temperature: sensor.battery_cell_min_temperature
    cell_max_temperature: sensor.battery_cell_max_temperature
    state_of_health: sensor.battery_soh
    cycle_count: sensor.battery_cycles
    remaining_energy: sensor.battery_remaining_energy
    daily_charge_energy: sensor.battery_charge_today
    daily_discharge_energy: sensor.battery_discharge_today
```

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

## Display options

```yaml
text_size: large
power_threshold: 5
balance_warning_threshold: 50
night_mode: true
```

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
