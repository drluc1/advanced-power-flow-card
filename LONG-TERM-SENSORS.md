# Recommended Long-Term Statistics sensors

The Energy Analytics Card works best with energy entities that Home Assistant stores as Long-Term Statistics.

For energy counters, the preferred metadata is:

```yaml
unit_of_measurement: kWh
device_class: energy
state_class: total_increasing
```

A lifetime/cumulative counter is the most robust source. A daily-reset energy sensor can also be exposed as `total_increasing`; Home Assistant's statistics sum can account for valid resets. The value must not jump backwards randomly during the day.

## Minimum useful setup

| Purpose | Example entity | Required metadata |
|---|---|---|
| Total PV generation | `sensor.pv_energy_total` | energy + total_increasing |
| House consumption | `sensor.house_energy_total` | energy + total_increasing |
| Grid import | `sensor.grid_import_total` | energy + total_increasing |
| Grid export | `sensor.grid_export_total` | energy + total_increasing |

With these four counters the card can chart production/consumption and calculate period Autarky and Eigenverbrauch.

## PV analytics

Create/keep one cumulative energy entity for every level you want to analyse:

- PV total, all systems combined
- each PV system, e.g. house roof, garage, pavilion
- each MPPT / sub-PV input

For every PV system and MPPT, also configure its installed peak power in `kWp` in the card. No Home Assistant sensor is required for kWp because it is a fixed configuration value.

This enables:

- kWh per day/month/year
- kWh/kWp per day/month/year
- comparison between differently sized PV arrays
- MPPT production share

## Battery analytics

Recommended cumulative counters:

- battery charge energy total
- battery discharge energy total

For two separate batteries, individual counters are ideal as well:

- Battery 1 charge total
- Battery 1 discharge total
- Battery 2 charge total
- Battery 2 discharge total

A combined charge/discharge counter is enough for the first overview chart; per-battery counters allow later per-battery history and efficiency analysis.

## Heat-pump analytics

Recommended cumulative counters:

- electrical energy consumed total
- thermal heating/heat-output energy total

Optional separate thermal counters:

- space-heating thermal energy total
- domestic-hot-water thermal energy total
- cooling thermal energy total

With electrical + thermal energy the card can calculate a period COP/JAZ:

```text
JAZ = thermal energy / electrical energy
```

## Other useful consumers

Optional cumulative energy sensors:

- wallbox / EV charging energy total
- heat rod / immersion heater energy total
- air conditioning energy total
- server / IT energy total
- other large dedicated consumers

These can later be used for consumer breakdowns without changing the core energy balance.

## Cost / tariff history

For a fixed tariff, cost can be calculated from grid-import energy. For dynamic tariffs, use cumulative monetary sensors if available:

- grid import cost total
- feed-in revenue total

These should have long-term statistics appropriate to their monetary unit.

## Turning a daily-reset energy sensor into a statistics-compatible sensor

If an integration only exposes a daily value, a template sensor can mirror it with energy metadata. Example:

```yaml
template:
  - sensor:
      - name: "PV Hausdach Energie LTS"
        unique_id: pv_hausdach_energie_lts
        state: "{{ states('sensor.pv_hausdach_heute') }}"
        unit_of_measurement: "kWh"
        device_class: energy
        state_class: total_increasing
        availability: >-
          {{ states('sensor.pv_hausdach_heute') not in ['unknown', 'unavailable', 'none'] }}
```

If the source is in Wh, either keep `Wh` or convert to kWh in the template. Do not label a Wh value as kWh without converting it.

After creating a new statistics-compatible sensor, Home Assistant only has Long-Term Statistics from that point forward; it cannot reconstruct old data that was never retained.

## Recommended full sensor set

1. PV total energy
2. House total energy
3. Grid import total energy
4. Grid export total energy
5. Each PV system total energy
6. Each MPPT/sub-PV total energy
7. Battery charge total energy
8. Battery discharge total energy
9. Optional charge/discharge totals per individual battery
10. Heat-pump electrical energy total
11. Heat-pump thermal energy total
12. Wallbox total energy
13. Optional other large-consumer totals
14. Optional cumulative grid cost and feed-in revenue for dynamic tariffs
