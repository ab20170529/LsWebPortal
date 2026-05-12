# Project Shell Low-Fi Spec V1

This document defines the low-fidelity structure for the `project` product shell.

It translates the IA proposal into a page-level shell that can be used for:

- wireframing
- PM/UI review
- front-end alignment
- role-based experience planning

Related docs:

- `project-information-architecture-v1.md`
- `project-role-permission-matrix-v1.md`
- `project-page-state-inventory-v1.md`

---

## 1. Shell Goal

The shell should help the user answer four questions immediately:

1. Which product am I in?
2. Which project context am I working on?
3. Which zone of work am I in?
4. What should I do next?

The shell should feel like a workbench, not a generic admin frame.

---

## 2. Recommended Structure

```text
+----------------------------------------------------------------------------------+
| Global Header                                                                    |
| Product / Current Zone / Current Workspace / Current Project / Search / Exit     |
+----------------------+-----------------------------------------------------------+
| Left Navigation      | Workspace Content Area                                    |
|----------------------|-----------------------------------------------------------|
| My Work              | Active page content                                       |
| - Task Submission    |                                                           |
| - Plan And Log       |                                                           |
| - Delay Application  |                                                           |
|----------------------|-----------------------------------------------------------|
| Project Control      | Optional contextual banner / state / filters             |
| - Project Ledger     |                                                           |
| - Schedule Collab    |                                                           |
|----------------------|-----------------------------------------------------------|
| Insight              |                                                           |
| - Analysis Dashboard |                                                           |
|----------------------|-----------------------------------------------------------|
| Standards            |                                                           |
| - Milestone Templates|                                                           |
|----------------------|-----------------------------------------------------------|
| Admin                |                                                           |
| - User Permissions   |                                                           |
| - Role Permissions   |                                                           |
+----------------------+-----------------------------------------------------------+
```

---

## 3. Shell Zones

### 3.1 Global Header

Purpose:

- show current context
- support search
- support system exit

Must show:

- product name
- current group
- current workspace
- current selected project

Recommended hierarchy:

1. current workspace
2. current project
3. utility actions

### 3.2 Left Navigation

Purpose:

- organize work by intent, not just feature

Recommended first-level groups:

- My Work
- Project Control
- Insight
- Standards
- Admin

### 3.3 Workspace Content Area

Purpose:

- allow the current page to own the main task
- keep shell noise low

Rule:

- only one strong primary task area at a time

---

## 4. Role-Based Default Entry

| Role | Default Group | Default Workspace |
| --- | --- | --- |
| PMO | Project Control | Project Ledger |
| Project Manager | Project Control | Schedule Collaboration |
| Project Member | My Work | Task Submission |
| Viewer | Insight or Project Control | Analysis Dashboard or Project Ledger |
| Super Admin | Project Control | Project Ledger |

Design implication:

- the shell should support different default entry states
- the visual frame can stay consistent while the default selected nav changes

---

## 5. Navigation Rules

### 5.1 First-Level Group Rules

Each group should answer a user intent:

- My Work: what I need to do
- Project Control: what I need to manage
- Insight: what I need to understand
- Standards: what I need to configure as a standard
- Admin: what I need to govern as a privileged user

### 5.2 Second-Level Item Rules

Each second-level item should:

- be task-specific
- avoid internal platform language
- not duplicate another item's mental model

### 5.3 Tab Rules

Current implementation supports tabs, but the design should treat them carefully.

Recommended rule:

- keep tabs only for meaningful multi-context work
- avoid encouraging excessive tab accumulation

Suggested design direction:

- active workspace tab stays visible
- tabs are secondary to left navigation
- tab close is available, but not visually dominant

---

## 6. Current Project Context Rules

The shell must always expose the current project context clearly.

Show:

- selected project name
- current workspace name
- optionally a small status or badge if useful later

Why:

- many workspaces depend on selected project
- "wrong project" is a high-cost mistake

If no project is selected:

- the shell should remain stable
- the content area should guide the user to select or create a project

---

## 7. Search Rules

Current shell has a global search input.

Recommended design meaning for now:

- search project
- search workspace entry
- search manager or related context

Important:

- if search meaning is broad, helper text should be clear
- if search is only project-level, label it accordingly

Suggested placeholder:

- `Search project, workspace, or manager`

If product wants stronger clarity:

- `Search projects`

---

## 8. Exit Rule

Exit system is a legitimate utility action, but it should remain secondary to core work.

Placement:

- top-right utility area

Visual weight:

- visible
- not primary
- clearly different from destructive business actions

---

## 9. Required Shell States

### 9.1 Normal State

- workspace visible
- current project visible
- navigation available

### 9.2 No Project Selected

- shell remains visible
- content area shows project-selection guidance

### 9.3 Restricted Role State

- unauthorized groups/items do not dominate
- ideally hide or clearly disable based on product decision

### 9.4 Loading Workspace State

- content area shows loading
- shell remains stable

### 9.5 Empty Workspace State

- content area explains what is missing
- guidance should lead to the next action

---

## 10. Low-Fi Layout Recommendation

### Desktop

```text
+----------------------------------------------------------------------------------+
| breadcrumb / workspace / current project / search / utility                      |
+----------------------+-----------------------------------------------------------+
| grouped left nav     | workspace header                                          |
|                      | state / summary / filters if needed                        |
|                      |-----------------------------------------------------------|
|                      | main page content                                          |
|                      |                                                           |
|                      |                                                           |
+----------------------+-----------------------------------------------------------+
```

### Mobile / Narrow Width

Low-fi rule only:

- left navigation should collapse
- current workspace and project context must remain visible at top

---

## 11. Review Questions

Use these during review:

1. Does the shell make role-based work easier?
2. Is the current selected project always clear enough?
3. Are admin/config areas visually over-weighted?
4. Is the shell helping the user orient, not distracting them?
5. Can a member quickly find "my work" without understanding the whole system?

---

## 12. Handoff Notes

Engineering alignment points:

1. reuse current shell structure where possible
2. focus on group naming, order, and visual hierarchy first
3. role-based defaults may require a small selection strategy change
4. selected-project visibility should be treated as a UX-critical requirement
