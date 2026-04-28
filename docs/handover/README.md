# Portal Handover

This folder is the first stop for anyone picking up `LsERPPortal`.
It is intentionally narrow: Portal mother-project entry points, package boundaries, and the shortest path to the real code.

## Read In Order

1. `portal-map.md`
2. `project-domain-map.md`
3. `portal-ui-standards-v1.md`
4. `../architecture.md`
5. `../auth-bootstrap-contract.md`

## What This Handover Covers

- Portal shell startup and provider wiring
- Auth bootstrap, company session, and system gate flow
- Route entry points for `systems`, `designer`, `erp`, `project`, `bi`, and `bi-display`
- Project product entry points and workspace boundaries
- Confirmed Portal UI baseline for typography, spacing, color roles, icons, logo, and control states

## What This Handover Does Not Cover

- Legacy designer implementation details under `packages/studio/designer`
- Backend implementation in `LserpPlatServer`
- Runtime protocol changes or package export changes

If you need to change behavior, start from the map files and then jump into the exact source file they name.
