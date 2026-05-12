# System Gate Hi-Fi Direction V1

This document defines the high-fidelity design direction for the Portal system gate page.

It sits between wireframe and final mockup.

Use it to guide:

- visual hierarchy
- typography choices
- emphasis rules
- state expression

---

## 1. Page Personality

The page should feel:

- calm
- trustworthy
- operational
- structured

It should not feel like:

- a marketing landing page
- a product brochure
- a generic settings screen

The user should feel:

`I am confirming where I work, then I enter the right system.`

---

## 2. Visual Strategy

This page has one main hierarchy rule:

> business context must visually lead system entry.

That means:

- the active company state is the primary anchor
- system cards are secondary but still important
- admin utility is tertiary

---

## 3. Layout Feel

### Left Column

Should feel:

- stable
- grounded
- context-heavy

Use:

- slightly denser information rhythm
- clearer status expression
- strong grouping between current context and company list

### Right Column

Should feel:

- scannable
- open
- choice-oriented

Use:

- more whitespace
- stronger card rhythm
- simplified system descriptions

---

## 4. Typography Hierarchy

### Recommended Levels

1. current company title
2. system card titles
3. page section titles
4. helper copy
5. metadata / server info

### Tone Rules

- page titles: assertive, direct
- helper copy: supportive, concise
- metadata: quiet
- state labels: compact and explicit

---

## 5. Business Context Card Direction

This is the visual anchor of the whole page.

### It should communicate:

1. current company
2. whether the user is ready to enter a system
3. whether action is still required

### Visual cues

- the card should have the strongest status treatment on the page
- success state should feel reassuring, not celebratory
- required state should feel cautionary, not alarming
- switching state should feel temporary and controlled

### Content emphasis

- company title is the hero
- status badge is secondary
- status sentence is supportive

---

## 6. Company List Direction

The company list should not feel like a configuration table.

It should feel like:

- a context switcher
- quick, legible, low-friction

### Each row should communicate

1. company name
2. environment/db hint
3. current/use/switching state

### Current row treatment

- strongest row background
- calm emphasis
- not over-decorated

### Available row treatment

- lightweight
- clear hover affordance

---

## 7. System Card Direction

System cards should feel like operational entry points.

They should not feel ornamental.

### Visual rule

- all cards share a consistent structure
- locked and ready are variants of the same object

### Content rule

- title explains the system
- description explains the user's likely task
- top-right state hint confirms readiness

### Project card

Because this product is a likely high-value destination, the Project card can receive slightly stronger emphasis if strategy confirms it.

But:

- do not break the grid
- do not turn it into a hero banner

---

## 8. State Design Direction

### No Company Selected

Mood:

- caution
- clarity

User takeaway:

- `I need to choose a business context first.`

### Ready

Mood:

- confidence
- readiness

User takeaway:

- `The context is correct. I can enter a system now.`

### Switching

Mood:

- transition
- system is working

User takeaway:

- `The change is in progress. Wait briefly.`

### Error

Mood:

- friction, but recoverable

User takeaway:

- `Something failed, but I know what to retry.`

---

## 9. Spacing And Density

Recommended:

- larger outer breathing space
- tighter rhythm inside company rows
- moderate rhythm inside system cards

The left side may be slightly denser than the right.

That is acceptable because the left side is context-heavy.

---

## 10. Icon And Badge Rules

### Badge

Use badges for:

- system short label
- company state
- context readiness

### Icons

Use icons sparingly.

They should:

- support orientation
- not replace text

---

## 11. High-Fidelity Review Questions

1. Is current company visually stronger than system card decoration?
2. Does the page feel trustworthy enough for context switching?
3. Does Project card explain user value fast enough?
4. Are locked and ready distinguishable without relying only on color?

---

## 12. Finish Line For This Page

This page is ready for high-fidelity sign-off when:

1. business context clearly leads the layout
2. system cards are task-oriented
3. the user can understand the flow in under a few seconds
4. state handling is visually complete
