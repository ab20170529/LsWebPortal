# Project Page State Inventory V1

This document lists the key page states that must be considered during week-1 and week-2 design work.

It is written for PM + UI review and implementation handoff.

---

## 1. State Categories

Every important page should define these states explicitly:

1. loading
2. empty
3. success / normal
4. warning
5. error
6. no permission

---

## 2. System Gate Page

### Required States

| State | Description |
| --- | --- |
| Loading companies | company list is loading |
| No active company | system cards locked |
| Company switching | current company row loading |
| Company selected | systems ready |
| Company load failed | left panel error |
| No systems granted | empty system grid |

---

## 3. Project Ledger

### Required States

| State | Description |
| --- | --- |
| Loading list | project list loading |
| No projects | empty list |
| No search results | keyword returns nothing |
| Project selected | detail area visible |
| Project create success | success toast/banner |
| Project create failure | error feedback |
| No permission to manage | action buttons disabled/hidden |

---

## 4. Schedule Collaboration

### Required States

| State | Description |
| --- | --- |
| No project selected | show selection guidance |
| Loading project detail | gantt/workspace data loading |
| No nodes/tasks | empty scheduling canvas |
| Normal edit state | schedule available |
| Save/update success | feedback shown |
| Save/update failure | error shown |
| Read-only due to role | surface read-only state clearly |

---

## 5. Task Submission

### Required States

| State | Description |
| --- | --- |
| No assigned tasks | member empty state |
| Loading tasks | list loading |
| Normal task update | default action state |
| Submission success | feedback |
| Submission failure | validation/error feedback |
| Read-only or restricted fields | visible field restrictions |

---

## 6. Plan And Log

### Required States

| State | Description |
| --- | --- |
| No plans/reports yet | empty collaboration state |
| Loading workspace data | loading state |
| Normal edit state | list and edit available |
| Attachment upload success/failure | clear feedback |
| Report save success/failure | clear feedback |

---

## 7. Delay Application

### Required States

| State | Description |
| --- | --- |
| No delay-related data | empty state |
| Loading | loading state |
| Normal apply/update state | form/list available |
| Submit success/failure | feedback |
| No permission | clear explanation |

---

## 8. Analysis Dashboard

### Required States

| State | Description |
| --- | --- |
| Placeholder planning state | current near-placeholder state |
| No data for charts | empty insight state |
| Normal data state | charts and summary visible |

---

## 9. Permission And Template Pages

### Required States

| State | Description |
| --- | --- |
| No permission | hard stop |
| Empty configuration | setup guidance |
| Loading | loading state |
| Normal management | list + edit |
| Save success/failure | feedback |

---

## 10. Design Checklist For States

Before handoff, confirm each designed page has:

1. a loading state
2. a meaningful empty state
3. an error state with recovery path
4. a no-permission state
5. success feedback
