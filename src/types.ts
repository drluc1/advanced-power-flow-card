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
}

export interface PvSystemConfig {
  name?: string;
  power?: string;
  children?: PvInputConfig[];
}

export interface BatteryConfig {
  name?: string;
  power?: string;
  soc?: string;
  positive_is_charging?: boolean;
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
  power_threshold?: number;
}

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}
