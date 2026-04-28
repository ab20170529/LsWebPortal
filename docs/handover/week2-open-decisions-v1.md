# Week 2 Open Decisions V1

This document lists the decisions that should be confirmed during week-2 review before visual design is fully frozen.

---

## 1. System Gate Decisions

### D1. Auto-Enter Or Explicit Choice

Question:

- after company selection, should the user be auto-routed to a default system?

Recommended answer:

- no
- keep explicit system choice

Why:

- safer in multi-system environments
- reduces unintended entry

### D2. Project Card Emphasis

Question:

- should the Project card receive stronger visual emphasis than the others?

Recommended answer:

- only if business strategy confirms project-first usage

### D3. Role Hint On Cards

Question:

- should a system card show a hint like `Recommended for your role`?

Recommended answer:

- optional
- only if implemented consistently across systems

---

## 2. Project Shell Decisions

### D4. First-Level Navigation Groups

Question:

- should the proposed five-group IA become the new first-level navigation?

Recommended answer:

- yes

### D5. Admin And Standards Visibility

Question:

- should `Standards` and `Admin` stay in first-level navigation for all authorized users?

Recommended answer:

- yes for now, but collapsed and visually secondary

### D6. Tab Prominence

Question:

- should workspace tabs remain a prominent part of the shell?

Recommended answer:

- keep them functional but reduce visual dominance

---

## 3. Project Ledger Decisions

### D7. Initialization Visibility

Question:

- should `Initialize By Type` be elevated from a minor row action to a contextual primary action in the detail panel?

Recommended answer:

- yes

### D8. Viewer Variant

Question:

- should viewers see the same detail panel with fewer actions, or a simplified read-only variant?

Recommended answer:

- same structure, fewer actions

### D9. Selected Project Requirement

Question:

- should downstream workspaces always require a selected project from the ledger first?

Recommended answer:

- yes for most project-specific workspaces

---

## 4. Role Strategy Decisions

### D10. Member Default Landing

Question:

- should project members always land on `Task Submission`?

Recommended answer:

- yes

### D11. Viewer Default Landing

Question:

- should viewers land on `Project Ledger` or `Project Analysis Dashboard`?

Recommended answer:

- default to `Project Ledger` if analysis maturity is still low

### D12. PMO Default Landing

Question:

- should PMO land on `Project Ledger` or a future dashboard?

Recommended answer:

- `Project Ledger` for now

---

## 5. Review Method

For each decision, collect:

1. final choice
2. owner
3. rationale
4. impact on design
5. impact on implementation
