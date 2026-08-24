export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
}

export interface PvConfig {
  name?: string;
  power?: string;
  voltage?: string;
  current?: string;
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
}

export interface AdvancedPowerFlowCardConfig {
  type: string;
  title?: string;
  solar?: {
    pv1?: PvConfig;
    pv2?: PvConfig;
    pv3?: PvConfig;
  };
  battery1?: BatteryConfig;
  battery2?: BatteryConfig;
  grid?: GridConfig;
  house?: ConsumerConfig;
  heat_pump?: ConsumerConfig;
  power_threshold?: number;
}

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}
