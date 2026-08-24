import { LitElement, css, html, nothing, svg } from "lit";
import "./editor";
import type {
  AdvancedPowerFlowCardConfig,
  BatteryConfig,
  HomeAssistant,
  HassEntity,
  PvConfig
} from "./types";

const CARD_NAME = "Advanced Power Flow Card";
const CARD_VERSION = "0.1.0";

type FlowDirection = "forward" | "reverse" | "off";

interface NodeData {
  title: string;
  main: string;
  sub?: string;
  entity?: string;
  kind: "pv" | "center" | "grid" | "house" | "battery" | "heat";
  x: number;
  y: number;
  w: number;
  h: number;
}

export class AdvancedPowerFlowCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true }
  };

  hass?: HomeAssistant;
  private _config!: AdvancedPowerFlowCardConfig;

  static getConfigElement(): HTMLElement {
    return document.createElement("advanced-power-flow-card-editor");
  }

  static getStubConfig(): AdvancedPowerFlowCardConfig {
    return {
      type: "custom:advanced-power-flow-card",
      title: "Energiefluss",
      solar: {
        pv1: {
          name: "PV1",
          power: "sensor.goodwe_pv1_power",
          voltage: "sensor.goodwe_pv1_voltage",
          current: "sensor.goodwe_pv1_current"
        },
        pv2: {
          name: "PV2",
          power: "sensor.goodwe_pv2_power",
          voltage: "sensor.goodwe_pv2_voltage",
          current: "sensor.goodwe_pv2_current"
        },
        pv3: {
          name: "PV3",
          power: "sensor.goodwe_pv3_power",
          voltage: "sensor.goodwe_pv3_voltage",
          current: "sensor.goodwe_pv3_current"
        }
      },
      battery1: {
        name: "Batterie 1",
        power: "sensor.battery_1_power",
        soc: "sensor.battery_1_soc",
        positive_is_charging: true
      },
      battery2: {
        name: "Batterie 2",
        power: "sensor.battery_2_power",
        soc: "sensor.battery_2_soc",
        positive_is_charging: true
      },
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
        power: "sensor.heatpump_power"
      },
      power_threshold: 5
    };
  }

  setConfig(config: AdvancedPowerFlowCardConfig): void {
    if (!config) throw new Error("Konfiguration fehlt.");
    this._config = structuredClone(config);
  }

  getCardSize(): number {
    return 5;
  }

  getGridOptions() {
    return {
      rows: 5,
      columns: 12,
      min_rows: 4,
      min_columns: 6
    };
  }

  private _state(entityId?: string): HassEntity | undefined {
    if (!entityId || !this.hass) return undefined;
    return this.hass.states[entityId];
  }

  private _number(entityId?: string): number | undefined {
    const state = this._state(entityId);
    if (!state || state.state === "unknown" || state.state === "unavailable") {
      return undefined;
    }

    const value = Number(state.state.replace(",", "."));
    return Number.isFinite(value) ? value : undefined;
  }

  private _unit(entityId?: string): string {
    const unit = this._state(entityId)?.attributes?.unit_of_measurement;
    return typeof unit === "string" ? unit : "";
  }

  private _powerW(entityId?: string): number | undefined {
    const value = this._number(entityId);
    if (value === undefined) return undefined;

    const unit = this._unit(entityId).toLowerCase();
    if (unit === "kw") return value * 1000;
    if (unit === "mw") return value * 1_000_000;
    return value;
  }

  private _formatPower(entityId?: string): string {
    const watts = this._powerW(entityId);
    if (watts === undefined) return "—";

    const abs = Math.abs(watts);
    if (abs >= 1000) {
      return `${(watts / 1000).toLocaleString(undefined, {
        maximumFractionDigits: 2
      })} kW`;
    }
    return `${watts.toLocaleString(undefined, {
      maximumFractionDigits: 0
    })} W`;
  }

  private _formatMeasurement(entityId?: string, fallbackUnit = ""): string {
    const value = this._number(entityId);
    if (value === undefined) return "—";

    const unit = this._unit(entityId) || fallbackUnit;
    return `${value.toLocaleString(undefined, {
      maximumFractionDigits: 2
    })}${unit ? ` ${unit}` : ""}`;
  }

  private _formatSoc(entityId?: string): string {
    const value = this._number(entityId);
    return value === undefined
      ? "SOC —"
      : `SOC ${value.toLocaleString(undefined, {
          maximumFractionDigits: 0
        })} %`;
  }

  private _pvSub(config?: PvConfig): string {
    if (!config) return "";
    const voltage = this._formatMeasurement(config.voltage, "V");
    const current = this._formatMeasurement(config.current, "A");
    return `${voltage} · ${current}`;
  }

  private _threshold(): number {
    return Math.max(0, this._config.power_threshold ?? 5);
  }

  private _flowForPositivePower(entityId?: string): FlowDirection {
    const p = this._powerW(entityId);
    if (p === undefined || Math.abs(p) <= this._threshold()) return "off";
    return p > 0 ? "forward" : "reverse";
  }

  private _gridFlow(): FlowDirection {
    const p = this._powerW(this._config.grid?.power);
    if (p === undefined || Math.abs(p) <= this._threshold()) return "off";

    const positiveImport = this._config.grid?.positive_is_import ?? true;
    const isImport = positiveImport ? p > 0 : p < 0;
    return isImport ? "forward" : "reverse";
  }

  private _batteryFlow(config?: BatteryConfig): FlowDirection {
    const p = this._powerW(config?.power);
    if (p === undefined || Math.abs(p) <= this._threshold()) return "off";

    const positiveCharging = config?.positive_is_charging ?? true;
    const isCharging = positiveCharging ? p > 0 : p < 0;

    // Forward on battery paths means center -> battery.
    return isCharging ? "forward" : "reverse";
  }

  private _duration(entityId?: string): number {
    const p = Math.abs(this._powerW(entityId) ?? 0);
    if (p <= this._threshold()) return 2.4;

    // 100 W ≈ slow, several kW ≈ fast.
    const speed = Math.min(1, Math.log10(Math.max(100, p)) / 4);
    return 2.3 - speed * 1.5;
  }

  private _sumPvW(): number | undefined {
    const ids = [
      this._config.solar?.pv1?.power,
      this._config.solar?.pv2?.power,
      this._config.solar?.pv3?.power
    ];

    const values = ids
      .map((id) => this._powerW(id))
      .filter((v): v is number => v !== undefined);

    return values.length ? values.reduce((a, b) => a + b, 0) : undefined;
  }

  private _formatW(value?: number): string {
    if (value === undefined) return "—";
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toLocaleString(undefined, {
        maximumFractionDigits: 2
      })} kW`;
    }
    return `${value.toLocaleString(undefined, {
      maximumFractionDigits: 0
    })} W`;
  }

  private _flowPath(
    d: string,
    direction: FlowDirection,
    powerEntity?: string,
    key = ""
  ) {
    const duration = this._duration(powerEntity);
    return svg`
      <path d=${d} class="flow-base"></path>
      <path
        d=${d}
        class="flow ${direction}"
        style=${`--flow-duration:${duration}s`}
        pathLength="100"
        data-key=${key}
      ></path>
    `;
  }

  private _node(data: NodeData) {
    const icon = {
      pv: "☀",
      center: "⚡",
      grid: "⇄",
      house: "⌂",
      battery: "▰",
      heat: "♨"
    }[data.kind];

    const titleY = data.y + 29;
    const mainY = data.y + 57;
    const subY = data.y + 78;

    return svg`
      <g
        class=${`node ${data.entity ? "clickable" : ""}`}
        @click=${() => data.entity && this._openMoreInfo(data.entity)}
      >
        <rect
          x=${data.x}
          y=${data.y}
          width=${data.w}
          height=${data.h}
          rx="16"
          ry="16"
          class=${`node-bg ${data.kind}`}
        ></rect>

        <text x=${data.x + 16} y=${titleY} class="node-title">
          <tspan class="node-icon">${icon}</tspan>
          <tspan dx="7">${data.title}</tspan>
        </text>

        <text x=${data.x + 16} y=${mainY} class="node-main">
          ${data.main}
        </text>

        ${data.sub
          ? svg`<text x=${data.x + 16} y=${subY} class="node-sub">${data.sub}</text>`
          : nothing}
      </g>
    `;
  }

  private _openMoreInfo(entity: string): void {
    const event = new Event("hass-action", {
      bubbles: true,
      composed: true
    }) as Event & { detail?: unknown };

    event.detail = {
      config: {
        entity,
        tap_action: { action: "more-info" }
      },
      action: "tap"
    };

    this.dispatchEvent(event);
  }

  render() {
    if (!this._config || !this.hass) return nothing;

    const pv1 = this._config.solar?.pv1;
    const pv2 = this._config.solar?.pv2;
    const pv3 = this._config.solar?.pv3;
    const battery1 = this._config.battery1;
    const battery2 = this._config.battery2;
    const grid = this._config.grid;
    const house = this._config.house;
    const heatPump = this._config.heat_pump;

    const pvTotal = this._sumPvW();

    return html`
      <ha-card>
        <div class="header">
          <div>
            <div class="title">${this._config.title ?? "Energiefluss"}</div>
            <div class="subtitle">PV gesamt ${this._formatW(pvTotal)}</div>
          </div>
          <div class="version">v${CARD_VERSION}</div>
        </div>

        <div class="canvas">
          <svg
            viewBox="0 0 1000 650"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Energiefluss"
          >
            ${this._flowPath(
              "M 170 142 C 170 210, 360 210, 455 270",
              this._flowForPositivePower(pv1?.power),
              pv1?.power,
              "pv1"
            )}
            ${this._flowPath(
              "M 500 142 L 500 258",
              this._flowForPositivePower(pv2?.power),
              pv2?.power,
              "pv2"
            )}
            ${this._flowPath(
              "M 830 142 C 830 210, 640 210, 545 270",
              this._flowForPositivePower(pv3?.power),
              pv3?.power,
              "pv3"
            )}

            ${this._flowPath(
              "M 260 334 L 430 334",
              this._gridFlow(),
              grid?.power,
              "grid"
            )}

            ${this._flowPath(
              "M 570 334 L 740 334",
              this._flowForPositivePower(house?.power),
              house?.power,
              "house"
            )}

            ${this._flowPath(
              "M 450 386 C 430 430, 385 455, 350 490",
              this._batteryFlow(battery1),
              battery1?.power,
              "battery1"
            )}

            ${this._flowPath(
              "M 550 386 C 570 430, 615 455, 650 490",
              this._batteryFlow(battery2),
              battery2?.power,
              "battery2"
            )}

            ${this._flowPath(
              "M 840 395 L 840 490",
              this._flowForPositivePower(heatPump?.power),
              heatPump?.power,
              "heatpump"
            )}

            ${this._node({
              title: pv1?.name ?? "PV1",
              main: this._formatPower(pv1?.power),
              sub: this._pvSub(pv1),
              entity: pv1?.power,
              kind: "pv",
              x: 70,
              y: 55,
              w: 200,
              h: 88
            })}

            ${this._node({
              title: pv2?.name ?? "PV2",
              main: this._formatPower(pv2?.power),
              sub: this._pvSub(pv2),
              entity: pv2?.power,
              kind: "pv",
              x: 400,
              y: 55,
              w: 200,
              h: 88
            })}

            ${this._node({
              title: pv3?.name ?? "PV3",
              main: this._formatPower(pv3?.power),
              sub: this._pvSub(pv3),
              entity: pv3?.power,
              kind: "pv",
              x: 730,
              y: 55,
              w: 200,
              h: 88
            })}

            ${this._node({
              title: "PV / Wechselrichter",
              main: this._formatW(pvTotal),
              sub: "Zentraler Energiefluss",
              kind: "center",
              x: 430,
              y: 278,
              w: 140,
              h: 108
            })}

            ${this._node({
              title: "Netz",
              main: this._formatPower(grid?.power),
              sub:
                this._gridFlow() === "forward"
                  ? "Bezug"
                  : this._gridFlow() === "reverse"
                    ? "Einspeisung"
                    : "Ruhe",
              entity: grid?.power,
              kind: "grid",
              x: 60,
              y: 290,
              w: 200,
              h: 88
            })}

            ${this._node({
              title: house?.name ?? "Haus",
              main: this._formatPower(house?.power),
              sub: "Gesamtverbrauch",
              entity: house?.power,
              kind: "house",
              x: 740,
              y: 290,
              w: 200,
              h: 105
            })}

            ${this._node({
              title: battery1?.name ?? "Batterie 1",
              main: this._formatPower(battery1?.power),
              sub: this._formatSoc(battery1?.soc),
              entity: battery1?.power ?? battery1?.soc,
              kind: "battery",
              x: 215,
              y: 490,
              w: 240,
              h: 96
            })}

            ${this._node({
              title: battery2?.name ?? "Batterie 2",
              main: this._formatPower(battery2?.power),
              sub: this._formatSoc(battery2?.soc),
              entity: battery2?.power ?? battery2?.soc,
              kind: "battery",
              x: 545,
              y: 490,
              w: 240,
              h: 96
            })}

            ${this._node({
              title: heatPump?.name ?? "Wärmepumpe",
              main: this._formatPower(heatPump?.power),
              sub: "Teil des Hausverbrauchs",
              entity: heatPump?.power,
              kind: "heat",
              x: 760,
              y: 490,
              w: 180,
              h: 96
            })}
          </svg>
        </div>

        <div class="legend">
          <span><i class="dot active"></i> aktiver Energiefluss</span>
          <span><i class="dot idle"></i> kein relevanter Fluss</span>
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
      --apfc-flow: var(--primary-color);
      --apfc-line: color-mix(
        in srgb,
        var(--secondary-text-color) 36%,
        transparent
      );
      --apfc-node-bg: color-mix(
        in srgb,
        var(--card-background-color) 92%,
        var(--primary-color) 8%
      );
    }

    ha-card {
      overflow: hidden;
      padding: 16px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 4px;
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .subtitle,
    .version {
      margin-top: 3px;
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .canvas {
      width: 100%;
      min-height: 360px;
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      min-height: 360px;
      overflow: visible;
    }

    .flow-base {
      fill: none;
      stroke: var(--apfc-line);
      stroke-width: 8;
      stroke-linecap: round;
    }

    .flow {
      fill: none;
      stroke: var(--apfc-flow);
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: 8 14;
      opacity: 0.95;
      animation: dash var(--flow-duration, 1.4s) linear infinite;
    }

    .flow.reverse {
      animation-direction: reverse;
    }

    .flow.off {
      opacity: 0;
      animation: none;
    }

    @keyframes dash {
      to {
        stroke-dashoffset: -44;
      }
    }

    .node-bg {
      fill: var(--apfc-node-bg);
      stroke: color-mix(
        in srgb,
        var(--divider-color) 85%,
        var(--primary-color) 15%
      );
      stroke-width: 1.4;
    }

    .node-bg.center {
      fill: color-mix(
        in srgb,
        var(--primary-color) 13%,
        var(--card-background-color)
      );
      stroke: color-mix(
        in srgb,
        var(--primary-color) 55%,
        var(--divider-color)
      );
    }

    .node-title {
      fill: var(--secondary-text-color);
      font-size: 15px;
      font-weight: 600;
    }

    .node-icon {
      fill: var(--primary-color);
      font-size: 18px;
    }

    .node-main {
      fill: var(--primary-text-color);
      font-size: 21px;
      font-weight: 700;
    }

    .node-sub {
      fill: var(--secondary-text-color);
      font-size: 12px;
    }

    .clickable {
      cursor: pointer;
    }

    .clickable:hover .node-bg {
      stroke: var(--primary-color);
      stroke-width: 2;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 2px;
      color: var(--secondary-text-color);
      font-size: 11px;
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot.active {
      background: var(--primary-color);
    }

    .dot.idle {
      background: var(--divider-color);
    }

    @media (max-width: 700px) {
      ha-card {
        padding: 12px;
      }

      .canvas {
        min-height: 320px;
      }

      svg {
        min-height: 320px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .flow {
        animation: none;
      }
    }
  `;
}

if (!customElements.get("advanced-power-flow-card")) {
  customElements.define("advanced-power-flow-card", AdvancedPowerFlowCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "advanced-power-flow-card",
  name: CARD_NAME,
  description:
    "Power-flow visualization with three PV strings, two batteries, grid, house and heat pump.",
  preview: true,
  configurable: true
});

console.info(
  `%c ${CARD_NAME} %c v${CARD_VERSION} `,
  "background:#03a9f4;color:white;font-weight:700;",
  "background:#222;color:white;"
);
