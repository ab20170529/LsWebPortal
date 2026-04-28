# Week 2 Review Checklist V1

Use this checklist in internal review before moving the week-2 target pages into polished visual design or engineering handoff.

Target pages:

- system gate
- project shell
- project ledger

---

## 1. System Gate Review

### Structure

- [ ] business context is visibly first
- [ ] system choice is visibly second
- [ ] current company is clearly highlighted
- [ ] admin action is secondary

### Understanding

- [ ] user can understand why company selection is required
- [ ] user can tell whether systems are locked or ready
- [ ] user can understand what Project is for before clicking

### States

- [ ] no-company state exists
- [ ] ready state exists
- [ ] switching state exists
- [ ] load-error state exists
- [ ] no-systems state exists

---

## 2. Project Shell Review

### Structure

- [ ] shell clearly separates header, nav, and content
- [ ] current project context is visible
- [ ] left navigation is grouped by role intent
- [ ] Admin and Standards do not dominate

### Role Fit

- [ ] manager landing feels logical
- [ ] member landing feels task-first
- [ ] viewer landing feels low-noise

### States

- [ ] no-project-selected state exists
- [ ] restricted/read-only state is considered
- [ ] loading workspace state is considered

---

## 3. Project Ledger Review

### Structure

- [ ] page header is clear
- [ ] summary cards are useful and not noisy
- [ ] list and detail relationship is clear
- [ ] selected project is obvious

### Product Logic

- [ ] initialization-by-type is visible enough
- [ ] create/edit/init/delete hierarchy is clear
- [ ] permission differences are understandable

### States

- [ ] empty state exists
- [ ] no-search-result state exists
- [ ] no-project-selected state exists
- [ ] load-error state exists
- [ ] no-permission-to-manage state exists

---

## 4. Cross-Page Review

- [ ] terminology is consistent
- [ ] state labels are consistent
- [ ] action language is business-facing
- [ ] role assumptions are aligned across pages
- [ ] current company context is not lost when entering Project

---

## 5. Release-To-Next-Step Rule

Do not move to polished visual work until:

- [ ] structure is stable
- [ ] role logic is accepted
- [ ] open decisions are reduced to a short list
