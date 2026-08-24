# Changelog

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
