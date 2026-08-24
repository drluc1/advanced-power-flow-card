import { LitElement, css, html, nothing } from "lit";
import type { AdvancedPowerFlowCardConfig, HomeAssistant } from "./types";

type Path = string[];

export class AdvancedPowerFlowCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true }
  };

  hass?: HomeAssistant;
  private _config: AdvancedPowerFlowCardConfig = {
    type: "custom:advanced-power-flow-card"
  };

  setConfig(config: AdvancedPowerFlowCardConfig): void {
    this._config = structuredClone(config);
  }

  private _get(path: Path): unknown {
    let value: unknown = this._config;
    for (const key of path) {
      if (!value || typeof value !== "object") return undefined;
      value = (value as Record<string, unknown>)[key];
    }
    return value;
  }

  private _set(path: Path, value: unknown): void {
    const next = structuredClone(this._config) as unknown as Record<string, unknown>;    let cursor = next;

    path.forEach((key, index) => {
      if (index === path.length - 1) {
        if (value === "" || value === undefined || value === null) {
          delete cursor[key];
        } else {
          cursor[key] = value;
        }
        return;
      }

      const existing = cursor[key];
      if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
        cursor[key] = {};
      }
      cursor = cursor[key] as Record<string, unknown>;
    });

    this._config = next as unknown as AdvancedPowerFlowCardConfig;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      })
    );
  }

  private _entityPicker(label: string, path: Path) {
    const value = (this._get(path) as string | undefined) ?? "";
    return html`
      <label>${label}</label>
      <ha-entity-picker
        .hass=${this.hass}
        .value=${value}
        .allowCustomEntity=${true}
        @value-changed=${(event: CustomEvent) =>
          this._set(path, event.detail?.value ?? "")}
      ></ha-entity-picker>
    `;
  }

  private _textInput(label: string, path: Path, placeholder = "") {
    const value = (this._get(path) as string | undefined) ?? "";
    return html`
      <label>${label}</label>
      <input
        type="text"
        .value=${value}
        placeholder=${placeholder}
        @input=${(event: Event) =>
          this._set(path, (event.target as HTMLInputElement).value)}
      />
    `;
  }

  private _numberInput(label: string, path: Path, fallback: number) {
    const value = (this._get(path) as number | undefined) ?? fallback;
    return html`
      <label>${label}</label>
      <input
        type="number"
        .value=${String(value)}
        @input=${(event: Event) =>
          this._set(path, Number((event.target as HTMLInputElement).value))}
      />
    `;
  }

  private _checkbox(label: string, path: Path, fallback: boolean) {
    const stored = this._get(path);
    const checked = typeof stored === "boolean" ? stored : fallback;
    return html`
      <label class="check">
        <input
          type="checkbox"
          .checked=${checked}
          @change=${(event: Event) =>
            this._set(path, (event.target as HTMLInputElement).checked)}
        />
        <span>${label}</span>
      </label>
    `;
  }

  render() {
    if (!this.hass) return nothing;

    return html`
      <div class="editor">
        <section>
          <h3>Allgemein</h3>
          ${this._textInput("Titel", ["title"], "Energiefluss")}
          ${this._numberInput("Animationsschwelle in W", ["power_threshold"], 5)}
        </section>

        ${this._pvSection("PV1", "pv1")}
        ${this._pvSection("PV2", "pv2")}
        ${this._pvSection("PV3", "pv3")}

        ${this._batterySection("Batterie 1", "battery1")}
        ${this._batterySection("Batterie 2", "battery2")}

        <section>
          <h3>Netz</h3>
          ${this._entityPicker("Leistung", ["grid", "power"])}
          ${this._checkbox(
            "Positiver Wert bedeutet Netzbezug",
            ["grid", "positive_is_import"],
            true
          )}
        </section>

        <section>
          <h3>Haus</h3>
          ${this._textInput("Name", ["house", "name"], "Haus")}
          ${this._entityPicker("Leistung", ["house", "power"])}
        </section>

        <section>
          <h3>Wärmepumpe</h3>
          ${this._textInput("Name", ["heat_pump", "name"], "Wärmepumpe")}
          ${this._entityPicker("Leistung", ["heat_pump", "power"])}
        </section>
      </div>
    `;
  }

  private _pvSection(title: string, key: "pv1" | "pv2" | "pv3") {
    return html`
      <section>
        <h3>${title}</h3>
        ${this._textInput("Name", ["solar", key, "name"], title)}
        ${this._entityPicker("Leistung", ["solar", key, "power"])}
        ${this._entityPicker("Spannung", ["solar", key, "voltage"])}
        ${this._entityPicker("Strom", ["solar", key, "current"])}
      </section>
    `;
  }

  private _batterySection(title: string, key: "battery1" | "battery2") {
    return html`
      <section>
        <h3>${title}</h3>
        ${this._textInput("Name", [key, "name"], title)}
        ${this._entityPicker("Leistung", [key, "power"])}
        ${this._entityPicker("Ladezustand (SOC)", [key, "soc"])}
        ${this._checkbox(
          "Positiver Wert bedeutet Laden",
          [key, "positive_is_charging"],
          true
        )}
      </section>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .editor {
      display: grid;
      gap: 12px;
      padding: 4px 0;
    }

    section {
      display: grid;
      grid-template-columns: minmax(140px, 0.8fr) minmax(180px, 1.4fr);
      gap: 8px 12px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
    }

    h3 {
      grid-column: 1 / -1;
      margin: 0 0 4px;
      font-size: 15px;
    }

    label {
      align-self: center;
      font-size: 14px;
    }

    input[type="text"],
    input[type="number"] {
      box-sizing: border-box;
      width: 100%;
      min-height: 40px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 8px 10px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
    }

    .check {
      grid-column: 1 / -1;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    @media (max-width: 600px) {
      section {
        grid-template-columns: 1fr;
      }

      h3,
      .check {
        grid-column: 1;
      }
    }
  `;
}

if (!customElements.get("advanced-power-flow-card-editor")) {
  customElements.define(
    "advanced-power-flow-card-editor",
    AdvancedPowerFlowCardEditor
  );
}
