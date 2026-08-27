export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callWS?<T = unknown>(message: Record<string, unknown>): Promise<T>;
}

export interface PvInputConfig {
  name?: string;
  power?: string;
  voltage?: string;
  current?: string;
  daily_energy?: string;
  daily_peak_power?: string;
  installed_kwp?: number;
  status?: string;
}

export interface PvSystemConfig {
  name?: string;
  power?: string;
  daily_energy?: string;
  daily_peak_power?: string;
  installed_kwp?: number;
  inverter_temperature?: string;
  status?: string;
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
  target_soc?: number;
  reserve_soc?: number;
  estimate_min_power_w?: number;
  average_power?: string;
  max_charge_power_kw?: number;
  max_discharge_power_kw?: number;
  status?: string;
  daily_min_soc?: string;
  daily_max_soc?: string;
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

export interface TariffConfig {
  import_price?: string;
  export_price?: string;
  import_cost_today?: string;
  export_revenue_today?: string;
  fixed_import_price?: number;
  fixed_export_price?: number;
  currency?: string;
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
  pv_temperature_high?: number;
  stale_sensor_minutes?: number;
}

export interface CardColorsConfig {
  solar?: string;
  grid?: string;
  battery?: string;
  heat_pump?: string;
  consumer?: string;
  flow?: string;
}

export type TextSize = "small" | "normal" | "large" | "xlarge";
export type DailyLayout = "auto" | "cards" | "compact";
export type LayoutDensity = "auto" | "compact" | "comfortable";
export type PvLayoutMode = "auto" | "expanded" | "compact" | "grouped";
export type PvDetailLevel = "auto" | "minimal" | "compact" | "full";

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
  display_temperature?: string;
  display_temperature_label?: string;
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
  tariffs?: TariffConfig;
  diagnostics?: DiagnosticsConfig;
  colors?: CardColorsConfig;
  power_threshold?: number;
  balance_warning_threshold?: number;
  text_size?: TextSize;
  mobile_scale?: number;
  layout_density?: LayoutDensity;
  pv_layout?: PvLayoutMode;
  pv_detail_level?: PvDetailLevel;
  daily_layout?: DailyLayout;
  night_mode?: boolean;
}

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}
