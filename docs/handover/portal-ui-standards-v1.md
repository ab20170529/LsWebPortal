# Portal UI Standards V1

Archived on 2026-04-27.

This file records the confirmed UI baseline after the `/systems` page polish.
Use it before optimizing `/project` so project pages inherit the same platform language instead of becoming a separate visual system.

## Source Paths

- `apps/portal/src/pages/system-access-page-view.tsx` owns the `/systems` structure, state copy, logo/avatar assets, and system/company interaction.
- `apps/portal/src/styles/system-gate.css` owns the current platform visual tokens and page-level UI rules.
- `apps/portal/src/assets/system-gate-platform-logo.png` is the current left-top platform logo asset.
- `packages/products/project/src/index.tsx` is the project product entry.
- `packages/products/project/src/project-workspace-shell.tsx` is the project workspace shell.
- `packages/products/project/src/project-workspace-config.ts` is the project workspace registry.

## Confirmed Baseline

### Page Personality

- The platform UI should feel calm, trustworthy, operational, and structured.
- Do not turn internal tools into marketing landing pages.
- Prefer dense but readable operational layouts over oversized decorative sections.
- Business context should lead system entry: choose company/business database first, then choose system.

### Typography

Use this family on platform pages:

```css
font-family: Arial, "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
```

Rules:

- English and numbers should render with Arial.
- Chinese should render with Microsoft YaHei.
- Base body size is `14px`.
- Helper text, placeholder text, and prompt copy should stay light: `font-weight: 400`.
- Step badge numbers should stay moderate, not heavy: `14px / 600`.
- Do not scale font size with viewport width.
- Letter spacing stays `0`.

Current size scale from `system-gate.css`:

| Token | Size | Use |
| --- | ---: | --- |
| `--system-gate-text-xxs` | `11px` | tiny metadata |
| `--system-gate-text-xs` | `12px` | compact metadata |
| `--system-gate-text-sm` | `13px` | helper text, input text |
| `--system-gate-text-md` | `14px` | body/default |
| `--system-gate-text-lg` | `16px` | brand/header labels |
| `--system-gate-text-xl` | `18px` | card emphasis |
| `--system-gate-text-2xl` | `22px` | section emphasis |
| `--system-gate-text-title` | `26px` | large page title |
| `--system-gate-text-hero-mobile` | `28px` | mobile hero title |
| `--system-gate-text-hero` | `30px` | desktop hero title |

### Spacing

Confirmed on 2026-04-28 after the `/project` full-page spacing pass.

Use an 8px-based spacing rhythm across Portal product pages. Prefer these spacing steps:

| Step | Size | Use |
| --- | ---: | --- |
| `1` | `4px` | icon/text micro gap, tight badges |
| `2` | `8px` | compact inline gap, control micro spacing |
| `3` | `12px` | small control groups, dense table actions |
| `4` | `16px` | page outer margin, standard module gap |
| `5` | `20px` | card, modal, drawer, and panel inner padding |
| `6` | `24px` | rare roomy grouping when content density requires it |
| `8` | `32px` | empty-state vertical breathing room only |

Confirmed project spacing implementation:

- `packages/products/project/src/project-workspace-shell.tsx` owns the project workspace outer margin.
- The project workspace main content uses `p-4`, so the left menu to content gap, top bar to content gap, right edge, and bottom edge are all `16px`.
- Project shell header and right tools use compact `20px` horizontal padding and `16px` group gaps.
- Project card, drawer, and modal content should use `p-5` (`20px`) by default.
- Dense inner modules should use `p-4` (`16px`) and `gap-4` (`16px`).
- Page-level stacked modules should use `gap-5` or `space-y-4/5`, not loose `gap-8` or `space-y-8`.
- Empty states should use `px-5 py-8`; avoid `py-16` unless a page is intentionally editorial rather than operational.
- Tables in project workspaces should use `px-5 py-4` for cells.

Avoid these in operational project pages unless explicitly redesigned:

- `p-8`, `p-10`, `px-8`, `py-16`
- `gap-6`, `gap-8`, `space-y-6`, `space-y-8`
- asymmetric page shell padding such as `left/top 16px` with `right/bottom 32px`

### Text Color

Text color must use semantic roles, not one-off hex values.

Current roles:

- `--system-gate-text-strong`
- `--system-gate-text-main`
- `--system-gate-text-muted`
- `--system-gate-text-subtle`
- `--system-gate-text-inverse`
- `--system-gate-accent`
- `--system-gate-accent-strong`
- `--system-gate-success`
- `--system-gate-warning`
- `--system-gate-danger`

Project pages should map text to these roles first. Decorative backgrounds and borders may still use page-local values, but visible text should stay semantic.

### Icons

Use stable icon sizes through variables:

| Token | Size | Use |
| --- | ---: | --- |
| `--system-gate-icon-xs` | `16px` | inline utility/search icon |
| `--system-gate-icon-sm` | `18px` | header/action small icon |
| `--system-gate-icon-md` | `20px` | arrows, footer symbols |
| `--system-gate-icon-lg` | `32px` | compact icon container |
| `--system-gate-icon-xl` | `34px` | avatar/basic square icon |
| `--system-gate-icon-2xl` | `42px` | medium feature icon |
| `--system-gate-icon-3xl` | `44px` | system card icon |
| `--system-gate-icon-corner` | `26px` | selected-corner marker |

Confirmed details:

- Search icon is `16px`; this is correct for a `34px` high input.
- SVG icons should scale to their container with `width: 100%; height: 100%;`.
- Avoid ad hoc icon sizes inside project pages unless a new token is added deliberately.
- Use established icons/components; do not add decorative SVG illustrations for operational UI.

### Logo And Avatar

Current logo behavior:

- The platform logo is a PNG asset imported from `apps/portal/src/assets/system-gate-platform-logo.png`.
- The logo has no background frame, no gradient box, no shadow, and no forced crop.
- Current display constraints:
  - height: `56px`
  - max width: `164px`
  - `object-fit: contain`
- Replacing the brand logo should be done by replacing the PNG asset or changing the import path, not by rebuilding CSS shapes.

Current avatar behavior:

- The right-top user avatar is rendered as a PNG image.
- Keep avatar dimensions aligned with `--system-gate-icon-xl` unless a wider header identity treatment is designed.

### Controls

Search input baseline:

- Width: `248px` on desktop.
- Height: `34px`.
- Search icon stays on the left.
- The separate icon button on the right side of the search bar has been removed.
- The toolbar is right-aligned.

Search states:

- Default border: `--system-gate-control-border`
- Hover border: `--system-gate-control-border-hover`
- Focus border: `--system-gate-accent`
- Focus ring: `--system-gate-control-focus-ring`
- Search icon turns accent color on focus.
- Native input outline is removed so the platform focus style is the only visible focus frame.

Project pages should reuse this control-state logic for search, filters, and compact inputs.

### Selection And Switching

Confirmed `/systems` interaction rules:

- Choosing a business database should keep the clicked row in place; do not reorder every selection to the first row.
- Switching should feel immediate through optimistic state.
- Avoid success banner flicker after switching; reserve banners for useful feedback or errors.
- The selected company corner marker should align with the card corner and not drift from the card radius.

### Layout Rules

- Do not nest cards inside cards.
- Do not use visible instructional text to explain obvious UI mechanics.
- Keep repeated operational items as cards or rows; keep page sections as unframed layout or full-width bands.
- For project pages, prioritize scannability, comparison, repeated action, and role-specific task flow.
- Keep page shell spacing symmetrical unless a specific data grid or split-pane interaction requires otherwise.

## Project Optimization Usage

Before changing `/project`, read:

1. `docs/handover/portal-ui-standards-v1.md`
2. `docs/handover/project-domain-map.md`
3. `docs/handover/project-pm-ui-week1-kit.md`
4. `packages/products/project/src/project-workspace-shell.tsx`
5. the specific project workspace page being optimized

Apply the same visual language, but do not copy the `/systems` layout literally.
The project product has a different job: workspace navigation, project records, task flow, schedule state, and role-based work.

## Next Steps For `/project`

- Inventory current project page typography, colors, icon sizes, and focus states against this baseline.
- Normalize project search/filter controls first.
- Then normalize workspace shell navigation, page headers, cards/tables, status labels, and action buttons.
- Keep product-specific behavior inside `packages/products/project`.
