# Handover Write-Back Checklist

Use this reference when turning confirmed Portal findings into durable docs or skill notes.

## Write-Back Order

1. Capture the stable conclusion.
2. Name the exact source file paths.
3. Add the shortest useful next step for the next agent.
4. Update `docs/handover/*` first, then `README.md` or `AGENTS.md` if discovery needs to change.
5. Keep skill references narrow and reusable.

## Rules

- Write confirmed facts, not hypotheses.
- Do not describe runtime implementation changes in the docs unless they are already landed.
- Do not introduce legacy designer details unless the doc is explicitly about the legacy tree.
- Do not change route protocol or package exports while documenting them.

## Good Output Shape

- Start with the entry file or map file.
- Use short path-first bullets.
- Keep the language stable enough that another agent can continue from it without re-discovering the same paths.
