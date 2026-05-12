# System Gate Figma Build Order V1

This document defines the recommended Figma build order for the system gate page.

It is meant to reduce rework by drawing the page in the same order as its information hierarchy.

---

## 1. Build Goal

Do not start from decoration.

Build in this order:

1. layout
2. hierarchy
3. states
4. component reuse
5. visual refinement

---

## 2. Recommended Build Sequence

### Step 1: Create Core Frames

Create these desktop frames first:

1. `System Gate / Default / No Company`
2. `System Gate / Default / Ready`
3. `System Gate / Switching`
4. `System Gate / Error`
5. `System Gate / No Systems Granted`

Reason:

- these five frames cover the core experience and major state variants

---

### Step 2: Draw Global Structure Only

Inside each frame, first place:

1. utility header
2. left context column
3. right system-entry column

At this step:

- no icon refinement
- no final colors
- no fancy shadows

Only solve:

- width ratio
- spacing
- block hierarchy

---

### Step 3: Build Left Column

Add these blocks top to bottom:

1. context section intro
2. current context card
3. why-this-matters card
4. company list
5. context footer note

At this step, validate:

- is the active company area visually strongest?
- is the reason for company selection understandable?

---

### Step 4: Build Right Column

Add these blocks top to bottom:

1. system section intro
2. helper text
3. system card grid

Then place the five cards:

1. Project
2. ERP
3. Designer
4. BI
5. BI Display

At this step, validate:

- does the user understand the difference between locked and ready?
- is Project understandable before entry?

---

### Step 5: Turn Blocks Into Reusable Components

Create reusable components for:

1. context card
2. company row
3. system card
4. state badge
5. inline status banner if used

Make variants before polishing.

---

### Step 6: Add State Variants

#### Context Card Variants

- required
- ready
- switching
- issue

#### Company Row Variants

- current
- available
- switching

#### System Card Variants

- ready
- locked

At this step, ensure:

- state differences are understandable in grayscale
- not only dependent on color

---

### Step 7: Add Copy

Do not write copy from memory.

Use:

- `week2-copy-sheet-v1.md`

Important:

- keep helper text short
- keep system descriptions task-oriented

---

### Step 8: Review Hierarchy Before Styling

Before visual polish, ask:

1. Is left column context clearer than right column choice?
2. Is current company more prominent than inactive companies?
3. Are system cards still readable without detailed styling?
4. Is admin action secondary enough?

Only after the answers are yes should you move into styling.

---

### Step 9: Add Visual Language

Now apply:

- spacing rhythm
- typography hierarchy
- state color
- border emphasis
- hover and locked behavior cues

Keep the page operational, not promotional.

---

### Step 10: Export Review Version

Prepare a review page in Figma with:

1. main desktop default
2. no-company state
3. ready state
4. switching state
5. error state
6. notes with open decisions

---

## 3. Minimum Frame Set For Review

If time is limited, at minimum prepare:

1. no-company
2. ready
3. switching

These three already tell most of the story.

---

## 4. Common Mistakes To Avoid

1. Spending too much time on system card polish before context hierarchy is solved.
2. Making the company list feel like a settings form.
3. Making all cards equally bright, which weakens the locked/ready distinction.
4. Using long descriptive text blocks that increase reading burden.

---

## 5. Suggested Review Script

When presenting the Figma draft:

1. explain that business context comes first
2. explain that system choice comes second
3. show locked state first
4. show ready state second
5. confirm whether Project needs stronger emphasis
