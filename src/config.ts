import type {
  AdvancedPowerFlowCardConfig,
  BatteryConfig,
  PvInputConfig,
  PvSystemConfig
} from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function legacySolarToArray(solar: unknown): PvSystemConfig[] {
  if (!solar || typeof solar !== "object" || Array.isArray(solar)) return [];

  const entries = Object.entries(solar as Record<string, unknown>)
    .filter(([key, value]) => key.toLowerCase().startsWith("pv") && value && typeof value === "object")
    .map(([key, value]) => {
      const source = value as Record<string, unknown>;
      return {
        name: typeof source.name === "string" ? source.name : key.toUpperCase(),
        power: typeof source.power === "string" ? source.power : undefined,
        voltage: typeof source.voltage === "string" ? source.voltage : undefined,
        current: typeof source.current === "string" ? source.current : undefined
      } satisfies PvInputConfig;
    });

  if (!entries.length) return [];

  return [
    {
      name: "PV-Anlage",
      children: entries
    }
  ];
}

export function normalizeConfig(input: unknown): AdvancedPowerFlowCardConfig {
  const raw = input && typeof input === "object"
    ? clone(input as Record<string, unknown>)
    : {};

  const solar = Array.isArray(raw.solar)
    ? raw.solar as PvSystemConfig[]
    : legacySolarToArray(raw.solar);

  let batteries: BatteryConfig[];
  if (Array.isArray(raw.batteries)) {
    batteries = raw.batteries as BatteryConfig[];
  } else {
    batteries = [];
    if (raw.battery1 && typeof raw.battery1 === "object") {
      batteries.push(raw.battery1 as BatteryConfig);
    }
    if (raw.battery2 && typeof raw.battery2 === "object") {
      batteries.push(raw.battery2 as BatteryConfig);
    }
  }

  return {
    type: typeof raw.type === "string" ? raw.type : "custom:advanced-power-flow-card",
    title: typeof raw.title === "string" ? raw.title : "Energiefluss",
    solar,
    batteries,
    grid: raw.grid && typeof raw.grid === "object" ? raw.grid : undefined,
    house: raw.house && typeof raw.house === "object" ? raw.house : undefined,
    heat_pump: raw.heat_pump && typeof raw.heat_pump === "object" ? raw.heat_pump : undefined,
    consumers: Array.isArray(raw.consumers) ? raw.consumers : [],
    power_threshold:
      typeof raw.power_threshold === "number" && Number.isFinite(raw.power_threshold)
        ? raw.power_threshold
        : 5
  } as AdvancedPowerFlowCardConfig;
}

export function createStubConfig(): AdvancedPowerFlowCardConfig {
  return {
    type: "custom:advanced-power-flow-card",
    title: "Energiefluss",
    solar: [
      {
        name: "GoodWe",
        power: "sensor.goodwe_pv_power",
        children: [
          {
            name: "MPPT 1",
            power: "sensor.goodwe_pv1_power",
            voltage: "sensor.goodwe_pv1_voltage",
            current: "sensor.goodwe_pv1_current"
          },
          {
            name: "MPPT 2",
            power: "sensor.goodwe_pv2_power",
            voltage: "sensor.goodwe_pv2_voltage",
            current: "sensor.goodwe_pv2_current"
          },
          {
            name: "MPPT 3",
            power: "sensor.goodwe_pv3_power",
            voltage: "sensor.goodwe_pv3_voltage",
            current: "sensor.goodwe_pv3_current"
          }
        ]
      },
      {
        name: "Victron",
        children: [
          {
            name: "MPPT 1",
            power: "sensor.victron_mppt_1_power",
            voltage: "sensor.victron_mppt_1_voltage",
            current: "sensor.victron_mppt_1_current"
          },
          {
            name: "MPPT 2",
            power: "sensor.victron_mppt_2_power",
            voltage: "sensor.victron_mppt_2_voltage",
            current: "sensor.victron_mppt_2_current"
          }
        ]
      }
    ],
    batteries: [
      {
        name: "Batterie 1",
        power: "sensor.battery_1_power",
        soc: "sensor.battery_1_soc",
        positive_is_charging: true
      },
      {
        name: "Batterie 2",
        power: "sensor.battery_2_power",
        soc: "sensor.battery_2_soc",
        positive_is_charging: true
      }
    ],
    grid: {
      power: "sensor.grid_power",
      positive_is_import: true
    },
    house: {
      name: "Haus",
      power: "sensor.house_power"
    },
    heat_pump: {
      name: "Wärmepumpe",
      power: "sensor.heatpump_power",
      part_of_house: true,
      flow_temperature: "sensor.heatpump_flow_temperature",
      return_temperature: "sensor.heatpump_return_temperature",
      outdoor_temperature: "sensor.heatpump_outdoor_temperature",
      hot_water_temperature: "sensor.heatpump_hot_water_temperature",
      mode: "sensor.heatpump_mode",
      compressor_status: "binary_sensor.heatpump_compressor",
      compressor_frequency: "sensor.heatpump_compressor_frequency",
      thermal_power: "sensor.heatpump_thermal_power",
      cop: "sensor.heatpump_cop",
      daily_energy: "sensor.heatpump_daily_energy"
    },
    consumers: [],
    power_threshold: 5
  };
}
