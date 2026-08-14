# Category E - Build & Performance

| ID  | Check                                                                                                                                                                                                   | P   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| E1  | Run build command - flag errors + deprecation warnings                                                                                                                                                  | P0  |
| E2  | _(only if TypeScript)_ `tsc --noEmit` - flag type errors; flag `any` casts in auth/payment paths                                                                                                        | P1  |
| E3  | Main JS bundle >300kb gzipped - list top 5 largest deps                                                                                                                                                 | P1  |
| E4  | `<img>` without `width`/`height`; `next/image`/`loading="lazy"` not used                                                                                                                                | P1  |
| E5  | Font imports missing `font-display: swap`; render-blocking `@import url()` in CSS                                                                                                                       | P2  |
| E6  | `<script>` in `<head>` without `defer`/`async`                                                                                                                                                          | P1  |
| E7  | Upload endpoints missing max file size config                                                                                                                                                           | P1  |
| E8  | DB calls (`.find(`, `.findOne(`, `SELECT`) inside loops (`for`, `forEach`, `.map(`) - N+1, flag with file:line                                                                                          | P1  |
| E9  | Static assets missing `Cache-Control: public, max-age=31536000, immutable`                                                                                                                              | P1  |
| E10 | `robots.txt`, sitemaps, HTML responses cached immutably - should have short cache / `must-revalidate`                                                                                                   | P1  |
| E11 | Compression enabled: `compress: true` (Next.js), `compression()` (Express), `gzip on` (Nginx)                                                                                                           | P1  |
| E12 | Modern image formats not configured (webp/avif via `formats: ["image/avif", "image/webp"]`, CDN, or build tool)                                                                                         | P2  |
| E13 | Sync heavy work in event handlers (`onclick`/`addEventListener`/`onKeyDown` with DB calls, large loops, blocking `while`/`for` without `requestAnimationFrame`)                                         | P1  |
| E14 | Dynamic content above fold without reserved space: ads/banners without fixed dims, `height: auto` on above-fold containers, images without `width`+`height`                                             | P1  |
| E15 | _(only if SSR framework)_ `Math.random()`/`Date.now()`/`new Date()` outside `useEffect`/`onMounted`; browser APIs (`localStorage`, `navigator`, `document`) at module/render level → hydration mismatch | P1  |

**Stack-specific build checks:** based on detected framework - no hardcoded lists. Apply judgement:

- Frontend: prod build doesn't expose sourcemaps, image/asset handling configured, security headers set
- Backend: debug off, CORS configured, framework security middleware active
- Compiled: vet/lint passes, race detection in tests
- Any: prod config differs from dev, no dev-only flags in prod build scripts
