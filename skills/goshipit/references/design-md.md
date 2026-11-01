# DESIGN.md Generation Guide

Loaded only when `design_md: yes` in `goshipit.md` AND no `DESIGN.md` exists at project root.

Spec: https://github.com/google-labs-code/design.md + https://stitch.withgoogle.com/docs/design-md/specification

## 1 - Inspect codebase for design signals

| Source                                             | Extract                                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `tailwind.config.*`                                | `theme.colors`, `fontFamily`, `fontSize`, `spacing`, `borderRadius`, `boxShadow`, `transitionDuration`                |
| `tokens.json`/`design-tokens.json`/`tokens/*.json` | All W3C DTCG token values                                                                                             |
| `globals.css`/`app.css`/`index.css`/`styles.css`   | CSS custom properties: `--color-*`, `--font-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*` |
| `theme.ts`/`theme.js`/`src/theme/*`                | Color/typography/spacing/shadow/motion objects                                                                        |
| `package.json` deps                                | Design system libs (`@mui/material`, `@chakra-ui/react`, `shadcn/ui`) → read theme override files                     |
| `design/` dir / Figma exports                      | Token JSON or CSS exports                                                                                             |
| `*.css` / components                               | Repeated hex values, font-family strings, px/rem values, box-shadow, transition durations                             |

Zero signals found → note `DESIGN.md skipped - no design tokens or brand signals found.` in the report and stop.

## 2 - Resolve brand personality
Read `README.md`, `package.json` description, landing page / `about` components. Extract: product name, tagline, target audience, brand voice.

## 3 - Write DESIGN.md at project root

```markdown
---
version: alpha
name: {product name}
description: {one-line brand description}
colors:
  primary: "{hex}"
  secondary: "{hex}"
  tertiary: "{hex}"          # only if found
  neutral: "{hex}"           # only if found
  success: "{hex}"           # only if found
  warning: "{hex}"           # only if found
  error: "{hex}"             # only if found
typography:
  h1:
    fontFamily: {family}
    fontSize: {value}px
    fontWeight: {number}
    lineHeight: {value}
    letterSpacing: {value}   # only if found
    fontFeature: {string}    # only if found
  # repeat per detected level
rounded:
  xs: {value}px              # only scales found - xs/sm/md/lg/xl/full
  sm: {value}px
  md: {value}px
  lg: {value}px
  full: 9999px               # only if pill/full-radius found
spacing:
  xs: {value}px              # only scales found - xs/sm/md/lg/xl/2xl
  sm: {value}px
  md: {value}px
  lg: {value}px
shadows:                     # only if box-shadow tokens found
  sm: "{css value}"
  md: "{css value}"
  lg: "{css value}"
motion:                      # only if transition/animation tokens found
  duration-fast: {value}ms
  duration-base: {value}ms
  duration-slow: {value}ms
  easing-default: "{css easing fn}"
  easing-enter: "{css easing fn}"
  easing-exit: "{css easing fn}"
components:                  # only if component-level tokens found
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    borderRadius: "{rounded.md}"
    typography: "{typography.label-md}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
  card:
    backgroundColor: "{colors.neutral}"
    borderRadius: "{rounded.lg}"
    shadow: "{shadows.md}"
omitted:
  - section: shadows
    reason: "No shadow tokens found in codebase"
  - section: motion
    reason: "No transition/animation tokens defined"
---

## Overview

{Brand personality, target audience, emotional intent - 3-5 sentences. Use descriptive language: "Architectural Minimalism meets Journalistic Gravitas" not "clean and modern".}

## Colors

- **Primary ({hex}):** {semantic role}
- **Secondary ({hex}):** {role}

## Typography

- **{token-name}:** {family, size, weight} - {intended use}

## Layout

{Spacing scale rationale, grid system, max container widths, breakpoints.}

## Elevation & Depth

{Only if shadows found. Scale + when each level applies.}

## Shapes

{Border-radius scale + when each level applies.}

## Components

{Only if component tokens found. Visual rules per component.}

## Do's and Don'ts

**Do:**

- {concrete rule from actual tokens}

**Don't:**

- {concrete rule - e.g. "Don't use tertiary on backgrounds <44px - contrast drops below WCAG AA"}
```

**Rules:**

- YAML values only from codebase - no invented values. Missing token → omit + add to `omitted`
- `{path.to.token}` in `components` must reference token defined in same file
- `fontWeight` must be a number (400, not "bold")
- All hex values must be valid CSS colors
- Section order: Overview → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts
- `omitted` entries suppress linter warnings - always include inspected-but-not-found sections
- Prose must describe _why_, not just _what_
- No placeholder text in final file - every line must contain real data

**After writing:** `DESIGN.md written - {N} color tokens, {M} typography levels, {K} shadows, {J} motion tokens, {L} component tokens.`

## 4 - Validate against live Google spec

After writing, validate DESIGN.md is not using deprecated fields. No web-fetch tool available → skip this step and output `DESIGN.md not validated - no web access.`

1. `WebFetch` https://github.com/google-labs-code/design.md - read the latest spec README
2. `WebFetch` https://stitch.withgoogle.com/docs/design-md/specification - read the full field reference
3. Compare every field/section name in the written DESIGN.md against the live spec:
    - Flag any field that no longer exists in the spec (deprecated/renamed)
    - Flag any required field that's now mandatory but missing
    - Flag any value format change (e.g. unit expected changed from px to rem)
4. If issues found → fix DESIGN.md in-place and note what was corrected
5. Output: `DESIGN.md validated against Google spec - {N} fixes applied.` or `DESIGN.md validated - no issues.`
