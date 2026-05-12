# Project UI Standards V1

Archived on 2026-04-29.

Use this file before optimizing `/project` workspaces. It extends `docs/handover/portal-ui-standards-v1.md` with the confirmed project-product page rules now applied to `packages/products/project`.

## Source Paths

- `packages/products/project/src/project-workspace-shell.tsx` owns the project top bar, left navigation, and `16px` shell padding.
- `packages/products/project/src/workspaces/plan-log/plan-log-page.tsx` is the current reference implementation for project workspace tables, page tabs, split side panels, and compact forms.
- `docs/handover/portal-ui-standards-v1.md` remains the parent typography, spacing, color, icon, logo, and control-state standard.

## Confirmed Page Frame

- Project workspace pages use the shell `main p-4`; do not add another page-level `p-4` inside the workspace.
- Page headers are lightweight content headers, not floating cards.
- Page title uses `20px / 700 / #111c33`; subtitle uses `14px / 500 / #5e7291`.
- Page tabs use a bottom-border active state, not filled pills, when they sit directly under the page title.
- Primary page actions sit at the right side of the page title row.

## Modules And Tables

- Main operational modules use `rounded-lg`, `border #e4ebf5`, white background, and a soft project shadow.
- Module header padding is `16px 16px 12px`.
- Table header background is `#f8fbff`.
- Table headers use `13px / 500 / #6b7f9e`.
- Table body uses `13px / 500`; strong row text uses `#263653`, secondary row text uses `#526681`.
- Cell padding is `12px 16px` for dense project workspaces.
- Empty table states use compact center text; avoid large illustrative empty states inside operational grids.

## Forms And Side Panels

- Right-side editing panels are reserved for primary entity forms such as project plans.
- Side panels use a white background, left border `#e4ebf5`, and a subtle left shadow. They should not be nested in another card.
- Side panel width starts at `360px` on desktop.
- Form controls use `36px` height, `6px` radius, border `#d9e3f1`, focus border `#1f7cff`, and focus ring `#dceaff`.
- Do not show editable fields that are not persisted by the current API. If a field is only a design target, keep it out until the data contract exists.

## Actions

- Page-level primary action: blue filled button, `32px` height, icon plus text.
- Table row actions: text buttons, `14px / 600 / #1f65e8`.
- Do not show destructive actions unless a real handler and confirmation flow exist.
- Keep destructive actions red and explicit when they are real, such as attachment deletion.

## Current Next Steps

- Keep `计划填报`, `日志 / 总结`, and `附件资料` visually aligned through the same module, table, control, and empty-state rules.
- If backend fields are added for plan priority, work hours, remarks, or deletion, update this file and the corresponding table/form in the same change.
