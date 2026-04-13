# LsERPPortal Architecture

## Final Direction

`LsERPPortal` is the long-term React mother project for:

- one deployment entry
- one runtime port
- one visual language
- one shared runtime engine
- multiple business domains

The final product shape is not "several independent apps that may be merged later".

It is:

- one portal shell
- one metadata-driven runtime engine
- one designer studio
- multiple product packs such as `erp`, `mes`, and `app`

## Core Architectural Rule

React owns:

- the portal shell
- route composition
- the designer UI
- the runtime renderer adapter

Pure TypeScript owns:

- schema contracts
- runtime state
- expression execution
- validation
- permission checks
- action orchestration

This keeps the most valuable platform logic independent from the UI framework while still letting the product standardize on React.

## Reference Document

The full baseline for product requirements, hidden requirements, workspace layout, and delivery order lives in:

- `docs/react-platform-foundation.md`
- `docs/development-standards.md`
- `docs/auth-bootstrap-contract.md`

## Migration Direction

`LsAITool` remains a migration source, not the long-term shell.

Recommended order:

1. Keep `LsERPPortal` as the clean mother.
2. Establish shared contracts and runtime core first.
3. Move shared infrastructure before moving pages.
4. Move designer capabilities by domain slice, not page-for-page translation.
5. Keep temporary technical islands isolated until they deserve a rewrite.

## Unified System Gate

Portal login does not grant product access by itself.

The expected access model is:

1. authenticate once at the portal shell
2. load the current user, role assignments, and granted system ids
3. enter a system gate route
4. expose only the systems allowed for that merged grant set
5. block direct route entry when the target system is not granted

The backend implementation can evolve toward:

- a system page table
- user-to-system bindings
- role-to-system bindings

The frontend should consume the merged grant result and keep route guards and navigation aligned with that source of truth.
