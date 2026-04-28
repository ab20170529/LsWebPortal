# Project Shell Figma Block Map V1

This is the Figma-ready block map for the project product shell.

It converts the IA proposal into draw-ready structure.

---

## 1. Frame Setup

### Recommended Frame Naming

- `Project / Shell / Desktop / Manager Default`
- `Project / Shell / Desktop / Member Default`
- `Project / Shell / Desktop / Viewer Default`
- `Project / Shell / Desktop / No Project Selected`

### Main Layout

- full-page frame
- header on top
- left navigation
- main content panel

---

## 2. Top-Level Blocks

```text
Frame
├─ Global Header
├─ Shell Body
│  ├─ Left Nav
│  └─ Main Workspace Panel
```

---

## 3. Global Header

### Child Blocks

- `Breadcrumb / Current Location`
- `Current Project Chip`
- `Search`
- `Utility Actions`

### Breadcrumb Content

- Product
- Group
- Workspace

Example:

- `Project / Project Control / Project Ledger`

### Current Project Chip

Content:

- selected project name
- optional small state

If no project is selected:

- `No project selected`

### Utility Actions

- notifications
- settings
- exit system

---

## 4. Left Nav

### Block Name

- `Project Left Nav`

### Child Blocks

1. `Nav Group / My Work`
2. `Nav Group / Project Control`
3. `Nav Group / Insight`
4. `Nav Group / Standards`
5. `Nav Group / Admin`

### Group Structure

```text
Nav Group
├─ Group Label
├─ Nav Item
├─ Nav Item
└─ ...
```

### Recommended Items

#### My Work

- Task Submission
- Plan And Log
- Delay Application

#### Project Control

- Project Ledger
- Schedule Collaboration

#### Insight

- Project Analysis Dashboard

#### Standards

- Milestone Templates

#### Admin

- User Permissions
- Role Permissions

---

## 5. Role Variants

### Manager Default

- Project Control expanded
- Schedule Collaboration active

### Member Default

- My Work expanded
- Task Submission active

### Viewer Default

- Insight or Project Control expanded
- Project Analysis Dashboard or Project Ledger active

---

## 6. Main Workspace Panel

### Child Blocks

- `Workspace Header`
- `Optional Context Banner`
- `Workspace Content Area`

### Workspace Header

Should show:

- workspace title
- short workspace purpose
- current project context

### Optional Context Banner

Use when needed for:

- no project selected
- read-only mode
- current company reminder

### Workspace Content Area

This is the replaceable area per page.

For wireframe purposes, treat it as:

- page-specific content slot

---

## 7. Required Shell Variants

Create these Figma versions:

1. manager landing
2. member landing
3. viewer landing
4. no project selected
5. read-only workspace

---

## 8. Draw Order Recommendation

1. draw the persistent shell first
2. draw left navigation states
3. draw header states
4. drop in one example page content block

---

## 9. Open Decisions

1. Should tabs remain visually prominent?
2. Should selected project chip be interactive?
3. Should admin and standards groups be collapsed by default for all roles?
