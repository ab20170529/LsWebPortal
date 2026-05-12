# System Gate Low-Fi Spec V1

This document turns the system gate redesign brief into a low-fidelity page specification that can be used for:

- wireframing
- discussion with engineers
- content alignment
- first-round design review

Related docs:

- `project-pm-ui-week1-kit.md`
- `system-gate-redesign-brief-v1.md`

---

## 1. Page Intent

The page helps the user do two things in order:

1. confirm or switch business context
2. enter the right system

This order must be visible in layout and interaction.

---

## 2. Low-Fi Layout

```text
+----------------------------------------------------------------------------------+
| Utility Header                                                                   |
| [User / Status]                                              [System Admin]      |
+------------------------------------+---------------------------------------------+
| Left: Business Context             | Right: Enter A System                        |
|------------------------------------|---------------------------------------------|
| A. Section Label                   | F. Section Label                             |
| "Current Business Context"         | "Enter A System"                             |
|------------------------------------|---------------------------------------------|
| B. Current Context Card            | G. Helper copy                              |
| - current company title            | "Choose the right system after business      |
| - current status badge             | context is confirmed."                       |
| - status message                   |                                             |
|------------------------------------|---------------------------------------------|
| C. Why This Matters                | H. System Card Grid                          |
| - 2 to 3 short bullets             | [Project] [ERP]                              |
| - explains data / permission link  | [Designer] [BI]                              |
|------------------------------------| [BI Display]                                 |
| D. Switch Company List             |                                             |
| - current company                  | each card:                                   |
| - other companies                  | - system badge                               |
| - switching state                  | - title                                      |
|------------------------------------| - task-oriented description                  |
| E. Footer Note                     | - ready / locked state                       |
| "Changing company refreshes        | - click behavior                             |
| business context."                 |                                             |
+------------------------------------+---------------------------------------------+
```

---

## 3. Section Breakdown

### A. Section Label

Purpose:

- frame the left side as context setup, not general content

Copy:

- `Current Business Context`

### B. Current Context Card

Purpose:

- show where the user is currently working

Must show:

- company name
- selected status
- a badge:
  - `Required`
  - `Ready`
  - `Switching`

### C. Why This Matters

Purpose:

- reduce confusion around company selection

Recommended bullets:

- `Projects and records are loaded from the selected business database.`
- `Permissions and available data may change when the business context changes.`
- `Confirm the company before entering Project, ERP, BI, or Designer.`

### D. Switch Company List

Purpose:

- make the company change action explicit and lightweight

Each row should show:

- company title
- server / db hint
- current or use state

States:

- current
- available
- switching

### E. Footer Note

Copy suggestion:

- `Changing business context refreshes your current platform session to avoid cross-company data mistakes.`

### F. Section Label

Copy:

- `Enter A System`

### G. Helper Copy

Copy:

- `Choose the correct system after business context is confirmed.`

### H. System Card Grid

Each card should show:

- short badge
- title
- short description
- entry status

Cards should not look equally actionable when locked.

---

## 4. Card Copy Suggestions

### Project

- Badge: `PM`
- Title: `Project Management System`
- Description: `Open project ledger, schedule collaboration, task execution, reports, and delivery follow-up.`

### ERP

- Badge: `Runtime`
- Title: `ERP Platform`
- Description: `Handle business operations, workflow execution, and runtime collaboration tied to the current company.`

### Designer

- Badge: `Studio`
- Title: `Design Platform`
- Description: `Design metadata, preview structures, and maintain platform-facing configuration rules.`

### BI

- Badge: `BI`
- Title: `BI Analysis Platform`
- Description: `Review dashboards, runtime metrics, and data analysis views for the selected business context.`

### BI Display

- Badge: `Display`
- Title: `BI Display System`
- Description: `Open organization-facing display screens powered by BI runtime data.`

---

## 5. Interaction Rules

### No Company Selected

- current context card shows warning state
- system cards remain visible
- system cards are locked
- clicking a system card shows a clear reason banner

Banner message:

- `Choose a business context before entering a system.`

### Company Selected

- current context card shows success state
- system cards become enterable
- current company row is visually highlighted

Banner message:

- `Business context confirmed. You can now enter a system.`

### Company Switching

- selected row enters loading state
- other company buttons are temporarily disabled
- system cards remain disabled until switching completes

Banner message:

- `Switching business context...`

### Company Load Failure

- show error panel in left column
- keep system cards visible but locked if no active company exists

Message:

- `Unable to load available business contexts. Please try again.`

---

## 6. Visual Priority Rules

1. Active company status must be more visually important than system card decoration.
2. Locked cards must still feel discoverable, but clearly unavailable.
3. The left panel should feel stable and operational, not decorative.
4. The Project card may be slightly emphasized only if product strategy wants project-first usage.

---

## 7. Page States

### State A: Initial With No Active Company

- left card shows warning
- company list visible
- systems locked

### State B: Company Selected

- left card shows success
- current company row selected
- systems ready

### State C: Switching

- current row loading
- systems temporarily locked

### State D: No Systems Granted

- replace right grid with informative empty state
- admin button may still exist for privileged users

### State E: Company List Load Error

- left panel error
- retry action

---

## 8. Review Questions

Use these in review:

1. Does the user immediately understand that company selection comes first?
2. Is the current company visible enough?
3. Is the difference between locked and ready clear enough?
4. Does the Project card explain real user value?
5. Is admin access present but not distracting?

---

## 9. Handoff Notes

For implementation, engineering should keep:

1. company list logic unchanged unless product explicitly changes it
2. route behavior unchanged unless approved
3. locked-click explanation consistent
4. success/error state text centralized if possible
