---
name: lserp-portal-evolution
description: Turn confirmed LsERPPortal findings into durable rolling logs, handover docs, map files, README/AGENTS discovery links, and repo-local skill notes. Use after time-consuming Portal work, when writing docs/rolling or docs/handover, updating skill references, or backfilling team AI knowledge; do not use for runtime or business-logic implementation.
---

# LsERP Portal Evolution

Use this skill only after a Portal finding is confirmed and you are writing it back into durable docs or skill references.

## Output Targets

- `docs/rolling/ai-development-log.md`
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
- Every time-consuming task should leave at least one reusable note in `docs/rolling/ai-development-log.md`.
- Promote only durable rules into skills; keep one-off command output in the rolling log.

## Write-Back Pattern

1. Read [handover-writing.md](references/handover-writing.md).
2. Read [evolution-policy.md](references/evolution-policy.md) for the write-back order.
3. Capture the confirmed source path or behavior.
4. Append the rolling log entry first when the work was non-trivial.
5. Write the shortest useful explanation for the next agent.
6. Update the relevant handover page, then README or AGENTS if discovery should change.
