# Changelog

## 0.2.5

- Reworked PV-system hierarchy: MPPT nodes are visually quieter while the system total is shown as a wider, stronger summary node with a `Gesamt` badge.
- MPPT nodes now use a distinct tracker icon so they are easier to distinguish from the parent PV system.
- Added an optional `daily_energy` entity to each PV system.
- Clicking `PV heute` now opens a detailed daily-production breakdown by PV system, including percentage shares when a total is available.
- Battery nodes are now expandable like the heat-pump node.
- Added optional battery detail entities for voltage, current, temperature, min/max cell voltage and temperature, SOH, cycle count, remaining energy and daily charge/discharge energy.
- Battery details automatically calculate and display the cell-voltage delta when min/max values are available.

## 0.2.4

- Reworked the center node: it now shows total current supply instead of repeating PV power.
- Added live energy-balance diagnostics. With a measured house-power entity the center reports residual balance and highlights deviations above the configurable warning threshold.
- House nodes calculated from PV/grid/battery power now show a clear `Berechnet` badge.
- Grid flow now uses a compact `Bezug` / `Einspeisung` / `Ruhe` badge.
- Battery subtitles now state `Lädt`, `Entlädt` or `Ruhe` alongside SOC.
- Added 20% and 80% reference marks to battery SOC bars.
- Added `small`, `normal` and `large` typography modes; `large` is the new default for improved phone readability.
- Added optional daily summary entities for PV energy, grid import, grid export and house energy.
- Hovering a node on desktop now emphasizes its connected power-flow path and fades unrelated paths.
- Idle/zero-power nodes are visually quieter.
- Removed the layout hint below the diagram.

## 0.2.3

- Added a graphical SOC fill bar to every battery node.
- Added a compact operating-mode/status badge to the heat-pump node.
- Added visual active, idle and unavailable node states.
- Idle nodes are intentionally quieter while active nodes receive a slightly stronger outline.
- Unavailable nodes use a subdued dashed outline so missing data is immediately recognizable.
- Heat-pump summary now prioritizes flow temperature and COP because the operating mode is shown as a badge.

## 0.2.2

- Increased diagram typography slightly for better phone readability.
- Added subtle semantic accents for PV, grid, battery and heat-pump nodes.
- Added softer node shadows and a subtle active-flow glow.
- Refined PV cluster styling and visual hierarchy.
- Hid the layout hint on small screens to reduce visual clutter.
- MPPT secondary information now omits missing voltage/current values instead of showing placeholder dashes.

## 0.2.1

- Removed internal horizontal scrolling; the complete diagram now fits the card width.
- PV systems wrap into multiple rows instead of making the diagram wider.
- MPPT nodes wrap within their PV system.
- Bottom consumers/batteries wrap into rows.
- Rebalanced node sizes and typography between v0.1 and v0.2.
- House consumption is calculated automatically when no house power entity is configured.
- Automatic house balance respects grid and battery sign settings and avoids double-counting child consumers.

## 0.2.0

- Dynamic number of PV systems.
- Arbitrary number of sub-PV/MPPT inputs per PV system.
- Dynamic number of batteries.
- Optional generic consumers.
- Extended heat-pump data with expandable details.
- Larger nodes, typography and flow lines.
- Responsive diagram that preserves readability with horizontal scrolling if necessary.
- Graphical editor for adding/removing PV systems, MPPTs, batteries and consumers.
- Automatic migration of the v0.1 fixed PV1/PV2/PV3 and battery1/battery2 configuration.
