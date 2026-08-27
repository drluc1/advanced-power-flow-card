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

  return [{ name: "PV-Anlage", children: entries }];
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
    if (raw.battery1 && typeof raw.battery1 === "object") batteries.push(raw.battery1 as BatteryConfig);
    if (raw.battery2 && typeof raw.battery2 === "object") batteries.push(raw.battery2 as BatteryConfig);
  }

  const diagnosticsRaw = raw.diagnostics && typeof raw.diagnostics === "object"
    ? raw.diagnostics as Record<string, unknown>
    : {};

  return {
    type: typeof raw.type === "string" ? raw.type : "custom:advanced-power-flow-card",
    title: typeof raw.title === "string" ? raw.title : "Energiefluss",
    solar,
    batteries,
    grid: raw.grid && typeof raw.grid === "object" ? raw.grid : undefined,
    house: raw.house && typeof raw.house === "object" ? raw.house : undefined,
    heat_pump: raw.heat_pump && typeof raw.heat_pump === "object" ? raw.heat_pump : undefined,
    consumers: Array.isArray(raw.consumers) ? raw.consumers : [],
    daily: raw.daily && typeof raw.daily === "object" ? raw.daily : undefined,
    diagnostics: {
      enabled: typeof diagnosticsRaw.enabled === "boolean" ? diagnosticsRaw.enabled : true,
      pv_voltage_without_power_threshold:
        typeof diagnosticsRaw.pv_voltage_without_power_threshold === "number"
          ? diagnosticsRaw.pv_voltage_without_power_threshold
          : 80,
      battery_cell_delta_warning:
        typeof diagnosticsRaw.battery_cell_delta_warning === "number"
          ? diagnosticsRaw.battery_cell_delta_warning
          : 0.05,
      battery_temperature_low:
        typeof diagnosticsRaw.battery_temperature_low === "number"
          ? diagnosticsRaw.battery_temperature_low
          : 5,
      battery_temperature_high:
        typeof diagnosticsRaw.battery_temperature_high === "number"
          ? diagnosticsRaw.battery_temperature_high
          : 45,
      mppt_relative_warning_enabled:
        typeof diagnosticsRaw.mppt_relative_warning_enabled === "boolean"
          ? diagnosticsRaw.mppt_relative_warning_enabled
          : false,
      mppt_relative_warning_ratio:
        typeof diagnosticsRaw.mppt_relative_warning_ratio === "number"
          ? diagnosticsRaw.mppt_relative_warning_ratio
          : 0.35,
      mppt_daily_relative_warning_enabled:
        typeof diagnosticsRaw.mppt_daily_relative_warning_enabled === "boolean"
          ? diagnosticsRaw.mppt_daily_relative_warning_enabled
          : false,
      mppt_daily_relative_warning_ratio:
        typeof diagnosticsRaw.mppt_daily_relative_warning_ratio === "number"
          ? diagnosticsRaw.mppt_daily_relative_warning_ratio
          : 0.35,
      pv_temperature_high:
        typeof diagnosticsRaw.pv_temperature_high === "number"
          ? diagnosticsRaw.pv_temperature_high
          : 75,
      stale_sensor_minutes:
        typeof diagnosticsRaw.stale_sensor_minutes === "number"
          ? diagnosticsRaw.stale_sensor_minutes
          : 0
    },
    tariffs: raw.tariffs && typeof raw.tariffs === "object" ? raw.tariffs : undefined,
    colors: raw.colors && typeof raw.colors === "object" ? raw.colors : undefined,
    power_threshold:
      typeof raw.power_threshold === "number" && Number.isFinite(raw.power_threshold)
        ? raw.power_threshold
        : 5,
    balance_warning_threshold:
      typeof raw.balance_warning_threshold === "number" && Number.isFinite(raw.balance_warning_threshold)
        ? raw.balance_warning_threshold
        : 50,
    text_size:
      raw.text_size === "small" || raw.text_size === "large" || raw.text_size === "normal" || raw.text_size === "xlarge"
        ? raw.text_size
        : "large",
    mobile_scale:
      typeof raw.mobile_scale === "number" && Number.isFinite(raw.mobile_scale)
        ? Math.min(1.3, Math.max(0.9, raw.mobile_scale))
        : 1.06,
    layout_density:
      raw.layout_density === "compact" || raw.layout_density === "comfortable" || raw.layout_density === "auto"
        ? raw.layout_density
        : "auto",
    pv_layout:
      raw.pv_layout === "expanded" || raw.pv_layout === "compact" || raw.pv_layout === "grouped" || raw.pv_layout === "auto"
        ? raw.pv_layout
        : "auto",
    pv_detail_level:
      raw.pv_detail_level === "minimal" || raw.pv_detail_level === "compact" || raw.pv_detail_level === "full" || raw.pv_detail_level === "auto"
        ? raw.pv_detail_level
        : "auto",
    pv_show_status: typeof raw.pv_show_status === "boolean" ? raw.pv_show_status : true,
    pv_show_relative_power: typeof raw.pv_show_relative_power === "boolean" ? raw.pv_show_relative_power : true,
    pv_compact_mppt_bars: typeof raw.pv_compact_mppt_bars === "boolean" ? raw.pv_compact_mppt_bars : true,
    night_pv_collapse: typeof raw.night_pv_collapse === "boolean" ? raw.night_pv_collapse : true,
    battery_layout: raw.battery_layout === "separate" || raw.battery_layout === "grouped" ? raw.battery_layout : "grouped",
    supply_node: raw.supply_node === "compact" || raw.supply_node === "hidden" || raw.supply_node === "full" ? raw.supply_node : "full",
    flow_animation:
      raw.flow_animation === "system" || raw.flow_animation === "off" || raw.flow_animation === "always"
        ? raw.flow_animation
        : "always",
    flow_routing:
      raw.flow_routing === "orthogonal" || raw.flow_routing === "curved"
        ? raw.flow_routing
        : "curved",
    visual_style:
      raw.visual_style === "classic" || raw.visual_style === "clean"
        ? raw.visual_style
        : "clean",
    show_legend: typeof raw.show_legend === "boolean" ? raw.show_legend : true,
    show_version: typeof raw.show_version === "boolean" ? raw.show_version : true,
    daily_layout:
      raw.daily_layout === "cards" || raw.daily_layout === "compact" || raw.daily_layout === "auto"
        ? raw.daily_layout
        : "cards",
    daily_items: Array.isArray(raw.daily_items)
      ? raw.daily_items.filter((value): value is string => typeof value === "string") as AdvancedPowerFlowCardConfig["daily_items"]
      : undefined,
    night_mode: typeof raw.night_mode === "boolean" ? raw.night_mode : true
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
        installed_kwp: 6,
        children: [
          { name: "MPPT 1", power: "sensor.goodwe_pv1_power", voltage: "sensor.goodwe_pv1_voltage", current: "sensor.goodwe_pv1_current", installed_kwp: 2 },
          { name: "MPPT 2", power: "sensor.goodwe_pv2_power", voltage: "sensor.goodwe_pv2_voltage", current: "sensor.goodwe_pv2_current", installed_kwp: 2 },
          { name: "MPPT 3", power: "sensor.goodwe_pv3_power", voltage: "sensor.goodwe_pv3_voltage", current: "sensor.goodwe_pv3_current", installed_kwp: 2 }
        ]
      },
      {
        name: "Victron",
        children: [
          { name: "MPPT 1", power: "sensor.victron_mppt_1_power", voltage: "sensor.victron_mppt_1_voltage", current: "sensor.victron_mppt_1_current" },
          { name: "MPPT 2", power: "sensor.victron_mppt_2_power", voltage: "sensor.victron_mppt_2_voltage", current: "sensor.victron_mppt_2_current" }
        ]
      }
    ],
    batteries: [
      { name: "Batterie 1", power: "sensor.battery_1_power", soc: "sensor.battery_1_soc", positive_is_charging: true },
      { name: "Batterie 2", power: "sensor.battery_2_power", soc: "sensor.battery_2_soc", positive_is_charging: true }
    ],
    grid: { power: "sensor.grid_power", positive_is_import: true },
    house: { name: "Haus" },
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
      daily_energy: "sensor.heatpump_daily_energy",
      display_temperature: "sensor.heatpump_flow_temperature",
      display_temperature_label: "VL"
    },
    consumers: [],
    daily: {},
    diagnostics: {
      enabled: true,
      pv_voltage_without_power_threshold: 80,
      battery_cell_delta_warning: 0.05,
      battery_temperature_low: 5,
      battery_temperature_high: 45,
      mppt_relative_warning_enabled: false,
      mppt_relative_warning_ratio: 0.35,
      mppt_daily_relative_warning_enabled: false,
      mppt_daily_relative_warning_ratio: 0.35
    },
    power_threshold: 5,
    balance_warning_threshold: 50,
    text_size: "large",
    mobile_scale: 1.06,
    layout_density: "auto",
    pv_layout: "auto",
    pv_detail_level: "auto",
    pv_show_status: true,
    pv_show_relative_power: true,
    pv_compact_mppt_bars: true,
    night_pv_collapse: true,
    battery_layout: "grouped",
    supply_node: "full",
    flow_animation: "always",
    flow_routing: "curved",
    visual_style: "clean",
    show_legend: true,
    show_version: true,
    daily_layout: "cards",
    night_mode: true
  };
}
