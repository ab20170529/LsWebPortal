# Project Ledger Figma Build Order V1

This document defines the recommended Figma build order for the Project Ledger page.

The objective is to design the page in the same order as its product logic:

1. understand
2. scan
3. select
4. continue work

---

## 1. Build Goal

The Project Ledger page should work as:

- project archive
- project selection hub
- manager/PMO control entry
- pre-scheduling setup surface

Do not build it like a generic CRUD page first.

Build it like an operational workbench.

---

## 2. Recommended Build Sequence

### Step 1: Create Core Frames

Create these desktop frames first:

1. `Project Ledger / Default`
2. `Project Ledger / Empty`
3. `Project Ledger / No Search Result`
4. `Project Ledger / No Project Selected`
5. `Project Ledger / No Permission To Manage`
6. `Project Ledger / Error`

Reason:

- these frames cover the main interaction states
- they prevent overfitting the design to only the happy path

---

### Step 2: Draw Page Skeleton

In every frame, first draw only:

1. page header
2. summary cards row
3. two-column main body

At this step:

- do not style table rows deeply
- do not polish drawer/modal details
- only solve hierarchy and page proportions

Validate:

1. header height
2. summary-card density
3. list vs detail width ratio

---

### Step 3: Build Page Header

Add these blocks:

1. page title
2. helper copy
3. create project action
4. refresh action
5. search

At this step validate:

1. is the page purpose obvious?
2. is create action clear without overpowering project selection?

---

### Step 4: Build Summary Cards

Add:

1. total projects
2. active
3. draft
4. completed

Rule:

- keep them simple
- they are orientation aids, not dashboards

Validate:

1. do cards summarize usefully?
2. do they avoid distracting from the actual list/detail workflow?

---

### Step 5: Build The Left List Panel

Add:

1. list toolbar
2. table/list container
3. row structure

Each row should include:

1. project name
2. project code
3. project type
4. manager
5. status
6. timeline
7. quick actions

At this step validate:

1. can the user scan projects quickly?
2. is selected state visually clear?

---

### Step 6: Build The Right Detail Panel

Add:

1. selected project header
2. key facts section
3. initialization status module
4. next actions module

This is the most important product distinction from a generic table page.

The detail panel should tell the story:

- this is the project
- this is its current status
- this is whether it is ready for downstream work
- this is what to do next

---

### Step 7: Elevate Initialization By Type

Do not leave initialization buried in row actions only.

In Figma, give it a dedicated detail-panel module:

1. title
2. current initialization state
3. short explanation
4. primary contextual action

At this step validate:

1. does the page communicate that project creation and project initialization are two distinct steps?

---

### Step 8: Add State Variants

Now draw the state-specific versions.

#### Empty

- no projects yet
- create-first guidance

#### No Search Result

- list empty due to keyword
- clear recovery path

#### No Project Selected

- list exists
- detail panel becomes a guidance panel

#### No Permission To Manage

- list and detail visible
- actions removed or disabled clearly

#### Error

- clear retry path

---

### Step 9: Add Copy

Use:

- `week2-copy-sheet-v1.md`
- `project-ledger-state-sheet-v1.md`

Do not improvise action labels between frames.

---

### Step 10: Create Reusable Components

Create these components:

1. summary card
2. project row
3. status badge
4. detail info row
5. initialization status module
6. empty/error state block

Variants to prepare:

- selected row
- normal row
- disabled action
- read-only action row

---

### Step 11: Review Before Styling

Before polishing, ask:

1. is list/detail relationship clear?
2. is selected project obvious?
3. is initialization prominent enough?
4. is permission difference understandable?

Only after yes should you move into strong visual styling.

---

### Step 12: Prepare Review Frames

At minimum, present:

1. default
2. empty
3. no project selected
4. no permission to manage

These four frames tell most of the page story.

---

## 3. Common Mistakes To Avoid

1. Making summary cards too dashboard-like.
2. Treating the right detail panel as a passive info dump.
3. Hiding initialization status among many equal-weight modules.
4. Making quick actions more visible than project identity.

---

## 4. Suggested Review Script

When presenting the Project Ledger wireframe:

1. explain that this is the project entry and control page
2. show how a user scans the list
3. show how selection drives the detail panel
4. show initialization as the transition to downstream work
5. show read-only and empty states
