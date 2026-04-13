# React Platform Foundation

## Decision Summary

The final frontend direction is:

- `React` as the product-wide UI framework
- `TypeScript` as the platform language
- `pnpm workspace` as the repository shape
- `one portal shell` for deployment and routing
- `one runtime engine` for metadata-driven rendering
- `designer`, `erp`, `mes`, and `app` as product domains on the same foundation

This is not a traditional multi-page business frontend.

It is a metadata-driven platform where the frontend is responsible for:

- parsing backend-delivered JSON metadata
- building runtime page instances
- rendering controls from a registry
- evaluating expressions and rules
- coordinating dynamic visibility, disable state, formulas, and actions
- providing a designer that edits the same runtime contract

## Confirmed Product Requirements

The following requirements were already made explicit in previous discussions.

### Product and deployment

- One deployment entry
- One runtime port
- One portal-style entry shell
- One consistent visual language
- Future domains must coexist under the same entry, not as separate long-term apps

### Business shape

- `erp` is the core product
- `erp` defines the runtime template system
- Template families include at least base templates and bill templates
- All visible page elements are dynamically rendered from backend metadata
- The frontend is primarily a runtime engine and renderer, not a page-by-page handwritten app

### Designer role

- The design platform is a platform foundation, not the final business runtime itself
- The designer is used to maintain metadata efficiently
- Future work may allow templates themselves to become dynamically designed
- Designer preview must align with the real runtime behavior

### Runtime behavior

- Metadata includes page, layout, form, table, column, button, and control definitions
- Runtime behavior includes:
  - dynamic visibility
  - dynamic hidden state
  - dynamic disabled state
  - formulas and calculated values
  - field-to-field linkage
  - conditional actions
  - permission-driven availability
- These behaviors are calculated at runtime, not fixed in handwritten pages

### Platform extension

- Future domains such as `mes` and `app` should render through the same dynamic template runtime
- New domains should extend templates, controls, actions, and metadata contracts without rebuilding the platform

### Engineering direction

- The mother project should stay clean
- The structure should minimize future upgrade cost
- Domain code should be isolated without splitting the product into unrelated apps

## Requirements That Are Easy To Miss

These are not optional details. They are part of the foundation if the platform is expected to survive long-term.

### 1. Schema versioning and migration

If the backend returns metadata, that metadata becomes a product contract.

The platform needs:

- versioned schema definitions
- migration rules between schema versions
- compatibility strategy for old templates
- validation before runtime execution

Without this, every template evolution becomes a breaking change.

### 2. Safe expression execution

Dynamic expressions are effectively an embedded rule language.

The platform needs:

- a parser or compiled expression model
- a sandboxed execution strategy
- prevention of arbitrary code execution
- error handling with useful diagnostics
- dependency tracking for recalculation

Direct `eval` must be forbidden.

### 3. Runtime dependency graph

Field linkage is not just "watch one value".

The runtime must understand:

- which fields depend on which inputs
- which formulas require recomputation
- which controls should re-render
- how to detect cycles such as `A -> B -> C -> A`

### 4. Runtime debugging and support tooling

Low-code platforms become hard to operate without visibility.

The platform should provide:

- schema inspection
- dependency tracing
- expression evaluation logs
- action execution logs
- runtime warnings for invalid metadata
- a debug panel that can be enabled in non-production environments

### 5. Performance budgets

Dynamic rendering becomes expensive fast, especially for tables and bills.

The platform needs:

- field-level subscriptions
- virtualized tables and long lists
- non-blocking recalculation for expensive transitions
- route and feature code splitting
- controlled cache invalidation

### 6. Multi-tenant and permission boundaries

Because this is ERP-led, the platform should treat these as first-class:

- tenant context
- account and role context
- page permissions
- field permissions
- row permissions
- action permissions
- auditability of metadata changes

### 7. Data contract governance

The frontend should not directly depend on unstable backend DTOs.

The platform needs:

- explicit platform contracts
- DTO-to-contract mapping
- compatibility tests for schema payloads
- fixture data for runtime regression tests

### 8. Observability

The platform should be prepared for:

- error monitoring
- user action tracing
- performance timing
- metadata fetch diagnostics
- slow rule evaluation diagnostics

### 9. UX consistency across products

One visual language means more than colors.

The platform should define:

- tokens
- spacing scale
- typography scale
- interaction patterns
- empty states
- loading states
- error states
- responsive behavior

### 10. Platform extension protocol

If `erp`, `mes`, and `app` all extend the same mother, extension cannot happen through ad-hoc imports.

The platform needs:

- template registration rules
- control registration rules
- action registration rules
- domain capability flags
- plugin-safe extension boundaries

### 11. ERP-specific output channels

ERP platforms usually grow into more than browser rendering.

The platform should be ready for:

- print templates
- export pipelines
- attachment workflows
- import validation
- mobile-oriented rendering conventions

### 12. Theme and skin governance

Theme switching is not a visual afterthought. It is a platform concern.

The platform should support:

- preset themes
- token-based theme overrides
- global typography and spacing governance
- brand color switching
- text color customization
- shell-level and template-level style consistency

Theme decisions must flow through tokens, not page-local hardcoded colors.

### 13. View and business separation

If templates may later be designed visually or generated by AI, view structure must not be mixed with runtime business logic.

The platform should separate:

- data schema
- behavior schema
- view schema
- renderer implementation

This means:

- runtime rules stay in `runtime-*`
- presentational structure stays in view contracts and renderer packages
- template authors and AI tools should be able to change view composition without editing action engines, validation engines, or datasource orchestration

## Recommended Technical Baseline

As of `2026-04-02`, the recommended baseline is:

- `React 19.2`
- `Vite 8`
- `TypeScript` in strict mode
- `Tailwind CSS v4`
- `pnpm workspace`
- `TanStack Router` for type-safe route composition
- `TanStack Query` for server-state orchestration
- `Vitest` for unit and package tests
- `Playwright` for end-to-end flows

For runtime state, the recommendation is:

- keep runtime state outside normal component state
- expose framework bindings through `useSyncExternalStore`
- use React as a renderer adapter, not as the business-rule engine

React-specific usage guidance:

- use `startTransition` for non-urgent recalculation and large view updates
- use `useDeferredValue` for expensive filtered or searched views
- use `useEffectEvent` when event semantics must stay stable without effect churn
- adopt React Compiler incrementally, not as a hard day-one dependency
- avoid introducing broad context-driven global state for runtime field values

## Why This React Shape Fits The Product

React is not chosen because it is magically better at low-code runtimes.

It is chosen because the total product is bigger than the runtime alone:

- one mother platform
- one designer
- one ERP runtime
- future `mes` and `app`
- one long-term engineering stack

To make React fit this problem well, the key is to avoid putting runtime intelligence into React components.

The valuable logic belongs in pure TypeScript packages and React consumes that logic through a renderer adapter.

## Recommended Workspace Layout

The package count is intentionally separated by responsibility, but it does not need to appear as one long flat list in the filesystem.

The recommended directory grouping is:

```text
apps/
  portal/
packages/
  platform/
    shell/
    router/
    auth/
    http/
    ui/
    tokens/
  schema/
    contracts/
    template-kits/
    control-registry/
  runtime/
    core/
    store/
    expression/
    actions/
    validation/
    permission/
    datasource/
    devtools/
  renderer/
    react/
  studio/
    designer/
  products/
    erp/
    mes/
    app/
```

This keeps the package boundaries clear while making the repository easier to scan.

## Recommended Split Strategy

Do not over-split on day one.

The right approach is:

### Stage 1. Compact package groups

Start with fewer real packages, grouped by layer:

```text
apps/
  portal/
packages/
  platform/
    core/
  schema/
    core/
  runtime/
    core/
  renderer/
    react/
  studio/
    designer/
  products/
    erp/
```

In this stage:

- `platform/core` can temporarily include shell, router, auth, http, and base UI
- `schema/core` can temporarily include contracts, template kits, and control registry
- `runtime/core` can temporarily include store, expression, actions, validation, permission, and datasource

This is the best starting point for early implementation speed.

### Stage 2. Split when pressure appears

Only split `runtime/core` or `platform/core` after one of these happens:

- ownership becomes unclear
- tests become slow or noisy
- package rebuild scope becomes too large
- APIs start getting unstable
- one area changes much faster than the others

Then the target split becomes:

- `platform/shell`
- `platform/router`
- `platform/auth`
- `platform/http`
- `platform/ui`
- `platform/tokens`
- `schema/contracts`
- `schema/template-kits`
- `schema/control-registry`
- `runtime/core`
- `runtime/store`
- `runtime/expression`
- `runtime/actions`
- `runtime/validation`
- `runtime/permission`
- `runtime/datasource`
- `runtime/devtools`

### Stage 3. Product expansion

When `mes` and `app` become real products, add:

- `products/mes`
- `products/app`

Keep product packages thin. Product packages should define extensions, not duplicate runtime infrastructure.

## Package Responsibilities

### `apps/portal`

Owns:

- deployment entry
- top-level route tree
- login bootstrapping
- tenant bootstrap
- shell layout
- product navigation
- lazy domain loading

### `packages/platform/shell`

Owns:

- global layout primitives
- shell header, side navigation, workspace switcher
- product entry guards
- shell-level notifications and dialogs

### `packages/platform/router`

Owns:

- route tree composition
- route context
- route guards
- shared route loaders
- product route registration

### `packages/platform/auth`

Owns:

- login session
- token refresh
- account bootstrap
- tenant switching
- permission context bootstrap

### `packages/platform/http`

Owns:

- request client
- interceptors
- retry and timeout policy
- API error normalization
- upload and download helpers

### `packages/platform/ui`

Owns:

- shared visual primitives
- accessible overlays
- buttons, inputs, menus, panels
- shell-level UI patterns

Important rule:

- schema contracts must never expose third-party component names

### `packages/platform/tokens`

Owns:

- color tokens
- spacing
- typography
- radius and elevation
- motion durations
- theme contracts
- theme presets
- token override governance

This package is the only place allowed to define global theme values.

### `packages/schema/contracts`

Owns the platform DSL:

- page schema
- layout schema
- template schema
- form schema
- grid schema
- column schema
- button schema
- control schema
- action schema
- expression schema
- validation schema
- permission schema
- datasource schema

This is the most important shared boundary in the whole platform.

It should eventually distinguish at least:

- data schema
- behavior schema
- view schema

### `packages/schema/template-kits`

Owns reusable template families:

- basic form template
- bill template
- query template
- list-detail template
- master-detail template
- dashboard template

`erp`, `mes`, and `app` extend these kits instead of inventing new page models casually.

### `packages/schema/control-registry`

Owns control registration:

- base controls
- selection controls
- table controls
- business bill controls
- product-specific extensions

The renderer asks the registry how to render a control type.

### `packages/runtime/core`

Owns the platform runtime model:

- schema normalization
- page instance creation
- form instance creation
- grid instance creation
- lifecycle orchestration
- command dispatching between runtime subdomains

### `packages/runtime/store`

Owns external runtime state:

- instance stores
- selectors
- subscription boundaries
- batched updates
- field-level invalidation

This package should expose React bindings through `useSyncExternalStore`-style APIs.

### `packages/runtime/expression`

Owns:

- expression parsing
- expression compilation
- dependency graph construction
- execution context
- safe formula evaluation
- circular dependency detection

### `packages/runtime/actions`

Owns:

- action registry
- button and event actions
- async command execution
- action pipeline and hooks
- optimistic or transactional action behavior where needed

### `packages/runtime/validation`

Owns:

- field validation
- cross-field validation
- form submission validation
- schema-level validation helpers

### `packages/runtime/permission`

Owns:

- page permission resolution
- field permission resolution
- action availability
- row-level permission helpers

### `packages/runtime/datasource`

Owns:

- remote options
- table querying
- dependent data loading
- cache keys
- invalidation strategy
- datasource adapters

### `packages/runtime/devtools`

Owns:

- schema inspector
- runtime trace viewer
- dependency graph debug utilities
- non-production diagnostics

### `packages/renderer/react`

Owns:

- schema-to-React rendering
- view adapters
- render slots
- suspense boundaries
- virtualization adapters
- presentational registry boundaries

This package renders runtime state. It does not define the runtime rules.

### `packages/studio/designer`

Owns:

- metadata editing UI
- schema authoring workflows
- control property editing
- action configuration
- preview integration

Critical rule:

- the preview must use the real runtime packages, not a fake designer-only preview path
- template editing must target the same view contracts that the runtime renderer consumes

### `packages/products/erp`

Owns ERP domain knowledge:

- ERP template definitions
- ERP controls
- ERP actions
- ERP default metadata conventions

This is the domain that defines the platform runtime language first.

### `packages/products/mes`

Owns:

- MES-specific controls
- MES-specific templates
- MES-specific actions

It extends the platform instead of bypassing it.

### `packages/products/app`

Owns:

- mobile-oriented templates
- mobile-oriented control mappings
- app-specific action and navigation conventions

## Runtime Data Flow

The desired flow is:

1. Backend returns metadata payloads that match `schema-contracts`.
2. `runtime-core` normalizes the payload into runtime instances.
3. `runtime-expression` builds the dependency graph.
4. `runtime-store` creates field and view subscriptions.
5. `runtime-datasource` resolves external data needs.
6. `runtime-permission` and `runtime-validation` resolve availability and correctness.
7. `renderer-react` renders the result through `app-ui`.
8. `designer-studio` edits the same schema and previews through the same runtime flow.

## React-Specific Guardrails

These rules matter for this platform more than for a normal React app.

- Do not store the entire runtime tree in React component state.
- Do not let page components own metadata business rules.
- Do not hardcode product colors directly in domain pages.
- Do not use a large React context that causes full-form rerenders.
- Do not let designer-only models drift away from runtime contracts.
- Do not bind schema identifiers to concrete UI library component names.
- Do not let domain packages import each other directly.
- Do not use generic form libraries as the source of truth for runtime-driven forms.
- Do not mix template view structure with validation, action, or datasource logic.

Prefer:

- external runtime stores
- selector-based subscriptions
- theme tokens and semantic styles
- lazy domain loading
- route-level and feature-level code splitting
- `startTransition` for expensive non-urgent state changes
- small pure renderer components
- package-first boundaries over folder conventions alone

## Suggested Delivery Order

### Phase 1. Foundation

- stabilize workspace structure
- define `schema-contracts`
- define shell, auth, http, tokens, and UI packages
- establish route composition strategy

### Phase 2. Runtime engine

- implement `runtime-core`
- implement `runtime-store`
- implement `runtime-expression`
- implement datasource, validation, and permission subdomains
- create a minimal debug panel

### Phase 3. React renderer

- implement `renderer-react`
- implement control registry
- implement template kits
- render one minimal form template and one minimal bill template

### Phase 4. Designer integration

- implement schema authoring flows
- wire real preview to runtime
- support control and template configuration

### Phase 5. Product extension

- establish `product-erp`
- add `product-mes`
- add `product-app`
- formalize extension APIs and governance

## Recommended First Build Target

The first working target should not be "all of ERP".

It should be:

- portal shell
- login bootstrap
- one metadata-driven form template
- one metadata-driven bill template
- one designer preview path using the same runtime

If this shape works cleanly, the mother is correct.

## Official References

- React versions: https://react.dev/versions
- React Compiler: https://react.dev/learn/react-compiler
- React `useSyncExternalStore`: https://react.dev/reference/react/useSyncExternalStore
- React `startTransition`: https://react.dev/reference/react/startTransition
- Vite guide: https://vite.dev/guide/
- Tailwind CSS with Vite: https://tailwindcss.com/docs/installation/using-vite
- pnpm workspaces: https://pnpm.io/workspaces
- TanStack Router overview: https://tanstack.com/router/latest/docs/overview
- TanStack Query overview: https://tanstack.com/query/latest/docs/framework/react/overview

## Delivery Governance Note

Day-to-day engineering rules for dependency selection, adapter boundaries, and supply-chain safety live in:

- `docs/development-standards.md`
