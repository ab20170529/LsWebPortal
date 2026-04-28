# Project Ledger Figma Block Map V1

This is the Figma-ready block map for the Project Ledger page.

Use it to draw the page wireframe directly.

---

## 1. Frame Setup

### Recommended Frame Naming

- `Project / Ledger / Desktop / Default`
- `Project / Ledger / Desktop / Empty`
- `Project / Ledger / Desktop / No Search Result`
- `Project / Ledger / Desktop / No Permission To Manage`
- `Project / Ledger / Desktop / Error`

---

## 2. Top-Level Blocks

```text
Page
├─ Page Header
├─ Summary Cards Row
├─ Main Two-Column Body
│  ├─ Project List Panel
│  └─ Project Detail Panel
```

---

## 3. Page Header

### Child Blocks

- `Page Title`
- `Page Helper Text`
- `Primary Action / Create Project`
- `Secondary Action / Refresh`
- `Search`

### Recommended Copy

Title:

- `Project Ledger`

Helper:

- `Create, review, and initialize projects before entering schedule and execution work.`

---

## 4. Summary Cards Row

### Child Blocks

- `Summary Card / Total`
- `Summary Card / Active`
- `Summary Card / Draft`
- `Summary Card / Completed`

### Card Content

- label
- value
- optional micro-hint later

---

## 5. Main Body

### Layout

- left: project list
- right: selected project detail

The right panel should always feel like the continuation of the selected row.

---

## 6. Project List Panel

### Child Blocks

- `List Toolbar`
- `Project Table or List`
- `Optional Empty/Result State`

### List Toolbar

Possible child blocks:

- search result count
- optional type/status filters later

### Project Row Structure

Each row should show:

- project name
- project code
- type
- manager
- status
- timeline
- quick actions

### Quick Actions

- edit
- initialize by type
- delete

Rule:

- initialization should not feel like a hidden side action

---

## 7. Project Detail Panel

### Child Blocks

- `Selected Project Header`
- `Project Key Facts`
- `Initialization Status Module`
- `Recommended Next Actions`

### Selected Project Header

Show:

- project name
- status badge
- project type

### Project Key Facts

Recommended rows:

- manager
- time range
- budget
- business unit
- source
- attendance address

### Initialization Status Module

This should be a visible standalone block.

Purpose:

- clarify whether the project is ready for downstream work

Possible states:

- not initialized
- initialized
- partially initialized only if product later supports it

### Recommended Next Actions

Examples:

- `Initialize by type`
- `Open schedule collaboration`
- `Edit project info`

---

## 8. Required Variants

### Empty State

- no projects yet
- create-first guidance

### No Search Result

- keyword returned no result

### No Project Selected

- user has projects but none is selected

### No Permission To Manage

- view allowed
- edit/init/delete restricted

### Error State

- list failed to load

---

## 9. Recommended Draw Sequence

1. draw page header
2. draw summary cards
3. draw project list panel
4. draw selected detail panel
5. duplicate for empty/error/restricted states

---

## 10. Open Decisions

1. Should initialization status appear in list rows too?
2. Should create and initialize be visually connected as a two-step story?
3. Should viewers see the same detail panel with fewer actions, or a simplified variant?
