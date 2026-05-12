# Project Ledger Low-Fi Spec V1

This document defines the low-fidelity structure for the Project Ledger page.

In the current system, this page corresponds to the main project record/ledger workspace and acts as:

- PMO portfolio entry
- manager project selection hub
- viewer read-only lookup surface

---

## 1. Page Goal

The Project Ledger page should help the user:

1. find the right project quickly
2. understand the current project state quickly
3. create or update projects if authorized
4. initialize a project from templates when required
5. enter downstream scheduling or execution work with confidence

This page is not just a CRUD table.

It is the operational archive and project entry surface.

---

## 2. Recommended Page Structure

```text
+----------------------------------------------------------------------------------+
| Page Header                                                                      |
| Title / Summary / Primary Action / Refresh / Search                              |
+----------------------------------------------------------------------------------+
| Top Summary Cards                                                                |
| Total Projects / Active / Draft / Completed                                      |
+--------------------------------------+-------------------------------------------+
| Left: Project List                   | Right: Project Detail / Action Panel       |
|--------------------------------------|-------------------------------------------|
| Search / filter area                 | Selected project summary                   |
| Table or list of projects            | Core fields                               |
| - name                               | status                                    |
| - code                               | manager                                   |
| - type                               | timeline                                  |
| - manager                            | budget                                    |
| - status                             | business unit                             |
| - timeline                           | source info                               |
| - actions                            | initialization state                      |
|                                      | next actions                              |
+--------------------------------------+-------------------------------------------+
```

---

## 3. Key Zones

### 3.1 Page Header

Must show:

- page title
- page purpose
- primary action
- refresh
- search

Recommended title:

- `Project Ledger`

Recommended helper text:

- `Create, review, and initialize projects before entering schedule and execution work.`

### 3.2 Summary Cards

Purpose:

- give a fast portfolio snapshot

Recommended cards:

- Total Projects
- Active
- Draft / Waiting
- Completed

### 3.3 Project List

Purpose:

- scan and select

Recommended columns:

- Project Name
- Project Code
- Type
- Manager
- Status
- Planned Timeline
- Budget
- Quick Actions

### 3.4 Project Detail Panel

Purpose:

- let the user understand the selected project without leaving the page

Recommended content:

- basic project identity
- manager and ownership
- timeline
- source
- attendance / business unit if relevant
- initialization readiness / status
- next recommended actions

---

## 4. Recommended Core Fields

### List View

These fields should be directly scannable:

1. project name
2. project code
3. project type
4. manager
5. status
6. planned dates

### Detail View

These fields matter most:

1. project name
2. status
3. manager
4. project type
5. source
6. plan start / end
7. budget
8. business unit
9. attendance address
10. initialization status

---

## 5. Important Product Rules To Expose

### 5.1 Initialization By Type

This is a key product rule.

The page should communicate:

- creating a project is step one
- initializing by template/type is step two
- scheduling and tasks depend on initialization

Recommended treatment:

- initialization should be visible as a high-value contextual action
- do not hide it among low-priority row actions

### 5.2 Permission Awareness

The page should clearly distinguish:

- can view
- can edit
- can initialize
- can delete

Avoid ambiguous affordances.

---

## 6. Low-Fi Wireframe

```text
+----------------------------------------------------------------------------------+
| Project Ledger                                                                   |
| Create Project | Refresh | Search                                                 |
+----------------------------------------------------------------------------------+
| [Total] [Active] [Draft] [Completed]                                              |
+--------------------------------------+-------------------------------------------+
| Project List                         | Selected Project                           |
|--------------------------------------|-------------------------------------------|
| search / optional filters            | project name + status                      |
|                                      | manager / type / time                      |
| row 1                                | source / budget / unit                     |
| row 2                                | initialization status                      |
| row 3                                |                                           |
| ...                                  | actions: edit / init / delete / next step  |
+--------------------------------------+-------------------------------------------+
```

---

## 7. Empty And Error States

### 7.1 No Projects Yet

Copy direction:

- `No projects yet. Create the first project to start scheduling and delivery work.`

Primary action:

- `Create Project`

### 7.2 No Search Result

Copy direction:

- `No matching projects found. Try a different keyword or clear the search.`

### 7.3 No Project Selected

Copy direction:

- `Select a project from the list to review details and continue project setup.`

### 7.4 No Permission To Manage

Behavior:

- keep list visible if view is allowed
- hide or disable actions clearly

### 7.5 Load Failure

Copy direction:

- `Unable to load project records. Please try again.`

Action:

- `Retry`

---

## 8. Recommended Interaction Rules

### Selecting A Project

- clicking a row updates the right-side detail panel
- selected state must be visually strong

### Creating A Project

- open create drawer/modal
- after success, select the created project automatically

### Editing A Project

- open edit drawer/modal
- keep user anchored to the selected project

### Initializing By Type

- available only for authorized roles
- should provide strong success/failure feedback
- should be visible in the detail panel as a primary contextual action

### Deleting A Project

- confirm explicitly
- communicate if deletion is blocked due to related data

---

## 9. Design Priorities

1. scanning efficiency
2. selected-project clarity
3. initialization visibility
4. permission clarity
5. empty/error completeness

---

## 10. Review Questions

1. Can a PMO understand the portfolio quickly?
2. Can a manager find and continue the right project quickly?
3. Is initialization-by-template obvious enough?
4. Does the page feel like a project control surface, not just a raw table?
5. Are actions clearly differentiated by importance?

---

## 11. Handoff Notes

Engineering alignment points:

1. preserve current CRUD logic where possible
2. elevate initialization visibility in layout
3. clarify selected-row and selected-detail states
4. keep permission-based action behavior explicit
