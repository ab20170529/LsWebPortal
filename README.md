# LsERPPortal

`LsERPPortal` is the new mother frontend for the LsERP platform family.

It is intended to host:

- `designer`
- `erp`
- future products such as `mes` and `app`

under one portal shell, one runtime port, and one shared platform foundation.

## Current Direction

The final platform choice is:

- `React` for the portal shell, designer UI, and renderer adapter
- `TypeScript` for all core platform logic
- `pnpm workspace` for package boundaries

The most important architectural rule is:

- React renders the platform
- pure TypeScript owns the runtime intelligence

## Key Documents

- `docs/architecture.md`
- `docs/auth-bootstrap-contract.md`
- `docs/development-standards.md`
- `docs/react-platform-foundation.md`

## Current Baseline

- React
- Vite
- TypeScript
- Tailwind CSS v4
- pnpm workspace

## Common Commands

```bash
pnpm dev
pnpm test
pnpm check
pnpm audit:deps
```

## Current Note

The current scaffold has already passed `build + typecheck`.

During the initial setup, registry access was unstable and returned `ECONNRESET`, so the first verification reused the neighboring `LsAITool/node_modules` as a temporary local dependency source.

Because this temporary dependency source does not currently expose the `vitest` binary in `LsERPPortal/node_modules/.bin`, `pnpm test` will need a proper local install before it can run successfully here.

Once registry access is stable, run:

```bash
pnpm install
pnpm test
pnpm check
```
