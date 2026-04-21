---
name: lserp-portal-evolution
description: Turn confirmed LsERPPortal findings into durable handover docs, map files, README links, and repo-local skill notes. Use when writing docs/handover, updating AGENTS or README discovery links, or backfilling skill references, and do not use for runtime or business-logic implementation.
---

# LsERP Portal Evolution

Use this skill only after a Portal finding is confirmed and you are writing it back into durable docs or skill references.

## Output Targets

- `docs/handover/README.md`
- `docs/handover/portal-map.md`
- `docs/handover/project-domain-map.md`
- `README.md`
- `AGENTS.md`
- `agent.md`
- `.codex/skills/*/references/*`

## Rules

- Write stable conclusions, not hypotheses.
- Put the exact file path early so the next agent can continue immediately.
- Separate facts from next steps.
- Keep legacy designer details out unless the doc is explicitly about that tree.
- Do not change runtime code, route protocol, or package exports while documenting them.

## Write-Back Pattern

1. Read [handover-writing.md](references/handover-writing.md).
2. Capture the confirmed source path or behavior.
3. Write the shortest useful explanation for the next agent.
4. Update the relevant handover page first, then README or AGENTS if discovery should change.
