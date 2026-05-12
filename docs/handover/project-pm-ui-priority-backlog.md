# Project PM/UI Priority Backlog

This backlog is the execution companion to `project-pm-ui-week1-kit.md`.

It is optimized for a hybrid PM + UI role and can be used directly for:

- weekly planning
- design scheduling
- dev alignment
- review scope control

---

## P0: Must Do First

### 1. Redesign System Gate Page

Goal:

- reduce first-step confusion
- explain why company selection is required
- make system entry intent clearer

Tasks:

- rewrite system card copy
- separate "business context" from "system choice"
- improve locked/ready states
- define empty/error states for company loading and company activation

Expected output:

- low-fidelity wireframe
- high-fidelity page
- state spec
- handoff notes

### 2. Redesign Project Workspace Shell

Goal:

- change the experience from workspace collection to role-aware workbench

Tasks:

- regroup navigation
- define role-based default landing workspace
- reduce visual competition between admin/config and execution areas
- define tab strategy

Expected output:

- navigation IA
- shell wireframe
- high-fidelity shell
- interaction notes

### 3. Redesign Project Ledger

Goal:

- make project ledger the stable operational entry for PMO/managers/viewers

Tasks:

- simplify list hierarchy
- clarify important fields
- add initialization status and business meaning
- improve empty, error, and no-permission states

Expected output:

- page wireframe
- page states
- high-fidelity page
- table behavior spec

---

## P1: Important After P0

### 4. Redesign Schedule Collaboration

Goal:

- make it the true manager cockpit

Tasks:

- define page zones
- clarify project summary vs scheduling canvas vs task editing
- define progressive disclosure
- define dependency-impact visualization priority

### 5. Reframe Member Work As One Mental Model

Goal:

- unify task submission, plan/log, and delay application under a "My Work" understanding

Tasks:

- define member landing page
- align labels and workflows
- reduce context switching between member workspaces

### 6. Build A Product Copy Pass

Goal:

- remove abstract/internal language
- unify terminology

Tasks:

- rewrite workspace names if needed
- rewrite button copy
- rewrite empty state copy
- rewrite permission-denied copy

---

## P2: Important But Can Follow

### 7. Clarify Analysis Dashboard Scope

Goal:

- decide whether the dashboard is a near-term page or a later-phase product

Tasks:

- define audience
- define KPIs
- define core charts
- define what data must already exist before the page is useful

### 8. Reassess Template And Permission Areas

Goal:

- keep advanced configuration from overwhelming daily users

Tasks:

- define whether these areas should sit in the main nav or secondary admin layer
- define which roles should even notice them

---

## Product Questions To Resolve Early

These should be answered before large-scale high-fidelity design begins.

1. Should project members land on "Task Submission" by default?
2. Should PMO and managers share one landing page?
3. Is the analysis dashboard a real short-term deliverable or still a placeholder direction?
4. Should template management be visible in the main first-level navigation?
5. Should user and role permission management remain inside the project product or move closer to portal/system admin?

---

## Design Review Checklist

Use this on every page before handoff.

1. Can the user understand where they are within 3 seconds?
2. Can the user identify the next main action within 5 seconds?
3. Is the current company/business context visible enough?
4. Is the current role expectation visible enough?
5. Are empty, error, loading, and no-permission states complete?
6. Is the page using business language rather than internal platform language?
7. Is the layout prioritized by task importance instead of feature count?

---

## Dev Alignment Checklist

Use this before opening implementation work.

1. Does this change require only front-end work?
2. Does it require API changes?
3. Does it change permission behavior?
4. Does it depend on company-session behavior?
5. Does it require new empty/error state responses from backend?

---

## Suggested Delivery Order

1. System gate page
2. Project shell/navigation
3. Project ledger
4. Schedule collaboration
5. Member workspaces
6. Analysis and advanced admin areas

---

## Recommended Working Rhythm

For each priority item:

1. define business goal
2. define role impact
3. draw low-fidelity
4. confirm interaction rules
5. produce high-fidelity
6. create handoff notes
7. run implementation review
