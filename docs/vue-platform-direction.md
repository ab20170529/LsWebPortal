# Vue Platform Direction

> Status: superseded.
>
> This document is kept only as a historical comparison record.
> The adopted direction for `LsERPPortal` is now documented in `docs/react-platform-foundation.md`.

## Decision Summary

If we ignore legacy migration cost and only optimize for the future platform shape, the recommended frontend direction is:

- `portal shell`: Vue 3
- `designer studio`: Vue 3
- `runtime renderer`: Vue 3
- `runtime core`: pure TypeScript, framework-agnostic

This choice is driven by the product shape:

- ERP is the primary product
- ERP defines the runtime template system
- pages are metadata-driven instead of hand-written
- most visible UI is dynamically rendered from backend JSON
- field behavior, visibility, disable state, formulas, and action availability are runtime-calculated
- later products such as `mes` and `app` still render through the same dynamic template runtime

For this problem, the real core is not "page framework", but a `runtime engine`.

## Target Platform Shape

The platform should not be modeled as "one design app plus several business pages".

It should be modeled as:

```text
apps/
  portal-web/
packages/
  shared-auth/
  shared-http/
  shared-shell/
  schema-contracts/
  template-kits/
  control-registry/
  runtime-core/
  runtime-expression/
  runtime-actions/
  runtime-validation/
  runtime-permission/
  renderer-vue/
  designer-studio/
  product-erp/
  product-mes/
  product-app/
```

### Portal Shell

Owns:

- login
- tenant and account context
- one runtime port
- navigation and route entry
- theme and global layout

Routes stay product-oriented:

- `/designer`
- `/erp`
- `/mes`
- `/app`

### Schema Contracts

The backend should not return raw frontend component trees.

It should return platform-level metadata contracts:

- page schema
- layout schema
- form schema
- grid schema
- column schema
- button schema
- action schema
- expression schema
- validation schema
- permission schema
- template schema
- datasource schema

### Template Kits

ERP should define platform-level template families such as:

- basic master template
- bill template
- query template
- list-detail template
- master-detail template
- dashboard template

MES and App should reuse the same template system and only extend the kit where needed.

### Control Registry

All runtime-renderable controls should be centrally defined:

- base inputs
- table and grid controls
- bill-specific controls
- MES-specific controls
- mobile-oriented controls

The renderer maps schema control types into registered controls.

### Runtime Core

This is the actual platform heart.

It must stay framework-agnostic and pure TypeScript.

Suggested subdomains:

- schema normalization
- dependency graph
- expression compilation and execution
- runtime store
- action engine
- datasource engine
- validation engine
- permission engine
- page/form/grid instance model

### Renderer Layer

Vue should only render runtime state.

The renderer must not own business rules.

### Designer Studio

The designer should edit the same schema contract that the runtime consumes.

That means:

- no private designer-only model
- no fake preview path
- preview uses the real runtime engine

## Why Vue 3 Fits This Better

For this platform, the main frontend problem is:

- dynamic component rendering
- runtime-calculated field dependencies
- expression-driven state changes
- fine-grained partial updates
- large amounts of metadata-bound UI

Vue 3 matches this well because:

- its reactivity model is closer to rule-driven UI
- computed state and watchers naturally fit field dependency evaluation
- dynamic component rendering is straightforward
- TypeScript support is mature
- the mental model for runtime-calculated UI is simpler than React plus a heavy external subscription layer

Official references:

- [Vue TypeScript Overview](https://cn.vuejs.org/guide/typescript/overview)
- [Composition API FAQ](https://cn.vuejs.org/guide/extras/composition-api-faq)
- [Reactivity In Depth](https://vuejs.org/guide/extras/reactivity-in-depth)
- [Performance Best Practices](https://cn.vuejs.org/guide/best-practices/performance)

React remains strong for editor-heavy applications, but for this specific product shape the runtime engine side is more important than the editor side.

## What This Means For `LsAITool`

The current design platform is useful as a migration source, but not as a direct Vue conversion target.

Local evidence from `LsAITool`:

- `src` currently has about `168` TypeScript/TSX files
- `110` files directly import React
- hook references are about `835`
- `src/features/dashboard` has `128` files, and `98` of them directly import React
- `src/components/Dashboard.tsx` alone is about `6242` lines
- the architecture doc already aims at "shared infrastructure, separate platform shells"
- but the doc also states the old `Dashboard` is still the live implementation behind the design route

That means the current project is not a thin shell around pure runtime logic. A large part of it is still deeply tied to React view composition.

## Feasibility Of Converting The Existing Design Platform To Vue

### 1. Direct "convert the current project to Vue"

Feasibility: `40% - 50%`

Why it is weak:

- too much React-bound TSX
- large dashboard workbench is interaction-heavy
- current design pages are not yet separated from the old dashboard shell deeply enough
- replacing hooks and render structure file by file would cost a lot and still carry the old shape forward

This path is not recommended.

### 2. Treat `LsAITool` as a source and rebuild the UI layer in Vue

Feasibility: `75% - 85%`

Why it is strong:

- shared contracts can be migrated
- backend API adapters can be reused or lightly rewritten
- process-designer concepts can be preserved
- the existing Vue simple designer is already a natural bridge
- heavy React workbench UI can be redesigned instead of mechanically ported

This is the recommended path.

## What Can Be Reused

Relatively portable:

- `src/lib/http.ts`
- `src/lib/backend-auth.ts`
- `src/app/contracts/platform-routing.ts`
- backend contract understanding
- template and process design concepts
- menu, route, and permission contract ideas

Mostly rewrite:

- `src/components/Dashboard.tsx`
- most of `src/features/dashboard/**`
- current React shell and route presentation
- motion and drag interaction built directly into React components

Bridge or temporary island:

- `subapps/simple-process-designer`
- `simple-process-design-host-panel.tsx`

The Vue process designer can be kept as a temporary compatible island while the new Vue mother is established.

## Recommended Next Step

If Vue is the real direction, do not continue extending the current React mother beyond architectural experiments.

Instead:

1. Keep the current `LsERPPortal` only as a structural reference.
2. Rebuild the mother shell in Vue 3.
3. Define `schema-contracts` and `runtime-core` first.
4. Recreate the renderer and designer shell in Vue.
5. Migrate `LsAITool` capabilities by domain slice, not by page-for-page conversion.
