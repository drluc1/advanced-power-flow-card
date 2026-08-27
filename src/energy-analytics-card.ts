import { LitElement, css, html, nothing, svg } from "lit";
import "./energy-analytics-editor";
import type { HomeAssistant } from "./types";
import type {
  AnalyticsPvInputConfig,
  AnalyticsPvSystemConfig,
  AnalyticsRange,
  EnergyAnalyticsCardConfig,
  StatisticRow,
  StatisticsResult
} from "./energy-analytics-types";

const CARD_NAME = "Energy Analytics Card";
const CARD_VERSION = "0.3.1";

type EnergySeriesKey =
  | "pv_total"
  | "house"
  | "grid_import"
  | "grid_export"
  | "battery_charge"
  | "battery_discharge"
  | "heat_pump"
  | "wallbox";

interface SeriesDef {
  key: EnergySeriesKey;
  label: string;
  entity?: string;
}

interface BucketValue {
  start: number;
  label: string;
  shortLabel: string;
  values: Partial<Record<EnergySeriesKey, number>>;
}

interface StatisticMetadata {
  statistic_id: string;
  has_sum?: boolean;
  display_unit_of_measurement?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finite(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export class EnergyAnalyticsCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _range: { state: true },
    _stats: { state: true },
    _loading: { state: true },
    _error: { state: true },
    _enabledSeries: { state: true },
    _selectedBucketStart: { state: true },
    _missingStatistics: { state: true }
  };

  hass?: HomeAssistant;
  private _config!: EnergyAnalyticsCardConfig;
  private _range: AnalyticsRange = "days";
  private _stats: StatisticsResult = {};
  private _loading = false;
  private _error = "";
  private _enabledSeries: EnergySeriesKey[] = ["pv_total", "house"];
  private _selectedBucketStart?: number;
  private _missingStatistics: string[] = [];
  private _lastLoadKey = "";

  static getConfigElement(): HTMLElement {
    return document.createElement("energy-analytics-card-editor");
  }

  static getStubConfig(): EnergyAnalyticsCardConfig {
    return {
      type: "custom:energy-analytics-card",
      title: "Energy Analytics",
      default_range: "days",
      day_count: 30,
      month_count: 12,
      year_count: 5,
      text_size: "large",
      energy: {
        pv_total: "sensor.pv_energy_total",
        house: "sensor.house_energy_total",
        grid_import: "sensor.grid_import_total",
        grid_export: "sensor.grid_export_total",
        battery_charge: "sensor.battery_charge_energy_total",
        battery_discharge: "sensor.battery_discharge_energy_total",
        heat_pump: "sensor.heatpump_energy_total"
      },
      solar: [
        {
          name: "Hausdach",
          energy: "sensor.pv_roof_energy_total",
          installed_kwp: 7.92,
          children: [
            { name: "MPPT 1", energy: "sensor.pv_roof_mppt1_energy_total", installed_kwp: 4.95 },
            { name: "MPPT 2", energy: "sensor.pv_roof_mppt2_energy_total", installed_kwp: 2.97 }
          ]
        }
      ]
    };
  }

  setConfig(config: EnergyAnalyticsCardConfig): void {
    if (!config) throw new Error("Konfiguration fehlt.");
    this._config = structuredClone(config);
    this._range = config.default_range ?? "days";
    this._lastLoadKey = "";
  }

  getCardSize(): number { return 7; }

  getGridOptions() {
    return { rows: 7, columns: 12, min_rows: 5, min_columns: 6 };
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (!this.hass?.callWS || !this._config) return;
    if (changed.has("hass") || changed.has("_config") || changed.has("_range")) {
      const key = this._loadKey();
      if (key !== this._lastLoadKey) {
        this._lastLoadKey = key;
        void this._loadStatistics();
      }
    }
  }

  private _loadKey(): string {
    return `${this._range}:${JSON.stringify(this._config?.energy ?? {})}:${JSON.stringify(this._config?.solar ?? [])}`;
  }

  private _rangeInfo(): { start: Date; end: Date; period: "day" | "month" | "year"; count: number } {
    const now = new Date();
    if (this._range === "months") {
      const count = clamp(Math.round(this._config.month_count ?? 12), 1, 36);
      const start = new Date(now.getFullYear(), now.getMonth() - count + 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end, period: "month", count };
    }
    if (this._range === "years") {
      const count = clamp(Math.round(this._config.year_count ?? 5), 1, 15);
      const start = new Date(now.getFullYear() - count + 1, 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end, period: "year", count };
    }
    const count = clamp(Math.round(this._config.day_count ?? 30), 1, 92);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - count + 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { start, end, period: "day", count };
  }

  private _allStatisticIds(): string[] {
    const ids = new Set<string>();
    Object.values(this._config.energy ?? {}).forEach((id) => {
      if (typeof id === "string" && id) ids.add(id);
    });
    for (const system of this._config.solar ?? []) {
      if (system.energy) ids.add(system.energy);
      for (const child of system.children ?? []) if (child.energy) ids.add(child.energy);
    }
    for (const battery of this._config.batteries ?? []) {
      if (battery.charge_energy) ids.add(battery.charge_energy);
      if (battery.discharge_energy) ids.add(battery.discharge_energy);
    }
    return [...ids];
  }

  private async _loadStatistics(): Promise<void> {
    if (!this.hass?.callWS) return;
    const ids = this._allStatisticIds();
    if (!ids.length) {
      this._stats = {};
      this._error = "Keine Langzeit-Energiesensoren konfiguriert.";
      return;
    }

    this._loading = true;
    this._error = "";
    try {
      const { start, end, period } = this._rangeInfo();
      const [stats, metadata] = await Promise.all([
        this.hass.callWS<StatisticsResult>({
          type: "recorder/statistics_during_period",
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          statistic_ids: ids,
          period,
          units: { energy: "kWh" },
          types: ["change", "sum", "state"]
        }),
        this.hass.callWS<StatisticMetadata[]>({
          type: "recorder/get_statistics_metadata",
          statistic_ids: ids
        }).catch(() => [] as StatisticMetadata[])
      ]);
      this._stats = stats ?? {};
      const available = new Set((metadata ?? []).map((m) => m.statistic_id));
      this._missingStatistics = available.size ? ids.filter((id) => !available.has(id)) : [];
      const buckets = this._energyBuckets();
      if (buckets.length) this._selectedBucketStart = buckets[buckets.length - 1].start;
    } catch (error) {
      this._error = error instanceof Error ? error.message : String(error);
      this._stats = {};
    } finally {
      this._loading = false;
    }
  }

  private _rowValue(row?: StatisticRow): number | undefined {
    if (!row) return undefined;
    const change = finite(row.change);
    if (change !== undefined) return Math.max(0, change);
    return undefined;
  }

  private _valueAt(entity: string | undefined, start: number): number | undefined {
    if (!entity) return undefined;
    const rows = this._stats[entity] ?? [];
    const row = rows.find((candidate) => candidate.start === start);
    return this._rowValue(row);
  }

  private _seriesDefs(): SeriesDef[] {
    const energy = this._config.energy ?? {};
    return [
      { key: "pv_total", label: "PV", entity: energy.pv_total },
      { key: "house", label: "Haus", entity: energy.house },
      { key: "grid_import", label: "Netzbezug", entity: energy.grid_import },
      { key: "grid_export", label: "Einspeisung", entity: energy.grid_export },
      { key: "battery_charge", label: "Akku laden", entity: energy.battery_charge },
      { key: "battery_discharge", label: "Akku entladen", entity: energy.battery_discharge },
      { key: "heat_pump", label: "Wärmepumpe", entity: energy.heat_pump },
      { key: "wallbox", label: "Wallbox", entity: energy.wallbox }
    ].filter((s) => !!s.entity) as SeriesDef[];
  }

  private _canonicalStarts(): number[] {
    const ids = this._allStatisticIds();
    const starts = new Set<number>();
    const { start, end, count } = this._rangeInfo();
    const min = start.getTime();
    const max = end.getTime();
    for (const id of ids) {
      for (const row of this._stats[id] ?? []) {
        if (row.start >= min && row.start < max) starts.add(row.start);
      }
    }
    return [...starts].sort((a, b) => a - b).slice(-count);
  }

  private _bucketLabel(start: number, short = false): string {
    const d = new Date(start);
    if (this._range === "years") return String(d.getFullYear());
    if (this._range === "months") {
      return d.toLocaleDateString(undefined, short ? { month: "short" } : { month: "long", year: "numeric" });
    }
    return d.toLocaleDateString(undefined, short ? { day: "2-digit", month: "2-digit" } : { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  private _energyBuckets(): BucketValue[] {
    const series = this._seriesDefs();
    return this._canonicalStarts().map((start) => {
      const values: Partial<Record<EnergySeriesKey, number>> = {};
      for (const def of series) {
        const value = this._valueAt(def.entity, start);
        if (value !== undefined) values[def.key] = value;
      }
      return { start, label: this._bucketLabel(start), shortLabel: this._bucketLabel(start, true), values };
    });
  }

  private _systemEnergyAt(system: AnalyticsPvSystemConfig, start: number): number | undefined {
    const direct = this._valueAt(system.energy, start);
    if (direct !== undefined) return direct;
    const childValues = (system.children ?? [])
      .map((child) => this._valueAt(child.energy, start))
      .filter((v): v is number => v !== undefined);
    return childValues.length ? childValues.reduce((a, b) => a + b, 0) : undefined;
  }

  private _systemEfficiencyAt(system: AnalyticsPvSystemConfig, start: number): number | undefined {
    const energy = this._systemEnergyAt(system, start);
    const kwp = finite(system.installed_kwp);
    if (energy === undefined || !kwp || kwp <= 0) return undefined;
    return energy / kwp;
  }

  private _toggleSeries(key: EnergySeriesKey): void {
    const current = new Set(this._enabledSeries);
    if (current.has(key)) {
      if (current.size > 1) current.delete(key);
    } else current.add(key);
    this._enabledSeries = [...current];
  }

  private _formatEnergy(value?: number): string {
    if (value === undefined || !Number.isFinite(value)) return "—";
    if (value >= 1000) return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} MWh`;
    return `${value.toLocaleString(undefined, { maximumFractionDigits: value < 10 ? 2 : 1 })} kWh`;
  }

  private _formatEfficiency(value?: number): string {
    if (value === undefined || !Number.isFinite(value)) return "—";
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh/kWp`;
  }

  private _formatPercent(value?: number): string {
    if (value === undefined || !Number.isFinite(value)) return "—";
    return `${clamp(value, 0, 100).toLocaleString(undefined, { maximumFractionDigits: 1 })} %`;
  }

  private _energyChart() {
    const buckets = this._energyBuckets();
    const defs = this._seriesDefs().filter((def) => this._enabledSeries.includes(def.key));
    if (!buckets.length || !defs.length) return html`<div class="empty">Für diesen Zeitraum sind keine Statistikdaten vorhanden.</div>`;

    const W = 1000, H = 360;
    const left = 58, right = 18, top = 20, bottom = 58;
    const chartW = W - left - right, chartH = H - top - bottom;
    const max = Math.max(1, ...buckets.flatMap((b) => defs.map((d) => b.values[d.key] ?? 0)));
    const slot = chartW / buckets.length;
    const groupWidth = slot * 0.72;
    const barWidth = Math.max(1.5, groupWidth / defs.length);
    const labelStep = Math.max(1, Math.ceil(buckets.length / 8));

    return html`
      <div class="chart-shell">
        <svg viewBox="0 0 ${W} ${H}" class="chart" aria-label="Energieverlauf">
          ${[0, .25, .5, .75, 1].map((ratio) => {
            const y = top + chartH * (1 - ratio);
            const value = max * ratio;
            return svg`
              <line x1=${left} x2=${W-right} y1=${y} y2=${y} class="gridline"></line>
              <text x=${left-9} y=${y+4} text-anchor="end" class="axis-label">${value.toLocaleString(undefined,{maximumFractionDigits:1})}</text>
            `;
          })}
          ${buckets.map((bucket, bi) => {
            const baseX = left + bi * slot + (slot - groupWidth) / 2;
            const selected = bucket.start === this._selectedBucketStart;
            return svg`
              ${selected ? svg`<rect x=${left + bi*slot} y=${top} width=${slot} height=${chartH} class="selected-band"></rect>` : nothing}
              ${defs.map((def, si) => {
                const value = bucket.values[def.key] ?? 0;
                const height = chartH * value / max;
                const x = baseX + si * barWidth;
                const y = top + chartH - height;
                return svg`<rect x=${x} y=${y} width=${Math.max(1,barWidth-1.5)} height=${Math.max(0,height)} rx="2" class=${`bar series-${def.key}`}>
                  <title>${bucket.label} · ${def.label}: ${this._formatEnergy(value)}</title>
                </rect>`;
              })}
              <rect x=${left+bi*slot} y=${top} width=${slot} height=${chartH} class="hit" @click=${() => this._selectedBucketStart = bucket.start}></rect>
              ${bi % labelStep === 0 || bi === buckets.length - 1 ? svg`<text x=${left + bi*slot + slot/2} y=${H-28} text-anchor="middle" class="x-label">${bucket.shortLabel}</text>` : nothing}
            `;
          })}
          <text x="14" y=${top+chartH/2} transform=${`rotate(-90 14 ${top+chartH/2})`} text-anchor="middle" class="axis-title">kWh</text>
        </svg>
      </div>
    `;
  }

  private _pvEfficiencyChart() {
    const systems = (this._config.solar ?? []).filter((s) => (s.installed_kwp ?? 0) > 0 && (!!s.energy || (s.children ?? []).some((c) => !!c.energy)));
    const starts = this._canonicalStarts();
    if (!systems.length || !starts.length) return nothing;

    const W = 1000, H = 330;
    const left = 58, right = 18, top = 20, bottom = 58;
    const chartW = W-left-right, chartH = H-top-bottom;
    const values = starts.flatMap((start) => systems.map((system) => this._systemEfficiencyAt(system,start) ?? 0));
    const max = Math.max(0.1, ...values);
    const slot = chartW / starts.length;
    const groupWidth = slot * .72;
    const barWidth = Math.max(1.5, groupWidth / systems.length);
    const labelStep = Math.max(1, Math.ceil(starts.length / 8));

    return html`
      <section class="panel">
        <div class="panel-head">
          <div><h3>PV-Effizienz</h3><p>Spezifischer Ertrag – Anlagen unterschiedlicher Größe direkt vergleichbar.</p></div>
          <span class="unit-badge">kWh/kWp</span>
        </div>
        <div class="legend-row">${systems.map((s,i) => html`<span><i class=${`legend-swatch pv-${i%5}`}></i>${s.name ?? `PV ${i+1}`}</span>`)}</div>
        <div class="chart-shell">
          <svg viewBox="0 0 ${W} ${H}" class="chart" aria-label="PV Effizienz">
            ${[0,.25,.5,.75,1].map((ratio) => {
              const y=top+chartH*(1-ratio); const value=max*ratio;
              return svg`<line x1=${left} x2=${W-right} y1=${y} y2=${y} class="gridline"></line><text x=${left-9} y=${y+4} text-anchor="end" class="axis-label">${value.toLocaleString(undefined,{maximumFractionDigits:2})}</text>`;
            })}
            ${starts.map((start,bi) => {
              const baseX=left+bi*slot+(slot-groupWidth)/2;
              return svg`
                ${systems.map((system,si) => {
                  const value=this._systemEfficiencyAt(system,start) ?? 0;
                  const height=chartH*value/max;
                  return svg`<rect x=${baseX+si*barWidth} y=${top+chartH-height} width=${Math.max(1,barWidth-1.5)} height=${height} rx="2" class=${`bar pv-${si%5}`}><title>${this._bucketLabel(start)} · ${system.name}: ${this._formatEfficiency(value)}</title></rect>`;
                })}
                ${bi%labelStep===0 || bi===starts.length-1 ? svg`<text x=${left+bi*slot+slot/2} y=${H-28} text-anchor="middle" class="x-label">${this._bucketLabel(start,true)}</text>` : nothing}
              `;
            })}
          </svg>
        </div>
      </section>
    `;
  }

  private _selectedBucket() {
    const buckets = this._energyBuckets();
    return buckets.find((b) => b.start === this._selectedBucketStart) ?? buckets[buckets.length-1];
  }

  private _selectedDetail() {
    const bucket = this._selectedBucket();
    if (!bucket) return nothing;
    const energy = bucket.values;
    const pv = energy.pv_total;
    const house = energy.house;
    const gridImport = energy.grid_import;
    const gridExport = energy.grid_export;
    const autarky = house && gridImport !== undefined && house > 0 ? 100*(1-gridImport/house) : undefined;
    const selfUse = pv && gridExport !== undefined && pv > 0 ? 100*(1-gridExport/pv) : undefined;
    const hpElectric = this._valueAt(this._config.energy?.heat_pump, bucket.start);
    const hpThermal = this._valueAt(this._config.energy?.heat_pump_thermal, bucket.start);
    const jaz = hpElectric && hpThermal !== undefined && hpElectric > 0 ? hpThermal/hpElectric : undefined;

    return html`
      <section class="panel selected-detail">
        <div class="panel-head"><div><h3>${bucket.label}</h3><p>Detailwerte des ausgewählten Balkens.</p></div></div>
        <div class="metric-grid">
          ${this._metric("PV", pv, "energy")}
          ${this._metric("Haus", house, "energy")}
          ${this._metric("Netzbezug", gridImport, "energy")}
          ${this._metric("Einspeisung", gridExport, "energy")}
          ${this._metric("Akku geladen", energy.battery_charge, "energy")}
          ${this._metric("Akku entladen", energy.battery_discharge, "energy")}
          ${this._metric("Autarkie", autarky, "percent")}
          ${this._metric("Eigenverbrauch", selfUse, "percent")}
          ${this._metric("Wärmepumpe", hpElectric, "energy")}
          ${this._metric("JAZ/COP Zeitraum", jaz, "number")}
        </div>
        ${(this._config.solar ?? []).length ? html`
          <h4>PV-Systeme</h4>
          <div class="pv-table">
            ${(this._config.solar ?? []).map((system) => {
              const sysEnergy = this._systemEnergyAt(system,bucket.start);
              const efficiency = this._systemEfficiencyAt(system,bucket.start);
              return html`
                <div class="pv-system-row">
                  <div class="pv-system-title"><strong>${system.name ?? "PV-System"}</strong><span>${this._formatEnergy(sysEnergy)} · ${this._formatEfficiency(efficiency)}</span></div>
                  ${(system.children ?? []).length ? html`<div class="mppt-list">
                    ${(system.children ?? []).map((child) => this._mpptRow(child,bucket.start,sysEnergy))}
                  </div>` : nothing}
                </div>
              `;
            })}
          </div>
        ` : nothing}
      </section>
    `;
  }

  private _mpptRow(child: AnalyticsPvInputConfig, start: number, systemEnergy?: number) {
    const energy = this._valueAt(child.energy,start);
    const kwp = finite(child.installed_kwp);
    const eff = energy !== undefined && kwp && kwp>0 ? energy/kwp : undefined;
    const share = energy !== undefined && systemEnergy && systemEnergy>0 ? 100*energy/systemEnergy : undefined;
    return html`<div class="mppt-row"><span>${child.name ?? "MPPT"}</span><strong>${this._formatEnergy(energy)}</strong><span>${this._formatEfficiency(eff)}</span><span>${share === undefined ? "—" : this._formatPercent(share)}</span></div>`;
  }

  private _metric(label: string, value: number | undefined, type: "energy"|"percent"|"number") {
    let text="—";
    if (type==="energy") text=this._formatEnergy(value);
    else if (type==="percent") text=this._formatPercent(value);
    else if (value!==undefined) text=value.toLocaleString(undefined,{maximumFractionDigits:2});
    return html`<div class="metric"><span>${label}</span><strong>${text}</strong></div>`;
  }

  private _summary() {
    const bucket = this._selectedBucket();
    if (!bucket) return nothing;
    const v=bucket.values;
    const autarky=v.house && v.grid_import!==undefined && v.house>0 ? 100*(1-v.grid_import/v.house) : undefined;
    return html`
      <div class="summary-grid">
        ${this._metric("PV",v.pv_total,"energy")}
        ${this._metric("Haus",v.house,"energy")}
        ${this._metric("Netzbezug",v.grid_import,"energy")}
        ${this._metric("Autarkie",autarky,"percent")}
      </div>
    `;
  }

  render() {
    if (!this._config) return nothing;
    const defs=this._seriesDefs();
    const textSize=this._config.text_size ?? "large";
    return html`
      <ha-card class=${`text-${textSize}`}>
        <div class="header">
          <div><div class="title">${this._config.title ?? "Energy Analytics"}</div><div class="subtitle">Langzeitstatistik aus Home Assistant Recorder</div></div>
          <div class="version">v${CARD_VERSION}</div>
        </div>

        <div class="range-tabs">
          <button class=${this._range==="days"?"active":""} @click=${()=>this._range="days"}>${this._config.day_count ?? 30} Tage</button>
          <button class=${this._range==="months"?"active":""} @click=${()=>this._range="months"}>${this._config.month_count ?? 12} Monate</button>
          <button class=${this._range==="years"?"active":""} @click=${()=>this._range="years"}>${this._config.year_count ?? 5} Jahre</button>
          <button class="refresh" @click=${()=>{this._lastLoadKey=""; void this._loadStatistics();}}>↻</button>
        </div>

        ${this._loading ? html`<div class="notice">Statistikdaten werden geladen …</div>` : nothing}
        ${this._error ? html`<div class="notice error">${this._error}</div>` : nothing}
        ${this._missingStatistics.length ? html`<div class="notice warn"><strong>Keine Long-Term-Statistics:</strong> ${this._missingStatistics.join(", ")}</div>` : nothing}

        ${this._summary()}

        <section class="panel">
          <div class="panel-head"><div><h3>Energieverlauf</h3><p>Balken anklicken, um den Zeitraum unten im Detail zu öffnen.</p></div><span class="unit-badge">kWh</span></div>
          <div class="series-buttons">
            ${defs.map((def)=>html`<button class=${this._enabledSeries.includes(def.key)?`on series-${def.key}`:""} @click=${()=>this._toggleSeries(def.key)}>${def.label}</button>`)}
          </div>
          ${this._energyChart()}
        </section>

        ${this._pvEfficiencyChart()}
        ${this._selectedDetail()}
      </ha-card>
    `;
  }

  static styles=css`
    :host{display:block;--eac-pv:#f5a623;--eac-house:#00a6c7;--eac-grid:#4aa3df;--eac-export:#8bc34a;--eac-battery:#45b96f;--eac-heat:#e67e22;--eac-wallbox:#7f8c8d}
    ha-card{padding:16px;overflow:hidden}
    .header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.title{font-size:24px;font-weight:700}.subtitle,.version{color:var(--secondary-text-color);font-size:12px}.subtitle{margin-top:3px}
    .text-normal{--metric-main:17px;--body:12px}.text-large{--metric-main:19px;--body:13px}.text-xlarge{--metric-main:21px;--body:14px}
    .range-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.range-tabs button,.series-buttons button{border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--secondary-text-color);border-radius:10px;padding:8px 12px;cursor:pointer}.range-tabs button.active{color:var(--primary-text-color);border-color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 12%,var(--card-background-color))}.range-tabs .refresh{margin-left:auto}
    .notice{padding:10px 12px;border:1px solid var(--divider-color);border-radius:10px;margin-bottom:10px;color:var(--secondary-text-color)}.notice.error{border-color:var(--error-color);color:var(--error-color)}.notice.warn{border-color:var(--warning-color,#f5a623)}
    .summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:12px}.metric{display:grid;gap:4px;padding:10px 12px;border:1px solid var(--divider-color);border-radius:12px;background:color-mix(in srgb,var(--card-background-color) 96%,var(--primary-color) 4%)}.metric span{font-size:var(--body);color:var(--secondary-text-color)}.metric strong{font-size:var(--metric-main)}
    .panel{border:1px solid var(--divider-color);border-radius:14px;padding:12px;margin-top:12px}.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.panel h3{margin:0;font-size:17px}.panel h4{margin:16px 0 8px}.panel p{margin:3px 0 0;color:var(--secondary-text-color);font-size:12px}.unit-badge{font-size:11px;border:1px solid var(--divider-color);border-radius:999px;padding:4px 7px;color:var(--secondary-text-color)}
    .series-buttons{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0 4px}.series-buttons button{padding:6px 9px;font-size:11px}.series-buttons button.on{color:var(--primary-text-color);font-weight:600}.series-buttons button.on.series-pv_total{border-color:var(--eac-pv)}.series-buttons button.on.series-house{border-color:var(--eac-house)}.series-buttons button.on.series-grid_import{border-color:var(--eac-grid)}.series-buttons button.on.series-grid_export{border-color:var(--eac-export)}.series-buttons button.on.series-battery_charge,.series-buttons button.on.series-battery_discharge{border-color:var(--eac-battery)}.series-buttons button.on.series-heat_pump{border-color:var(--eac-heat)}.series-buttons button.on.series-wallbox{border-color:var(--eac-wallbox)}
    .chart-shell{width:100%;overflow:hidden}.chart{display:block;width:100%;height:auto;min-height:220px}.gridline{stroke:var(--divider-color);stroke-width:1}.axis-label,.x-label,.axis-title{fill:var(--secondary-text-color);font-size:11px}.selected-band{fill:color-mix(in srgb,var(--primary-color) 9%,transparent)}.hit{fill:transparent;cursor:pointer}.bar{opacity:.88}.bar:hover{opacity:1}.series-pv_total{fill:var(--eac-pv)}.series-house{fill:var(--eac-house)}.series-grid_import{fill:var(--eac-grid)}.series-grid_export{fill:var(--eac-export)}.series-battery_charge,.series-battery_discharge{fill:var(--eac-battery)}.series-heat_pump{fill:var(--eac-heat)}.series-wallbox{fill:var(--eac-wallbox)}
    .pv-0{fill:#f5a623;background:#f5a623}.pv-1{fill:#ffcc54;background:#ffcc54}.pv-2{fill:#d99000;background:#d99000}.pv-3{fill:#f08a24;background:#f08a24}.pv-4{fill:#b87500;background:#b87500}.legend-row{display:flex;flex-wrap:wrap;gap:10px;margin:9px 0 0;font-size:11px;color:var(--secondary-text-color)}.legend-row span{display:inline-flex;align-items:center;gap:5px}.legend-swatch{width:8px;height:8px;border-radius:2px;display:inline-block}
    .metric-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-top:10px}.pv-table{display:grid;gap:8px}.pv-system-row{border:1px solid var(--divider-color);border-radius:11px;padding:10px;background:color-mix(in srgb,var(--card-background-color) 96%,var(--eac-pv) 4%)}.pv-system-title{display:flex;justify-content:space-between;gap:10px;align-items:center}.pv-system-title span{font-size:12px;color:var(--secondary-text-color)}.mppt-list{display:grid;gap:5px;margin-top:8px}.mppt-row{display:grid;grid-template-columns:1.3fr .8fr 1fr .65fr;gap:8px;padding:6px 7px;border-top:1px solid color-mix(in srgb,var(--divider-color) 65%,transparent);font-size:11px}.mppt-row span{color:var(--secondary-text-color)}.mppt-row strong{color:var(--primary-text-color)}
    .empty{padding:30px;text-align:center;color:var(--secondary-text-color)}
    @media(max-width:700px){ha-card{padding:10px}.title{font-size:21px}.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.panel{padding:9px}.chart{min-height:190px}.range-tabs button{padding:7px 9px}.mppt-row{grid-template-columns:1fr 1fr}.pv-system-title{align-items:flex-start;flex-direction:column;gap:3px}}
  `;
}

if(!customElements.get("energy-analytics-card")) customElements.define("energy-analytics-card",EnergyAnalyticsCard);
window.customCards=window.customCards||[];
if(!window.customCards.some((card)=>card.type==="energy-analytics-card")) window.customCards.push({type:"energy-analytics-card",name:CARD_NAME,description:"Long-term energy statistics, PV yield and kWh/kWp analytics using Home Assistant recorder statistics.",preview:true,configurable:true});
console.info(`%c ${CARD_NAME} %c v${CARD_VERSION} `,"background:#f5a623;color:#111;font-weight:700;","background:#222;color:white;");
