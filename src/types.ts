export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
}

export interface PvInputConfig {
  name?: string;
  power?: string;
  voltage?: string;
  current?: string;
  daily_energy?: string;
  daily_peak_power?: string;
  installed_kwp?: number;
}

export interface PvSystemConfig {
  name?: string;
  power?: string;
  daily_energy?: string;
  daily_peak_power?: string;
  installed_kwp?: number;
  children?: PvInputConfig[];
}

export interface BatteryConfig {
  name?: string;
  power?: string;
  soc?: string;
  positive_is_charging?: boolean;
  voltage?: string;
  current?: string;
  temperature?: string;
  cell_min_voltage?: string;
  cell_max_voltage?: string;
  cell_min_temperature?: string;
  cell_max_temperature?: string;
  state_of_health?: string;
  cycle_count?: string;
  remaining_energy?: string;
  daily_charge_energy?: string;
  daily_discharge_energy?: string;
  capacity_kwh?: number;
}

export interface GridConfig {
  power?: string;
  positive_is_import?: boolean;
}

export interface ConsumerConfig {
  name?: string;
  power?: string;
  part_of_house?: boolean;
}

export interface DailyStatsConfig {
  pv_energy?: string;
  grid_import_energy?: string;
  grid_export_energy?: string;
  house_energy?: string;
}

export interface DiagnosticsConfig {
  enabled?: boolean;
  pv_voltage_without_power_threshold?: number;
  battery_cell_delta_warning?: number;
  battery_temperature_low?: number;
  battery_temperature_high?: number;
  mppt_relative_warning_enabled?: boolean;
  mppt_relative_warning_ratio?: number;
  mppt_daily_relative_warning_enabled?: boolean;
  mppt_daily_relative_warning_ratio?: number;
}

export interface CardColorsConfig {
  solar?: string;
  grid?: string;
  battery?: string;
  heat_pump?: string;
  consumer?: string;
  flow?: string;
}

export type TextSize = "small" | "normal" | "large";
export type DailyLayout = "auto" | "cards" | "compact";

export interface HeatPumpConfig extends ConsumerConfig {
  flow_temperature?: string;
  return_temperature?: string;
  outdoor_temperature?: string;
  hot_water_temperature?: string;
  room_temperature?: string;
  target_temperature?: string;
  mode?: string;
  compressor_status?: string;
  compressor_frequency?: string;
  thermal_power?: string;
  cop?: string;
  daily_energy?: string;
  daily_thermal_energy?: string;
  daily_cop?: string;
  details_expanded_by_default?: boolean;
}

export interface AdvancedPowerFlowCardConfig {
  type: string;
  title?: string;
  solar?: PvSystemConfig[];
  batteries?: BatteryConfig[];
  grid?: GridConfig;
  house?: ConsumerConfig;
  heat_pump?: HeatPumpConfig;
  consumers?: ConsumerConfig[];
  daily?: DailyStatsConfig;
  diagnostics?: DiagnosticsConfig;
  colors?: CardColorsConfig;
  power_threshold?: number;
  balance_warning_threshold?: number;
  text_size?: TextSize;
  daily_layout?: DailyLayout;
  night_mode?: boolean;
}

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}
