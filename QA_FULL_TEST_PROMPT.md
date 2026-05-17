# 🧪 NeuroBridge — Full QA Test + Refinement Prompt

**Context**: ты работаешь над `/Users/lucky/neurobridge` (Next.js 16 + React 19 + Tailwind v4 + framer-motion 12 + D3). Production: `neurocomputers.io`. API backend: `api.neurocomputers.io`. Дизайн-стандарт: **World Class** (Linear / Notion / Figma / Vercel / Stripe level — никаких MVP-компромиссов).

**Цель этой сессии**: пройти платформу через **полный QA bughunt** на 3 viewport × 2 темах × всем флоу. Найти всё что не world-class, исправить, переснять, повторить пока чисто.

**Working dir**: `/Users/lucky/neurobridge`
**Vault context**: `~/vault/Биокомпьютинг/` (Recent Decisions, Open Questions, KPI)
**Auto-memory**: `~/.claude/projects/-Users-lucky/memory/project_neurobridge.md`

---

## 📋 Setup (один раз в начале)

```bash
cd /Users/lucky/neurobridge
npm install
npm run build          # должен быть ✅ Compiled successfully
lsof -ti:3000 | xargs kill -9 2>/dev/null
nohup npm start > /tmp/nb.log 2>&1 &
sleep 4 && curl -s http://localhost:3000 | grep -c "neurocomputers"   # ≥1 = up
```

Если backend нужен локально: `NEXT_PUBLIC_API_BASE=http://localhost:8847 npm start`.
По умолчанию dev frontend fallback'ит на `https://api.neurocomputers.io` (CORS открыт).

Запусти Chrome MCP в новой вкладке через `tabs_context_mcp({createIfEmpty: true})`.

---

## 🎯 Test Matrix (обязательное покрытие)

| Viewport | Theme | Pages |
|---|---|---|
| Desktop 1440×900 | Dark | / · /dashboard · /spikes · /network · /iq · /discovery · /experiments · /protocols · /constructor · /live |
| Desktop 1440×900 | Light | (то же) |
| Tablet 768×1024 | Dark | (то же) |
| Tablet 768×1024 | Light | (то же) |
| Mobile 375×812 | Dark | (то же) |
| Mobile 375×812 | Light | (то же) |
| **Plus** | | /contact · /privacy · /terms · /not-found · 404 random URL |

Mobile resize через MCP `resize_window` затрагивает только OS-окно — viewport остаётся desktop. Для **настоящего** мобильного теста запускай Chrome DevTools device emulation вручную через `chrome-devtools-mcp` (если установлен), либо проверь responsive через CSS-инспекцию (window.matchMedia).

---

## 🔍 Section 1: Landing Page (`/`)

### 1.1 First paint (FOUC check)
1. Очисти localStorage: DevTools → Application → Storage → Clear site data
2. Hard reload (Cmd+Shift+R)
3. **Expected**: theme применяется до первого paint — нет flash от dark→light
4. **Bug pattern**: если видишь короткую вспышку другой темы → `app/layout.tsx` theme-init script сломан
5. Test в обеих system preferences: macOS Light + macOS Dark

### 1.2 Hero render
- ✅ Badge `OPEN-SOURCE · MIT · PEER-REVIEWED` появляется с pulsing dot
- ✅ Heading `The platform for` (Geist) + `brain organoid analysis` (Instrument Serif italic, gradient)
- ✅ AnimatedWords рендерит каждое слово по очереди (с motion); либо все сразу (reduced motion)
- ✅ Description visible
- ✅ CTAs `Try Live Dashboard` (gradient solid) + `View on GitHub` (glass)
- ✅ Scroll indicator (тонкая вертикальная линия снизу, breathing)
- ✅ NeuralBackground canvas с particles (theme-aware: cyan/violet на dark, теплее на light)

### 1.3 Reduced motion test
1. macOS System Preferences → Accessibility → Display → Reduce motion ON
2. Reload landing
3. **Expected**: текст видим МГНОВЕННО (no fade), particles статичны (1 frame), counters сразу показывают final value
4. **Bug pattern**: blank hero / invisible numbers = `useReducedMotion()` не сработал в каком-то компоненте

### 1.4 Animated counters
1. Scroll к секции STATS
2. **Expected**: `9`, `12K`, `2.6M`, `22` animate from 0 → final
3. **Bug pattern**: `2.6M` → `26.6M` (старый bug parser, должен быть починен)
4. Reduced motion: цифры финальные сразу

### 1.5 Mini visualizations (3 cards)
- MiniRasterPlot — горизонтальная прокрутка спайков по 6 каналам
- MiniHeatmap — тепловая карта inferno colormap, обновление ~10Hz
- MiniNetwork — узлы + соединения + cascade firing animation
- **All**: pause when scrolled off-screen (IntersectionObserver) — проверь через DevTools Performance: rAF stops когда canvas вне viewport
- **All**: pause when document.hidden (переключи tab → вернись → анимация resumes)

### 1.6 Capabilities / Workflow / Methods scroll reveal
- Прокрутка вниз → каждая секция fade-in через ScrollReveal
- **Bug pattern**: если секции остаются opacity:0 → ScrollReveal сломан

### 1.7 Nav (desktop)
- Logo `neurocomputers` clickable → / (already there)
- Links `Capabilities` / `Workflow` / `Methods` → smooth scroll к anchor
- `Dashboard →` button → /dashboard
- Glass effect (backdrop-blur 30px) — фон позади виден размытым

### 1.8 Nav (mobile, < 768px)
- Hamburger button visible (3 lines)
- Click → drawer slides down с overlay
- Drawer содержит: Capabilities / Workflow / Methods / Open Dashboard CTA
- Click outside → closes
- Escape → closes
- Body scroll locked while open
- **a11y**: aria-expanded toggles, aria-controls="mobile-nav", aria-label corrects

### 1.9 Theme toggle
- Если есть theme toggle button — проверь что переключение persists в localStorage `neurobridge-theme`
- Reload → тема сохранена
- Все цвета (badge, gradient text, particles, hero glow) должны перекрашиваться корректно

### 1.10 Footer
- 7 links: GitHub / API Docs / PyPI / Dashboard / Privacy / Terms / Contact
- External links (`GitHub`, `API Docs`, `PyPI`) → target=_blank rel=noopener
- Все 4 internal links открывают свои страницы корректно

---

## 🔍 Section 2: Dashboard Hub (`/dashboard`)

### 2.1 First visit (WelcomeModal)
1. Очисти localStorage `neuro_onboarded`
2. Open /dashboard
3. **Expected**: WelcomeModal появляется
4. Test interactions:
   - Escape → closes
   - Click outside backdrop → closes
   - ArrowRight → next step (4 steps total)
   - ArrowLeft → prev step
   - Click progress dot → jumps to step
   - `Skip` → dismisses + saves `neuro_onboarded=1`
   - `Get Started` (last step) → dismisses
5. **a11y**: focus на primary CTA при открытии, restore focus при close, role="dialog", aria-modal="true"
6. **Body scroll** locked while open (попробуй прокрутить — page behind не двигается)

### 2.2 Empty state (idle, no dataset)
- ✅ Breathing orb (radial gradient breathing animation)
- ✅ Eyebrow `CHOOSE A DATA SOURCE`
- ✅ Heading `Load data to begin analysis`
- ✅ Description с highlighted `FinalSpark`
- ✅ 3 описательных Panel cards: FinalSpark / Synthetic / Upload

### 2.3 Sidebar (desktop, lg+)
- Logo top-left
- Section header `ANALYSIS`
- 9 nav items: Overview / Spikes / Network / Complexity / Discovery / Experiments / Protocols / Constructor / Live
- Active item: gradient left bar + pulse dot + bg tint + bold weight
- Hover non-active: text becomes primary
- Bottom: `THEME` row with toggle + `API Debug` button + `Exit dashboard` link
- Если dataset загружен: показывает `Dataset {id} / N ch · Ms` в footer

### 2.4 Sidebar (mobile, < lg = 1024px)
- Hidden by default
- Hamburger в header → opens drawer
- Backdrop overlay (rgba black 50%) blurred
- Click backdrop → closes
- Click any nav link → closes (`onClick={() => setSidebarOpen(false)}`)
- Mobile показывает currentPage label в header (рядом с hamburger): "Overview" / "Spikes" / etc

### 2.5 Header (status badges + controls)
- Idle: только кнопки `FinalSpark / 30s / 120s / Upload`
- Loading: yellow spinner pill с текущим step ("Loading FinalSpark MEA data...")
- Ready: green pill `FinalSpark 5-day · MM:SS` + Metric pills (lg+ only) + Subset selector (>1h only)
- Error: red pill `ERROR` + красный error bar ниже header

### 2.6 Data loading: FinalSpark
1. Click `FinalSpark` button
2. **Expected within ~30s**:
   - Status → loading → ready
   - Spike data loads (raster shows 1000 spikes)
   - Background analysis: Summary → Health → NCI Score → Bursts (sequential)
   - Progress bar shows `1/4 → 2/4 → 3/4 → 4/4 Running analysis`
   - NCI Hero radial fills (Grade C, score 55±5 для fs437 1h slice)
   - Health Stat: ~90%
   - Firing Rate Stat: ~0.5 Hz
   - Bursts Stat: number
   - Raster Plot + Network Connectivity render
3. **Bug pattern**: `Failed to fetch` → API_BASE сломан или CORS issue

### 2.7 Data loading: Synthetic 30s / 120s
1. Click `30s` → generates 30s synthetic, status badge `Synthetic 30s`
2. Switch to `120s` → re-generates, badge updates
3. Verify all stats + charts re-render with new data

### 2.8 Data loading: Upload
1. Click `Upload` → file input opens
2. Test with valid CSV (e.g. SpikeDataToShare_fs437data.csv)
3. Test with invalid file (random .txt) → error pill + readable error msg
4. Test cancel → no state change

### 2.9 Subset selector (slice)
- Только видим если duration > 1h (~3600s)
- 3 options: 1h / 10h / Full
- Default: 1h (cheapest)
- Switch → wipes cached analyses → re-runs with new subset
- Active state visible (green bg + green text)

### 2.10 CSV export
- Когда data ready → `CSV` link появляется в header
- Click → скачивает CSV файл

### 2.11 Full Report JSON
- Button в правом верху visualizations area
- Click → downloads `neurobridge-report-{id}.json`
- File содержит full analysis JSON

---

## 🔍 Section 3: Sub-pages (по 1 каждой)

### 3.1 /dashboard/spikes
- Raster Plot full
- Spike Waveforms
- ISI Histogram
- Firing Rate Timeline (D3 line+area)
- **Bug check**: D3 imports должны быть tree-shaken (`d3-selection`, `d3-scale`, etc.) — не `import * as d3 from 'd3'`

### 3.2 /dashboard/network
- Connectivity Graph (D3 force simulation)
- Cross-Correlogram
- Transfer Entropy matrix
- **Bug check**: то же про D3 imports
- Drag nodes — должны двигаться плавно с physics

### 3.3 /dashboard/iq (Complexity)
- NCI radial gauge большего размера
- 6 dimension breakdowns (criticality / metastability / etc.)
- Per-dimension explanations с citations

### 3.4 /dashboard/discovery
- 17 advanced analyses, grouped в 4 categories (emergence / dynamics / memory / health)
- Collapsible sections — click чтобы свернуть
- Each card имеет per-card loading state (skeleton + spinner + elapsed timer)
- Error per card — НЕ ломает остальные cards (ErrorBoundary compact mode)

### 3.5 /dashboard/experiments
- Experiment templates / configurations

### 3.6 /dashboard/protocols
- Protocol library

### 3.7 /dashboard/constructor
- Custom analysis pipeline builder

### 3.8 /dashboard/live
- Connect button → WebSocket → wss://api.neurocomputers.io/ws/spikes
- Streaming spikes appear на canvas
- Pause / Resume / Disconnect controls
- Stats: spike count, elapsed, peak rate per electrode
- **Bug check**: DPR setup отдельно от render loop (предыдущий bug — ctx.scale на каждом кадре)

---

## 🔍 Section 4: Error states + Resilience

### 4.1 404 page
- Visit `/random-nonexistent-url`
- **Expected**: NotFound page с "404" gradient + heading + 3 CTAs (Home / Dashboard / API docs)
- На mobile — vertical stack

### 4.2 Crash recovery (`app/error.tsx`)
1. Open DevTools console → инжектируй ошибку в dashboard component
2. **Expected**: error.tsx fallback показывается, остальное приложение работает
3. Click `Try again` → reset выполнен, component re-renders

### 4.3 Global crash (`app/global-error.tsx`)
- Trigger root layout error (например через DevTools — переименуй HTML element)
- **Expected**: global-error fallback с inline styles (без globals.css), `Reload` button работает

### 4.4 Per-card error
- Block API endpoint (Network tab → block request URL)
- Force component to refetch
- **Expected**: только этот ChartCard показывает `Card failed to render` + Retry, остальные карты живы

### 4.5 API timeouts
- Heavy endpoint (transfer entropy на full FinalSpark) может timeout 504
- **Expected**: friendly error `Analysis ran out of time. Try a smaller time range (use the 1h / 10h selector at the top).`
- Retry button работает

### 4.6 Network offline
- DevTools → Network → Offline
- Try to load data
- **Expected**: friendly `Network error — could not reach the API.`

### 4.7 Rate limit (429)
- Если есть способ trigger — verify friendly msg

### 4.8 Dataset expired (410)
- Wait > backend session timeout
- Try action → expect friendly `Your dataset was released to free memory. Reload the page to start a new session.`

---

## 🔍 Section 5: Accessibility (axe-core check)

### 5.1 Keyboard navigation
1. Tab through landing page → focus visible на каждом focusable
2. Skip link (`Skip to main content`) → first Tab показывает
3. Dashboard sidebar → Tab проходит по всем nav items
4. Modal trap focus inside (Tab внутри modal не выходит на background)

### 5.2 Focus styles
- `:focus-visible` outline cyan 2px + 2px offset
- Все buttons / links / inputs имеют visible focus при Tab

### 5.3 ARIA
- Modal: role=dialog, aria-modal, aria-labelledby, aria-describedby
- Buttons toggles: aria-pressed, aria-expanded, aria-controls
- Decorative canvas: aria-hidden=true
- Status indicators: role + aria-live (если они dynamic)

### 5.4 Color contrast (DevTools Lighthouse a11y)
- Run Lighthouse on `/` and `/dashboard`
- Score should be ≥ 90 accessibility
- Если < 90, посмотри которые контрасты failure — typically `text-tertiary` на glass surfaces

### 5.5 Screen reader (VoiceOver, optional)
- macOS: Cmd+F5 → VoiceOver
- Navigate landing → headings hierarchy logical
- Open modal → focus announces dialog title

---

## 🔍 Section 6: Performance

### 6.1 Bundle size
```bash
npm run build 2>&1 | tail -40
```
- Verify no route > 500 KB
- Если есть — check imports (особенно d3 umbrella)

### 6.2 Lighthouse Performance
- Open landing in Chrome → DevTools → Lighthouse → Mobile + Desktop
- Score: ≥ 85 mobile, ≥ 95 desktop
- LCP < 2.5s, CLS < 0.1, FID < 100ms

### 6.3 Canvas frame rate
- DevTools → Performance → Record 5s on landing
- Verify ~60 fps when canvases visible
- Verify rAF stops when scroll past hero (NeuralBackground) or when tab hidden

### 6.4 Memory leaks
- DevTools → Memory → Heap snapshot before / after navigation
- Navigate between /spikes /network /iq /discovery 10 раз
- Heap не должен расти > 20%

### 6.5 First Contentful Paint dev vs prod
- `npm run dev` vs `npm start` — verify prod is much faster (no HMR)
- Prod TTFB < 200ms on localhost

---

## 🔍 Section 7: Cross-browser

### 7.1 Safari 17+
- Open в Safari → verify backdrop-filter работает (Safari rendering glass)
- Verify font fallback `Instrument Serif` отображается
- Test WebSocket live page

### 7.2 Firefox 120+
- Verify backdrop-filter (Firefox 103+ supports)
- Verify color-mix() (Firefox 113+)
- Test motion (framer-motion)

### 7.3 Edge / Chromium-based
- Should work identical to Chrome

---

## 🔍 Section 8: Edge cases

### 8.1 Slow 3G
- DevTools → Network → Slow 3G
- Verify loading states everywhere (no white flash)

### 8.2 Empty data
- Generate 1s synthetic with burst_probability=0 → near-zero spikes
- Verify charts show "No data" gracefully, not crash

### 8.3 Huge data
- Upload 100MB CSV (если есть)
- Verify upload progress, then graceful 413 if exceeded

### 8.4 Multiple tabs same dataset
- Open same dashboard в 2 tabs
- Load FinalSpark в tab 1
- Switch to tab 2 → state independent (datasetId per tab)

### 8.5 Theme switching mid-session
- Load dataset
- Switch theme
- Verify all charts re-render с new colors (особенно D3 которые читают `getThemeColors()`)

### 8.6 OS prefers-color-scheme change
- Load page без localStorage override
- macOS Settings → switch to Light/Dark
- **Expected**: page follows OS automatically (через mediaQuery listener в theme-context)

### 8.7 Localization
- Currently English only. Verify нет hardcoded UA/CZ/RU strings оставшихся

### 8.8 RTL languages
- Optional: set `<html dir="rtl">` → verify layout doesn't break (likely not supported)

---

## 🔍 Section 9: Backend integration smoke tests

### 9.1 All API endpoints respond
```bash
curl -s https://api.neurocomputers.io/health
curl -s https://api.neurocomputers.io/api/datasets
# (более endpoints через DevTools Network tab пока работаешь UI)
```

### 9.2 WebSocket connect
- /dashboard/live → Connect
- Verify spikes streaming
- Disconnect → verify clean close

### 9.3 Background analysis sequence
- Watch DevTools → Network as data loads
- Verify order: Summary → Health → IQ → Bursts (sequential, не parallel — backend single worker)

---

## 🔍 Section 10: SEO + metadata

### 10.1 Sitemap
- `curl https://neurocomputers.io/sitemap.xml`
- Verify все routes listed except internal (`publish`)

### 10.2 robots.txt
- `curl https://neurocomputers.io/robots.txt`
- `User-agent: *` + `Allow: /` + Sitemap reference

### 10.3 OG tags
- `curl https://neurocomputers.io/` | grep `og:`
- Title / description / image URL valid

### 10.4 JSON-LD
- Grep for `application/ld+json` в HTML
- Validate в [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## 🛠️ Что делать при найденных багах

### Severity scale
- 🚨 **Critical**: blank page / data loss / unrecoverable crash / security
- ⚠️ **High**: feature broken / wrong data shown / mobile нерабочее
- 🔧 **Medium**: UX jank / wrong colors in one theme / a11y issues
- 📝 **Low**: typo / minor visual / nice-to-have polish

### Fix pattern
1. **Reproduce** в DevTools или via MCP screenshots
2. **Localize** в коде (grep / find component)
3. **Read** existing implementation полностью перед изменениями
4. **Fix** минимально-инвазивно
5. **Verify** через `npm run build` + browser screenshot
6. **Document** что починил (комментарий в коде если non-obvious)

### Стандарты кода
- TypeScript strict (no `any` без причины)
- No `eslint-disable` без явного reason в комментарии
- Reduced-motion support везде где есть animation
- Theme-aware colors (CSS vars), не hardcoded hex
- a11y: aria-* + focus management + keyboard support
- Canvas: setTransform (not scale), visibility pause, ResizeObserver, IntersectionObserver
- Error boundaries: per-card + per-route + global

### Commit pattern
После каждой логической группы fixes:
```bash
git add <specific files>
git commit -m "fix: <component> — <what was wrong> → <how fixed>

<2-3 sentences why>"
```
Не batch коммитов 20 файлов под "various fixes".

### Deploy
```bash
# Vercel auto-deploy on push to main
git push origin main
# Verify production:
# 1. Open neurocomputers.io in incognito (no cache)
# 2. Run smoke tests Section 9
# 3. Check Vercel deployment logs for warnings
```

---

## 🔄 Iteration protocol

**После каждой полной прохода через все sections**:
1. Если найдены bugs → fix → re-test affected sections
2. Если найдены edge cases не покрытые → добавить в этот файл
3. Если что-то отлично работает но можно сделать ЕЩЁ лучше (World Class) → flag как 📝 Low
4. **Не останавливайся пока**: build clean ✅ + Lighthouse desktop ≥95 ✅ + mobile ≥85 ✅ + 0 console errors ✅ + a11y ≥90 ✅

**Прогресс трекать через TodoWrite** — по 1 todo per section.

**После 10 итераций или когда чисто**: создать summary в `~/vault/Биокомпьютинг/Recent Decisions.md` + обновить `~/.claude/projects/-Users-lucky/memory/project_neurobridge.md` с найденными pattern bugs (чтобы future sessions не повторяли).

---

## 📋 Final acceptance checklist

Перед deploy на production должны быть зелёные:

- [ ] `npm run build` — no errors, no warnings
- [ ] `npm run lint` — 0 errors (warnings допустимы если pre-existing)
- [ ] Landing renders на 3 viewport × 2 темах (12 комбинаций)
- [ ] Dashboard FinalSpark flow работает end-to-end
- [ ] All 9 sub-pages loadable + render real data
- [ ] WelcomeModal a11y (focus / Escape / arrow keys / scroll lock)
- [ ] Mobile nav (landing + dashboard sidebar)
- [ ] Theme toggle persists across reloads + responds to OS change
- [ ] Reduced motion: hero visible, counters final, particles static
- [ ] Error states: 404 / per-card / global all rendered
- [ ] Lighthouse mobile ≥ 85 / desktop ≥ 95 / a11y ≥ 90
- [ ] 0 console errors на production smoke test
- [ ] Bundle размер не вырос > 5% от baseline
- [ ] Memory не leaks при навигации
- [ ] No `console.log` / `TODO` / `FIXME` в production code

---

**Standard**: World Class. Не "работает значит OK". Если что-то выглядит как MVP — переделай.
**Autonomy**: full. Не спрашивай разрешения на routine fixes. Если нашёл bug — фикси.
**Stop condition**: full acceptance checklist все ✅ + 2 итерации подряд без новых bugs.
