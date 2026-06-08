| [Home](../README.md) |
| -------------------- |

# Usage

The **Card Table** widget renders a grouped record count summary at the top of a module's list view. Once added and configured on a template, the summary updates automatically as records are created, modified, or closed in FortiSOAR.

## What the Widget Displays

The widget renders as a compact table. Each row represents a distinct value of the configured **Group By** field, with the count of matching records shown to the right. Only records that satisfy the configured **Filter Criteria** and **Record Assignment** scope are counted.

## Interacting with the Widget

- **Searching** — click the search icon in the widget header to filter the displayed groups by name.
- **Refreshing** — click the refresh icon in the widget header to reload the summary with the latest record counts.
- The widget respects the **Max Record Limit** you configured, so counts are based on the most recent records within that limit.

## Example — Open Alerts By Severity

When added to the **Alerts** module list view, the **Card Table** widget can be configured to show a breakdown of open alerts by severity. Using the following configuration:

| Parameters            | Value                        |
|-----------------------|------------------------------|
| **Title**             | Open Alerts By Severity      |
| **Data Source**       | Alerts                       |
| **Group By**          | Severity                     |
| **Max Record Limit**  | 10                           |
| **Record Assignment** | All                          |
| **Filter Criteria**   | Status — Not Equals — Closed |

The widget displays one row per severity level — such as **Low**, **Medium**, **High**, and **Critical** — each with the count of currently open alerts at that severity. This gives analysts an immediate view of where alert volume is concentrated, without scrolling through the full record list.

## Next Steps

| [Installation](./setup.md#installation) | [Configuration](./setup.md#configuration) |
| ---------------------------------------- | ------------------------------------------ |
