# Advanced Power Flow Card

Custom Lovelace card for Home Assistant.

## Features

- 3 PV strings with power, voltage and current
- 2 independent batteries with SOC and bidirectional power flow
- Grid import/export
- House consumption
- Dedicated heat-pump consumer
- Animated power-flow lines
- Visual card editor
- Automatic W/kW formatting
- Theme-friendly styling
- Section-view sizing support
- Graceful handling of missing/unavailable entities

## Build

```bash
npm install
npm run build
```

The compiled card is written to:

```text
dist/advanced-power-flow-card.js
```

## Example configuration

```yaml
type: custom:advanced-power-flow-card
title: Energiefluss
solar:
  pv1:
    name: PV1
    power: sensor.goodwe_pv1_power
    voltage: sensor.goodwe_pv1_voltage
    current: sensor.goodwe_pv1_current
  pv2:
    name: PV2
    power: sensor.goodwe_pv2_power
    voltage: sensor.goodwe_pv2_voltage
    current: sensor.goodwe_pv2_current
  pv3:
    name: PV3
    power: sensor.goodwe_pv3_power
    voltage: sensor.goodwe_pv3_voltage
    current: sensor.goodwe_pv3_current

battery1:
  name: Batterie 1
  power: sensor.battery_1_power
  soc: sensor.battery_1_soc
  positive_is_charging: true

battery2:
  name: Batterie 2
  power: sensor.battery_2_power
  soc: sensor.battery_2_soc
  positive_is_charging: true

grid:
  power: sensor.grid_power
  positive_is_import: true

house:
  power: sensor.house_power

heat_pump:
  name: Wärmepumpe
  power: sensor.heatpump_power

power_threshold: 5
```
