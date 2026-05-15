# LsERPPortal Evolution Policy

Use this reference after substantial Portal work.

## Append To Rolling Log When

- Work took meaningful investigation time.
- A runtime entrypoint, package boundary, route, auth flow, or verification trap was clarified.
- A bug fix required reading more than one module.
- A decision affects future migration from `LsAITool`.
- A failed approach would likely be repeated by another AI or teammate.

## Write-Back Order

1. `docs/rolling/ai-development-log.md`
2. The nearest `docs/handover/*` map or checklist
3. Repo-local `.codex/skills/lserp-portal-*`
4. Workspace `D:\NetPorjects\JavaProject\LserpPro\.codex\skills\lserp-skill-evolution` for cross-project facts

## Entry Shape

- Date and task name
- Real entrypoints touched
- Confirmed lesson
- Files changed
- Verification command and result
- Remaining risk or next handoff
