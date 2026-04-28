# Project Role Permission Matrix V1

This matrix is a PM/UI-friendly translation of the current project role logic.

It is not a security source of truth.

It is a design and product alignment document based on current front-end and back-end behavior.

---

## 1. Role Definitions

| Role | Meaning |
| --- | --- |
| Super Admin | platform-level full access |
| PMO | project governance and broad visibility |
| Project Manager | owns or manages project delivery |
| Project Member | executes assigned work |
| Viewer | read-only project visibility |

---

## 2. Workspace Visibility Matrix

| Workspace | Super Admin | PMO | Project Manager | Project Member | Viewer |
| --- | --- | --- | --- | --- | --- |
| Project Ledger | Yes | Yes | Yes | No | Yes |
| Schedule Collaboration | Yes | Yes | Yes | No | No |
| Task Submission | Yes | Yes | Yes | Yes | No |
| Plan And Log | Yes | Yes | Yes | Yes | No |
| Delay Application | Yes | Yes | Yes | Yes | No |
| Milestone Templates | Yes | Yes if template authority exists | No by default | No | No |
| Project Analysis Dashboard | Yes | Yes | Yes | No | Yes |
| User Permissions | Yes | No | No | No | No |
| Role Permissions | Yes | No | No | No | No |

---

## 3. Action Permission Matrix

| Action | Super Admin | PMO | Project Manager | Project Member | Viewer |
| --- | --- | --- | --- | --- | --- |
| View all projects | Yes | Yes | Usually own/managed projects | Only joined projects / assigned context | Read-only subset |
| Create project | Yes | Yes | Yes | No | No |
| Edit project base info | Yes | Yes | Yes for own/manage scope | No | No |
| Delete project | Yes | Yes | Usually own/manage scope | No | No |
| Initialize by template | Yes | Yes | Yes for own/manage scope | No | No |
| Manage schedule/nodes/tasks | Yes | Yes | Yes | No | No |
| Update own task status | Yes | Yes | Yes | Yes | No |
| Submit plan/log/report | Yes | Yes | Yes | Yes | No |
| Apply delay | Yes | Yes | Yes | Yes | No |
| View dashboard | Yes | Yes | Yes | Limited / optional later | Yes |
| Manage templates | Yes | Template authority only | No | No | No |
| Manage user permissions | Yes | No | No | No | No |
| Manage role permissions | Yes | No | No | No | No |

---

## 4. UX Implications

### PMO

Needs:

- broad visibility
- control
- portfolio awareness
- template influence

Recommended landing:

- Project Ledger

### Project Manager

Needs:

- project status overview
- scheduling
- member assignment
- task and milestone control

Recommended landing:

- Schedule Collaboration

### Project Member

Needs:

- very clear personal action list
- low-noise entry
- obvious reporting flow

Recommended landing:

- Task Submission

### Viewer

Needs:

- simple summary
- low operational complexity
- read-only visibility

Recommended landing:

- Project Analysis Dashboard or Project Ledger

---

## 5. Risks

1. Current front-end role detection depends on matching role text.
2. If role naming changes, visible experience can drift.
3. Some actions may look available on the page while backend still blocks them if scope is narrower.
4. Design should never assume front-end visibility alone is permission truth.

---

## 6. Recommended Product Rule Clarifications

These should be confirmed with engineering/business:

1. Can every project manager create projects, or only managers in specific orgs?
2. Can viewers access member-level logs and reports?
3. Should project members see project ledger at all, even in read-only mode?
4. Should PMO always see templates, or only template-authorized PMO users?

---

## 7. Design Rule Of Thumb

For design purposes:

1. members should see work, not administration
2. managers should see control, not just records
3. viewers should see clarity, not clutter
4. admin functions should be visually isolated
