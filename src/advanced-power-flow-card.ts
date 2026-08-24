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
const CARD_VERSION = "0.2.2";

type FlowDirection = "forward" | "reverse" | "off";
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
    _heatExpanded: { state: true }
  };

  hass?: HomeAssistant;
  private _config: AdvancedPowerFlowCardConfig = createStubConfig();
  private _heatExpanded = false;
  private _heatExpansionInitialized = false;

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
  }

  getCardSize(): number {
    return this._heatExpanded ? 7 : 6;
  }

  getGridOptions() {
    return {
      rows: this._heatExpanded ? 7 : 6,
      columns: 12,
      min_rows: 5,
      min_columns: 6
    };
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
    const parentW = 210;
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

        const parentX = clusterX + clusterWidth / 2 - parentW / 2;
        const parentY = pvY + clusterPadY + childrenAreaH + 16;
        const parentPower = this._pvSystemPowerW(system);

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
          h: parentH
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
            h: childH
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
    const center: DiagramNode = {
      id: "center",
      title: "Energie",
      main: this._formatW(this._totalPvW(), true),
      sub: "Zentraler Energiefluss",
      kind: "center",
      x: width / 2 - 100,
      y: centerY,
      w: 200,
      h: 92
    };

    const grid: DiagramNode = {
      id: "grid",
      title: "Netz",
      main: this._formatPower(this._config.grid?.power, true),
      sub: this._gridFlow() === "forward" ? "Bezug" : this._gridFlow() === "reverse" ? "Einspeisung" : "Ruhe",
      entity: this._config.grid?.power,
      kind: "grid",
      x: 50,
      y: centerY + 2,
      w: 190,
      h: 88
    };

    const houseInfo = this._housePowerInfo();
    const house: DiagramNode = {
      id: "house",
      title: this._config.house?.name ?? "Haus",
      main: houseInfo.complete ? this._formatW(houseInfo.value, true) : "—",
      sub: houseInfo.calculated
        ? (houseInfo.complete ? "Automatisch berechnet" : "Berechnung unvollständig")
        : (houseInfo.complete ? "Gesamtverbrauch" : "Sensor nicht verfügbar"),
      entity: this._config.house?.power,
      kind: "house",
      x: width - 240,
      y: centerY + 2,
      w: 190,
      h: 88
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
            sub: this._formatSoc(battery.soc),
            entity: battery.power ?? battery.soc,
            kind: "battery",
            x,
            y,
            w: nodeW,
            h: 90
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
            heatPump: true
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
            h: 90
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

  private _heatPumpSummary(hp: HeatPumpConfig): string {
    const parts: string[] = [];
    const mode = this._raw(hp.mode);
    if (mode) parts.push(mode);
    const flow = this._number(hp.flow_temperature);
    if (flow !== undefined) {
      const unit = this._unit(hp.flow_temperature) || "°C";
      parts.push(`VL ${flow.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`);
    }
    return parts.length ? parts.join(" · ") : "Details anzeigen";
  }

  private _flowPath(
    d: string,
    direction: FlowDirection,
    power?: number,
    key = ""
  ) {
    const duration = this._durationFromPower(power);
    return svg`
      <path d=${d} class="flow-base"></path>
      <path
        d=${d}
        class=${`flow ${direction}`}
        style=${`--flow-duration:${duration}s`}
        pathLength="100"
        data-key=${key}
      ></path>
    `;
  }

  private _node(node: DiagramNode) {
    const icon: Record<NodeKind, string> = {
      pv: "☀",
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
    const clickable = Boolean(node.entity || node.heatPump);

    return svg`
      <g
        class=${`node ${node.kind} ${clickable ? "clickable" : ""}`}
        @click=${() => this._handleNodeClick(node)}
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
          <tspan dx="8">${this._short(node.title, 28)}</tspan>
        </text>
        <text x=${node.x + 14} y=${mainY} class="node-main">${node.main}</text>
        ${node.sub
          ? svg`<text x=${node.x + 14} y=${subY} class="node-sub">${this._short(node.sub, 34)}</text>`
          : nothing}
        ${node.heatPump
          ? svg`<text x=${node.x + node.w - 14} y=${node.y + 26} text-anchor="end" class="node-action">${this._heatExpanded ? "▲" : "▼"}</text>`
          : nothing}
      </g>
    `;
  }

  private _handleNodeClick(node: DiagramNode): void {
    if (node.heatPump) {
      this._heatExpanded = !this._heatExpanded;
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
              ${this._detailItem("COP", hp.cop)}
              ${this._detailItem("Tagesenergie", hp.daily_energy)}
            </div>
          `
          : html`<div class="empty-detail">Noch keine Detail-Entities für die Wärmepumpe konfiguriert.</div>`}
      </div>
    `;
  }

  render() {
    if (!this.hass) return nothing;

    const layout = this._layout();
    const pvTotal = this._totalPvW();

    return html`
      <ha-card>
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
                    `pv-child-${cluster.systemIndex}-${childIndex}`
                  );
                })}
                ${this._flowPath(
                  this._connectionPath(cluster.parent, layout.center),
                  this._positiveFlow(systemPower),
                  systemPower,
                  `pv-system-${cluster.systemIndex}`
                )}
              `;
            })}

            ${this._flowPath(
              this._horizontalPath(layout.grid, layout.center),
              this._gridFlow(),
              this._powerW(this._config.grid?.power),
              "grid"
            )}

            ${this._flowPath(
              this._horizontalPath(layout.center, layout.house),
              this._positiveFlow(this._housePowerInfo().value),
              this._housePowerInfo().value,
              "house"
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
                item.node.id
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
          <span class="hint">Layout passt sich automatisch an die Kartenbreite an.</span>
        </div>

        ${this._heatExpanded && this._config.heat_pump
          ? this._heatDetails(this._config.heat_pump)
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
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }

    .title {
      font-size: 24px;
      line-height: 1.2;
      font-weight: 700;
      color: var(--primary-text-color);
    }

    .subtitle {
      margin-top: 6px;
      font-size: 14px;
      color: var(--secondary-text-color);
    }

    .subtitle strong { color: var(--primary-text-color); }
    .separator { margin: 0 6px; }

    .version {
      font-size: 12px;
      color: var(--secondary-text-color);
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
      fill: color-mix(in srgb, var(--apfc-solar) 4%, var(--secondary-background-color));
      stroke: color-mix(in srgb, var(--apfc-solar) 20%, var(--divider-color));
      stroke-width: 1.2;
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

    @keyframes dash {
      to { stroke-dashoffset: -50; }
    }

    .node-bg {
      fill: var(--apfc-node-bg);
      stroke: color-mix(in srgb, var(--divider-color) 82%, var(--primary-color) 18%);
      stroke-width: 1.45;
      filter: drop-shadow(0 2px 2px color-mix(in srgb, var(--primary-text-color) 9%, transparent));
    }

    .node-bg.pv,
    .node-bg.pv-parent {
      fill: color-mix(in srgb, var(--apfc-solar) 8%, var(--card-background-color));
      stroke: color-mix(in srgb, var(--apfc-solar) 46%, var(--divider-color));
    }

    .node-bg.pv-parent {
      fill: color-mix(in srgb, var(--apfc-solar) 12%, var(--card-background-color));
      stroke-width: 1.8;
    }

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
      font-size: 17px;
      font-weight: 650;
    }

    .node-icon {
      fill: var(--primary-color);
      font-size: 19px;
    }

    .node-main {
      fill: var(--primary-text-color);
      font-size: 24px;
      font-weight: 750;
    }

    .node-sub {
      fill: var(--secondary-text-color);
      font-size: 13.5px;
    }

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

    .legend .hint { margin-left: auto; opacity: .75; }

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
    .detail-item span { font-size: 12px; color: var(--secondary-text-color); }
    .detail-item strong { font-size: 16px; color: var(--primary-text-color); }
    .empty-detail { color: var(--secondary-text-color); font-size: 13px; }

    @media (max-width: 700px) {
      ha-card { padding: 12px; }
      .title { font-size: 22px; }
      .subtitle { font-size: 13.5px; }
      .version { font-size: 11.5px; }
      .legend { font-size: 11.5px; gap: 10px; }
      .legend .hint { display: none; }
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
