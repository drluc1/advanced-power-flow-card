# Advanced Power Flow Card

Home Assistant Lovelace card for flexible visualization of energy flows.

## v0.2.5 highlights

- Any number of PV systems and MPPT/sub-PV inputs.
- Clearer PV hierarchy: MPPTs are visually separated from each PV system's total-production node.
- Click `PV heute` to expand per-system daily production and percentage shares.
- Battery nodes now open a detailed BMS-style panel with optional cell, temperature, SOH and cycle data.
- PV systems and MPPTs wrap into additional rows instead of widening the diagram.
- No internal horizontal scrollbar: the complete diagram scales to the card width.
- Compact node sizing between the v0.1 and v0.2 designs.
- Any number of batteries and optional generic consumers.
- Dedicated heat-pump node with expandable operating details.
- House consumption can be calculated automatically from PV, grid and battery power when no house-power entity is configured.
- Graphical editor supports adding/removing PV systems, MPPTs, batteries and consumers.
- Battery nodes include a proportional SOC fill bar.
- Heat-pump node includes an operating-mode/status badge.
- Active, idle and unavailable nodes are visually differentiated without hiding information.
- v0.1 configurations are migrated automatically when loaded.
- Center node shows total live supply rather than duplicating PV power.
- Optional balance diagnostics warn when measured inputs/outputs do not close within the configured threshold.
- Grid and calculated-house nodes use compact status badges; batteries explicitly show charging/discharging state.
- Three typography sizes are available; `large` is the default for better mobile readability.
- Optional daily energy summary for PV, import, export and house consumption.
- Desktop hover highlights the connected energy path.

## Development

```bash
npm install
npm run build
```

The HACS file is generated at:

```text
dist/advanced-power-flow-card.js
```

Commit the generated JavaScript file to the repository because HACS serves the built dashboard resource.

## PV configuration

A PV system can have its own total-power entity and any number of child MPPTs:

```yaml
solar:
  - name: GoodWe
    power: sensor.goodwe_pv_power
    daily_energy: sensor.goodwe_pv_energy_today
    children:
      - name: MPPT 1
        power: sensor.goodwe_pv1_power
        voltage: sensor.goodwe_pv1_voltage
        current: sensor.goodwe_pv1_current
      - name: MPPT 2
        power: sensor.goodwe_pv2_power
        voltage: sensor.goodwe_pv2_voltage
        current: sensor.goodwe_pv2_current

  - name: Victron
    daily_energy: sensor.victron_pv_energy_today
    children:
      - name: MPPT Garage
        power: sensor.victron_mppt_garage_power
```

If the PV-system `power` entity is missing or unavailable, the card automatically sums the available child MPPT powers.

`daily_energy` is optional. When configured per PV system, clicking the `PV heute` summary tile opens a breakdown of the daily production of all PV systems. If a total PV daily-energy entity is available, the card also shows each system's percentage share.

## Batteries

```yaml
batteries:
  - name: Batterie 1
    power: sensor.battery_1_power
    soc: sensor.battery_1_soc
    positive_is_charging: true
    voltage: sensor.battery_1_voltage
    current: sensor.battery_1_current
    temperature: sensor.battery_1_temperature
    cell_min_voltage: sensor.battery_1_cell_min_voltage
    cell_max_voltage: sensor.battery_1_cell_max_voltage
    cell_min_temperature: sensor.battery_1_cell_min_temperature
    cell_max_temperature: sensor.battery_1_cell_max_temperature
    state_of_health: sensor.battery_1_soh
    cycle_count: sensor.battery_1_cycles
    remaining_energy: sensor.battery_1_remaining_energy
    daily_charge_energy: sensor.battery_1_charge_today
    daily_discharge_energy: sensor.battery_1_discharge_today
```

`positive_is_charging: true` means positive power is charging and negative power is discharging. Click a battery node to open the optional detail values. When minimum and maximum cell voltage are configured, the card also calculates the current cell-voltage delta.

## House consumption

The house-power entity is optional:

```yaml
house:
  name: Haus
```

When `house.power` is omitted, the card calculates the house demand using the energy balance:

```text
house = PV + grid import - grid export + battery discharge - battery charging
```

Consumers configured with `part_of_house: false` are subtracted from this value so they are not counted twice. The calculation uses the configured grid and battery sign conventions.

## Heat pump

The following fields are optional:

```yaml
heat_pump:
  name: Wärmepumpe
  power: sensor.heatpump_power
  part_of_house: true
  flow_temperature: sensor.heatpump_flow_temperature
  return_temperature: sensor.heatpump_return_temperature
  outdoor_temperature: sensor.heatpump_outdoor_temperature
  hot_water_temperature: sensor.heatpump_hot_water_temperature
  room_temperature: sensor.heatpump_room_temperature
  target_temperature: sensor.heatpump_target_temperature
  mode: sensor.heatpump_mode
  compressor_status: binary_sensor.heatpump_compressor
  compressor_frequency: sensor.heatpump_compressor_frequency
  thermal_power: sensor.heatpump_thermal_power
  cop: sensor.heatpump_cop
  daily_energy: sensor.heatpump_daily_energy
```

Click the heat-pump node to expand or collapse the detailed values.

## Generic consumers

```yaml
consumers:
  - name: Server
    power: sensor.server_power
    part_of_house: true
```

If `part_of_house` is true, the flow is drawn from the house node to the consumer so the consumer is visually represented as part of the already measured house consumption rather than as an additional total load.


## Display and balance options

```yaml
text_size: large
power_threshold: 5
balance_warning_threshold: 50
```

`text_size` accepts `small`, `normal` or `large`.

When a real `house.power` entity is configured, the card independently compares the measured house load against PV, grid, battery and direct-consumer power. If the residual exceeds `balance_warning_threshold`, the center node is highlighted as a warning.

When `house.power` is omitted, the house load itself is derived from the same balance. In that case a residual cannot be used as an independent sensor check, so the card marks the house as calculated instead.

## Optional daily summary

Only configured entries are shown:

```yaml
daily:
  pv_energy: sensor.pv_energy_today
  grid_import_energy: sensor.grid_import_today
  grid_export_energy: sensor.grid_export_today
  house_energy: sensor.house_energy_today
```

The values appear as compact tiles above the live flow diagram. `PV heute` opens the per-system production breakdown; the other tiles open their Home Assistant entities.
