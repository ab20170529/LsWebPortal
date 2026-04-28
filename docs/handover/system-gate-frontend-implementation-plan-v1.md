# System Gate Frontend Implementation Plan V1

This document turns the system gate redesign work into a front-end implementation plan.

Primary file:

- `apps/portal/src/pages/system-access-page-view.tsx`

Supporting style file:

- `apps/portal/src/styles/system-gate.css`

---

## 1. Implementation Goal

Do not change the business behavior first.

Change:

- structure
- component boundaries
- content hierarchy
- state presentation

Keep stable for now:

- company activation flow
- redirect handling
- granted-system filtering logic

---

## 2. Recommended Refactor Strategy

### Phase A: Structural Refactor

Goal:

- make the JSX easier to reason about

Recommended local component split:

1. `SystemGateHeader`
2. `BusinessContextPanel`
3. `BusinessContextStatus`
4. `CompanySwitchList`
5. `SystemEntryGrid`
6. `SystemEntryCard`

You do not need to move them to separate files on day 1.

Start with same-file extraction if faster.

### Phase B: Content And State Cleanup

Goal:

- replace unclear copy
- make state differences explicit

Focus:

- ready / required / switching / error messages
- Project card description
- helper text hierarchy

### Phase C: Style Rebalance

Goal:

- make context visually lead entry

Focus:

- left/right weight
- current company emphasis
- locked/ready distinction

---

## 3. Suggested JSX Structure

```text
SystemAccessPage
├─ SystemGateHeader
├─ BusinessContextPanel
│  ├─ ContextIntro
│  ├─ BusinessContextStatus
│  ├─ WhyContextMatters
│  ├─ CompanySwitchList
│  └─ ContextFooter
└─ SystemEntryGrid
   ├─ SystemIntro
   ├─ SystemHelper
   └─ SystemEntryCard[]
```

---

## 4. State Mapping

### BusinessContextPanel

Inputs:

- `hasActiveCompany`
- `companyError`
- `gateMessage`
- `isLoadingCompanies`
- `isActivatingCompanyKey`

### CompanySwitchList

Inputs:

- `companies`
- `currentCompanyKey`
- `isActivatingCompanyKey`

### SystemEntryGrid

Inputs:

- `accessibleEntries`
- `hasActiveCompany`

---

## 5. Recommended Refactor Order

### Step 1

Extract `SystemEntryCard`

Reason:

- the right-side mapping is clean and repetitive

### Step 2

Extract `CompanySwitchList`

Reason:

- this area has the highest state complexity

### Step 3

Wrap left column into `BusinessContextPanel`

Reason:

- this makes the page hierarchy explicit

### Step 4

Add or refine CSS hooks if needed

Possible class additions:

- `portal-system-gate__context`
- `portal-system-gate__status-card`
- `portal-system-gate__company-list`
- `portal-system-gate__system-grid`

---

## 6. Text Cleanup Priority

Fix first:

1. mojibake/encoding-visible copy
2. current context helper text
3. company required warning
4. system card descriptions

Do not leave visible broken strings in the redesigned page.

---

## 7. Visual Refactor Priority

Priority order:

1. current company emphasis
2. system card readiness state
3. left/right balance
4. admin action de-emphasis

---

## 8. Testing Checklist

After implementation, verify:

1. no company selected
2. company selected
3. switching company
4. company load failure
5. no systems granted

Also verify:

1. redirect still works
2. clicking a locked system still gives clear feedback
3. admin button still behaves correctly

---

## 9. Recommended Day 2 Start

Tomorrow's coding work should begin with:

1. extracting `SystemEntryCard`
2. extracting `CompanySwitchList`
3. cleaning visible copy

That gives the largest clarity gain with the lowest business risk.
