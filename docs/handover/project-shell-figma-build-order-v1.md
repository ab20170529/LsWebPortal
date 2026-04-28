# Project Shell Figma Build Order V1

This document defines the recommended Figma build order for the Project product shell.

The objective is to stabilize structure before drawing individual workspace pages.

---

## 1. Build Goal

Build the shell as the long-term frame for multiple project workspaces.

The shell must solve:

1. orientation
2. role-aware navigation
3. current project visibility
4. stable content slot

---

## 2. Recommended Build Sequence

### Step 1: Create Role-Based Frames

Create these frames first:

1. `Project Shell / Manager Default`
2. `Project Shell / Member Default`
3. `Project Shell / Viewer Default`
4. `Project Shell / No Project Selected`

Reason:

- this forces role thinking before visual detail

---

### Step 2: Draw Persistent Structure

In every frame, draw only:

1. global header
2. left navigation
3. main workspace panel

Do not design page internals yet.

At this stage, validate:

- shell proportions
- navigation width
- header density
- main content dominance

---

### Step 3: Build Header

Add:

1. breadcrumb / current location
2. current project chip
3. search
4. utility actions

Important:

- current project chip must stay visually obvious
- utility actions must remain secondary

---

### Step 4: Build Left Navigation

Add groups in this order:

1. My Work
2. Project Control
3. Insight
4. Standards
5. Admin

Then add items beneath each group.

At this step validate:

1. can a member find their area quickly?
2. are Admin and Standards visually secondary?

---

### Step 5: Create Nav Components

Build reusable components for:

1. nav group
2. nav item
3. active nav item
4. collapsed/secondary nav group if needed

Variants should include:

- active
- inactive
- hover-ready
- restricted/hidden reference state if useful for docs

---

### Step 6: Build Workspace Header Slot

Inside the main workspace panel, add a generic workspace header:

1. workspace title
2. workspace helper text
3. current project context

This becomes the template top for all downstream pages.

---

### Step 7: Add Role Variants

#### Manager Default

- Project Control emphasized
- Schedule Collaboration active

#### Member Default

- My Work emphasized
- Task Submission active

#### Viewer Default

- Insight or Project Control emphasized
- low-action workspace active

#### No Project Selected

- current project chip shows empty state
- main slot shows guidance

---

### Step 8: Add Example Content Placeholder

Drop in a generic content block in the workspace area.

Examples:

- `Project Ledger Content Placeholder`
- `Task Submission Content Placeholder`

Purpose:

- validate shell-to-content ratio
- avoid overfitting shell to one page

---

### Step 9: Apply Visual Hierarchy

Now refine:

- typography
- nav grouping
- active states
- current project emphasis
- spacing and background layers

Rule:

- shell must feel calm and navigational
- content pages should remain the hero

---

### Step 10: Prepare Review Frames

For review, show:

1. manager default
2. member default
3. no project selected
4. one version with Admin visible but collapsed

---

## 3. Common Mistakes To Avoid

1. Making the header too crowded.
2. Giving equal weight to all nav groups.
3. Hiding current project context too deeply.
4. Designing the shell around only manager needs.

---

## 4. Review Questions

1. Can each role identify their landing area quickly?
2. Is the shell helping orientation more than decoration?
3. Is the selected project always visible enough?
4. Is the content area dominant enough?
