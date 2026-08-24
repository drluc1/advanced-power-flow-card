# Advanced Power Flow Card

Home Assistant Lovelace card for flexible visualization of energy flows.

## v0.2.3 highlights

- Any number of PV systems and MPPT/sub-PV inputs.
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
    children:
      - name: MPPT Garage
        power: sensor.victron_mppt_garage_power
```

If the PV-system `power` entity is missing or unavailable, the card automatically sums the available child MPPT powers.

## Batteries

```yaml
batteries:
  - name: Batterie 1
    power: sensor.battery_1_power
    soc: sensor.battery_1_soc
    positive_is_charging: true
```

`positive_is_charging: true` means positive power is charging and negative power is discharging.

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
