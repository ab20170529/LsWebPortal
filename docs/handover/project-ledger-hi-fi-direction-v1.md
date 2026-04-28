# Project Ledger Hi-Fi Direction V1

This document defines the visual direction for the Project Ledger page.

It follows the ledger low-fi spec and prepares the page for high-fidelity execution.

---

## 1. Page Personality

The page should feel:

- operational
- legible
- manager-friendly
- calmly data-rich

It should not feel:

- like a raw admin table
- like a BI dashboard
- like a form-heavy setup page

This page is the control entry for project work.

---

## 2. Visual Strategy

The page has one central story:

> identify the project, understand its state, then continue the right next action.

That means the page hierarchy should be:

1. project list scanning
2. selected project understanding
3. next-step action

---

## 3. Header Direction

The header should communicate:

1. what this page is for
2. what the main action is

### Recommended emphasis order

1. page title
2. create project
3. search
4. refresh

The title should make the page feel foundational, not optional.

---

## 4. Summary Cards Direction

These cards should feel:

- compact
- useful
- not dashboard-like

They help orientation, but should not compete with the list and detail relationship.

Rule:

- keep them visually quiet compared with the selected-project detail panel

---

## 5. List Panel Direction

The left list is the scanning engine of the page.

### It should support

1. quick comparison
2. fast recognition
3. stable selection

### Design rule

- rows must feel scannable, not crowded
- selected row must be visually obvious
- quick actions must not overpower row identity

The project name and status should be the strongest row signals.

---

## 6. Detail Panel Direction

The right detail panel is what makes this page product-valuable.

It should not just repeat row data.

It should tell the user:

1. what this project is
2. what state it is in
3. whether it is ready for downstream work
4. what should happen next

### Strong modules

1. selected project header
2. key facts
3. initialization status
4. recommended next actions

---

## 7. Initialization Status Direction

This is a key product concept and should have clear visual treatment.

### If not initialized

Mood:

- pending
- important
- actionable

### If initialized

Mood:

- ready
- stable

The module should feel like an operational readiness checkpoint, not like a warning or error.

---

## 8. Permission Treatment

For users who can view but not manage:

- the page should still feel complete
- but actions should not imply false permission

Design rule:

- read-only users should understand the page, not feel broken by it

Possible support copy:

- `You can view this project, but you do not have permission to manage it.`

---

## 9. Empty And Error State Direction

### Empty

Should feel:

- inviting
- clear
- action-oriented

### No Search Result

Should feel:

- recoverable
- lightweight

### Error

Should feel:

- controlled
- retryable

---

## 10. Density And Rhythm

Recommended rhythm:

- moderate density in the list
- calmer, clearer density in the detail panel

The detail panel should breathe more than the list.

That difference helps scanning vs understanding.

---

## 11. Action Hierarchy

### Primary

- Create Project
- Initialize By Type when needed

### Secondary

- Edit
- Open Schedule Collaboration

### Tertiary

- Refresh
- Delete

Delete should not visually compete with setup and continuation actions.

---

## 12. High-Fidelity Review Questions

1. Does the page feel more like project control than generic CRUD?
2. Is the selected project clear enough?
3. Is initialization visible enough as a meaningful step?
4. Are viewers/read-only users handled gracefully?

---

## 13. Finish Line For This Page

This page is ready when:

1. list/detail relationship is strong
2. selected project state is obvious
3. initialization is visible and understandable
4. actions are clearly prioritized
