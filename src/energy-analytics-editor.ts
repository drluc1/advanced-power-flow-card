import { LitElement, css, html, nothing } from "lit";
import type { HomeAssistant } from "./types";
import type {
  AnalyticsPvInputConfig,
  AnalyticsPvSystemConfig,
  EnergyAnalyticsCardConfig
} from "./energy-analytics-types";

type PathPart = string | number;

export class EnergyAnalyticsCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true }
  };

  hass?: HomeAssistant;
  private _config: EnergyAnalyticsCardConfig = {
    type: "custom:energy-analytics-card",
    title: "Energy Analytics",
    default_range: "days",
    day_count: 30,
    month_count: 12,
    year_count: 5,
    text_size: "large",
    energy: {},
    solar: [],
    batteries: []
  };

  setConfig(config: EnergyAnalyticsCardConfig): void {
    this._config = structuredClone(config);
  }

  private _get(path: PathPart[]): unknown {
    let value: unknown = this._config;
    for (const part of path) {
      if (typeof part === "number") {
        if (!Array.isArray(value)) return undefined;
        value = value[part];
      } else {
        if (!value || typeof value !== "object") return undefined;
        value = (value as Record<string, unknown>)[part];
      }
    }
    return value;
  }

  private _set(path: PathPart[], value: unknown): void {
    const next = structuredClone(this._config) as unknown as Record<string, unknown>;
    let cursor: unknown = next;
    path.forEach((part, index) => {
      const last = index === path.length - 1;
      if (typeof part === "number") {
        if (!Array.isArray(cursor)) return;
        if (last) cursor[part] = value;
        else cursor = cursor[part];
      } else {
        if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return;
        const obj = cursor as Record<string, unknown>;
        if (last) {
          if (value === "" || value === undefined || value === null) delete obj[part];
          else obj[part] = value;
        } else {
          const nextPart = path[index + 1];
          if (!(part in obj) || obj[part] == null) obj[part] = typeof nextPart === "number" ? [] : {};
          cursor = obj[part];
        }
      }
    });
    this._config = next as unknown as EnergyAnalyticsCardConfig;
    this._emit();
  }

  private _emit(): void {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config }, bubbles: true, composed: true
    }));
  }

  private _entity(label: string, path: PathPart[]) {
    return html`
      <label>${label}</label>
      <ha-entity-picker
        .hass=${this.hass}
        .value=${(this._get(path) as string | undefined) ?? ""}
        .allowCustomEntity=${true}
        @value-changed=${(e: CustomEvent) => this._set(path, e.detail?.value ?? "")}
      ></ha-entity-picker>
    `;
  }

  private _text(label: string, path: PathPart[], placeholder = "") {
    return html`
      <label>${label}</label>
      <input type="text" .value=${(this._get(path) as string | undefined) ?? ""}
        placeholder=${placeholder}
        @input=${(e: Event) => this._set(path, (e.target as HTMLInputElement).value)} />
    `;
  }

  private _number(label: string, path: PathPart[], fallback: number, step = "1") {
    const value = this._get(path);
    return html`
      <label>${label}</label>
      <input type="number" step=${step} .value=${String(typeof value === "number" ? value : fallback)}
        @input=${(e: Event) => this._set(path, Number((e.target as HTMLInputElement).value))} />
    `;
  }

  private _select(label: string, path: PathPart[], options: Array<[string, string]>, fallback: string) {
    const value = (this._get(path) as string | undefined) ?? fallback;
    return html`
      <label>${label}</label>
      <select .value=${value} @change=${(e: Event) => this._set(path, (e.target as HTMLSelectElement).value)}>
        ${options.map(([v, text]) => html`<option value=${v}>${text}</option>`)}
      </select>
    `;
  }

  private _addSolar(): void {
    const solar = [...(this._config.solar ?? [])];
    solar.push({ name: `PV-System ${solar.length + 1}`, children: [] });
    this._config = { ...this._config, solar };
    this._emit();
  }

  private _removeSolar(index: number): void {
    const solar = [...(this._config.solar ?? [])];
    solar.splice(index, 1);
    this._config = { ...this._config, solar };
    this._emit();
  }

  private _addMppt(systemIndex: number): void {
    const solar = structuredClone(this._config.solar ?? []);
    const system = solar[systemIndex] ?? ({ children: [] } as AnalyticsPvSystemConfig);
    const children = [...(system.children ?? [])];
    children.push({ name: `MPPT ${children.length + 1}` } as AnalyticsPvInputConfig);
    system.children = children;
    solar[systemIndex] = system;
    this._config = { ...this._config, solar };
    this._emit();
  }

  private _removeMppt(systemIndex: number, childIndex: number): void {
    const solar = structuredClone(this._config.solar ?? []);
    const system = solar[systemIndex];
    if (!system) return;
    const children = [...(system.children ?? [])];
    children.splice(childIndex, 1);
    system.children = children;
    this._config = { ...this._config, solar };
    this._emit();
  }

  render() {
    if (!this.hass) return nothing;
    return html`
      <div class="editor">
        <section>
          <h3>Allgemein</h3>
          ${this._text("Titel", ["title"], "Energy Analytics")}
          ${this._select("Standardansicht", ["default_range"], [["days","30 Tage"],["months","12 Monate"],["years","5 Jahre"]], "days")}
          ${this._number("Anzahl Tage", ["day_count"], 30)}
          ${this._number("Anzahl Monate", ["month_count"], 12)}
          ${this._number("Anzahl Jahre", ["year_count"], 5)}
          ${this._select("Schriftgröße", ["text_size"], [["normal","Normal"],["large","Groß"],["xlarge","Sehr groß"]], "large")}
        </section>

        <section>
          <h3>Langzeit-Energiesensoren</h3>
          ${this._entity("PV gesamt", ["energy","pv_total"])}
          ${this._entity("Hausverbrauch", ["energy","house"])}
          ${this._entity("Netzbezug", ["energy","grid_import"])}
          ${this._entity("Einspeisung", ["energy","grid_export"])}
          ${this._entity("Batterie geladen", ["energy","battery_charge"])}
          ${this._entity("Batterie entladen", ["energy","battery_discharge"])}
          ${this._entity("Wärmepumpe elektrisch", ["energy","heat_pump"])}
          ${this._entity("Wärmepumpe thermisch", ["energy","heat_pump_thermal"])}
          ${this._entity("Wallbox", ["energy","wallbox"])}
          ${this._entity("Netzkosten kumuliert", ["energy","cost_import"])}
          ${this._entity("Einspeiseerlös kumuliert", ["energy","revenue_export"])}
        </section>

        <div class="section-head">
          <h3>PV-Systeme / MPPTs</h3>
          <button @click=${this._addSolar}>+ PV-System</button>
        </div>
        ${(this._config.solar ?? []).map((system, i) => html`
          <section class="solar">
            <div class="section-head full">
              <h3>${system.name ?? `PV-System ${i + 1}`}</h3>
              <button class="danger" @click=${() => this._removeSolar(i)}>Entfernen</button>
            </div>
            ${this._text("Name", ["solar",i,"name"], `PV-System ${i + 1}`)}
            ${this._entity("Gesamtenergie total", ["solar",i,"energy"])}
            ${this._number("Installiert kWp", ["solar",i,"installed_kwp"], system.installed_kwp ?? 0, "0.01")}
            <div class="subhead full"><strong>MPPTs / Sub-PV</strong><button @click=${() => this._addMppt(i)}>+ MPPT</button></div>
            ${(system.children ?? []).map((child, j) => html`
              <div class="mppt full">
                <div class="mppt-title"><strong>${child.name ?? `MPPT ${j + 1}`}</strong><button class="danger" @click=${() => this._removeMppt(i,j)}>×</button></div>
                <div class="grid">
                  ${this._text("Name", ["solar",i,"children",j,"name"], `MPPT ${j + 1}`)}
                  ${this._entity("Energie total", ["solar",i,"children",j,"energy"])}
                  ${this._number("Installiert kWp", ["solar",i,"children",j,"installed_kwp"], child.installed_kwp ?? 0, "0.01")}
                </div>
              </div>
            `)}
          </section>
        `)}
      </div>
    `;
  }

  static styles = css`
    :host { display:block; }
    .editor { display:grid; gap:12px; }
    section { display:grid; grid-template-columns:minmax(150px,.8fr) minmax(190px,1.4fr); gap:9px 12px; padding:12px; border:1px solid var(--divider-color); border-radius:12px; }
    h3 { margin:0; font-size:15px; }
    section > h3 { grid-column:1/-1; margin-bottom:4px; }
    label { align-self:center; font-size:13px; }
    input, select { width:100%; box-sizing:border-box; min-height:40px; padding:8px 10px; border:1px solid var(--divider-color); border-radius:8px; background:var(--card-background-color); color:var(--primary-text-color); }
    button { border:1px solid var(--divider-color); border-radius:9px; background:var(--card-background-color); color:var(--primary-text-color); padding:7px 10px; cursor:pointer; }
    button.danger { color:var(--error-color); }
    .section-head, .subhead, .mppt-title { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .section-head.full, .subhead.full, .mppt.full { grid-column:1/-1; }
    .solar { background:color-mix(in srgb, var(--card-background-color) 94%, var(--warning-color,#f5a623) 6%); }
    .mppt { padding:10px; border:1px dashed var(--divider-color); border-radius:10px; }
    .mppt-title { margin-bottom:8px; }
    .grid { display:grid; grid-template-columns:minmax(150px,.8fr) minmax(190px,1.4fr); gap:8px 12px; }
    @media(max-width:600px){ section,.grid{grid-template-columns:1fr;} section>h3,.section-head.full,.subhead.full,.mppt.full{grid-column:1;} }
  `;
}

if (!customElements.get("energy-analytics-card-editor")) {
  customElements.define("energy-analytics-card-editor", EnergyAnalyticsCardEditor);
}
