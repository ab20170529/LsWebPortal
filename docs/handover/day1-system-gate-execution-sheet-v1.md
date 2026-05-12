# Day 1 System Gate Execution Sheet V1

This is the day-1 execution sheet for the current week plan.

Focus page:

- `apps/portal/src/pages/system-access-page-view.tsx`

Day-1 goal:

- stabilize the structure and decision flow of the system gate page
- clarify what must change before visual refinement or frontend restructuring

---

## 1. Today's Problem Statement

Current problem:

- users must both choose business context and choose a system on the same page
- the page does not explain the dependency strongly enough
- the current experience is visually clean, but product logic is still too implicit

Today we are solving:

> make the system gate page structurally obvious: context first, system second.

---

## 2. Today's Deliverables

By the end of today, you should have:

1. one approved or near-approved low-fidelity structure for the system gate page
2. one confirmed block hierarchy
3. one list of front-end structure changes
4. one list of open decisions for review

---

## 3. Current Code Facts

### Relevant Files

- `apps/portal/src/pages/system-access-page-view.tsx`
- `apps/portal/src/styles/system-gate.css`
- `packages/schema/contracts/src/index.ts`

### Current Behavior

The page already has:

1. company list loading
2. company switching
3. active company state
4. system card locked/ready logic
5. optional admin entry

This is good news:

- product logic exists
- the current redesign can focus mainly on hierarchy, wording, and framing

### Current Risks Found Today

1. a lot of visible copy contains mojibake/encoding issues
2. company context and system choice still compete visually
3. system cards are clear enough structurally, but still not task-oriented enough in content

---

## 4. What To Decide Today

Today is not for final pixel polish.

Today is for deciding:

1. exact left/right column responsibilities
2. context-card visual priority
3. company list structure
4. system grid structure
5. whether Project should receive stronger emphasis than other system cards

---

## 5. Recommended Working Sequence For Today

### Step 1

Open these docs side by side:

- `system-gate-redesign-brief-v1.md`
- `system-gate-lowfi-spec-v1.md`
- `system-gate-figma-block-map-v1.md`
- `system-gate-hi-fi-direction-v1.md`

### Step 2

Draw one simple wireframe with only these blocks:

- utility header
- business context column
- system entry column

### Step 3

Inside the left column, lock these blocks:

- current context intro
- current context card
- why this matters
- company list
- footer note

### Step 4

Inside the right column, lock these blocks:

- system intro
- helper line
- system grid

### Step 5

Capture open decisions.

Minimum decision list:

1. Project emphasis
2. role hint on cards or not
3. exact helper copy tone
4. whether company rows show more metadata

---

## 6. Suggested Figma Frames For Today

You do not need full state coverage today.

Build at minimum:

1. `No Company`
2. `Ready`
3. `Switching`

If time allows:

4. `Load Error`

---

## 7. Front-End Notes For Today

You do not need to fully rewrite the page today.

But you should identify the structure boundaries in code:

### Logical slices already present

1. current company section
2. company list
3. system entry grid
4. admin entry

### Suggested future extraction path

- `SystemGateHeader`
- `BusinessContextPanel`
- `CompanyList`
- `SystemEntryGrid`
- `SystemEntryCard`

Today you only need to decide whether this split feels right.

---

## 8. End-Of-Day Checklist

- [ ] wireframe exists
- [ ] left/right structure is fixed
- [ ] primary states are clear
- [ ] open decisions are listed
- [ ] future component split is identified

---

## 9. End-Of-Day Output Format

Write down:

1. what structure was chosen
2. what is still undecided
3. what tomorrow's front-end work starts with

Tomorrow should begin with:

- front-end skeleton restructuring
