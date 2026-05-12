# Project Ledger State Sheet V1

This state sheet supplements the low-fidelity specification for the Project Ledger page.

It focuses on the states most likely to be reviewed or designed during week 2.

---

## 1. Default State

### Description

- projects exist
- one project is selected
- summary cards visible
- detail panel visible

### Must Show

- selected row
- selected project detail
- available actions based on role

---

## 2. Empty State

### Trigger

- no projects exist

### Goal

- encourage first project creation

### Content

Title:

- `No projects yet`

Body:

- `Create the first project to begin scheduling and delivery work.`

Action:

- `Create Project`

---

## 3. No Search Result State

### Trigger

- projects exist, but current keyword matches none

### Goal

- help user recover quickly

### Content

Title:

- `No matching projects found`

Body:

- `Try a different keyword or clear the search.`

Action:

- `Clear Search`

---

## 4. No Project Selected State

### Trigger

- projects exist
- none is actively selected

### Goal

- encourage selection

### Content

Title:

- `Select a project`

Body:

- `Choose a project from the list to review details and continue setup or execution.`

---

## 5. No Permission To Manage State

### Trigger

- user can view project data
- user cannot edit or initialize

### Goal

- avoid false affordances

### Behavior

- keep detail visible
- remove or disable manage actions clearly

Support text:

- `You can view this project, but you do not have permission to manage it.`

---

## 6. Load Error State

### Trigger

- list load fails

### Goal

- provide recovery path

### Content

Title:

- `Unable to load project records`

Body:

- `Please try again.`

Action:

- `Retry`

---

## 7. Initialization Guidance State

### Trigger

- selected project exists
- project has not been initialized by type/template

### Goal

- make next step explicit

### Content

Title:

- `Initialization required`

Body:

- `Initialize this project by template to generate nodes and tasks before scheduling work begins.`

Action:

- `Initialize By Type`

---

## 8. Design Guidance

1. Empty and no-result states should not look identical.
2. Initialization guidance should feel operational, not like an error.
3. No-permission state should reduce frustration by clearly explaining why actions are missing.
