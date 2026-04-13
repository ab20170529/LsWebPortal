# Development Standards

## Purpose

`LsERPPortal` is a platform product, not a one-off business frontend.

The development standards exist to protect:

- long-term maintainability
- clean package boundaries
- stable dependency strategy
- supply-chain safety
- the separation of runtime intelligence from render implementation

## Core Engineering Rules

### 1. Build platform-specific value, not generic infrastructure

We build our own code for:

- schema contracts
- runtime engines
- renderer adapters
- designer workflows
- ERP, MES, and APP domain extensions
- business-specific controls and template kits

We do not rebuild generic foundations unless there is a clear product reason.

### 2. Prefer mature third-party libraries

For common capabilities, third-party libraries are preferred over custom implementations.

Typical examples include:

- request clients
- server-state caching
- date and time handling
- common UI controls
- heavy data grids
- upload helpers
- testing tools
- monitoring SDKs

The default rule is:

- if a mature library already solves the problem well, use it
- if we write it ourselves, we must justify why

### 3. Hide vendor libraries behind platform adapters

Business packages must not couple themselves directly to vendor APIs where swap cost would be high.

The adapter boundary should live in packages such as:

- `packages/platform/http`
- `packages/platform/ui`
- `packages/platform/date`
- `packages/platform/grid`

Domain packages should consume platform interfaces, not raw vendor packages.

Important rules:

- schema contracts must never contain vendor component names
- metadata must not reference `antd`, `ag-grid`, `axios`, or similar package names
- product packages must not decide transport or UI vendors by themselves

### 4. System access must be governed centrally

The portal shell is a unified login entry for multiple product systems.

That means:

- authentication and system authorization are different concerns
- login alone must not imply access to every system
- route guards and navigation must follow the same merged grant source
- user-level and role-level system bindings must be supported

The expected backend shape is compatible with:

- a system page table
- user bindings to one or more system ids
- role bindings to one or more system ids

The frontend should consume merged system grants and expose only allowed systems.

## Recommended Dependency Baseline

The current preferred baseline is:

- `Ant Design` for shared UI controls and standard business-facing forms
- `AG Grid Enterprise` for heavy ERP tables, large datasets, frozen columns, grouping, tree data, master-detail, and Excel-like editing
- `TanStack Query` for server-state, caching, invalidation, retries, and async coordination
- `Day.js` for date handling
- `TanStack Router` for type-safe route composition

For HTTP transport:

- keep the transport implementation behind `packages/platform/http`
- prefer a mature client instead of a custom request wrapper
- treat `Axios` as a candidate, not an unconditional direct dependency

Because dependency risk changes over time, the transport client may change without affecting domain packages.

## Supply-Chain and Dependency Safety

### 1. Every new dependency needs a quick review

Before adding a dependency, check:

- official documentation
- maintenance activity
- license suitability
- security advisories
- release quality and stability
- whether the library is genuinely solving a common problem we should not rebuild

### 2. Exact version pinning is required

New dependencies must be added with exact versions.

Repository rule:

- commit the lockfile
- do not add runtime dependencies with floating ranges on purpose
- upgrade in controlled batches, not through accidental drift

### 3. One capability, one primary library

Avoid overlapping libraries for the same capability.

Examples:

- do not mix multiple request clients without a clear reason
- do not mix multiple date libraries
- do not mix multiple general UI component systems
- do not mix multiple heavy grid engines casually

### 4. High-scrutiny dependencies need extra controls

If a library has recent public supply-chain concerns or active security churn, adoption must be stricter.

Example: `Axios` incident note

On `2026-03-31`, public reports indicated that `axios@1.14.1` and `axios@0.30.4` on npm were malicious releases published through a compromised maintainer account.

Reported impact included:

- introduction of the malicious dependency `plain-crypto-js`
- install-time script execution
- cross-platform payload delivery affecting Windows, macOS, and Linux
- registry takedown of the malicious versions afterward

Working rule for this repository:

- never install or allow `axios@1.14.1`
- never install or allow `axios@0.30.4`
- if `plain-crypto-js` appears in the dependency tree, treat the environment as potentially compromised

For `Axios`, the current platform policy is:

- verify official advisories and release notes at install time
- pin an exact approved version
- add it only through `packages/platform/http`
- do not allow direct imports from product packages
- keep a fallback adapter strategy so transport can be swapped without schema or domain rewrites

If package trust is unclear on the day of adoption, pause integration and use the adapter boundary to switch strategy rather than pushing the risk into product code.

### 5. Incident response rule for compromised dependencies

If a package is later found to be malicious or compromised:

- stop installs immediately
- freeze dependency upgrades until the affected package is identified and contained
- inspect the lockfile and dependency tree
- identify every machine, CI runner, or container that executed install during the exposure window
- rotate credentials if install-time code execution may have occurred
- document the incident in project standards or security notes before resuming adoption

### 6. Audit before merge when dependencies change

When adding or upgrading dependencies:

- run dependency audit checks
- review lockfile changes
- verify only expected packages changed
- note any temporary exceptions explicitly in documentation

## Buy vs Build Decision Rules

Use a third-party library by default when all of these are true:

- the problem is common
- the library is active and maintained
- it has acceptable license and security posture
- we do not need deep domain-specific behavior

Build internally when at least one of these is true:

- the capability is part of the platform core
- the capability encodes ERP runtime semantics
- no mature library fits the requirement
- compliance, security, or performance rules block adoption
- we need a thin adapter to isolate a vendor, not to recreate the vendor

## UI and Template Rules

### 1. Theme and style must stay token-driven

Do not hardcode product colors in business pages.

All global visual decisions should flow through:

- tokens
- presets
- semantic roles
- controlled theme overrides

### 2. View and business logic must stay separated

This platform is expected to support template design and future AI-assisted template generation.

Therefore:

- view schema changes should not require rewriting runtime logic
- renderer packages should focus on visual mapping
- runtime packages should own rules, actions, validation, datasource, and permission logic

### 3. Generic form libraries are not the runtime source of truth

The runtime engine owns metadata-driven state.

UI libraries may provide controls, but they must not become the source of truth for dynamic runtime forms.

## Package Import Rules

- `products/*` may depend on `platform/*`, `schema/*`, `runtime/*`, and `renderer/*`
- `products/*` must not depend directly on external infrastructure libraries when an adapter package exists
- `schema/*` must stay framework-agnostic
- `runtime/*` must stay framework-agnostic
- `renderer/*` may depend on React and UI adapters

## Delivery Rule

When facing a generic capability decision:

- prefer a stable third-party solution
- wrap it behind a platform package
- keep business contracts vendor-neutral
- only build custom code where the platform actually differentiates
