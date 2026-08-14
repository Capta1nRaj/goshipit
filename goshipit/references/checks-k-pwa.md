# Category K — PWA & Service Worker _(only if intent detected)_

Only run this category if `manifest.json`, `sw.js`, `next-pwa`, or workbox is detected.

| ID  | Check                                                                                                                           | P   |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | --- |
| K1  | `manifest.json`/`site.webmanifest` missing or lacks `name`, `short_name`, `icons`, `theme_color`, `background_color`, `display` | P1  |
| K2  | Service worker not registered (`navigator.serviceWorker.register()` or framework equivalent)                                    | P1  |
| K3  | No offline fallback page cached by SW                                                                                           | P2  |
| K4  | SW intercepts API routes or auth endpoints → stale/cached login responses                                                       | P0  |
| K5  | SW not versioned/cache-busted on deploy → stale SW serves old assets                                                            | P1  |
