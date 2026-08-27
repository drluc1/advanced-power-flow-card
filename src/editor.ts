import { LitElement, css, html, nothing } from "lit";
import { createStubConfig, normalizeConfig } from "./config";
import type {
  AdvancedPowerFlowCardConfig,
  BatteryConfig,
  ConsumerConfig,
  HeatPumpConfig,
  HomeAssistant,
  PvInputConfig,
  PvSystemConfig
} from "./types";

export class AdvancedPowerFlowCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true }
  };

  hass?: HomeAssistant;
  private _config: AdvancedPowerFlowCardConfig = createStubConfig();

  setConfig(config: AdvancedPowerFlowCardConfig): void {
    this._config = normalizeConfig(config);
  }

  private _commit(config: AdvancedPowerFlowCardConfig): void {
    this._config = structuredClone(config);
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }

  private _with(mutator: (config: AdvancedPowerFlowCardConfig) => void): void {
    const next = structuredClone(this._config);
    mutator(next);
    this._commit(next);
  }

  private _entityPicker(label: string, value: string | undefined, onChange: (value: string | undefined) => void) {
    return html`
      <label>${label}</label>
      <ha-entity-picker
        .hass=${this.hass}
        .value=${value ?? ""}
        .allowCustomEntity=${true}
        @value-changed=${(event: CustomEvent) => {
          const next = event.detail?.value as string | undefined;
          onChange(next || undefined);
        }}
      ></ha-entity-picker>
    `;
  }

  private _textInput(label: string, value: string | undefined, placeholder: string, onChange: (value: string | undefined) => void) {
    return html`
      <label>${label}</label>
      <input
        type="text"
        .value=${value ?? ""}
        placeholder=${placeholder}
        @input=${(event: Event) => {
          const next = (event.target as HTMLInputElement).value.trim();
          onChange(next || undefined);
        }}
      />
    `;
  }

  private _numberInput(
    label: string,
    value: number | undefined,
    fallback: number,
    onChange: (value: number) => void,
    options: { min?: number; max?: number; step?: number } = {}
  ) {
    return html`
      <label>${label}</label>
      <input
        type="number"
        min=${String(options.min ?? 0)}
        max=${options.max === undefined ? "" : String(options.max)}
        step=${String(options.step ?? 1)}
        .value=${String(value ?? fallback)}
        @input=${(event: Event) => {
          const parsed = Number((event.target as HTMLInputElement).value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
      />
    `;
  }

  private _optionalNumberInput(
    label: string,
    value: number | undefined,
    placeholder: string,
    onChange: (value: number | undefined) => void,
    options: { min?: number; max?: number; step?: number } = {}
  ) {
    return html`
      <label>${label}</label>
      <input
        type="number"
        min=${String(options.min ?? 0)}
        max=${options.max === undefined ? "" : String(options.max)}
        step=${String(options.step ?? 0.01)}
        .value=${value === undefined ? "" : String(value)}
        placeholder=${placeholder}
        @input=${(event: Event) => {
          const text = (event.target as HTMLInputElement).value;
          if (!text.trim()) {
            onChange(undefined);
            return;
          }
          const parsed = Number(text);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
      />
    `;
  }

  private _selectInput(label: string, value: string | undefined, options: Array<{ value: string; label: string }>, onChange: (value: string) => void) {
    return html`
      <label>${label}</label>
      <select
        .value=${value ?? options[0]?.value ?? ""}
        @change=${(event: Event) => onChange((event.target as HTMLSelectElement).value)}
      >
        ${options.map((option) => html`<option value=${option.value}>${option.label}</option>`)}
      </select>
    `;
  }

  private _checkbox(label: string, value: boolean | undefined, fallback: boolean, onChange: (value: boolean) => void) {
    return html`
      <label class="check">
        <input
          type="checkbox"
          .checked=${typeof value === "boolean" ? value : fallback}
          @change=${(event: Event) => onChange((event.target as HTMLInputElement).checked)}
        />
        <span>${label}</span>
      </label>
    `;
  }

  private _updateSolar(index: number, patch: Partial<PvSystemConfig>): void {
    this._with((config) => {
      config.solar ??= [];
      config.solar[index] = { ...config.solar[index], ...patch };
    });
  }

  private _updateMppt(solarIndex: number, inputIndex: number, patch: Partial<PvInputConfig>): void {
    this._with((config) => {
      config.solar ??= [];
      const system = config.solar[solarIndex];
      if (!system) return;
      system.children ??= [];
      system.children[inputIndex] = { ...system.children[inputIndex], ...patch };
    });
  }

  private _updateBattery(index: number, patch: Partial<BatteryConfig>): void {
    this._with((config) => {
      config.batteries ??= [];
      config.batteries[index] = { ...config.batteries[index], ...patch };
    });
  }

  private _updateConsumer(index: number, patch: Partial<ConsumerConfig>): void {
    this._with((config) => {
      config.consumers ??= [];
      config.consumers[index] = { ...config.consumers[index], ...patch };
    });
  }

  private _updateHeatPump(patch: Partial<HeatPumpConfig>): void {
    this._with((config) => {
      config.heat_pump = { ...config.heat_pump, ...patch };
    });
  }

  render() {
    if (!this.hass) return nothing;

    return html`
      <div class="editor">
        <section>
          <div class="section-title"><h3>Allgemein</h3></div>
          ${this._textInput("Titel", this._config.title, "Energiefluss", (value) => this._with((config) => { config.title = value; }))}
          ${this._numberInput("Animationsschwelle in W", this._config.power_threshold, 5, (value) => this._with((config) => { config.power_threshold = value; }))}
          ${this._numberInput("Bilanz-Warnschwelle in W", this._config.balance_warning_threshold, 50, (value) => this._with((config) => { config.balance_warning_threshold = value; }))}
          ${this._selectInput("Schriftgröße", this._config.text_size, [
            { value: "small", label: "Klein" },
            { value: "normal", label: "Normal" },
            { value: "large", label: "Groß" },
            { value: "xlarge", label: "Sehr groß" }
          ], (value) => this._with((config) => { config.text_size = value as "small" | "normal" | "large" | "xlarge"; }))}
          ${this._numberInput("Mobile Skalierung", this._config.mobile_scale, 1.06, (value) => this._with((config) => { config.mobile_scale = Math.min(1.3, Math.max(0.9, value)); }), { min: 0.9, max: 1.3, step: 0.01 })}
          ${this._selectInput("Layout-Dichte", this._config.layout_density, [
            { value: "auto", label: "Automatisch" },
            { value: "compact", label: "Kompakt" },
            { value: "comfortable", label: "Großzügig" }
          ], (value) => this._with((config) => { config.layout_density = value as "auto" | "compact" | "comfortable"; }))}
          ${this._selectInput("PV-Darstellung", this._config.pv_layout, [
            { value: "auto", label: "Automatisch – mehrere Anlagen gruppieren" },
            { value: "grouped", label: "Gruppiert – eine gemeinsame PV-Kachel" },
            { value: "expanded", label: "Getrennt – klassische Darstellung" },
            { value: "compact", label: "Getrennt kompakt" }
          ], (value) => this._with((config) => { config.pv_layout = value as "auto" | "expanded" | "compact" | "grouped"; }))}
          ${this._selectInput("PV-Detailstufe im Hauptdiagramm", this._config.pv_detail_level, [
            { value: "auto", label: "Automatisch" },
            { value: "minimal", label: "Minimal – nur Gesamtleistung" },
            { value: "compact", label: "Kompakt – MPPT-Leistungen als Zeilen" },
            { value: "full", label: "Vollständig – einzelne MPPT-Kacheln" }
          ], (value) => this._with((config) => { config.pv_detail_level = value as "auto" | "minimal" | "compact" | "full"; }))}
          <div class="help">„Gruppiert + Kompakt“ fasst alle PV-Anlagen in einer gemeinsamen Kachel zusammen und zeigt die MPPT-Leistungen platzsparend direkt unter der jeweiligen Anlagenleistung. Ein Klick auf ein PV-System öffnet weiterhin die vollständige Detailansicht.</div>
          ${this._checkbox("PV-Systemstatus im Hauptdiagramm anzeigen", this._config.pv_show_status, true, (value) => this._with((config) => { config.pv_show_status = value; }))}
          ${this._checkbox("Relative PV-Leistung (W/kWp) anzeigen", this._config.pv_show_relative_power, true, (value) => this._with((config) => { config.pv_show_relative_power = value; }))}
          ${this._checkbox("Leistungsbalken bei kompakten MPPTs anzeigen", this._config.pv_compact_mppt_bars, true, (value) => this._with((config) => { config.pv_compact_mppt_bars = value; }))}
          ${this._checkbox("PV-Sektion nachts auf eine Zeile reduzieren", this._config.night_pv_collapse, true, (value) => this._with((config) => { config.night_pv_collapse = value; }))}
          ${this._selectInput("Batterie-Darstellung", this._config.battery_layout, [
            { value: "grouped", label: "Gruppiert – gemeinsame Batteriezone" },
            { value: "separate", label: "Getrennt" }
          ], (value) => this._with((config) => { config.battery_layout = value as "grouped" | "separate"; }))}
          ${this._selectInput("Versorgungsknoten", this._config.supply_node, [
            { value: "full", label: "Vollständig" },
            { value: "compact", label: "Kompakt" },
            { value: "hidden", label: "Nur Verteilerpunkt" }
          ], (value) => this._with((config) => { config.supply_node = value as "full" | "compact" | "hidden"; }))}
          ${this._selectInput("Flussanimation", this._config.flow_animation, [
            { value: "always", label: "Immer animieren – empfohlen" },
            { value: "system", label: "Systemeinstellung für reduzierte Bewegung beachten" },
            { value: "off", label: "Aus" }
          ], (value) => this._with((config) => { config.flow_animation = value as "always" | "system" | "off"; }))}
          ${this._selectInput("Leitungsführung unten", this._config.flow_routing, [
            { value: "natural", label: "Natürlich – direkte weiche Verbindung" },
            { value: "orthogonal", label: "Rechtwinklig / Bus" }
          ], (value) => this._with((config) => { config.flow_routing = value as "natural" | "orthogonal"; }))}
          ${this._selectInput("Optischer Stil", this._config.visual_style, [
            { value: "clean", label: "Clean – ruhiger und reduzierter" },
            { value: "classic", label: "Classic – stärkere Konturen/Schatten" }
          ], (value) => this._with((config) => { config.visual_style = value as "clean" | "classic"; }))}
          ${this._selectInput("Informationsdichte im Live-Diagramm", this._config.live_detail, [
            { value: "standard", label: "Standard – alle Unterzeilen" },
            { value: "minimal", label: "Minimal – nur wichtige Zusatzinfos" }
          ], (value) => this._with((config) => { config.live_detail = value as "standard" | "minimal"; }))}
          ${this._checkbox("Aktive Komponenten stärker hervorheben", this._config.focus_active, true, (value) => this._with((config) => { config.focus_active = value; }))}
          ${this._checkbox("Legende anzeigen", this._config.show_legend, true, (value) => this._with((config) => { config.show_legend = value; }))}
          ${this._checkbox("Versionsnummer anzeigen", this._config.show_version, true, (value) => this._with((config) => { config.show_version = value; }))}
          <div class="help">Mobile Skalierung wirkt nur auf kleinen Displays. 1,06 entspricht +6 %; Werte bis 1,30 sind möglich.</div>
          ${this._selectInput("Tageswerte-Layout", this._config.daily_layout, [
            { value: "auto", label: "Automatisch (mobil kompakt)" },
            { value: "cards", label: "Karten" },
            { value: "compact", label: "Kompakt" },
            { value: "strip", label: "Kennzahlenleiste – maximal reduziert" }
          ], (value) => this._with((config) => { config.daily_layout = value as "auto" | "cards" | "compact" | "strip"; }))}
          ${this._textInput(
            "Tageskarten – Auswahl/Reihenfolge",
            (this._config.daily_items ?? []).join(", "),
            "pv, house, grid-import, grid-export, autarky, self-consumption, self-supplied-energy, self-supply-savings",
            (value) => this._with((config) => {
              const items = (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
              config.daily_items = items.length ? items as typeof config.daily_items : undefined;
            })
          )}
          <div class="help">Leer = alle verfügbaren Tageswerte. Zusätzlich verfügbar: self-supplied-energy (Eigenversorgung PV+Batterie) und self-supply-savings (vermiedene Netzstromkosten).</div>
          ${this._checkbox("PV bei Nacht stärker ausblenden", this._config.night_mode, true, (value) => this._with((config) => { config.night_mode = value; }))}
        </section>

        <section>
          <div class="section-title">
            <h3>PV-Systeme</h3>
            <button class="add" @click=${() => this._with((config) => {
              config.solar ??= [];
              config.solar.push({ name: `PV ${config.solar.length + 1}`, children: [] });
            })}>+ PV-System</button>
          </div>

          <div class="stack full">
            ${(this._config.solar ?? []).map((system, solarIndex) => html`
              <div class="group">
                <div class="group-head">
                  <strong>${system.name || `PV ${solarIndex + 1}`}</strong>
                  <button class="danger" @click=${() => this._with((config) => { config.solar?.splice(solarIndex, 1); })}>Entfernen</button>
                </div>
                <div class="form-grid">
                  ${this._textInput("Name", system.name, `PV ${solarIndex + 1}`, (value) => this._updateSolar(solarIndex, { name: value }))}
                  ${this._entityPicker("Gesamtleistung (optional)", system.power, (value) => this._updateSolar(solarIndex, { power: value }))}
                  ${this._entityPicker("Tagesproduktion", system.daily_energy, (value) => this._updateSolar(solarIndex, { daily_energy: value }))}
                  ${this._entityPicker("Peak-Leistung heute", system.daily_peak_power, (value) => this._updateSolar(solarIndex, { daily_peak_power: value }))}
                  ${this._optionalNumberInput("Installierte Leistung [kWp]", system.installed_kwp, "z. B. 4.95", (value) => this._updateSolar(solarIndex, { installed_kwp: value }), { step: 0.01 })}
                  ${this._entityPicker("Wechselrichter-Temperatur (optional)", system.inverter_temperature, (value) => this._updateSolar(solarIndex, { inverter_temperature: value }))}
                  ${this._entityPicker("PV-Systemstatus (optional)", system.status, (value) => this._updateSolar(solarIndex, { status: value }))}
                </div>

                <div class="subhead">
                  <span>Sub-PV / MPPTs</span>
                  <button class="add small" @click=${() => this._with((config) => {
                    const target = config.solar?.[solarIndex];
                    if (!target) return;
                    target.children ??= [];
                    target.children.push({ name: `MPPT ${target.children.length + 1}` });
                  })}>+ MPPT</button>
                </div>

                <div class="stack">
                  ${(system.children ?? []).map((input, inputIndex) => html`
                    <div class="subgroup">
                      <div class="group-head compact">
                        <strong>${input.name || `MPPT ${inputIndex + 1}`}</strong>
                        <button class="danger small" @click=${() => this._with((config) => { config.solar?.[solarIndex]?.children?.splice(inputIndex, 1); })}>Entfernen</button>
                      </div>
                      <div class="form-grid">
                        ${this._textInput("Name", input.name, `MPPT ${inputIndex + 1}`, (value) => this._updateMppt(solarIndex, inputIndex, { name: value }))}
                        ${this._entityPicker("Leistung", input.power, (value) => this._updateMppt(solarIndex, inputIndex, { power: value }))}
                        ${this._entityPicker("Spannung", input.voltage, (value) => this._updateMppt(solarIndex, inputIndex, { voltage: value }))}
                        ${this._entityPicker("Strom", input.current, (value) => this._updateMppt(solarIndex, inputIndex, { current: value }))}
                        ${this._entityPicker("Tagesproduktion", input.daily_energy, (value) => this._updateMppt(solarIndex, inputIndex, { daily_energy: value }))}
                        ${this._entityPicker("Peak-Leistung heute", input.daily_peak_power, (value) => this._updateMppt(solarIndex, inputIndex, { daily_peak_power: value }))}
                        ${this._optionalNumberInput("Installierte Leistung [kWp]", input.installed_kwp, "optional", (value) => this._updateMppt(solarIndex, inputIndex, { installed_kwp: value }), { step: 0.01 })}
                        ${this._entityPicker("MPPT-Status (optional)", input.status, (value) => this._updateMppt(solarIndex, inputIndex, { status: value }))}
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            `)}
          </div>
        </section>

        <section>
          <div class="section-title">
            <h3>Batterien</h3>
            <button class="add" @click=${() => this._with((config) => {
              config.batteries ??= [];
              config.batteries.push({ name: `Batterie ${config.batteries.length + 1}`, positive_is_charging: true });
            })}>+ Batterie</button>
          </div>

          <div class="stack full">
            ${(this._config.batteries ?? []).map((battery, index) => html`
              <div class="group">
                <div class="group-head">
                  <strong>${battery.name || `Batterie ${index + 1}`}</strong>
                  <button class="danger" @click=${() => this._with((config) => { config.batteries?.splice(index, 1); })}>Entfernen</button>
                </div>
                <div class="form-grid">
                  ${this._textInput("Name", battery.name, `Batterie ${index + 1}`, (value) => this._updateBattery(index, { name: value }))}
                  ${this._entityPicker("Leistung", battery.power, (value) => this._updateBattery(index, { power: value }))}
                  ${this._entityPicker("SOC", battery.soc, (value) => this._updateBattery(index, { soc: value }))}
                  ${this._optionalNumberInput("Nutzbare Kapazität [kWh]", battery.capacity_kwh, "optional", (value) => this._updateBattery(index, { capacity_kwh: value }), { step: 0.1 })}
                  ${this._optionalNumberInput("Ziel-SOC [%]", battery.target_soc, "100", (value) => this._updateBattery(index, { target_soc: value }), { min: 0, max: 100, step: 1 })}
                  ${this._optionalNumberInput("Reserve-SOC [%]", battery.reserve_soc, "0", (value) => this._updateBattery(index, { reserve_soc: value }), { min: 0, max: 100, step: 1 })}
                  ${this._optionalNumberInput("Prognose erst ab [W]", battery.estimate_min_power_w, "100", (value) => this._updateBattery(index, { estimate_min_power_w: value }), { min: 0, step: 10 })}
                  ${this._checkbox("Positiver Wert bedeutet Laden", battery.positive_is_charging, true, (value) => this._updateBattery(index, { positive_is_charging: value }))}
                  <div class="help">Für Lade-/Restlaufzeit werden Kapazität + SOC bzw. Restenergie und eine ausreichend hohe Batterieleistung benötigt.</div>
                </div>

                <details class="optional-details">
                  <summary>Batterie-Detaildaten</summary>
                  <div class="form-grid detail-form">
                    ${this._entityPicker("Geglättete Leistung für Prognose (optional)", battery.average_power, (value) => this._updateBattery(index, { average_power: value }))}
                    ${this._optionalNumberInput("Max. Ladeleistung [kW]", battery.max_charge_power_kw, "optional", (value) => this._updateBattery(index, { max_charge_power_kw: value }), { min: 0, step: 0.1 })}
                    ${this._optionalNumberInput("Max. Entladeleistung [kW]", battery.max_discharge_power_kw, "optional", (value) => this._updateBattery(index, { max_discharge_power_kw: value }), { min: 0, step: 0.1 })}
                    ${this._entityPicker("Batteriespannung", battery.voltage, (value) => this._updateBattery(index, { voltage: value }))}
                    ${this._entityPicker("Batteriestrom", battery.current, (value) => this._updateBattery(index, { current: value }))}
                    ${this._entityPicker("Temperatur", battery.temperature, (value) => this._updateBattery(index, { temperature: value }))}
                    ${this._entityPicker("Zellspannung Minimum", battery.cell_min_voltage, (value) => this._updateBattery(index, { cell_min_voltage: value }))}
                    ${this._entityPicker("Zellspannung Maximum", battery.cell_max_voltage, (value) => this._updateBattery(index, { cell_max_voltage: value }))}
                    ${this._entityPicker("Zelltemperatur Minimum", battery.cell_min_temperature, (value) => this._updateBattery(index, { cell_min_temperature: value }))}
                    ${this._entityPicker("Zelltemperatur Maximum", battery.cell_max_temperature, (value) => this._updateBattery(index, { cell_max_temperature: value }))}
                    ${this._entityPicker("State of Health (SOH)", battery.state_of_health, (value) => this._updateBattery(index, { state_of_health: value }))}
                    ${this._entityPicker("Batteriestatus (optional)", battery.status, (value) => this._updateBattery(index, { status: value }))}
                    ${this._entityPicker("SOC Minimum heute", battery.daily_min_soc, (value) => this._updateBattery(index, { daily_min_soc: value }))}
                    ${this._entityPicker("SOC Maximum heute", battery.daily_max_soc, (value) => this._updateBattery(index, { daily_max_soc: value }))}
                    ${this._entityPicker("Zyklen", battery.cycle_count, (value) => this._updateBattery(index, { cycle_count: value }))}
                    ${this._entityPicker("Restenergie", battery.remaining_energy, (value) => this._updateBattery(index, { remaining_energy: value }))}
                    ${this._entityPicker("Ladeenergie heute", battery.daily_charge_energy, (value) => this._updateBattery(index, { daily_charge_energy: value }))}
                    ${this._entityPicker("Entladeenergie heute", battery.daily_discharge_energy, (value) => this._updateBattery(index, { daily_discharge_energy: value }))}
                  </div>
                </details>
              </div>
            `)}
          </div>
        </section>

        <section>
          <div class="section-title"><h3>Netz & Haus</h3></div>
          <div class="form-grid full">
            ${this._entityPicker("Netzleistung", this._config.grid?.power, (value) => this._with((config) => { config.grid = { ...config.grid, power: value }; }))}
            ${this._checkbox("Positiver Netzwert bedeutet Bezug", this._config.grid?.positive_is_import, true, (value) => this._with((config) => { config.grid = { ...config.grid, positive_is_import: value }; }))}
            ${this._textInput("Hausname", this._config.house?.name, "Haus", (value) => this._with((config) => { config.house = { ...config.house, name: value }; }))}
            ${this._entityPicker("Hausleistung (optional)", this._config.house?.power, (value) => this._with((config) => { config.house = { ...config.house, power: value }; }))}
            <div class="help">Leer lassen = Hausverbrauch automatisch aus PV, Netz und Batterien berechnen.</div>
          </div>
        </section>

        <section>
          <div class="section-title"><h3>Tageswerte</h3></div>
          <div class="form-grid full">
            ${this._entityPicker("PV-Energie heute", this._config.daily?.pv_energy, (value) => this._with((config) => { config.daily = { ...config.daily, pv_energy: value }; }))}
            ${this._entityPicker("Netzbezug heute", this._config.daily?.grid_import_energy, (value) => this._with((config) => { config.daily = { ...config.daily, grid_import_energy: value }; }))}
            ${this._entityPicker("Einspeisung heute", this._config.daily?.grid_export_energy, (value) => this._with((config) => { config.daily = { ...config.daily, grid_export_energy: value }; }))}
            ${this._entityPicker("Hausverbrauch heute", this._config.daily?.house_energy, (value) => this._with((config) => { config.daily = { ...config.daily, house_energy: value }; }))}
            <div class="help">Mit Hausverbrauch + Netzbezug werden Autarkie, mit PV + Einspeisung der Eigenverbrauch automatisch berechnet.</div>
          </div>
        </section>

        <section>
          <div class="section-title"><h3>Strompreis & Kosten (optional)</h3></div>
          <div class="form-grid full">
            ${this._entityPicker("Aktueller Bezugspreis", this._config.tariffs?.import_price, (value) => this._with((config) => { config.tariffs = { ...config.tariffs, import_price: value }; }))}
            ${this._entityPicker("Aktuelle Einspeisevergütung", this._config.tariffs?.export_price, (value) => this._with((config) => { config.tariffs = { ...config.tariffs, export_price: value }; }))}
            ${this._entityPicker("Netzkosten heute", this._config.tariffs?.import_cost_today, (value) => this._with((config) => { config.tariffs = { ...config.tariffs, import_cost_today: value }; }))}
            ${this._entityPicker("Einspeiseerlös heute", this._config.tariffs?.export_revenue_today, (value) => this._with((config) => { config.tariffs = { ...config.tariffs, export_revenue_today: value }; }))}
            ${this._entityPicker("Eigenversorgungs-Ersparnis heute (optional)", this._config.tariffs?.self_supply_savings_today, (value) => this._with((config) => { config.tariffs = { ...config.tariffs, self_supply_savings_today: value }; }))}
            ${this._optionalNumberInput("Fester Bezugspreis [€/kWh]", this._config.tariffs?.fixed_import_price, "optional", (value) => this._with((config) => { config.tariffs = { ...config.tariffs, fixed_import_price: value }; }), { min: 0, step: 0.001 })}
            ${this._optionalNumberInput("Feste Einspeisevergütung [€/kWh]", this._config.tariffs?.fixed_export_price, "optional", (value) => this._with((config) => { config.tariffs = { ...config.tariffs, fixed_export_price: value }; }), { min: 0, step: 0.001 })}
            ${this._textInput("Währung", this._config.tariffs?.currency, "€", (value) => this._with((config) => { config.tariffs = { ...config.tariffs, currency: value }; }))}
            <div class="help">Eigenversorgung = Hausverbrauch minus Netzbezug. Die daraus vermiedenen Netzstromkosten werden bevorzugt aus einer eigenen Ersparnis-Entity gelesen; alternativ mit festem Bezugspreis berechnet. Bei dynamischen Preisen kann nur eine Näherung aus dem aktuellen bzw. bisherigen Durchschnittspreis erfolgen.</div>
          </div>
        </section>

        <section>
          <div class="section-title"><h3>Diagnose & Warnungen</h3></div>
          <div class="form-grid full">
            ${this._checkbox("Diagnose aktivieren", this._config.diagnostics?.enabled, true, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, enabled: value }; }))}
            ${this._numberInput("PV-Spannung ohne Leistung [V]", this._config.diagnostics?.pv_voltage_without_power_threshold, 80, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, pv_voltage_without_power_threshold: value }; }))}
            ${this._numberInput("Zellspannungs-Delta Warnung [V]", this._config.diagnostics?.battery_cell_delta_warning, 0.05, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, battery_cell_delta_warning: value }; }), { step: 0.005 })}
            ${this._numberInput("Batterietemperatur Minimum [°C]", this._config.diagnostics?.battery_temperature_low, 5, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, battery_temperature_low: value }; }), { min: -40, step: 1 })}
            ${this._numberInput("Batterietemperatur Maximum [°C]", this._config.diagnostics?.battery_temperature_high, 45, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, battery_temperature_high: value }; }))}
            ${this._numberInput("PV/Wechselrichter Temperatur Maximum [°C]", this._config.diagnostics?.pv_temperature_high, 75, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, pv_temperature_high: value }; }))}
            ${this._numberInput("Sensor veraltet nach [min] (0 = aus)", this._config.diagnostics?.stale_sensor_minutes, 0, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, stale_sensor_minutes: value }; }), { min: 0, step: 1 })}
            ${this._checkbox("MPPT-Abweichungsdiagnose aktivieren", this._config.diagnostics?.mppt_relative_warning_enabled, false, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, mppt_relative_warning_enabled: value }; }))}
            ${this._numberInput("MPPT-Warnverhältnis", this._config.diagnostics?.mppt_relative_warning_ratio, 0.35, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, mppt_relative_warning_ratio: value }; }), { step: 0.05 })}
            ${this._checkbox("MPPT-Tagesertragsdiagnose aktivieren", this._config.diagnostics?.mppt_daily_relative_warning_enabled, false, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, mppt_daily_relative_warning_enabled: value }; }))}
            ${this._numberInput("Tagesertrags-Warnverhältnis", this._config.diagnostics?.mppt_daily_relative_warning_ratio, 0.35, (value) => this._with((config) => { config.diagnostics = { ...config.diagnostics, mppt_daily_relative_warning_ratio: value }; }), { step: 0.05 })}
            <div class="help">Momentan- und Tagesdiagnose sind standardmäßig aus. Die Tagesdiagnose benötigt Tagesenergie + kWp pro MPPT und vergleicht kWh/kWp. Bei stark unterschiedlichen Ausrichtungen kann trotzdem eine Abweichung normal sein.</div>
          </div>
        </section>

        <section>
          <div class="section-title"><h3>Farben (optional)</h3></div>
          <div class="form-grid full">
            ${this._textInput("PV", this._config.colors?.solar, "z. B. #f6b800", (value) => this._with((config) => { config.colors = { ...config.colors, solar: value }; }))}
            ${this._textInput("Netz", this._config.colors?.grid, "CSS-Farbe", (value) => this._with((config) => { config.colors = { ...config.colors, grid: value }; }))}
            ${this._textInput("Batterie", this._config.colors?.battery, "CSS-Farbe", (value) => this._with((config) => { config.colors = { ...config.colors, battery: value }; }))}
            ${this._textInput("Wärmepumpe", this._config.colors?.heat_pump, "CSS-Farbe", (value) => this._with((config) => { config.colors = { ...config.colors, heat_pump: value }; }))}
            ${this._textInput("Verbraucher", this._config.colors?.consumer, "CSS-Farbe", (value) => this._with((config) => { config.colors = { ...config.colors, consumer: value }; }))}
            ${this._textInput("Energiefluss", this._config.colors?.flow, "CSS-Farbe", (value) => this._with((config) => { config.colors = { ...config.colors, flow: value }; }))}
          </div>
        </section>

        <section>
          <div class="section-title"><h3>Wärmepumpe</h3></div>
          <div class="form-grid full">
            ${this._textInput("Name", this._config.heat_pump?.name, "Wärmepumpe", (value) => this._updateHeatPump({ name: value }))}
            ${this._entityPicker("Elektrische Leistung", this._config.heat_pump?.power, (value) => this._updateHeatPump({ power: value }))}
            ${this._checkbox("Teil des Hausverbrauchs", this._config.heat_pump?.part_of_house, true, (value) => this._updateHeatPump({ part_of_house: value }))}
            ${this._checkbox("Details standardmäßig geöffnet", this._config.heat_pump?.details_expanded_by_default, false, (value) => this._updateHeatPump({ details_expanded_by_default: value }))}
            ${this._entityPicker("Temperatur direkt im Energiefluss (optional)", this._config.heat_pump?.display_temperature, (value) => this._updateHeatPump({ display_temperature: value }))}
            ${this._textInput("Kurzlabel für Diagrammtemperatur", this._config.heat_pump?.display_temperature_label, "Temp", (value) => this._updateHeatPump({ display_temperature_label: value }))}
            <div class="help">Wenn keine separate Diagrammtemperatur gesetzt ist, verwendet die Card automatisch die Vorlauftemperatur. Beispiel: „VL 34,5 °C · COP 3,8“.</div>
            ${this._entityPicker("Vorlauftemperatur", this._config.heat_pump?.flow_temperature, (value) => this._updateHeatPump({ flow_temperature: value }))}
            ${this._entityPicker("Rücklauftemperatur", this._config.heat_pump?.return_temperature, (value) => this._updateHeatPump({ return_temperature: value }))}
            ${this._entityPicker("Außentemperatur", this._config.heat_pump?.outdoor_temperature, (value) => this._updateHeatPump({ outdoor_temperature: value }))}
            ${this._entityPicker("Warmwassertemperatur", this._config.heat_pump?.hot_water_temperature, (value) => this._updateHeatPump({ hot_water_temperature: value }))}
            ${this._entityPicker("Raumtemperatur", this._config.heat_pump?.room_temperature, (value) => this._updateHeatPump({ room_temperature: value }))}
            ${this._entityPicker("Solltemperatur", this._config.heat_pump?.target_temperature, (value) => this._updateHeatPump({ target_temperature: value }))}
            ${this._entityPicker("Betriebsmodus", this._config.heat_pump?.mode, (value) => this._updateHeatPump({ mode: value }))}
            ${this._entityPicker("Kompressorstatus", this._config.heat_pump?.compressor_status, (value) => this._updateHeatPump({ compressor_status: value }))}
            ${this._entityPicker("Kompressorfrequenz", this._config.heat_pump?.compressor_frequency, (value) => this._updateHeatPump({ compressor_frequency: value }))}
            ${this._entityPicker("Thermische Leistung", this._config.heat_pump?.thermal_power, (value) => this._updateHeatPump({ thermal_power: value }))}
            ${this._entityPicker("COP (optional, sonst berechnet)", this._config.heat_pump?.cop, (value) => this._updateHeatPump({ cop: value }))}
            ${this._entityPicker("Elektrische Energie heute", this._config.heat_pump?.daily_energy, (value) => this._updateHeatPump({ daily_energy: value }))}
            ${this._entityPicker("Thermische Energie heute", this._config.heat_pump?.daily_thermal_energy, (value) => this._updateHeatPump({ daily_thermal_energy: value }))}
            ${this._entityPicker("Tagesarbeitszahl/JAZ (optional)", this._config.heat_pump?.daily_cop, (value) => this._updateHeatPump({ daily_cop: value }))}
          </div>
        </section>

        <section>
          <div class="section-title">
            <h3>Weitere Verbraucher</h3>
            <button class="add" @click=${() => this._with((config) => {
              config.consumers ??= [];
              config.consumers.push({ name: `Verbraucher ${config.consumers.length + 1}`, part_of_house: true });
            })}>+ Verbraucher</button>
          </div>
          <div class="stack full">
            ${(this._config.consumers ?? []).map((consumer, index) => html`
              <div class="group">
                <div class="group-head">
                  <strong>${consumer.name || `Verbraucher ${index + 1}`}</strong>
                  <button class="danger" @click=${() => this._with((config) => { config.consumers?.splice(index, 1); })}>Entfernen</button>
                </div>
                <div class="form-grid">
                  ${this._textInput("Name", consumer.name, `Verbraucher ${index + 1}`, (value) => this._updateConsumer(index, { name: value }))}
                  ${this._entityPicker("Leistung", consumer.power, (value) => this._updateConsumer(index, { power: value }))}
                  ${this._checkbox("Teil des Hausverbrauchs", consumer.part_of_house, true, (value) => this._updateConsumer(index, { part_of_house: value }))}
                </div>
              </div>
            `)}
          </div>
        </section>
      </div>
    `;
  }

  static styles = css`
    :host { display: block; }
    .editor { display: grid; gap: 14px; padding: 4px 0; }
    section {
      display: grid;
      grid-template-columns: minmax(150px, .75fr) minmax(220px, 1.5fr);
      gap: 10px 14px;
      padding: 14px;
      border: 1px solid var(--divider-color);
      border-radius: 14px;
    }
    .section-title, .group-head, .subhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .section-title { grid-column: 1 / -1; }
    h3 { margin: 0; font-size: 16px; }
    label { align-self: center; font-size: 14px; }
    .help {
      grid-column: 1 / -1;
      font-size: 12px;
      line-height: 1.45;
      color: var(--secondary-text-color);
    }
    input[type="text"], input[type="number"], select {
      box-sizing: border-box;
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      padding: 8px 10px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
    }
    button {
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      padding: 8px 11px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
    }
    button:hover { border-color: var(--primary-color); }
    .add { font-weight: 600; }
    .danger { color: var(--error-color); }
    .small { padding: 5px 8px; font-size: 12px; }
    .full, .stack { grid-column: 1 / -1; }
    .stack { display: grid; gap: 10px; }
    .group, .subgroup {
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      background: color-mix(in srgb, var(--secondary-background-color) 55%, transparent);
    }
    .subgroup { margin-top: 8px; }
    .group-head { margin-bottom: 10px; }
    .group-head.compact { margin-bottom: 8px; }
    .subhead { margin-top: 12px; font-weight: 600; font-size: 13px; }
    .form-grid {
      display: grid;
      grid-template-columns: minmax(150px, .75fr) minmax(220px, 1.5fr);
      gap: 9px 14px;
    }
    .check {
      grid-column: 1 / -1;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .optional-details { margin-top: 12px; border-top: 1px solid var(--divider-color); padding-top: 10px; }
    .optional-details summary { cursor: pointer; font-size: 13px; font-weight: 650; color: var(--primary-text-color); user-select: none; }
    .detail-form { margin-top: 12px; }
    @media (max-width: 680px) {
      section, .form-grid { grid-template-columns: 1fr; }
      .section-title, .full, .stack, .check { grid-column: 1; }
    }
  `;
}

if (!customElements.get("advanced-power-flow-card-editor")) {
  customElements.define("advanced-power-flow-card-editor", AdvancedPowerFlowCardEditor);
}
