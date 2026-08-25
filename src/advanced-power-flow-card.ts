import { LitElement, css, html, nothing, svg } from "lit";
import "./editor";
import { createStubConfig, normalizeConfig } from "./config";
import type {
  AdvancedPowerFlowCardConfig,
  BatteryConfig,
  ConsumerConfig,
  HassEntity,
  HeatPumpConfig,
  HomeAssistant,
  PvInputConfig,
  PvSystemConfig
} from "./types";

const CARD_NAME = "Advanced Power Flow Card";
const CARD_VERSION = "0.2.6";

type FlowDirection = "forward" | "reverse" | "off";
type NodeActivity = "active" | "idle" | "unknown";
type NodeKind = "pv" | "pv-parent" | "center" | "grid" | "house" | "battery" | "heat" | "consumer";

interface DiagramNode {
  id: string;
  title: string;
  main: string;
  sub?: string;
  entity?: string;
  kind: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  heatPump?: boolean;
  batteryIndex?: number;
  activity?: NodeActivity;
  batterySoc?: number;
  badge?: string;
  warning?: boolean;
  pvSystemIndex?: number;
  pvShare?: number;
}

interface PvClusterLayout {
  system: PvSystemConfig;
  systemIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  parent: DiagramNode;
  children: DiagramNode[];
}

interface BottomNode {
  node: DiagramNode;
  source: "center" | "house";
  power?: string;
  numericPower?: number;
  direction: FlowDirection;
}

interface DiagnosticMessage {
  severity: "warning" | "info";
  title: string;
  detail: string;
  nodeId?: string;
}

interface LayoutResult {
  width: number;
  height: number;
  center: DiagramNode;
  grid: DiagramNode;
  house: DiagramNode;
  pvClusters: PvClusterLayout[];
  bottom: BottomNode[];
}

export class AdvancedPowerFlowCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _heatExpanded: { state: true },
    _expandedBattery: { state: true },
    _pvDailyExpanded: { state: true },
    _expandedPvSystem: { state: true },
    _diagnosticsExpanded: { state: true },
    _hoveredNode: { state: true }
  };

  hass?: HomeAssistant;
  private _config: AdvancedPowerFlowCardConfig = createStubConfig();
  private _heatExpanded = false;
  private _heatExpansionInitialized = false;
  private _expandedBattery?: number;
  private _pvDailyExpanded = false;
  private _expandedPvSystem?: number;
  private _diagnosticsExpanded = false;
  private _hoveredNode?: string;

  static getConfigElement(): HTMLElement {
    return document.createElement("advanced-power-flow-card-editor");
  }

  static getStubConfig(): AdvancedPowerFlowCardConfig {
    return createStubConfig();
  }

  setConfig(config: AdvancedPowerFlowCardConfig): void {
    this._config = normalizeConfig(config);
    if (!this._heatExpansionInitialized) {
      this._heatExpanded = this._config.heat_pump?.details_expanded_by_default ?? false;
      this._heatExpansionInitialized = true;
    }
    if (this._expandedBattery !== undefined && this._expandedBattery >= (this._config.batteries ?? []).length) {
      this._expandedBattery = undefined;
    }
    if (this._expandedPvSystem !== undefined && this._expandedPvSystem >= (this._config.solar ?? []).length) {
      this._expandedPvSystem = undefined;
    }
  }

  getCardSize(): number {
    return this._detailsOpen() ? 8 : 6;
  }

  getGridOptions() {
    return {
      rows: this._detailsOpen() ? 8 : 6,
      columns: 12,
      min_rows: 5,
      min_columns: 6
    };
  }

  private _detailsOpen(): boolean {
    return this._heatExpanded || this._expandedBattery !== undefined || this._pvDailyExpanded || this._expandedPvSystem !== undefined || this._diagnosticsExpanded;
  }

  private _state(entityId?: string): HassEntity | undefined {
    if (!entityId || !this.hass) return undefined;
    return this.hass.states[entityId];
  }

  private _number(entityId?: string): number | undefined {
    const state = this._state(entityId);
    if (!state || state.state === "unknown" || state.state === "unavailable") return undefined;

    const value = Number(state.state.replace(",", "."));
    return Number.isFinite(value) ? value : undefined;
  }

  private _raw(entityId?: string): string | undefined {
    const state = this._state(entityId);
    if (!state || state.state === "unknown" || state.state === "unavailable") return undefined;
    return state.state;
  }

  private _unit(entityId?: string): string {
    const unit = this._state(entityId)?.attributes?.unit_of_measurement;
    return typeof unit === "string" ? unit : "";
  }

  private _powerW(entityId?: string): number | undefined {
    const value = this._number(entityId);
    if (value === undefined) return undefined;

    const unit = this._unit(entityId).trim().toLowerCase();
    if (unit === "kw") return value * 1000;
    if (unit === "mw") return value * 1_000_000;
    return value;
  }

  private _formatW(value?: number, absolute = false): string {
    if (value === undefined) return "—";
    const shown = absolute ? Math.abs(value) : value;
    const abs = Math.abs(shown);
    if (abs >= 1000) {
      return `${(shown / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kW`;
    }
    return `${shown.toLocaleString(undefined, { maximumFractionDigits: 0 })} W`;
  }

  private _formatPower(entityId?: string, absolute = true): string {
    return this._formatW(this._powerW(entityId), absolute);
  }

  private _formatMeasurement(entityId?: string, fallbackUnit = ""): string {
    const numeric = this._number(entityId);
    if (numeric !== undefined) {
      const unit = this._unit(entityId) || fallbackUnit;
      return `${numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
    }

    const raw = this._raw(entityId);
    return raw ?? "—";
  }

  private _formatSoc(entityId?: string): string {
    const value = this._number(entityId);
    return value === undefined
      ? "SOC —"
      : `SOC ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} %`;
  }

  private _pvSub(input: PvInputConfig): string {
    const parts: string[] = [];
    if (input.voltage) {
      const voltage = this._formatMeasurement(input.voltage, "V");
      if (voltage !== "—") parts.push(voltage);
    }
    if (input.current) {
      const current = this._formatMeasurement(input.current, "A");
      if (current !== "—") parts.push(current);
    }
    return parts.join(" · ");
  }

  private _threshold(): number {
    return Math.max(0, this._config.power_threshold ?? 5);
  }

  private _activityFromPower(power?: number): NodeActivity {
    if (power === undefined) return "unknown";
    return Math.abs(power) > this._threshold() ? "active" : "idle";
  }

  private _clampPercent(value?: number): number | undefined {
    if (value === undefined || !Number.isFinite(value)) return undefined;
    return Math.min(100, Math.max(0, value));
  }

  private _positiveFlow(power?: number): FlowDirection {
    if (power === undefined || Math.abs(power) <= this._threshold()) return "off";
    return power > 0 ? "forward" : "reverse";
  }

  private _gridFlow(): FlowDirection {
    const p = this._powerW(this._config.grid?.power);
    if (p === undefined || Math.abs(p) <= this._threshold()) return "off";
    const positiveImport = this._config.grid?.positive_is_import ?? true;
    const isImport = positiveImport ? p > 0 : p < 0;
    return isImport ? "forward" : "reverse";
  }

  private _batteryFlow(config: BatteryConfig): FlowDirection {
    const p = this._powerW(config.power);
    if (p === undefined || Math.abs(p) <= this._threshold()) return "off";
    const positiveCharging = config.positive_is_charging ?? true;
    const charging = positiveCharging ? p > 0 : p < 0;
    return charging ? "forward" : "reverse";
  }

  private _pvSystemPowerW(system: PvSystemConfig): number | undefined {
    const direct = this._powerW(system.power);
    if (direct !== undefined) return direct;

    const values = (system.children ?? [])
      .map((child) => this._powerW(child.power))
      .filter((value): value is number => value !== undefined);

    return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
  }

  private _totalPvW(): number | undefined {
    const values = (this._config.solar ?? [])
      .map((system) => this._pvSystemPowerW(system))
      .filter((value): value is number => value !== undefined);
    return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
  }

  private _gridNetToHouseW(): number | undefined {
    const entity = this._config.grid?.power;
    if (!entity) return 0;

    const power = this._powerW(entity);
    if (power === undefined) return undefined;

    const positiveImport = this._config.grid?.positive_is_import ?? true;
    return positiveImport ? power : -power;
  }

  private _batteryNetToHouseW(config: BatteryConfig): number | undefined {
    if (!config.power) return undefined;

    const power = this._powerW(config.power);
    if (power === undefined) return undefined;

    // Positive result means energy delivered to the house.
    const positiveCharging = config.positive_is_charging ?? true;
    return positiveCharging ? -power : power;
  }

  private _housePowerInfo(): {
    value?: number;
    calculated: boolean;
    complete: boolean;
  } {
    const configuredEntity = this._config.house?.power;
    if (configuredEntity) {
      const value = this._powerW(configuredEntity);
      return {
        value,
        calculated: false,
        complete: value !== undefined
      };
    }

    let pv = 0;
    for (const system of this._config.solar ?? []) {
      const value = this._pvSystemPowerW(system);
      if (value === undefined) {
        return { calculated: true, complete: false };
      }
      pv += Math.max(0, value);
    }

    const grid = this._gridNetToHouseW();
    if (grid === undefined) {
      return { calculated: true, complete: false };
    }

    let batteries = 0;
    for (const battery of this._config.batteries ?? []) {
      const value = this._batteryNetToHouseW(battery);
      if (value === undefined) {
        return { calculated: true, complete: false };
      }
      batteries += value;
    }

    // Consumers marked as direct are not part of the house node and therefore
    // have to be removed from the balance before calculating house demand.
    let directConsumers = 0;
    const direct = [
      ...((this._config.consumers ?? []).filter((consumer) => !(consumer.part_of_house ?? true))),
      ...(this._config.heat_pump && !(this._config.heat_pump.part_of_house ?? true)
        ? [this._config.heat_pump]
        : [])
    ];

    for (const consumer of direct) {
      if (!consumer.power) {
        return { calculated: true, complete: false };
      }
      const value = this._powerW(consumer.power);
      if (value === undefined) {
        return { calculated: true, complete: false };
      }
      directConsumers += Math.abs(value);
    }

    // Energy balance:
    // house = PV + grid import - grid export + battery discharge
    //         - battery charging - separate direct consumers.
    const value = Math.max(0, pv + grid + batteries - directConsumers);
    return { value, calculated: true, complete: true };
  }


  private _batteryStatus(config: BatteryConfig): string {
    const p = this._powerW(config.power);
    if (p === undefined) return "Status —";
    if (Math.abs(p) <= this._threshold()) return "Ruhe";

    const positiveCharging = config.positive_is_charging ?? true;
    const charging = positiveCharging ? p > 0 : p < 0;
    return charging ? "Lädt" : "Entlädt";
  }

  private _directConsumersPowerW(): { value?: number; complete: boolean } {
    let total = 0;
    const direct: ConsumerConfig[] = [
      ...((this._config.consumers ?? []).filter((consumer) => !(consumer.part_of_house ?? true))),
      ...(this._config.heat_pump && !(this._config.heat_pump.part_of_house ?? true)
        ? [this._config.heat_pump]
        : [])
    ];

    for (const consumer of direct) {
      if (!consumer.power) return { complete: false };
      const value = this._powerW(consumer.power);
      if (value === undefined) return { complete: false };
      total += Math.abs(value);
    }

    return { value: total, complete: true };
  }

  private _systemBalanceInfo(): {
    source?: number;
    sink?: number;
    residual?: number;
    complete: boolean;
    calculatedHouse: boolean;
    warning: boolean;
  } {
    const pv = this._totalPvW();
    const grid = this._gridNetToHouseW();
    const house = this._housePowerInfo();
    const direct = this._directConsumersPowerW();

    if (pv === undefined || grid === undefined || !house.complete || !direct.complete) {
      return {
        complete: false,
        calculatedHouse: house.calculated,
        warning: false
      };
    }

    let batterySource = 0;
    let batterySink = 0;
    for (const battery of this._config.batteries ?? []) {
      const value = this._batteryNetToHouseW(battery);
      if (value === undefined) {
        return {
          complete: false,
          calculatedHouse: house.calculated,
          warning: false
        };
      }
      batterySource += Math.max(0, value);
      batterySink += Math.max(0, -value);
    }

    const source =
      Math.max(0, pv) +
      Math.max(0, grid) +
      batterySource;

    const sink =
      Math.max(0, house.value ?? 0) +
      Math.max(0, direct.value ?? 0) +
      Math.max(0, -grid) +
      batterySink;

    const residual = source - sink;
    const limit = Math.max(0, this._config.balance_warning_threshold ?? 50);

    return {
      source,
      sink,
      residual,
      complete: true,
      calculatedHouse: house.calculated,
      warning: !house.calculated && Math.abs(residual) > limit
    };
  }

  private _formatSignedW(value?: number): string {
    if (value === undefined) return "—";
    const sign = value > 0 ? "+" : value < 0 ? "−" : "±";
    return `${sign}${this._formatW(Math.abs(value), true)}`;
  }

  private _formatEnergy(entityId?: string): string {
    const value = this._number(entityId);
    if (value === undefined) return "—";

    const unit = this._unit(entityId).trim();
    const normalized = unit.toLowerCase();
    if (normalized === "wh" && Math.abs(value) >= 1000) {
      return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`;
    }

    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
  }

  private _energyWh(entityId?: string): number | undefined {
    const value = this._number(entityId);
    if (value === undefined) return undefined;

    const unit = this._unit(entityId).trim().toLowerCase();
    if (unit === "kwh") return value * 1000;
    if (unit === "mwh") return value * 1_000_000;
    if (unit === "wh" || !unit) return value;
    return undefined;
  }

  private _formatEnergyWh(value?: number): string {
    if (value === undefined) return "—";
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
      return `${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} MWh`;
    }
    if (abs >= 1000) {
      return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh`;
    }
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} Wh`;
  }

  private _pvDailyTotalWh(): number | undefined {
    const direct = this._energyWh(this._config.daily?.pv_energy);
    if (direct !== undefined) return direct;

    const systems = this._config.solar ?? [];
    if (!systems.length || systems.some((system) => !system.daily_energy)) return undefined;

    const values = systems.map((system) => this._energyWh(system.daily_energy));
    if (values.some((value) => value === undefined)) return undefined;
    return (values as number[]).reduce((sum, value) => sum + value, 0);
  }

  private _autarkyPercent(): number | undefined {
    const house = this._energyWh(this._config.daily?.house_energy);
    const gridImport = this._energyWh(this._config.daily?.grid_import_energy);
    if (house === undefined || gridImport === undefined || house <= 0) return undefined;
    return this._clampPercent((1 - gridImport / house) * 100);
  }

  private _selfConsumptionPercent(): number | undefined {
    const pv = this._pvDailyTotalWh();
    const exportWh = this._energyWh(this._config.daily?.grid_export_energy);
    if (pv === undefined || exportWh === undefined || pv <= 0) return undefined;
    return this._clampPercent((1 - exportWh / pv) * 100);
  }

  private _formatPercent(value?: number): string {
    return value === undefined
      ? "—"
      : `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} %`;
  }

  private _heatPumpCopInfo(hp: HeatPumpConfig): { value?: number; calculated: boolean } {
    const direct = this._number(hp.cop);
    if (direct !== undefined) return { value: direct, calculated: false };

    const thermal = this._powerW(hp.thermal_power);
    const electric = Math.abs(this._powerW(hp.power) ?? 0);
    if (thermal === undefined || electric <= this._threshold()) return { calculated: true };
    return { value: Math.abs(thermal) / electric, calculated: true };
  }

  private _specificYield(system: PvSystemConfig): number | undefined {
    const energyWh = this._energyWh(system.daily_energy);
    if (energyWh === undefined || !system.installed_kwp || system.installed_kwp <= 0) return undefined;
    return energyWh / 1000 / system.installed_kwp;
  }

  private _entityUnavailable(entity?: string): boolean {
    if (!entity) return false;
    const state = this._state(entity);
    return !state || state.state === "unknown" || state.state === "unavailable";
  }

  private _mpptDiagnostic(system: PvSystemConfig, input: PvInputConfig, inputIndex: number): string | undefined {
    const diag = this._config.diagnostics;
    if (diag?.enabled === false) return undefined;

    if (input.power && this._entityUnavailable(input.power)) return "Leistungssensor nicht verfügbar";
    if (input.voltage && this._entityUnavailable(input.voltage)) return "Spannungssensor nicht verfügbar";

    const p = Math.abs(this._powerW(input.power) ?? 0);
    const voltage = this._number(input.voltage);
    const voltageLimit = Math.max(0, diag?.pv_voltage_without_power_threshold ?? 80);
    if (voltage !== undefined && voltage >= voltageLimit && p <= this._threshold()) {
      return `Spannung ${this._formatMeasurement(input.voltage, "V")}, aber keine relevante Leistung`;
    }

    if (!(diag?.mppt_relative_warning_enabled ?? false)) return undefined;
    const children = system.children ?? [];
    if (children.length < 2) return undefined;

    const allHaveKwp = children.every((child) => (child.installed_kwp ?? 0) > 0);
    const values = children.map((child) => {
      const power = Math.abs(this._powerW(child.power) ?? 0);
      return allHaveKwp ? power / Math.max(0.001, child.installed_kwp ?? 1) : power;
    });
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2
      ? sorted[Math.floor(sorted.length / 2)]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const own = values[inputIndex] ?? 0;
    const ratio = Math.max(0, diag?.mppt_relative_warning_ratio ?? 0.35);
    if (median > this._threshold() && own < median * ratio) {
      return allHaveKwp
        ? "Ertrag pro kWp deutlich unter den anderen MPPTs"
        : "Leistung deutlich unter den anderen MPPTs";
    }
    return undefined;
  }

  private _batteryWarnings(battery: BatteryConfig): string[] {
    const diag = this._config.diagnostics;
    if (diag?.enabled === false) return [];
    const warnings: string[] = [];

    if (battery.power && this._entityUnavailable(battery.power)) warnings.push("Leistungssensor nicht verfügbar");
    if (battery.soc && this._entityUnavailable(battery.soc)) warnings.push("SOC-Sensor nicht verfügbar");

    const minCell = this._number(battery.cell_min_voltage);
    const maxCell = this._number(battery.cell_max_voltage);
    if (minCell !== undefined && maxCell !== undefined) {
      const delta = Math.abs(maxCell - minCell);
      const limit = Math.max(0, diag?.battery_cell_delta_warning ?? 0.05);
      if (delta > limit) warnings.push(`Zellspannungs-Delta ${delta.toLocaleString(undefined, { maximumFractionDigits: 4 })} V`);
    }

    const temp = this._number(battery.temperature);
    if (temp !== undefined) {
      const low = diag?.battery_temperature_low ?? 5;
      const high = diag?.battery_temperature_high ?? 45;
      if (temp < low) warnings.push(`Batterietemperatur niedrig (${temp.toLocaleString(undefined, { maximumFractionDigits: 1 })} °C)`);
      if (temp > high) warnings.push(`Batterietemperatur hoch (${temp.toLocaleString(undefined, { maximumFractionDigits: 1 })} °C)`);
    }
    return warnings;
  }

  private _pvSystemWarnings(system: PvSystemConfig): string[] {
    const warnings: string[] = [];
    if (system.power && this._entityUnavailable(system.power)) warnings.push("Gesamtleistungssensor nicht verfügbar");
    (system.children ?? []).forEach((input, index) => {
      const warning = this._mpptDiagnostic(system, input, index);
      if (warning) warnings.push(`${input.name ?? `MPPT ${index + 1}`}: ${warning}`);
    });
    return warnings;
  }

  private _diagnosticMessages(): DiagnosticMessage[] {
    if (this._config.diagnostics?.enabled === false) return [];
    const messages: DiagnosticMessage[] = [];

    const balance = this._systemBalanceInfo();
    if (balance.warning) {
      messages.push({
        severity: "warning",
        title: "Leistungsbilanz",
        detail: `Abweichung ${this._formatSignedW(balance.residual)}`,
        nodeId: "center"
      });
    }

    (this._config.solar ?? []).forEach((system, systemIndex) => {
      this._pvSystemWarnings(system).forEach((detail) => messages.push({
        severity: "warning",
        title: system.name ?? `PV ${systemIndex + 1}`,
        detail,
        nodeId: `pv-system-${systemIndex}`
      }));
    });

    (this._config.batteries ?? []).forEach((battery, index) => {
      this._batteryWarnings(battery).forEach((detail) => messages.push({
        severity: "warning",
        title: battery.name ?? `Batterie ${index + 1}`,
        detail,
        nodeId: `battery-${index}`
      }));
    });

    if (this._config.grid?.power && this._entityUnavailable(this._config.grid.power)) {
      messages.push({ severity: "warning", title: "Netz", detail: "Leistungssensor nicht verfügbar", nodeId: "grid" });
    }
    if (this._config.house?.power && this._entityUnavailable(this._config.house.power)) {
      messages.push({ severity: "warning", title: this._config.house.name ?? "Haus", detail: "Leistungssensor nicht verfügbar", nodeId: "house" });
    }
    return messages;
  }

  private _dailyItems(): Array<{
    key: "pv" | "grid-import" | "grid-export" | "house" | "autarky" | "self-consumption";
    label: string;
    value: string;
    entity?: string;
    expandable?: boolean;
  }> {
    const daily = this._config.daily;
    const items: Array<{
      key: "pv" | "grid-import" | "grid-export" | "house" | "autarky" | "self-consumption";
      label: string;
      value: string;
      entity?: string;
      expandable?: boolean;
    }> = [];

    const pvTotal = this._pvDailyTotalWh();
    if (daily?.pv_energy || pvTotal !== undefined) {
      items.push({
        key: "pv",
        label: "PV heute",
        value: daily?.pv_energy ? this._formatEnergy(daily.pv_energy) : this._formatEnergyWh(pvTotal),
        entity: daily?.pv_energy,
        expandable: true
      });
    }

    const candidates: Array<[
      "grid-import" | "grid-export" | "house",
      string,
      string | undefined
    ]> = [
      ["grid-import", "Netzbezug", daily?.grid_import_energy],
      ["grid-export", "Einspeisung", daily?.grid_export_energy],
      ["house", "Haus heute", daily?.house_energy]
    ];

    for (const [key, label, entity] of candidates) {
      if (!entity) continue;
      items.push({ key, label, value: this._formatEnergy(entity), entity });
    }

    const autarky = this._autarkyPercent();
    if (autarky !== undefined) items.push({ key: "autarky", label: "Autarkie", value: this._formatPercent(autarky) });
    const selfConsumption = this._selfConsumptionPercent();
    if (selfConsumption !== undefined) items.push({ key: "self-consumption", label: "Eigenverbrauch", value: this._formatPercent(selfConsumption) });

    return items;
  }

  private _flowFocusClass(relatedNodes: string[]): string {
    if (!this._hoveredNode) return "";
    return relatedNodes.includes(this._hoveredNode) ? "focus" : "dimmed";
  }

  private _durationFromPower(power?: number): number {
    const p = Math.abs(power ?? 0);
    if (p <= this._threshold()) return 2.3;
    const normalized = Math.min(1, Math.log10(Math.max(100, p)) / 4);
    return 2.25 - normalized * 1.45;
  }

  private _short(value: string, max = 25): string {
    if (value.length <= max) return value;
    return `${value.slice(0, max - 1)}…`;
  }

  private _layout(): LayoutResult {
    const solar = this._config.solar ?? [];
    const batteries = this._config.batteries ?? [];
    const consumers = this._config.consumers ?? [];
    const hasHeatPump = Boolean(this._config.heat_pump);

    // v0.2.1 uses a fixed logical width and grows vertically instead of
    // horizontally. The SVG is then scaled to the available card width, so
    // every node stays visible without an internal horizontal scrollbar.
    const width = 1000;
    const sideMargin = 28;
    const pvGapX = 20;
    const pvGapY = 20;
    const pvColumns = solar.length <= 1 ? 1 : 2;
    const clusterWidth = pvColumns === 1
      ? 620
      : (width - sideMargin * 2 - pvGapX) / 2;

    const childGapX = 12;
    const childGapY = 10;
    const childH = 78;
    const parentMaxW = 430;
    const parentH = 86;
    const clusterPadX = 18;
    const clusterPadY = 18;

    const pvClusters: PvClusterLayout[] = [];
    let pvY = 18;

    for (let rowStart = 0; rowStart < solar.length; rowStart += pvColumns) {
      const rowSystems = solar.slice(rowStart, rowStart + pvColumns);
      const maxChildren = Math.max(
        1,
        ...rowSystems.map((system) => Math.max(1, system.children?.length ?? 0))
      );
      const maxChildRows = Math.ceil(maxChildren / 2);
      const childrenAreaH = maxChildRows * childH + Math.max(0, maxChildRows - 1) * childGapY;
      const rowHeight = clusterPadY + childrenAreaH + 16 + parentH + clusterPadY;

      rowSystems.forEach((system, localIndex) => {
        const systemIndex = rowStart + localIndex;
        const rowCount = rowSystems.length;
        const clusterX = rowCount === 1
          ? (width - clusterWidth) / 2
          : sideMargin + localIndex * (clusterWidth + pvGapX);

        const children = system.children ?? [];
        const childColumns = Math.min(2, Math.max(1, children.length));
        const childW = childColumns === 1
          ? Math.min(220, clusterWidth - clusterPadX * 2)
          : (clusterWidth - clusterPadX * 2 - childGapX) / 2;

        const parentW = Math.min(parentMaxW, clusterWidth - clusterPadX * 2);
        const parentX = clusterX + clusterWidth / 2 - parentW / 2;
        const parentY = pvY + clusterPadY + childrenAreaH + 16;
        const parentPower = this._pvSystemPowerW(system);
        const systemWarnings = this._pvSystemWarnings(system);
        const totalPv = this._totalPvW();
        const pvShare = parentPower !== undefined && totalPv !== undefined && totalPv > this._threshold()
          ? this._clampPercent(Math.max(0, parentPower) / totalPv * 100)
          : undefined;

        const parent: DiagramNode = {
          id: `pv-system-${systemIndex}`,
          title: system.name ?? `PV ${systemIndex + 1}`,
          main: this._formatW(parentPower, true),
          sub: children.length ? `${children.length} MPPT${children.length === 1 ? "" : "s"}` : "PV-System",
          entity: system.power,
          kind: "pv-parent",
          x: parentX,
          y: parentY,
          w: parentW,
          h: parentH,
          activity: this._activityFromPower(parentPower),
          badge: systemWarnings.length ? "⚠ Prüfen" : "Gesamt",
          warning: systemWarnings.length > 0,
          pvSystemIndex: systemIndex,
          pvShare
        };

        const childNodes: DiagramNode[] = children.map((child, childIndex) => {
          const row = Math.floor(childIndex / childColumns);
          const col = childIndex % childColumns;
          const itemsInThisRow = Math.min(childColumns, children.length - row * childColumns);
          const usedWidth = itemsInThisRow * childW + Math.max(0, itemsInThisRow - 1) * childGapX;
          const rowStartX = clusterX + (clusterWidth - usedWidth) / 2;

          return {
            id: `pv-${systemIndex}-${childIndex}`,
            title: child.name ?? `MPPT ${childIndex + 1}`,
            main: this._formatPower(child.power, true),
            sub: this._pvSub(child),
            entity: child.power,
            kind: "pv",
            x: rowStartX + col * (childW + childGapX),
            y: pvY + clusterPadY + row * (childH + childGapY),
            w: childW,
            h: childH,
            activity: this._activityFromPower(this._powerW(child.power)),
            warning: Boolean(this._mpptDiagnostic(system, child, childIndex))
          };
        });

        pvClusters.push({
          system,
          systemIndex,
          x: clusterX,
          y: pvY,
          width: clusterWidth,
          height: rowHeight,
          parent,
          children: childNodes
        });
      });

      pvY += rowHeight + pvGapY;
    }

    if (!solar.length) pvY = 24;

    const centerY = pvY + 34;
    const balance = this._systemBalanceInfo();
    const center: DiagramNode = {
      id: "center",
      title: "Versorgung",
      main: balance.complete ? this._formatW(balance.source, true) : "—",
      sub: balance.complete
        ? (balance.calculatedHouse
          ? "Haus aus Leistungsbilanz"
          : `${balance.warning ? "⚠ " : ""}Bilanz ${this._formatSignedW(balance.residual)}`)
        : "Bilanz unvollständig",
      kind: "center",
      x: width / 2 - 100,
      y: centerY,
      w: 200,
      h: 92,
      activity: balance.complete ? this._activityFromPower(balance.source) : "unknown",
      warning: balance.warning
    };

    const grid: DiagramNode = {
      id: "grid",
      title: "Netz",
      main: this._formatPower(this._config.grid?.power, true),
      sub: this._gridFlow() === "forward"
        ? "Energie aus Netz"
        : this._gridFlow() === "reverse"
          ? "Energie ins Netz"
          : "Kein Netzfluss",
      entity: this._config.grid?.power,
      kind: "grid",
      x: 50,
      y: centerY + 2,
      w: 190,
      h: 88,
      activity: this._activityFromPower(this._powerW(this._config.grid?.power)),
      badge: this._gridFlow() === "forward"
        ? "Bezug"
        : this._gridFlow() === "reverse"
          ? "Einspeisung"
          : "Ruhe"
    };

    const houseInfo = this._housePowerInfo();
    const house: DiagramNode = {
      id: "house",
      title: this._config.house?.name ?? "Haus",
      main: houseInfo.complete ? this._formatW(houseInfo.value, true) : "—",
      sub: houseInfo.calculated
        ? (houseInfo.complete ? "Aus PV, Netz & Akkus" : "Berechnung unvollständig")
        : (houseInfo.complete ? "Gesamtverbrauch" : "Sensor nicht verfügbar"),
      entity: this._config.house?.power,
      kind: "house",
      x: width - 240,
      y: centerY + 2,
      w: 190,
      h: 88,
      activity: houseInfo.complete ? this._activityFromPower(houseInfo.value) : "unknown",
      badge: houseInfo.calculated
        ? (houseInfo.complete ? "Berechnet" : "Prüfen")
        : undefined
    };

    const bottom: BottomNode[] = [];
    const bottomSpecs: Array<{
      width: number;
      make: (x: number, y: number, width: number) => BottomNode;
    }> = [];

    batteries.forEach((battery, index) => {
      bottomSpecs.push({
        width: 205,
        make: (x, y, nodeW) => ({
          source: "center",
          power: battery.power,
          direction: this._batteryFlow(battery),
          node: {
            id: `battery-${index}`,
            title: battery.name ?? `Batterie ${index + 1}`,
            main: this._formatPower(battery.power, true),
            sub: `${this._batteryStatus(battery)} · ${this._formatSoc(battery.soc)}`,
            entity: battery.power ?? battery.soc,
            kind: "battery",
            x,
            y,
            w: nodeW,
            h: 90,
            activity: this._activityFromPower(this._powerW(battery.power)),
            batterySoc: this._clampPercent(this._number(battery.soc)),
            batteryIndex: index,
            warning: this._batteryWarnings(battery).length > 0,
            badge: this._batteryWarnings(battery).length ? "⚠ Prüfen" : undefined
          }
        })
      });
    });

    if (this._config.heat_pump) {
      const hp = this._config.heat_pump;
      bottomSpecs.push({
        width: 225,
        make: (x, y, nodeW) => ({
          source: hp.part_of_house ?? true ? "house" : "center",
          power: hp.power,
          direction: this._positiveFlow(this._powerW(hp.power)),
          node: {
            id: "heat-pump",
            title: hp.name ?? "Wärmepumpe",
            main: this._formatPower(hp.power, true),
            sub: this._heatPumpSummary(hp),
            entity: hp.power,
            kind: "heat",
            x,
            y,
            w: nodeW,
            h: 94,
            heatPump: true,
            activity: this._activityFromPower(this._powerW(hp.power)),
            badge: this._heatPumpBadge(hp)
          }
        })
      });
    }

    consumers.forEach((consumer, index) => {
      bottomSpecs.push({
        width: 205,
        make: (x, y, nodeW) => ({
          source: consumer.part_of_house ?? true ? "house" : "center",
          power: consumer.power,
          direction: this._positiveFlow(this._powerW(consumer.power)),
          node: {
            id: `consumer-${index}`,
            title: consumer.name ?? `Verbraucher ${index + 1}`,
            main: this._formatPower(consumer.power, true),
            sub: consumer.part_of_house ?? true ? "Teil des Hausverbrauchs" : "Direkter Verbraucher",
            entity: consumer.power,
            kind: "consumer",
            x,
            y,
            w: nodeW,
            h: 90,
            activity: this._activityFromPower(this._powerW(consumer.power))
          }
        })
      });
    });

    const bottomStartY = centerY + center.h + 68;
    const bottomColumns = Math.min(3, Math.max(1, bottomSpecs.length));
    const bottomGapX = 18;
    const bottomGapY = 18;
    const cellW = (width - sideMargin * 2 - Math.max(0, bottomColumns - 1) * bottomGapX) / bottomColumns;
    const bottomRowH = 94;

    bottomSpecs.forEach((spec, index) => {
      const row = Math.floor(index / bottomColumns);
      const col = index % bottomColumns;
      const itemsInRow = Math.min(bottomColumns, bottomSpecs.length - row * bottomColumns);
      const rowWidth = itemsInRow * cellW + Math.max(0, itemsInRow - 1) * bottomGapX;
      const rowStartX = (width - rowWidth) / 2;
      const nodeW = Math.min(spec.width, cellW);
      const cellX = rowStartX + col * (cellW + bottomGapX);
      const x = cellX + (cellW - nodeW) / 2;
      const y = bottomStartY + row * (bottomRowH + bottomGapY);
      bottom.push(spec.make(x, y, nodeW));
    });

    const bottomRows = bottomSpecs.length
      ? Math.ceil(bottomSpecs.length / bottomColumns)
      : 0;
    const height = bottomRows
      ? bottomStartY + bottomRows * bottomRowH + Math.max(0, bottomRows - 1) * bottomGapY + 30
      : centerY + center.h + 38;

    return { width, height, center, grid, house, pvClusters, bottom };
  }

  private _heatPumpBadge(hp: HeatPumpConfig): string {
    const raw = this._raw(hp.mode)?.trim();
    if (raw) {
      const normalized = raw.toLowerCase().replace(/[\s-]+/g, "_");
      const labels: Record<string, string> = {
        heat: "Heizen",
        heating: "Heizen",
        heating_only: "Heizen",
        dhw: "Warmwasser",
        hot_water: "Warmwasser",
        domestic_hot_water: "Warmwasser",
        cool: "Kühlen",
        cooling: "Kühlen",
        auto: "Auto",
        standby: "Standby",
        idle: "Standby",
        off: "Aus"
      };
      return this._short(labels[normalized] ?? raw, 15);
    }

    const power = this._powerW(hp.power);
    if (power === undefined) return "Status —";
    return Math.abs(power) > this._threshold() ? "Aktiv" : "Standby";
  }

  private _heatPumpSummary(hp: HeatPumpConfig): string {
    const parts: string[] = [];
    const flow = this._number(hp.flow_temperature);
    if (flow !== undefined) {
      const unit = this._unit(hp.flow_temperature) || "°C";
      parts.push(`VL ${flow.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`);
    }
    const copInfo = this._heatPumpCopInfo(hp);
    if (copInfo.value !== undefined) {
      parts.push(`COP ${copInfo.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${copInfo.calculated ? "*" : ""}`);
    }
    return parts.length ? parts.join(" · ") : "Details anzeigen";
  }

  private _flowPath(
    d: string,
    direction: FlowDirection,
    power?: number,
    key = "",
    relatedNodes: string[] = []
  ) {
    const duration = this._durationFromPower(power);
    const focusClass = this._flowFocusClass(relatedNodes);
    return svg`
      <path d=${d} class=${`flow-base ${focusClass}`}></path>
      <path
        d=${d}
        class=${`flow ${direction} ${focusClass}`}
        style=${`--flow-duration:${duration}s`}
        pathLength="100"
        data-key=${key}
      ></path>
    `;
  }

  private _node(node: DiagramNode) {
    const icon: Record<NodeKind, string> = {
      pv: "↯",
      "pv-parent": "☀",
      center: "⚡",
      grid: "⇄",
      house: "⌂",
      battery: "▰",
      heat: "♨",
      consumer: "●"
    };

    const titleY = node.y + 26;
    const mainY = node.y + 54;
    const subY = node.y + 73;
    const clickable = Boolean(node.entity || node.heatPump || node.batteryIndex !== undefined || node.pvSystemIndex !== undefined);
    const activity = node.activity ?? "unknown";
    const socTrackX = node.x + 14;
    const socTrackY = node.y + node.h - 9;
    const socTrackW = Math.max(0, node.w - 28);
    const socFillW = node.batterySoc === undefined
      ? 0
      : socTrackW * node.batterySoc / 100;

    return svg`
      <g
        class=${`node ${node.kind} ${activity} ${node.warning ? "warning" : ""} ${clickable ? "clickable" : ""}`}
        @click=${() => this._handleNodeClick(node)}
        @mouseenter=${() => { this._hoveredNode = node.id; }}
        @mouseleave=${() => { this._hoveredNode = undefined; }}
      >
        <rect
          x=${node.x}
          y=${node.y}
          width=${node.w}
          height=${node.h}
          rx="15"
          ry="15"
          class=${`node-bg ${node.kind}`}
        ></rect>
        <text x=${node.x + 14} y=${titleY} class="node-title">
          <tspan class="node-icon">${icon[node.kind]}</tspan>
          <tspan dx="8">${this._short(node.title, node.badge ? 20 : 28)}</tspan>
        </text>
        ${node.badge
          ? svg`
            <g class=${`status-badge ${node.badge.startsWith("⚠") ? "warning" : ""}`}>
              <rect
                x=${node.x + node.w - Math.min(92, Math.max(52, node.badge.length * 7 + 20)) - 14}
                y=${node.y + 10}
                width=${Math.min(92, Math.max(52, node.badge.length * 7 + 20))}
                height="23"
                rx="11.5"
              ></rect>
              <text
                x=${node.x + node.w - 14 - Math.min(92, Math.max(52, node.badge.length * 7 + 20)) / 2}
                y=${node.y + 26}
                text-anchor="middle"
              >${this._short(node.badge, 15)}</text>
            </g>
          `
          : nothing}
        <text x=${node.x + 14} y=${mainY} class="node-main">${node.main}</text>
        ${node.sub
          ? svg`<text x=${node.x + 14} y=${subY} class="node-sub">${this._short(node.sub, 34)}</text>`
          : nothing}
        ${node.kind === "battery" && node.batterySoc !== undefined
          ? svg`
            <rect
              x=${socTrackX}
              y=${socTrackY}
              width=${socTrackW}
              height="4.5"
              rx="2.25"
              class="battery-soc-track"
            ></rect>
            <rect
              x=${socTrackX}
              y=${socTrackY}
              width=${socFillW}
              height="4.5"
              rx="2.25"
              class="battery-soc-fill"
            ></rect>
            <line
              x1=${socTrackX + socTrackW * 0.2}
              y1=${socTrackY - 1.5}
              x2=${socTrackX + socTrackW * 0.2}
              y2=${socTrackY + 6}
              class="battery-soc-mark"
            ></line>
            <line
              x1=${socTrackX + socTrackW * 0.8}
              y1=${socTrackY - 1.5}
              x2=${socTrackX + socTrackW * 0.8}
              y2=${socTrackY + 6}
              class="battery-soc-mark"
            ></line>
          `
          : nothing}
        ${node.kind === "pv-parent" && node.pvShare !== undefined
          ? svg`
            <rect x=${socTrackX} y=${socTrackY} width=${socTrackW} height="4.5" rx="2.25" class="pv-node-share-track"></rect>
            <rect x=${socTrackX} y=${socTrackY} width=${socTrackW * node.pvShare / 100} height="4.5" rx="2.25" class="pv-node-share-fill"></rect>
          `
          : nothing}
        ${node.heatPump
          ? svg`<text x=${node.x + node.w - 14} y=${node.y + node.h - 12} text-anchor="end" class="node-action">${this._heatExpanded ? "▲" : "▼"}</text>`
          : node.batteryIndex !== undefined
            ? svg`<text x=${node.x + node.w - 14} y=${node.y + 27} text-anchor="end" class="node-action">${this._expandedBattery === node.batteryIndex ? "▲" : "▼"}</text>`
            : node.pvSystemIndex !== undefined
              ? svg`<text x=${node.x + node.w - 14} y=${node.y + node.h - 12} text-anchor="end" class="node-action">${this._expandedPvSystem === node.pvSystemIndex ? "▲" : "▼"}</text>`
              : nothing}
      </g>
    `;
  }

  private _handleNodeClick(node: DiagramNode): void {
    if (node.heatPump) {
      const next = !this._heatExpanded;
      this._heatExpanded = next;
      if (next) {
        this._expandedBattery = undefined;
        this._pvDailyExpanded = false;
        this._expandedPvSystem = undefined;
        this._diagnosticsExpanded = false;
      }
      return;
    }

    if (node.batteryIndex !== undefined) {
      const next = this._expandedBattery === node.batteryIndex ? undefined : node.batteryIndex;
      this._expandedBattery = next;
      if (next !== undefined) {
        this._heatExpanded = false;
        this._pvDailyExpanded = false;
        this._expandedPvSystem = undefined;
        this._diagnosticsExpanded = false;
      }
      return;
    }

    if (node.pvSystemIndex !== undefined) {
      const next = this._expandedPvSystem === node.pvSystemIndex ? undefined : node.pvSystemIndex;
      this._expandedPvSystem = next;
      if (next !== undefined) {
        this._heatExpanded = false;
        this._expandedBattery = undefined;
        this._pvDailyExpanded = false;
        this._diagnosticsExpanded = false;
      }
      return;
    }

    if (node.entity) this._openMoreInfo(node.entity);
  }

  private _openMoreInfo(entityId: string): void {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true
    }));
  }

  private _connectionPath(from: DiagramNode, to: DiagramNode): string {
    const x1 = from.x + from.w / 2;
    const y1 = from.y + from.h;
    const x2 = to.x + to.w / 2;
    const y2 = to.y;
    const bend = Math.max(38, Math.abs(y2 - y1) * 0.42);
    return `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`;
  }

  private _horizontalPath(from: DiagramNode, to: DiagramNode): string {
    const fromOnLeft = from.x < to.x;
    const x1 = fromOnLeft ? from.x + from.w : from.x;
    const y1 = from.y + from.h / 2;
    const x2 = fromOnLeft ? to.x : to.x + to.w;
    const y2 = to.y + to.h / 2;
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  }

  private _detailItem(label: string, entity?: string, fallbackUnit = "") {
    if (!entity) return nothing;
    return html`
      <div class="detail-item" @click=${() => this._openMoreInfo(entity)}>
        <span>${label}</span>
        <strong>${this._formatMeasurement(entity, fallbackUnit)}</strong>
      </div>
    `;
  }

  private _detailValueItem(label: string, value: string, note?: string) {
    return html`
      <div class="detail-item static">
        <span>${label}</span>
        <strong>${value}</strong>
        ${note ? html`<small>${note}</small>` : nothing}
      </div>
    `;
  }

  private _batteryDetails(battery: BatteryConfig, index: number) {
    const minCell = this._number(battery.cell_min_voltage);
    const maxCell = this._number(battery.cell_max_voltage);
    const delta = minCell !== undefined && maxCell !== undefined
      ? Math.max(0, maxCell - minCell)
      : undefined;
    const deltaUnit = this._unit(battery.cell_max_voltage) || this._unit(battery.cell_min_voltage) || "V";
    const deltaText = delta === undefined
      ? undefined
      : `${delta.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${deltaUnit}`;
    const chargeWh = this._energyWh(battery.daily_charge_energy);
    const dischargeWh = this._energyWh(battery.daily_discharge_energy);
    const energyRatio = chargeWh !== undefined && dischargeWh !== undefined && chargeWh > 0
      ? dischargeWh / chargeWh * 100
      : undefined;
    const equivalentCycles = battery.capacity_kwh && battery.capacity_kwh > 0 && chargeWh !== undefined && dischargeWh !== undefined
      ? (chargeWh + dischargeWh) / (2 * battery.capacity_kwh * 1000)
      : undefined;
    const warnings = this._batteryWarnings(battery);

    const detailEntities = [
      battery.power,
      battery.soc,
      battery.voltage,
      battery.current,
      battery.temperature,
      battery.cell_min_voltage,
      battery.cell_max_voltage,
      battery.cell_min_temperature,
      battery.cell_max_temperature,
      battery.state_of_health,
      battery.cycle_count,
      battery.remaining_energy,
      battery.daily_charge_energy,
      battery.daily_discharge_energy
    ];
    const hasAny = detailEntities.some(Boolean);

    return html`
      <div class="heat-details battery-details">
        <div class="heat-details-head">
          <div>
            <div class="heat-title">▰ ${battery.name ?? `Batterie ${index + 1}`}</div>
            <div class="heat-subtitle">${this._batteryStatus(battery)} · ${this._formatSoc(battery.soc)}</div>
          </div>
          <button @click=${() => { this._expandedBattery = undefined; }}>Schließen</button>
        </div>
        ${warnings.length
          ? html`<div class="detail-warning"><strong>⚠ Diagnose</strong><span>${warnings.join(" · ")}</span></div>`
          : nothing}
        ${hasAny
          ? html`
            <div class="detail-grid">
              ${this._detailItem("Leistung", battery.power)}
              ${this._detailItem("Ladezustand", battery.soc, "%")}
              ${this._detailItem("Batteriespannung", battery.voltage, "V")}
              ${this._detailItem("Batteriestrom", battery.current, "A")}
              ${this._detailItem("Temperatur", battery.temperature, "°C")}
              ${this._detailItem("Zellspannung Minimum", battery.cell_min_voltage, "V")}
              ${this._detailItem("Zellspannung Maximum", battery.cell_max_voltage, "V")}
              ${deltaText ? this._detailValueItem("Zellspannungs-Delta", deltaText, "Max − Min") : nothing}
              ${this._detailItem("Zelltemperatur Minimum", battery.cell_min_temperature, "°C")}
              ${this._detailItem("Zelltemperatur Maximum", battery.cell_max_temperature, "°C")}
              ${this._detailItem("State of Health", battery.state_of_health, "%")}
              ${this._detailItem("Zyklen", battery.cycle_count)}
              ${this._detailItem("Restenergie", battery.remaining_energy)}
              ${this._detailItem("Ladeenergie heute", battery.daily_charge_energy)}
              ${this._detailItem("Entladeenergie heute", battery.daily_discharge_energy)}
              ${energyRatio !== undefined ? this._detailValueItem("Entladen / Laden heute", `${energyRatio.toLocaleString(undefined, { maximumFractionDigits: 1 })} %`, "Kein echter Wirkungsgrad; SOC-Verschiebung möglich") : nothing}
              ${equivalentCycles !== undefined ? this._detailValueItem("Äquivalente Zyklen heute", equivalentCycles.toLocaleString(undefined, { maximumFractionDigits: 2 }), `bei ${battery.capacity_kwh?.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh Kapazität`) : nothing}
            </div>
          `
          : html`<div class="empty-detail">Noch keine Detail-Entities für diese Batterie konfiguriert.</div>`}
      </div>
    `;
  }

  private _pvDailyDetails() {
    const systems = this._config.solar ?? [];
    const totalWh = this._pvDailyTotalWh();
    const hasSystemData = systems.some((system) => Boolean(system.daily_energy));

    return html`
      <div class="heat-details pv-daily-details">
        <div class="heat-details-head">
          <div>
            <div class="heat-title">☀ PV-Produktion heute</div>
            <div class="heat-subtitle">
              ${totalWh !== undefined ? `Gesamt ${this._formatEnergyWh(totalWh)}` : "Aufschlüsselung nach PV-System"}
            </div>
          </div>
          <button @click=${() => { this._pvDailyExpanded = false; }}>Schließen</button>
        </div>

        ${hasSystemData
          ? html`
            <div class="detail-grid pv-daily-grid">
              ${systems.map((system, index) => {
                const entity = system.daily_energy;
                const valueWh = this._energyWh(entity);
                const share = valueWh !== undefined && totalWh !== undefined && totalWh > 0
                  ? Math.min(100, Math.max(0, valueWh / totalWh * 100))
                  : undefined;
                const value = entity ? this._formatEnergy(entity) : "Nicht konfiguriert";
                const specificYield = this._specificYield(system);
                const peak = system.daily_peak_power ? this._formatPower(system.daily_peak_power, true) : undefined;
                return html`
                  <div
                    class=${`detail-item pv-daily-system ${entity ? "" : "static missing"}`}
                    @click=${() => entity && this._openMoreInfo(entity)}
                  >
                    <span>${system.name ?? `PV ${index + 1}`}</span>
                    <strong>${value}</strong>
                    ${share !== undefined
                      ? html`
                        <small>${share.toLocaleString(undefined, { maximumFractionDigits: 1 })} % der Tagesproduktion</small>
                        <div class="pv-share-track"><i style=${`width:${share}%`}></i></div>
                      `
                      : html`<small>Tagesproduktion des Systems</small>`}
                    ${(specificYield !== undefined || peak || system.installed_kwp)
                      ? html`<div class="pv-daily-meta">
                          ${system.installed_kwp ? html`<span>${system.installed_kwp.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWp</span>` : nothing}
                          ${specificYield !== undefined ? html`<span>${specificYield.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh/kWp</span>` : nothing}
                          ${peak ? html`<span>Peak ${peak}</span>` : nothing}
                        </div>`
                      : nothing}
                  </div>
                `;
              })}
            </div>
          `
          : html`
            <div class="empty-detail">
              Für die einzelnen PV-Systeme ist noch keine Tagesproduktion konfiguriert.
              Im Karteneditor bei jedem PV-System eine „Tagesproduktion“-Entity auswählen.
            </div>
          `}

        ${this._config.daily?.pv_energy
          ? html`
            <button class="details-entity-button" @click=${() => this._openMoreInfo(this._config.daily!.pv_energy!)}>
              PV-Gesamtsensor öffnen
            </button>
          `
          : nothing}
      </div>
    `;
  }

  private _pvSystemDetails(system: PvSystemConfig, index: number) {
    const total = this._pvSystemPowerW(system);
    const pvTotal = this._totalPvW();
    const share = total !== undefined && pvTotal !== undefined && pvTotal > this._threshold()
      ? this._clampPercent(Math.max(0, total) / pvTotal * 100)
      : undefined;
    const warnings = this._pvSystemWarnings(system);
    const specificYield = this._specificYield(system);

    return html`
      <div class="heat-details pv-system-details">
        <div class="heat-details-head">
          <div>
            <div class="heat-title">☀ ${system.name ?? `PV ${index + 1}`}</div>
            <div class="heat-subtitle">
              ${this._formatW(total, true)} aktuell${share !== undefined ? ` · ${this._formatPercent(share)} der PV-Leistung` : ""}
            </div>
          </div>
          <button @click=${() => { this._expandedPvSystem = undefined; }}>Schließen</button>
        </div>

        ${warnings.length
          ? html`<div class="detail-warning"><strong>⚠ Diagnose</strong><span>${warnings.join(" · ")}</span></div>`
          : html`<div class="detail-ok"><strong>✓ Diagnose</strong><span>Keine Auffälligkeiten erkannt.</span></div>`}

        <div class="detail-grid system-overview-grid">
          ${this._detailValueItem("Aktuelle Gesamtleistung", this._formatW(total, true))}
          ${system.daily_energy ? this._detailItem("Produktion heute", system.daily_energy) : nothing}
          ${system.daily_peak_power ? this._detailItem("Peak heute", system.daily_peak_power) : nothing}
          ${system.installed_kwp ? this._detailValueItem("Installierte Leistung", `${system.installed_kwp.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWp`) : nothing}
          ${specificYield !== undefined ? this._detailValueItem("Spezifischer Ertrag heute", `${specificYield.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh/kWp`) : nothing}
          ${share !== undefined ? this._detailValueItem("Anteil an PV aktuell", this._formatPercent(share)) : nothing}
        </div>

        ${(system.children ?? []).length
          ? html`
            <div class="details-section-title">MPPTs / Sub-PV</div>
            <div class="mppt-detail-list">
              ${(system.children ?? []).map((input, childIndex) => {
                const power = Math.abs(this._powerW(input.power) ?? 0);
                const systemPower = Math.abs(total ?? 0);
                const mpptShare = systemPower > this._threshold() ? this._clampPercent(power / systemPower * 100) : undefined;
                const normalized = input.installed_kwp && input.installed_kwp > 0 ? power / input.installed_kwp : undefined;
                const warning = this._mpptDiagnostic(system, input, childIndex);
                return html`
                  <div class=${`mppt-detail-row ${warning ? "warning" : ""}`}>
                    <div class="mppt-detail-head">
                      <div>
                        <strong>${input.name ?? `MPPT ${childIndex + 1}`}</strong>
                        ${warning ? html`<small>⚠ ${warning}</small>` : html`<small>Keine Auffälligkeit</small>`}
                      </div>
                      <button ?disabled=${!input.power} @click=${() => input.power && this._openMoreInfo(input.power)}>Entity</button>
                    </div>
                    <div class="mppt-detail-values">
                      <span><b>${this._formatPower(input.power, true)}</b> Leistung</span>
                      ${input.voltage ? html`<span><b>${this._formatMeasurement(input.voltage, "V")}</b> Spannung</span>` : nothing}
                      ${input.current ? html`<span><b>${this._formatMeasurement(input.current, "A")}</b> Strom</span>` : nothing}
                      ${input.installed_kwp ? html`<span><b>${input.installed_kwp.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWp</b> installiert</span>` : nothing}
                      ${normalized !== undefined ? html`<span><b>${normalized.toLocaleString(undefined, { maximumFractionDigits: 0 })} W/kWp</b> aktuell</span>` : nothing}
                    </div>
                    ${mpptShare !== undefined ? html`<div class="pv-share-track"><i style=${`width:${mpptShare}%`}></i></div>` : nothing}
                  </div>
                `;
              })}
            </div>
          `
          : html`<div class="empty-detail">Keine MPPT-Unterpunkte konfiguriert.</div>`}
      </div>
    `;
  }

  private _diagnosticsDetails(messages: DiagnosticMessage[]) {
    return html`
      <div class="heat-details diagnostics-details">
        <div class="heat-details-head">
          <div>
            <div class="heat-title">⚠ Diagnose</div>
            <div class="heat-subtitle">${messages.length} Hinweis${messages.length === 1 ? "" : "e"}</div>
          </div>
          <button @click=${() => { this._diagnosticsExpanded = false; }}>Schließen</button>
        </div>
        <div class="diagnostic-list">
          ${messages.map((message) => html`
            <div class="diagnostic-row">
              <div><strong>${message.title}</strong><span>${message.detail}</span></div>
              ${message.nodeId ? html`<button @click=${() => { this._hoveredNode = message.nodeId; window.setTimeout(() => { this._hoveredNode = undefined; }, 1800); }}>Markieren</button>` : nothing}
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _heatDetails(hp: HeatPumpConfig) {
    const hasAny = [
      hp.flow_temperature,
      hp.return_temperature,
      hp.outdoor_temperature,
      hp.hot_water_temperature,
      hp.room_temperature,
      hp.target_temperature,
      hp.mode,
      hp.compressor_status,
      hp.compressor_frequency,
      hp.thermal_power,
      hp.cop,
      hp.daily_energy
    ].some(Boolean);

    return html`
      <div class="heat-details">
        <div class="heat-details-head">
          <div>
            <div class="heat-title">♨ ${hp.name ?? "Wärmepumpe"}</div>
            <div class="heat-subtitle">Zusätzliche Betriebsdaten</div>
          </div>
          <button @click=${() => { this._heatExpanded = false; }}>Schließen</button>
        </div>
        ${hasAny
          ? html`
            <div class="detail-grid">
              ${this._detailItem("Vorlauf", hp.flow_temperature, "°C")}
              ${this._detailItem("Rücklauf", hp.return_temperature, "°C")}
              ${this._detailItem("Außentemperatur", hp.outdoor_temperature, "°C")}
              ${this._detailItem("Warmwasser", hp.hot_water_temperature, "°C")}
              ${this._detailItem("Raumtemperatur", hp.room_temperature, "°C")}
              ${this._detailItem("Solltemperatur", hp.target_temperature, "°C")}
              ${this._detailItem("Betriebsmodus", hp.mode)}
              ${this._detailItem("Kompressor", hp.compressor_status)}
              ${this._detailItem("Kompressorfrequenz", hp.compressor_frequency, "Hz")}
              ${this._detailItem("Thermische Leistung", hp.thermal_power)}
              ${hp.cop
                ? this._detailItem("COP", hp.cop)
                : (() => {
                    const cop = this._heatPumpCopInfo(hp);
                    return cop.value !== undefined
                      ? this._detailValueItem("COP", cop.value.toLocaleString(undefined, { maximumFractionDigits: 2 }), "aus thermischer / elektrischer Leistung berechnet")
                      : nothing;
                  })()}
              ${this._detailItem("Tagesenergie", hp.daily_energy)}
            </div>
          `
          : html`<div class="empty-detail">Noch keine Detail-Entities für die Wärmepumpe konfiguriert.</div>`}
      </div>
    `;
  }

  private _isPvNight(): boolean {
    if (this._config.night_mode === false) return false;
    const pv = this._totalPvW();
    return pv !== undefined && Math.abs(pv) <= this._threshold();
  }

  private _cardStyle(): string {
    const colors = this._config.colors;
    const declarations: string[] = [];
    if (colors?.solar) declarations.push(`--apfc-solar:${colors.solar}`);
    if (colors?.grid) declarations.push(`--apfc-grid:${colors.grid}`);
    if (colors?.battery) declarations.push(`--apfc-battery:${colors.battery}`);
    if (colors?.heat_pump) declarations.push(`--apfc-heat:${colors.heat_pump}`);
    if (colors?.consumer) declarations.push(`--apfc-consumer:${colors.consumer}`);
    if (colors?.flow) declarations.push(`--apfc-flow:${colors.flow}`);
    return declarations.join(";");
  }

  render() {
    if (!this.hass) return nothing;

    const layout = this._layout();
    const pvTotal = this._totalPvW();
    const dailyItems = this._dailyItems();
    const diagnostics = this._diagnosticMessages();
    const dailyLayout = this._config.daily_layout ?? "auto";
    const houseBranchIds = layout.bottom
      .filter((item) => item.source === "house")
      .map((item) => item.node.id);

    return html`
      <ha-card
        class=${`text-${this._config.text_size ?? "large"} ${this._isPvNight() ? "pv-night" : ""}`}
        style=${this._cardStyle()}
      >
        <div class="header">
          <div>
            <div class="title">${this._config.title ?? "Energiefluss"}</div>
            <div class="subtitle">
              PV gesamt <strong>${this._formatW(pvTotal, true)}</strong>
              <span class="separator">·</span>
              ${(this._config.solar ?? []).length} PV-System${(this._config.solar ?? []).length === 1 ? "" : "e"}
            </div>
          </div>
          <div class="version">v${CARD_VERSION}</div>
        </div>

        ${dailyItems.length
          ? html`
            <div class=${`daily-summary daily-${dailyLayout}`}>
              ${dailyItems.map((item) => html`
                <button
                  class=${`daily-item ${item.expandable ? "expandable" : ""}`}
                  @click=${() => {
                    if (item.key === "pv") {
                      const next = !this._pvDailyExpanded;
                      this._pvDailyExpanded = next;
                      if (next) {
                        this._heatExpanded = false;
                        this._expandedBattery = undefined;
                        this._expandedPvSystem = undefined;
                        this._diagnosticsExpanded = false;
                      }
                      return;
                    }
                    if (item.entity) this._openMoreInfo(item.entity);
                  }}
                >
                  <span class="daily-item-label">
                    ${item.label}
                    ${item.expandable ? html`<b>${this._pvDailyExpanded ? "▲" : "▼"}</b>` : nothing}
                  </span>
                  <strong>${item.value}</strong>
                </button>
              `)}
            </div>
          `
          : nothing}

        <div class="diagram-fit">
          <svg
            viewBox=${`0 0 ${layout.width} ${layout.height}`}
            style="width:100%; height:auto;"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Energiefluss"
          >
            ${layout.pvClusters.map((cluster) => {
              const systemPower = this._pvSystemPowerW(cluster.system);
              return svg`
                <rect
                  x=${cluster.x}
                  y=${cluster.y}
                  width=${cluster.width}
                  height=${cluster.height}
                  rx="24"
                  class="cluster-bg"
                ></rect>
                ${cluster.children.map((child, childIndex) => {
                  const power = this._powerW(cluster.system.children?.[childIndex]?.power);
                  return this._flowPath(
                    this._connectionPath(child, cluster.parent),
                    this._positiveFlow(power),
                    power,
                    `pv-child-${cluster.systemIndex}-${childIndex}`,
                    [child.id, cluster.parent.id]
                  );
                })}
                ${this._flowPath(
                  this._connectionPath(cluster.parent, layout.center),
                  this._positiveFlow(systemPower),
                  systemPower,
                  `pv-system-${cluster.systemIndex}`,
                  [cluster.parent.id, layout.center.id, ...cluster.children.map((child) => child.id)]
                )}
              `;
            })}

            ${this._flowPath(
              this._horizontalPath(layout.grid, layout.center),
              this._gridFlow(),
              this._powerW(this._config.grid?.power),
              "grid",
              [layout.grid.id, layout.center.id]
            )}

            ${this._flowPath(
              this._horizontalPath(layout.center, layout.house),
              this._positiveFlow(this._housePowerInfo().value),
              this._housePowerInfo().value,
              "house",
              [layout.center.id, layout.house.id, ...houseBranchIds]
            )}

            ${layout.bottom.map((item) => {
              const source = item.source === "house" ? layout.house : layout.center;
              const path = this._connectionPath(source, item.node);
              const direction = item.source === "house"
                ? item.direction
                : item.direction;
              return this._flowPath(
                path,
                direction,
                item.numericPower ?? this._powerW(item.power),
                item.node.id,
                [source.id, item.node.id]
              );
            })}

            ${layout.pvClusters.map((cluster) => svg`
              ${cluster.children.map((child) => this._node(child))}
              ${this._node(cluster.parent)}
            `)}
            ${this._node(layout.grid)}
            ${this._node(layout.center)}
            ${this._node(layout.house)}
            ${layout.bottom.map((item) => this._node(item.node))}
          </svg>
        </div>

        <div class="legend">
          <span><i class="dot active"></i> aktiver Energiefluss</span>
          <span><i class="dot idle"></i> kein relevanter Fluss</span>
          ${diagnostics.length
            ? html`<button class="diagnostic-summary-button" @click=${() => {
                const next = !this._diagnosticsExpanded;
                this._diagnosticsExpanded = next;
                if (next) {
                  this._heatExpanded = false;
                  this._expandedBattery = undefined;
                  this._pvDailyExpanded = false;
                  this._expandedPvSystem = undefined;
                }
              }}>⚠ ${diagnostics.length} Hinweis${diagnostics.length === 1 ? "" : "e"}</button>`
            : nothing}
        </div>

        ${this._heatExpanded && this._config.heat_pump
          ? this._heatDetails(this._config.heat_pump)
          : this._expandedBattery !== undefined && this._config.batteries?.[this._expandedBattery]
            ? this._batteryDetails(this._config.batteries[this._expandedBattery], this._expandedBattery)
            : this._expandedPvSystem !== undefined && this._config.solar?.[this._expandedPvSystem]
              ? this._pvSystemDetails(this._config.solar[this._expandedPvSystem], this._expandedPvSystem)
              : this._pvDailyExpanded
                ? this._pvDailyDetails()
                : this._diagnosticsExpanded && diagnostics.length
                  ? this._diagnosticsDetails(diagnostics)
                  : nothing}
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
      --apfc-flow: var(--primary-color);
      --apfc-line: color-mix(in srgb, var(--secondary-text-color) 28%, transparent);
      --apfc-node-bg: color-mix(in srgb, var(--card-background-color) 94%, var(--primary-color) 6%);
      --apfc-solar: var(--warning-color, #f4b400);
      --apfc-grid: var(--info-color, #039be5);
      --apfc-battery: var(--success-color, #43a047);
      --apfc-heat: var(--orange-color, #fb8c00);
      --apfc-consumer: var(--primary-color);
    }

    ha-card {
      overflow: hidden;
      padding: 20px;
      --apfc-title-size: 24px;
      --apfc-subtitle-size: 14px;
      --apfc-node-title-size: 17px;
      --apfc-node-icon-size: 19px;
      --apfc-node-main-size: 24px;
      --apfc-node-sub-size: 13.5px;
      --apfc-badge-size: 11.5px;
    }

    ha-card.text-small {
      --apfc-title-size: 22px;
      --apfc-subtitle-size: 13px;
      --apfc-node-title-size: 15.5px;
      --apfc-node-icon-size: 17.5px;
      --apfc-node-main-size: 22px;
      --apfc-node-sub-size: 12.5px;
      --apfc-badge-size: 10.5px;
    }

    ha-card.text-large {
      --apfc-title-size: 25px;
      --apfc-subtitle-size: 14.5px;
      --apfc-node-title-size: 18.5px;
      --apfc-node-icon-size: 20.5px;
      --apfc-node-main-size: 25.5px;
      --apfc-node-sub-size: 14.5px;
      --apfc-badge-size: 12px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }

    .title {
      font-size: var(--apfc-title-size);
      line-height: 1.2;
      font-weight: 700;
      color: var(--primary-text-color);
    }

    .subtitle {
      margin-top: 6px;
      font-size: var(--apfc-subtitle-size);
      color: var(--secondary-text-color);
    }

    .subtitle strong { color: var(--primary-text-color); }
    .separator { margin: 0 6px; }

    .version {
      font-size: 12px;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }

    .daily-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
      gap: 8px;
      margin: 0 0 12px;
    }

    .daily-item {
      display: grid;
      gap: 2px;
      min-width: 0;
      padding: 8px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: color-mix(in srgb, var(--secondary-background-color) 58%, transparent);
      color: inherit;
      text-align: left;
      cursor: pointer;
      font: inherit;
    }

    .daily-item:hover {
      border-color: var(--primary-color);
    }

    .daily-item span {
      font-size: 11px;
      color: var(--secondary-text-color);
    }

    .daily-item-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .daily-item-label b {
      font-size: 9px;
      color: var(--primary-color);
    }

    .daily-item.expandable {
      border-color: color-mix(in srgb, var(--apfc-solar) 28%, var(--divider-color));
    }

    .daily-item strong {
      font-size: 14px;
      color: var(--primary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .diagram-fit {
      width: 100%;
      overflow: hidden;
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      max-width: 1100px;
      margin: 0 auto;
      overflow: visible;
    }

    .cluster-bg {
      fill: color-mix(in srgb, var(--apfc-solar) 2%, var(--secondary-background-color));
      stroke: color-mix(in srgb, var(--apfc-solar) 16%, var(--divider-color));
      stroke-width: 1.15;
    }

    .flow-base {
      fill: none;
      stroke: var(--apfc-line);
      stroke-width: 7;
      stroke-linecap: round;
    }

    .flow {
      fill: none;
      stroke: var(--apfc-flow);
      stroke-width: 3.8;
      stroke-linecap: round;
      stroke-dasharray: 8 14;
      opacity: .98;
      filter: drop-shadow(0 0 1.5px color-mix(in srgb, var(--apfc-flow) 42%, transparent));
      animation: dash var(--flow-duration, 1.35s) linear infinite;
    }

    .flow.reverse { animation-direction: reverse; }
    .flow.off { opacity: 0; animation: none; }

    .flow-base,
    .flow {
      transition: opacity 160ms ease, stroke-width 160ms ease, filter 160ms ease;
    }

    .flow-base.dimmed { opacity: .16; }
    .flow.dimmed { opacity: .14; }
    .flow-base.focus { opacity: 1; stroke-width: 8.5; }
    .flow.focus {
      opacity: 1;
      stroke-width: 4.8;
      filter: drop-shadow(0 0 3px color-mix(in srgb, var(--apfc-flow) 58%, transparent));
    }

    @keyframes dash {
      to { stroke-dashoffset: -50; }
    }

    .node-bg {
      fill: var(--apfc-node-bg);
      stroke: color-mix(in srgb, var(--divider-color) 82%, var(--primary-color) 18%);
      stroke-width: 1.45;
      filter: drop-shadow(0 2px 2px color-mix(in srgb, var(--primary-text-color) 9%, transparent));
      transition: opacity 160ms ease, stroke-width 160ms ease, filter 160ms ease;
    }

    .node.active .node-bg {
      stroke-width: 1.9;
      filter: drop-shadow(0 2px 3px color-mix(in srgb, var(--primary-color) 12%, transparent));
    }

    .node.warning .node-bg {
      stroke: var(--error-color, #db4437);
      stroke-width: 2.2;
      filter: drop-shadow(0 2px 4px color-mix(in srgb, var(--error-color, #db4437) 18%, transparent));
    }

    .node.warning .node-sub {
      fill: var(--error-color, #db4437);
      font-weight: 700;
    }

    .node.idle .node-bg {
      opacity: .58;
      filter: none;
    }

    .node.idle .node-icon { opacity: .46; }
    .node.idle .node-main { opacity: .68; }
    .node.idle .node-title { opacity: .72; }
    .node.idle .node-sub { opacity: .58; }

    .node.unknown .node-bg {
      opacity: .56;
      stroke-dasharray: 5 4;
      filter: none;
    }

    .node.unknown .node-icon,
    .node.unknown .node-main,
    .node.unknown .node-sub { opacity: .62; }

    .node-bg.pv {
      fill: color-mix(in srgb, var(--apfc-solar) 3%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-solar) 30%, var(--divider-color));
      stroke-width: 1.2;
      filter: none;
    }

    .node-bg.pv-parent {
      fill: color-mix(in srgb, var(--apfc-solar) 17%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-solar) 70%, var(--divider-color));
      stroke-width: 2.35;
      filter: drop-shadow(0 3px 4px color-mix(in srgb, var(--apfc-solar) 16%, transparent));
    }

    .node.pv-parent .node-title,
    .node.pv-parent .node-main {
      font-weight: 800;
    }

    .node.pv-parent.idle .node-bg { opacity: .76; }
    .node.pv-parent.idle .node-title { opacity: .86; }
    .node.pv-parent.idle .node-main { opacity: .82; }

    .node-bg.center {
      fill: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--primary-color) 68%, var(--divider-color));
      stroke-width: 2.2;
      filter: drop-shadow(0 3px 4px color-mix(in srgb, var(--primary-color) 18%, transparent));
    }

    .node-bg.grid {
      fill: color-mix(in srgb, var(--apfc-grid) 8%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-grid) 40%, var(--divider-color));
    }

    .node-bg.battery {
      fill: color-mix(in srgb, var(--apfc-battery) 8%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-battery) 40%, var(--divider-color));
    }

    .node-bg.heat {
      fill: color-mix(in srgb, var(--apfc-heat) 9%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-heat) 42%, var(--divider-color));
    }

    .node-bg.house,
    .node-bg.consumer {
      fill: color-mix(in srgb, var(--apfc-consumer) 7%, var(--card-background-color));
    }

    .node.pv .node-icon,
    .node.pv-parent .node-icon { fill: var(--apfc-solar); }
    .node.grid .node-icon { fill: var(--apfc-grid); }
    .node.battery .node-icon { fill: var(--apfc-battery); }
    .node.heat .node-icon { fill: var(--apfc-heat); }

    .node-title {
      fill: var(--secondary-text-color);
      font-size: var(--apfc-node-title-size);
      font-weight: 650;
    }

    .node-icon {
      fill: var(--primary-color);
      font-size: var(--apfc-node-icon-size);
    }

    .node-main {
      fill: var(--primary-text-color);
      font-size: var(--apfc-node-main-size);
      font-weight: 750;
    }

    .node-sub {
      fill: var(--secondary-text-color);
      font-size: var(--apfc-node-sub-size);
    }

    .battery-soc-track {
      fill: color-mix(in srgb, var(--secondary-text-color) 18%, transparent);
    }

    .battery-soc-fill {
      fill: var(--apfc-battery);
      filter: drop-shadow(0 0 1px color-mix(in srgb, var(--apfc-battery) 35%, transparent));
    }

    .battery-soc-mark {
      stroke: color-mix(in srgb, var(--primary-text-color) 34%, transparent);
      stroke-width: 1;
      pointer-events: none;
    }

    .status-badge rect {
      fill: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--primary-color) 42%, var(--divider-color));
      stroke-width: 1;
    }

    .status-badge text {
      fill: color-mix(in srgb, var(--primary-color) 76%, var(--primary-text-color));
      font-size: var(--apfc-badge-size);
      font-weight: 700;
    }

    .node.pv-parent .status-badge rect {
      fill: color-mix(in srgb, var(--apfc-solar) 22%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-solar) 68%, var(--divider-color));
    }

    .node.pv-parent .status-badge text {
      fill: color-mix(in srgb, var(--apfc-solar) 78%, var(--primary-text-color));
    }

    .node.heat .status-badge rect {
      fill: color-mix(in srgb, var(--apfc-heat) 16%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-heat) 48%, var(--divider-color));
    }

    .node.heat .status-badge text {
      fill: color-mix(in srgb, var(--apfc-heat) 78%, var(--primary-text-color));
    }

    .node.grid .status-badge rect {
      fill: color-mix(in srgb, var(--apfc-grid) 14%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-grid) 46%, var(--divider-color));
    }

    .node.grid .status-badge text {
      fill: color-mix(in srgb, var(--apfc-grid) 78%, var(--primary-text-color));
    }

    .status-badge.warning rect {
      fill: color-mix(in srgb, var(--error-color, #db4437) 15%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--error-color, #db4437) 55%, var(--divider-color));
    }

    .status-badge.warning text {
      fill: color-mix(in srgb, var(--error-color, #db4437) 82%, var(--primary-text-color));
    }

    .node.idle .status-badge,
    .node.unknown .status-badge { opacity: .7; }

    .node-action {
      fill: var(--secondary-text-color);
      font-size: 14px;
    }

    .clickable { cursor: pointer; }
    .clickable:hover .node-bg {
      stroke: var(--primary-color);
      stroke-width: 2.4;
      filter: drop-shadow(0 3px 4px color-mix(in srgb, var(--primary-color) 18%, transparent));
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px;
      padding-top: 8px;
      color: var(--secondary-text-color);
      font-size: 12px;
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot.active { background: var(--primary-color); }
    .dot.idle { background: var(--divider-color); }

    .heat-details {
      margin-top: 16px;
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 16px;
      background: color-mix(in srgb, var(--secondary-background-color) 62%, transparent);
    }

    .heat-details-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .heat-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-text-color);
    }

    .heat-subtitle {
      margin-top: 2px;
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .heat-details button {
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      padding: 7px 10px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
    }

    .detail-item {
      display: grid;
      gap: 4px;
      min-height: 58px;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 11px;
      background: var(--card-background-color);
      cursor: pointer;
    }

    .detail-item:hover { border-color: var(--primary-color); }
    .detail-item.static { cursor: default; }
    .detail-item.static:hover { border-color: var(--divider-color); }
    .detail-item span { font-size: 12px; color: var(--secondary-text-color); }
    .detail-item strong { font-size: 16px; color: var(--primary-text-color); }
    .detail-item small { font-size: 11px; color: var(--secondary-text-color); }
    .detail-item.missing { opacity: .62; }
    .empty-detail { color: var(--secondary-text-color); font-size: 13px; line-height: 1.5; }

    .battery-details {
      border-color: color-mix(in srgb, var(--apfc-battery) 30%, var(--divider-color));
    }

    .pv-daily-details {
      border-color: color-mix(in srgb, var(--apfc-solar) 34%, var(--divider-color));
    }

    .pv-daily-system {
      position: relative;
      overflow: hidden;
    }

    .pv-share-track {
      height: 4px;
      margin-top: 2px;
      border-radius: 2px;
      overflow: hidden;
      background: color-mix(in srgb, var(--secondary-text-color) 14%, transparent);
    }

    .pv-share-track i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--apfc-solar);
    }

    .details-entity-button {
      margin-top: 12px;
    }

    .pv-node-share-track {
      fill: color-mix(in srgb, var(--secondary-text-color) 15%, transparent);
    }

    .pv-node-share-fill {
      fill: var(--apfc-solar);
      filter: drop-shadow(0 0 1px color-mix(in srgb, var(--apfc-solar) 35%, transparent));
    }

    .pv-night .cluster-bg { opacity: .42; }
    .pv-night .node.pv:not(.warning) { opacity: .58; }
    .pv-night .node.pv-parent:not(.warning) { opacity: .68; }

    .daily-summary.daily-compact {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .daily-summary.daily-compact .daily-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex: 1 1 145px;
      min-height: 38px;
      padding: 6px 9px;
    }

    .daily-summary.daily-compact .daily-item strong { font-size: 13px; }
    .daily-summary.daily-compact .daily-item-label { gap: 4px; }

    .diagnostic-summary-button {
      border: 1px solid color-mix(in srgb, var(--error-color, #db4437) 42%, var(--divider-color));
      border-radius: 999px;
      padding: 4px 8px;
      background: color-mix(in srgb, var(--error-color, #db4437) 8%, transparent);
      color: color-mix(in srgb, var(--error-color, #db4437) 82%, var(--primary-text-color));
      font: inherit;
      cursor: pointer;
    }

    .detail-warning, .detail-ok {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 0 0 12px;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 12px;
      line-height: 1.4;
    }

    .detail-warning {
      border: 1px solid color-mix(in srgb, var(--error-color, #db4437) 38%, var(--divider-color));
      background: color-mix(in srgb, var(--error-color, #db4437) 8%, transparent);
    }

    .detail-ok {
      border: 1px solid color-mix(in srgb, var(--apfc-battery) 30%, var(--divider-color));
      background: color-mix(in srgb, var(--apfc-battery) 6%, transparent);
    }

    .detail-warning span, .detail-ok span { color: var(--secondary-text-color); }
    .pv-system-details { border-color: color-mix(in srgb, var(--apfc-solar) 38%, var(--divider-color)); }
    .details-section-title { margin: 16px 0 8px; font-weight: 700; color: var(--primary-text-color); }
    .mppt-detail-list { display: grid; gap: 9px; }
    .mppt-detail-row {
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 11px;
      background: var(--card-background-color);
    }
    .mppt-detail-row.warning { border-color: color-mix(in srgb, var(--error-color, #db4437) 50%, var(--divider-color)); }
    .mppt-detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .mppt-detail-head > div { display: grid; gap: 2px; }
    .mppt-detail-head strong { font-size: 14px; }
    .mppt-detail-head small { color: var(--secondary-text-color); font-size: 11px; }
    .mppt-detail-head button:disabled { opacity: .45; cursor: default; }
    .mppt-detail-values {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(105px, 1fr));
      gap: 6px 10px;
      margin: 9px 0 7px;
    }
    .mppt-detail-values span { display: grid; gap: 1px; color: var(--secondary-text-color); font-size: 10.5px; }
    .mppt-detail-values b { color: var(--primary-text-color); font-size: 13px; }
    .pv-daily-meta { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
    .pv-daily-meta span {
      border-radius: 999px;
      padding: 2px 6px;
      background: color-mix(in srgb, var(--apfc-solar) 9%, transparent);
      color: var(--secondary-text-color);
      font-size: 10px;
    }

    .diagnostic-list { display: grid; gap: 8px; }
    .diagnostic-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid color-mix(in srgb, var(--error-color, #db4437) 30%, var(--divider-color));
      border-radius: 10px;
      background: var(--card-background-color);
    }
    .diagnostic-row > div { display: grid; gap: 2px; }
    .diagnostic-row strong { font-size: 13px; }
    .diagnostic-row span { font-size: 11px; color: var(--secondary-text-color); }

    @media (max-width: 700px) {
      ha-card { padding: 12px; }
      .version { font-size: 11.5px; }
      .legend { font-size: 11.5px; gap: 10px; }
      .daily-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        margin-bottom: 8px;
      }
      .daily-item { padding: 7px 8px; }
      .daily-summary.daily-auto {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .daily-summary.daily-auto .daily-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        flex: 1 1 135px;
        min-height: 36px;
        padding: 6px 8px;
      }
      .daily-summary.daily-auto .daily-item strong { font-size: 12.5px; }
      .detail-warning, .detail-ok { flex-direction: column; gap: 3px; }
      .diagnostic-row { align-items: flex-start; }
    }

    @media (prefers-reduced-motion: reduce) {
      .flow { animation: none; }
    }
  `;
}

if (!customElements.get("advanced-power-flow-card")) {
  customElements.define("advanced-power-flow-card", AdvancedPowerFlowCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "advanced-power-flow-card")) {
  window.customCards.push({
    type: "advanced-power-flow-card",
    name: CARD_NAME,
    description: "Flexible power-flow visualization with dynamic PV systems, MPPTs, batteries and consumers.",
    preview: true,
    configurable: true
  });
}

console.info(
  `%c ${CARD_NAME} %c v${CARD_VERSION} `,
  "background:#03a9f4;color:white;font-weight:700;",
  "background:#222;color:white;"
);
