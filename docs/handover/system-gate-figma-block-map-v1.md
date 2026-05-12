# System Gate Figma Block Map V1

This is a Figma-ready block map for the system gate page.

Use it as the direct page structure when drawing wireframes.

---

## 1. Frame Setup

### Desktop Main Frame

- width: desktop-first
- layout direction: horizontal two-column
- left column: business context
- right column: system entry

### Recommended Frame Naming

- `Portal / System Gate / Desktop / Default`
- `Portal / System Gate / Desktop / No Company`
- `Portal / System Gate / Desktop / Ready`
- `Portal / System Gate / Desktop / Switching`
- `Portal / System Gate / Desktop / Error`

---

## 2. Top-Level Blocks

```text
Frame
├─ Utility Header
├─ Main Grid
│  ├─ Left Column / Business Context
│  └─ Right Column / System Entry
```

---

## 3. Utility Header

### Block Name

- `Utility Header`

### Child Blocks

- `Page Utility / User Context`
- `Page Utility / System Admin Action`

### Content

User context may include:

- current user label
- optional role or session hint

Admin action:

- `System Management`

### Visual Weight

- light
- secondary

---

## 4. Left Column: Business Context

### Block Name

- `Business Context Column`

### Child Blocks

1. `Section Label / Context`
2. `Context Card / Current Company`
3. `Info Card / Why Context Matters`
4. `Company List`
5. `Footer Note / Context Refresh`

---

## 5. Section Label / Context

### Content

- eyebrow: `Business Context`
- title: `Current Business Context`
- helper: `Confirm the correct company database before entering a system.`

---

## 6. Context Card / Current Company

### Child Blocks

- `Company Title`
- `Status Badge`
- `Status Message`

### Variants

#### No Company

- badge: `Required`
- message: `Choose a business context before entering a system.`

#### Ready

- badge: `Ready`
- message: `Business context confirmed. You can now enter a system.`

#### Switching

- badge: `Switching`
- message: `Switching business context...`

#### Error

- badge: `Issue`
- message: `Unable to confirm current business context.`

---

## 7. Info Card / Why Context Matters

### Child Blocks

- `Card Title`
- `Bullet List`

### Content

Title:

- `Why this matters`

Bullets:

- `Projects and records come from the selected business database.`
- `Permissions and visible data may change with business context.`
- `Confirm company first to avoid cross-company mistakes.`

---

## 8. Company List

### Block Name

- `Company List`

### Child Structure

```text
Company List
├─ Company Row / Current
├─ Company Row / Available
├─ Company Row / Available
└─ ...
```

### Company Row Content

- company title
- db/server hint
- state badge
- optional click action

### Row Variants

#### Current

- highlighted container
- badge: `Current`

#### Available

- neutral container
- badge: `Use`

#### Switching

- neutral-disabled or loading state
- badge: `Switching`

---

## 9. Footer Note / Context Refresh

### Content

- `Changing business context refreshes the platform session to prevent cross-company data confusion.`

### Visual Weight

- tertiary

---

## 10. Right Column: System Entry

### Block Name

- `System Entry Column`

### Child Blocks

1. `Section Label / Systems`
2. `Helper Text / Systems`
3. `System Grid`

---

## 11. Section Label / Systems

### Content

- eyebrow: `System Entry`
- title: `Enter A System`

---

## 12. Helper Text / Systems

### Content

- `Choose the correct system after business context is confirmed.`

---

## 13. System Grid

### Block Name

- `System Grid`

### Child Blocks

- `System Card / Project`
- `System Card / ERP`
- `System Card / Designer`
- `System Card / BI`
- `System Card / BI Display`

### Grid Rules

- all visible systems should share the same structural card template
- locked and ready are visual variants of the same card

---

## 14. System Card Template

### Child Blocks

- `Card Badge`
- `Card State Hint`
- `Card Title`
- `Card Description`

### Card Variants

#### Locked

- state hint: `Locked`
- subdued interaction

#### Ready

- state hint: `Enter`
- active interaction

### Project Card Content

- badge: `PM`
- title: `Project Management System`
- description: `Open project ledger, schedule collaboration, task execution, reports, and delivery follow-up.`

---

## 15. Required Page Variants

Build these Figma frames:

1. `Default / No Company`
2. `Default / Ready`
3. `Company Row / Switching`
4. `Company List / Error`
5. `No Systems Granted`

---

## 16. Open Decisions

Need confirmation during review:

1. Should Project card be visually emphasized?
2. Should system cards contain recommended-role hints?
3. Should current company card include more business metadata?
