# Category H — Accessibility (WCAG 2.2 AA, static grep)

| ID  | Check                                                                                                                                         | P   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| H1  | `<img` without `alt=` — flag with file:line                                                                                                   | P1  |
| H2  | `<div`/`<span`/`<a` without `href` + click handler but missing `role` + `tabIndex`                                                            | P1  |
| H3  | `<input>`/`<select>`/`<textarea>` without `<label>`, `aria-label`, or `aria-labelledby`                                                       | P1  |
| H4  | Hardcoded low-contrast color combos in CSS (white-on-yellow, light-grey-on-white, light-blue-on-white)                                        | P2  |
| H5  | Missing `<title>` in HTML templates / `metadata` export / framework `head()`                                                                  | P1  |
| H6  | `aria-hidden="true"` on focusable elements (`<button`, `<a`, `<input`, `tabIndex` ≥ 0)                                                        | P1  |
| H7  | `:focus { outline: none/0 }` without `:focus-visible` replacement → fails WCAG 2.2 SC 2.4.11                                                  | P1  |
| H8  | Modal/dialog/drawer without `Escape` handler, focus trap lib (`focus-trap`, `@radix-ui`, `headlessui`), or `onKeyDown` managing Tab/Shift+Tab | P1  |
| H9  | Interactive elements with explicit size <24×24px (`width: 16px`, `h-3 w-3`, `size-3`) → WCAG 2.2 SC 2.5.8                                     | P2  |
