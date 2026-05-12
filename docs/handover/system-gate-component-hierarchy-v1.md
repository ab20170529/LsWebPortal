# System Gate Component Hierarchy V1

This document expands the system gate block map into a draw-ready component hierarchy for Figma and later UI specification.

---

## 1. Page Tree

```text
System Gate Page
├─ Utility Header
│  ├─ User Session Info
│  └─ Admin Action
├─ Business Context Column
│  ├─ Context Section Intro
│  ├─ Current Context Card
│  ├─ Why Context Matters Card
│  ├─ Company List
│  │  ├─ Company Row
│  │  ├─ Company Row
│  │  └─ ...
│  └─ Context Footer Note
└─ System Entry Column
   ├─ System Section Intro
   ├─ System Helper Text
   └─ System Grid
      ├─ System Card
      ├─ System Card
      └─ ...
```

---

## 2. Component Inventory

### Utility Header

Components:

- user identity label
- admin utility button

### Current Context Card

Components:

- label
- company title
- status badge
- status text

### Why Context Matters Card

Components:

- card title
- 2 to 3 bullet rows

### Company Row

Components:

- company title
- server/db subtitle
- state badge
- row action container

Variants:

- current
- available
- switching
- disabled/error-adjacent

### System Card

Components:

- badge
- state hint
- title
- description

Variants:

- ready
- locked

---

## 3. Figma Component Suggestions

### Local Components To Build

1. `Badge / State`
2. `Card / Context`
3. `Row / Company`
4. `Card / System Entry`
5. `Banner / Status`

### Useful Variants

#### `Badge / State`

- ready
- required
- switching
- use
- current
- locked

#### `Row / Company`

- current
- available
- switching

#### `Card / System Entry`

- ready
- locked

---

## 4. Spacing Logic

Recommended hierarchy:

- page frame gap: large
- section gap: medium
- card internal gap: medium
- row internal gap: small

Visual principle:

- business context should feel grouped and stable
- system cards should feel scannable and decision-oriented

---

## 5. Page-Level Content Slots

### Context Section Intro

- eyebrow
- title
- helper copy

### System Section Intro

- eyebrow
- title

### Helper Copy

- one short explanatory sentence only

---

## 6. Design Guardrails

1. Do not overload system cards with too many secondary labels.
2. Do not let the admin action compete with system entry cards.
3. Do not let the company list feel like a settings page.
4. The current company must be stronger than decorative styling.
