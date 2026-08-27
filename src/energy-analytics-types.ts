export type AnalyticsRange = "days" | "months" | "years";
export type AnalyticsTextSize = "normal" | "large" | "xlarge";

export interface AnalyticsEnergyConfig {
  pv_total?: string;
  house?: string;
  grid_import?: string;
  grid_export?: string;
  battery_charge?: string;
  battery_discharge?: string;
  heat_pump?: string;
  heat_pump_thermal?: string;
  wallbox?: string;
  cost_import?: string;
  revenue_export?: string;
}

export interface AnalyticsPvInputConfig {
  name?: string;
  energy?: string;
  installed_kwp?: number;
}

export interface AnalyticsPvSystemConfig {
  name?: string;
  energy?: string;
  installed_kwp?: number;
  children?: AnalyticsPvInputConfig[];
}

export interface AnalyticsBatteryConfig {
  name?: string;
  charge_energy?: string;
  discharge_energy?: string;
  capacity_kwh?: number;
}

export interface EnergyAnalyticsCardConfig {
  type: string;
  title?: string;
  default_range?: AnalyticsRange;
  day_count?: number;
  month_count?: number;
  year_count?: number;
  text_size?: AnalyticsTextSize;
  energy?: AnalyticsEnergyConfig;
  solar?: AnalyticsPvSystemConfig[];
  batteries?: AnalyticsBatteryConfig[];
}

export interface StatisticRow {
  start: number;
  end?: number;
  change?: number | null;
  sum?: number | null;
  state?: number | null;
}

export type StatisticsResult = Record<string, StatisticRow[]>;
