# Advanced Power Flow Card

Flexible Home Assistant Lovelace power-flow card with dynamic PV systems, MPPTs, batteries, grid, house load, heat pump and additional consumers.

## v0.2.6 highlights

- Unlimited PV systems and MPPT/sub-PV inputs.
- Click a PV-system total node for a detailed live MPPT breakdown.
- Optional PV `installed_kwp`, daily peak power and specific yield in kWh/kWp.
- Automatic Autarky and Eigenverbrauch daily metrics.
- PV, battery, balance and sensor-availability diagnostics.
- Optional normalized MPPT comparison in W/kWp.
- Battery detail panels with cell voltages, temperature, SOH, cycles and daily energy.
- Heat-pump COP can be calculated automatically from thermal/electrical power.
- Optional compact daily-summary layout and night mode.
- Optional category/flow color overrides.
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
        installed_kwp: 1.98
      - name: MPPT 2 Garten
        power: sensor.goodwe_pv2_power
        voltage: sensor.goodwe_pv2_voltage
        current: sensor.goodwe_pv2_current
        installed_kwp: 1.98
      - name: MPPT 3 Straße
        power: sensor.goodwe_pv3_power
        voltage: sensor.goodwe_pv3_voltage
        current: sensor.goodwe_pv3_current
        installed_kwp: 1.98
```

`power` on the parent PV system is optional. If omitted, the card sums its MPPT powers.

Clicking the parent PV node opens live MPPT details. Clicking `PV heute` opens the daily production breakdown. When `installed_kwp` is configured, the card calculates specific daily yield in kWh/kWp. `daily_peak_power` is optional.

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
```

The card can flag:

- PV voltage present but no relevant power.
- Unavailable PV/battery/grid/house sensors.
- Excessive battery cell-voltage delta.
- Battery temperatures outside configured limits.
- Power-balance residuals when a measured house-power entity is configured.
- Optional relative MPPT underperformance.

Relative MPPT diagnostics are **off by default** because different orientations/shading can make raw MPPT comparisons misleading. When `installed_kwp` is set on all MPPTs, the comparison uses W/kWp instead of raw watts.

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
  daily_energy: sensor.heatpump_daily_energy
  part_of_house: true
```

If `cop` is omitted but both electrical and thermal power are available, the card calculates the live COP automatically.

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
