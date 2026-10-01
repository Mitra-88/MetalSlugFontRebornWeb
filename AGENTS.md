# AGENTS.md - X

## What this is

MetalSlugFontRebornWeb: a client-side web tool that renders text as images using Metal Slug sprite fonts. Type text, pick a font variant (1 to 5), a color, an output scale, and the app draws the text onto a canvas from per-character PNGs, then offers a PNG download. Two reference pages round it out: an examples gallery and a character support table.

The stack is Solid.js 1.9 + Vite 8 (MPA, three HTML entries) + Tailwind CSS 4 + lucide-solid icons, styled as a hand-rolled Material 3 system (light and dark schemes, see Design system below) with a built-in sampling profiler for the render pipeline. No router, no SSR, no server: `npm run build` emits static files with relative paths that run from any static host or a Tauri shell.

## Coding rules (mandatory: apply to every change)

**Purpose:** implement only what is genuinely necessary for the requested feature.

**Core rules**

- No overengineering.
- No unnecessary abstractions.
- No generic framework-like constructs when a simple, direct solution suffices.
- No "future-proofing" without a concrete need.
- No dead helper classes, wrappers, managers, registry layers, or utility collections without a clear current use case.
- No artificially bloated architectures.

**Style guidelines**

- Write simple, direct, readable code.
- Prefer concrete implementations over unnecessary generalization.
- Keep classes small and single-purpose.
- Keep methods short and clear.
- Use self-explanatory names instead of comments. **never add comments in code**, every rationale, invariant, and quirk lives in this file instead, so it has exactly one home and can't drift from the code. Don't re-add inline comments or apis/docs; put the knowledge here.
- Never use em dashes. In any file (docs, config comments, chat messages, code strings) write the sentence with commas, colons, or plain hyphens instead.

**What to avoid**

- AI-typical "enterprise" patterns for small features.
- Excessive use of interfaces without real added value.
- Builders, factories, services, providers, adapters, etc., unless actually needed.
- Defensive abstractions for hypothetical future use cases.
- Multi-layered architecture for trivial logic.
- Duplicated helper logic in "Utils" just to make code look "cleaner".
- Complex configuration or event systems for simple flows.

**Implementation principle, for every change:**

1. What is the specific requirement?
2. What is the smallest clean solution?
3. Implement exactly that, nothing beyond it.

**Refactoring** happens only for a real benefit: better readability, less duplication, clearer responsibilities, or a necessary technical fix, never purely stylistic preference.

**When in doubt, prefer:** less code, fewer files, less abstraction, less magic.

**Goal:** the code should feel pragmatically and deliberately written by an experienced developer, not like generic AI output.

## Ponytail, lazy senior dev mode

Adapted from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/blob/main/AGENTS.md), commit `b6c04480c03e8db2f035751d7c46289779ec3362`.

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse the helper, util, or pattern that's already here, don't re-write it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

The ladder runs after you understand the problem, not instead of it: read the task and the code it touches, trace the real flow end to end, then climb.

Bug fix = root cause, not symptom: a report names a symptom. Grep every caller of the function you touch and fix the shared function once, one guard there is a smaller diff than one per caller, and patching only the path the ticket names leaves a sibling caller still broken.

Rules:

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest working diff wins, but only once you understand the problem. The smallest change in the wrong place isn't lazy, it's a second bug.
- Question complex requests: "Do you actually need X, or does Y cover it?"
- Pick the edge-case-correct option when two stdlib approaches are the same size, lazy means less code, not the flimsier algorithm.
- Mark deliberate simplifications that cut a real corner with a known ceiling (global lock, O(n²) scan, naive heuristic) with a `ponytail:` note naming the ceiling and upgrade path; in this repo that note lives here in AGENTS.md (next to the relevant section or in Gotchas & quirks).

Not lazy about: understanding the problem (read it fully and trace the real flow before picking a rung, a small diff you don't understand is just laziness dressed up as efficiency), input validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs (the platform is never the spec ideal, a clock drifts, a sensor reads off), anything explicitly requested. Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind, the smallest thing that fails if the logic breaks (an assert-based demo/self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.

(Yes, this also applies to agents working on this repo. Especially to them.)

## Build & run

- `npm install` once.
- `npm run dev` for the dev server (default port 5173).
- `npm run build` to produce `dist/`, `npm run preview` to serve the build.
- `npm test` runs three assert-based self-checks (plain node, no framework): `tests/layout.test.js` covers character mapping (including per-font overrides), support tables, preload lists, layout math (including unsupported-character skipping) and the layout memo; `tests/perf.test.js` covers the profiler math (with a faked clock), the ring buffer cap and a layout benchmark (24k chars in 400 lines at roughly 2 to 3 ms per op, asserted well under 50 ms); `tests/sprites.test.js` walks every font/color directory in `public/assets/fonts` and asserts `FONT_SUPPORT` matches the sprite files exactly in both directions, so no character can be declared without a sprite and no sprite can sit unreachable.

## How it works

Rendering pipeline, in the order `Generator.jsx` drives it:

1. Character support: `FONT_SUPPORT` in `src/lib/fonts.js` declares, per font, the available colors, case support, digits and symbol characters. `SPECIAL_CHARACTERS` maps a typed character to its sprite filename, with `FONT_SYMBOL_OVERRIDES` for per-font exceptions (Font 2 numbers its accent glyphs differently from Font 1). `getCharPath` is the single gatekeeper: it returns null for any character `isCharSupported` rejects, so unsupported characters can never load another font's sprite. Font 5 is uppercase-only, digits 1 to 9, and input is uppercased before any other step. Unsupported characters do not error: `computeLayout` skips them, `generate` reports them via `collectUnsupported`, and only a render with zero drawable characters fails (error kind `empty`).
2. Asset loading: `src/lib/render.js` keeps a module-level `imgCache` Map and `failedLoads` Set. `loadImage` decodes each PNG once, preferring `createImageBitmap` (off-main-thread decode, faster `drawImage`), falling back to the `HTMLImageElement`; cache entries are uniform `{ drawable, w, h }`. Each attempt has an 8s timeout so a hung connection can never stall the pipeline, one retry follows a failure after 50ms, and a final failure lands in `failedLoads`. `resetFailures()` clears that set for the UI's manual retry. Loading is lazy: nothing loads at page boot except `preloadIdle`, which warms the rest of the current font/color during idle time in batches of 10 (chains are cancelled when the target font/color changes and deduped per target); generating only awaits the sprites the text actually needs (`getMissingPaths`).
3. Generation: typing debounces 50ms into `generate()`. It rejects unsupported characters (`findUnsupportedChar`), awaits any missing sprites while the UI shows the loading overlay with the fetch count, then calls `renderToCanvas`. That resolves the layout through `getLayout` (an LRU memo keyed `font|color|text`, cap 48, only cached when every sprite exists), draws via `drawLayout`, and records a profiler sample; failed renders cancel their sample via `perf.cancel` so error attempts never pollute the stats. Output above 8192px sets a warning, above 16384px is refused (browser canvas limits).
4. Layout rules baked into `computeLayout`/`drawLayout`: whitespace is a 25px advance, an empty line is 50px tall, lines are separated by 15px, glyphs align to the bottom of their line (baseline = tallest glyph), scale multiplies via canvas dimensions plus `ctx.scale` with `imageSmoothingEnabled = false` (pixelated output).
5. Profiling: `src/lib/perf.js` is a sampling profiler. Each `renderToCanvas` records one sample with phases (`layout`, residual `draw`, plus `load` merged in by the generator) and metadata (sprites, cacheHits, chars) into a 100-slot ring buffer; `stats()` aggregates min/p50/p95/max per phase. The preview panel shows the last sample as chips (time, sprites, cache hit %) and a Details table with the last 5 runs plus p95.
6. Download: `canvas.toBlob` to PNG, object URL, synthetic anchor click.

Every async path is guarded by a monotonically increasing `genId` counter: any new input (typing, font/color/scale change) increments it, and a stale async generate discards its result instead of drawing. Select handlers clear the pending debounce so a slow load can't double-fire.

UI state is one `status` signal (`idle | loading | success | error`). The canvas is ALWAYS mounted; the loading/idle/error overlays are absolutely positioned siblings shown on top of it. Never wrap the canvas in a `<Show>`: while the loading overlay replaced it, the ref went stale and the post-load draw hit a detached canvas, leaving the visible one empty.

## Design system (Material 3)

`src/index.css` hand-rolls M3 with Tailwind v4 tokens; @material/web was rejected as ~80KB of web components versus ~6KB gzipped CSS.

- Color: full M3 role set (primary/on-primary/container pairs, surface container tiers, outline roles, inverse) as CSS variables `--m3-*` exposed to Tailwind via `@theme inline` as `--color-*`, so every utility is runtime themeable. Three seed palettes, each with light and dark schemes as tonal-token sets: `amber` (default, hue ~38, warm cream/amber), `verdant` (green, `[data-palette="verdant"]`) and `azure` (blue, `[data-palette="azure"]`); dark is `[data-theme="dark"]` over `:root`. The palette+dark selector has higher specificity than the plain dark block, and palette-light beats `:root` by source order; keep that order intact when editing.
- The palette is user-selectable through `PaletteMenu` in the app bar (persisted as `msfb-palette`), the scheme through `ThemeToggle` (persisted as `msfb-theme`). An inline boot script in each HTML head applies both before first paint and sets the single `theme-color` meta from a per-palette surface tint table; `ThemeToggle` and `PaletteMenu` update that meta at runtime using the same tint table (`SCHEME_TINTS` in `Page.jsx`). Keep the inline script and `SCHEME_TINTS` in sync when adding a palette.
- Typography: Roboto Flex from Google Fonts (`display=swap`, system fallbacks). Hand-written M3 type-scale classes: `.text-display-s`, `.text-headline-s`, `.text-title-*`, `.text-body-*`, `.text-label-*`; `.mono` for profiler numbers. Labels, titles and the label text on buttons/segments/chips use weight 500 per spec; only the expressive headline and the error-box actions are heavier.
- Shape: pills for buttons/segments, `rounded-card` (28px) cards, `rounded-stage` (24px) preview, outlined text field with 4px top corners and a floating label masked over the border.
- Motion: M3 easing tokens as Tailwind `ease-*` utilities, including the M3 Expressive spring as a CSS `linear()` curve (`--ease-spring`) used for the segmented thumb, chips and button press scale. Cross-page fades come from `@view-transition { navigation: auto }`, theme and palette switches crossfade via a temporary `.theme-fade` class on `<html>` (`withThemeTransition` in Page.jsx), stage overlays use `.stage-overlay`, selection checks use `.pop-in`, and the canvas pops on each successful render through the Web Animations API. `prefers-reduced-motion` kills all of it.
- Components are plain CSS classes: `.btn-filled` with `::before` state layers (hover 8%, press 12%), `.icon-btn`, `.m3-seg` (sliding thumb, width 1/n, `translateX(index*100%)`), `.m3-chip`, `.chip-static`, `.m3-field`, `.card`, `.stage` (pixel-grid background), `.m3-progress` (conic spinner), `.state-chip`, `.error-box`, `.rise-in` (staggered entrance).

## Codebase tour

- `index.html`, `examples.html`, `supported.html`: Vite MPA entries at the repo root, each with the pre-paint theme/palette boot script and the Roboto Flex link.
- `vite.config.js`: relative base (`./`) so the build works under any host path, `appType: "mpa"`, the three HTML inputs, solid + tailwind plugins.
- `src/lib/fonts.js`: all font metadata and pure character logic (paths, support checks, preload lists). No DOM.
- `src/lib/render.js`: bitmap cache, lazy/idle loading, layout memo, layout computation and canvas drawing. The only browser-coupled module besides the pages.
- `src/lib/perf.js`: sampling profiler (ring buffer, phase timings, percentile stats). Node-safe and clock-fakeable for tests.
- `src/pages/Generator.jsx`: the generator, M3 controls (Segmented, ColorChips, outlined field), state machine, perf chips and Details table.
- `src/pages/Examples.jsx`: gallery, data-driven from `FONT_SUPPORT` plus a per-font image size table; images lazy + async decode.
- `src/pages/Supported.jsx`: support table, derived from `FONT_SUPPORT` (single source of truth with the generator) plus the hardcoded unsupported-symbols note.
- `src/Page.jsx`: `AppBar` (mascot mark, actions slot), `Page` shell, `ThemeToggle` and `PaletteMenu` (both persisted), `ColorDot`, the `COLOR_HEX` sprite swatches, `PALETTES`/`SCHEME_TINTS` theme data and `capitalize`.
- `src/index.css`: the M3 design system (see above).
- `public/assets/`: fonts, example images, icons, `manifest.json`. Everything is referenced with relative `./assets/...` URLs.
- `tests/layout.test.js`, `tests/perf.test.js`: the self-checks, both run by `npm test`.

## Rules that matter for edits

- Keep page components in `src/pages/` and entry files in `src/`. On this case-insensitive Windows filesystem `examples.jsx` and `Examples.jsx` would be the same file, so entry and component names must never collide; the `pages/` directory is the guard.
- Never switch asset URLs to absolute paths. Relative `./assets/...` is what makes the same build work at a domain root and under a GitHub Pages subpath.
- When touching layout metrics (25/50/15, limits), change them in `src/lib/fonts.js` only and let `tests/layout.test.js` expectations follow.
- The supported page must keep deriving from `FONT_SUPPORT`; do not copy the table into markup. Only the "No sprites in any font" note is hardcoded text and must be updated when support changes.
- Keep sprite filenames and `SPECIAL_CHARACTERS` in sync with the `MetalSlugFontReborn` asset repo; the web app has no sprites of its own. `tests/sprites.test.js` enforces this in both directions: after adding or removing any sprite file, run it before trusting the supported lists. Accent glyph numbering is per font (Font 1 E-3 is é, Font 2 E-4 is é); `FONT_SYMBOL_OVERRIDES` exists for exactly that and must stay in sync with the files.
- Color changes go through the `--m3-*` variables only; never hardcode a theme hex in JSX (the color dots in `COLOR_HEX` are sprite-color swatches, not theme colors).
- If a render phase is added or renamed, update `perf.js` phase handling, the Details table columns and `tests/perf.test.js` together.

## Gotchas & quirks

- Solid 1.9 stable is deliberate on this branch: it is the stable-line edition. The Solid 2.0 RC + TypeScript edition is maintained separately at github.com/Mitra-88/MetalSlugFontRebornSolid2 (its Solid 2 gotchas live in that repo AGENTS.md). Do not port RC toolchain changes back here.
- lucide-solid 1.x dropped brand icons, so the GitHub footer link is plain text and the mascot is the bundled webp.
- Do not conditionally mount the preview canvas. `<Show>` around it desynced the ref during the loading overlay and the draw landed on a detached canvas (empty preview at default 300×150). Overlays over an always-mounted canvas are the pattern.
- The floating field label needs its opaque background: it sits on the field border and would show the border line through the text otherwise.
- The textarea is deliberately uncontrolled (no `value` binding): the binding only ever echoed user input back, and writing `.value` during IME composition can cancel CJK input. If you ever need to set the textarea programmatically, guard against `compositionstart`/`compositionend` first.
- Error and empty transitions must clear `warning`, `imgMeta`, `sample` and `errorKind` along with the status; the chips row lives outside the stage overlay, so stale dimensions and profiler numbers would survive an error otherwise. The chips row is rendered only while `imgMeta` is non-empty, and the meta chip has no placeholder value.
- Failed sprite loads (after timeout and retry) are a recoverable state, not a dead end: the error box grows a Try again button (only for the `failed` kind) that calls `resetFailures()` and regenerates. Error kinds exist because unsupported/too-large errors are not retryable.
- The font/color/scale handlers all funnel through the `revalidate` helper (clear debounce, invalidate genId, apply, generate) so no input path can skip the invalidation.
- `preloadIdle` chains are cancelled by target change (`idleTarget`) and deduped per `font|color` (`activeChains`), so switching fonts quickly never stacks background downloads. Keep that invariant if you touch it.
- Theme and palette are applied pre-paint by an inline script in each HTML head (`msfb-theme` and `msfb-palette` in localStorage, falling back to `prefers-color-scheme` and amber); keep the script inline, after the theme-color meta, and before any painted content so there is no flash of the wrong scheme.
- The IAB/Playwright `fill("")` and plain key presses may not edit a textarea in the in-app browser (default text-edit actions don't run). When testing text behavior in automation, set `value` and dispatch an `input` event instead; the app itself handles empty input correctly.
- Font asset directories are `ms-<color>` with colors `blue`, `orange`, `gold`, `yellow`; a color not in `FONT_SUPPORT[font].colors` has no directory, which is why the color chips are re-derived on font switch.
- ponytail: text input has no length cap; oversized outputs are caught by the 16384px hard limit and reported as an error, which covers the pathological cases without buffering logic. If abusive giant texts ever become a real problem, add a max character count at the textarea.

## Where to look things up

`docs-for-agents/` holds a full MDN content snapshot (web API/platform reference), a material-web repo snapshot under `m3_material_docs/`, solid docs under `solid-docs/` and the vite repo under `vite-main/`. For dependency APIs, read the package in `node_modules` directly.

## RTK

RTK (`rtk`) is installed and available on PATH. Use RTK commands whenever an equivalent exists to reduce unnecessary CLI output and context usage.

### Rules

- Prefer `rtk` over the normal command when RTK provides an equivalent.
- Use the normal command when RTK does not provide an appropriate equivalent.
- Do not use RTK if the full/raw output is required for the task.
- Do not run both RTK and the normal command just to compare their output.
- RTK only filters/condenses output; it does not change the underlying command's intended behavior.
- If RTK hides information needed to continue, use `rtk recall` when applicable or run the normal command.

### Common replacements

- `ls` → `rtk ls`
- `tree` → `rtk tree`
- `cat` / file reading → `rtk read`
- `find` → `rtk find`
- `grep` → `rtk grep`
- `rg` → `rtk rg`
- `git ...` → `rtk git ...`
- `gh ...` → `rtk gh ...`
- `curl ...` → `rtk curl ...`
- `wget ...` → `rtk wget ...`

Maven has no RTK equivalent : run `mvn` normally.

### Useful specialized commands

- Use `rtk test` when only test failures/results are needed.
- Use `rtk err` when only errors and warnings are relevant.
- Use `rtk diff` for a compact diff when the full diff is unnecessary.
- Use `rtk json` when inspecting JSON output.
- Use `rtk summary` or `rtk smart` when a concise command summary is useful.

Do not blindly replace every command with RTK; if RTK's filtering could hide information needed to continue, run the normal command.

### On this machine

- ZCode's shell is **Git Bash** (win32), not PowerShell : invoke `rtk` normally, never `.\rtk.exe`.
- Installed at `C:\Program Files\rtk-x86_64-pc-windows-msvc\rtk.exe` and on the persisted user PATH.
- Shell env vars don't persist between Bash calls, so `export PATH=...` won't stick. If plain `rtk` isn't found (e.g. ZCode was launched before the PATH entry was added : inherited env is stale until ZCode restarts), call it by absolute path `"/c/Program Files/rtk-x86_64-pc-windows-msvc/rtk.exe"` or fall back to the normal command.
