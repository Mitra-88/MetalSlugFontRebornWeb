# MetalSlugFontRebornWeb

Web app version of [MetalSlugFontReborn](https://github.com/Mitra-88/MetalSlugFontReborn). _This branch reimplements it to run entirely client-side, rebuilt with Solid.js, Vite and Tailwind CSS, styled after Material Design 3_

## 🚀 Demo

Visit the live instance: [https://vermeil.pythonanywhere.com](https://vermeil.pythonanywhere.com) or [https://metalslugfontrebornweb.mitra88dev.workers.dev/](https://metalslugfontrebornweb.mitra88dev.workers.dev/)

## ✨ Highlights

- Live canvas rendering: type text, pick a font variant, color and scale, download the PNG. Characters a font cannot draw are skipped automatically with a clear notice, and the rest still renders.
- Reliable by design: sprite loads have timeouts and automatic retries, failures offer a one-click retry, and the character support lists are machine-verified against the sprite files on every test run.
- Material 3 design system hand-rolled with Tailwind tokens: three seed palettes (Amber Forge, Verdant, Azure) each with full light and dark schemes, M3 color roles, type scale, shape and expressive spring motion.
- Fast by construction: sprites decode once into GPU bitmaps via `createImageBitmap`, layouts are memoized per text, the rest of the font warms up during idle time, and a built-in sampling profiler shows render phase timings (load, layout, draw) with p50/p95 stats right in the preview panel.
- Adaptive layout for desktop and mobile, no router, no server, ~18 KB gzipped of app code and CSS.

## 🌿 Branches

- `rewrite/solid-vite` — Solid 1.9, plain JavaScript. Stable line (this branch).
- The Solid 2 (TypeScript) edition has moved to its own repository: [MetalSlugFontRebornSolid2](https://github.com/Mitra-88/MetalSlugFontRebornSolid2).

The Material 3 UI, profiler and feature set are identical in both.

## 📁 Project Structure

```
├── index.html            # Main generator page
├── examples.html         # Font examples gallery
├── supported.html        # Character support reference
├── public/
│   └── assets/
│       ├── examples/     # Example images
│       ├── fonts/        # Character sprite assets (5 fonts, various colors)
│       └── icons/        # App icons and favicon
├── src/
│   ├── lib/
│   │   ├── fonts.js      # Font metadata, character mapping, path builder
│   │   ├── render.js     # Bitmap cache, idle preloading, layout memo, canvas drawing
│   │   └── perf.js       # Sampling profiler for the render pipeline
│   ├── pages/
│   │   ├── Generator.jsx # Controls, live preview, profiler panel, download
│   │   ├── Examples.jsx
│   │   └── Supported.jsx
│   ├── Page.jsx          # App bar, page shell, theme toggle
│   ├── index.css         # Material 3 design system (Tailwind v4 tokens)
│   └── *.jsx             # Entry points per page
└── tests/
    ├── layout.test.js    # Self-check for layout and character logic
    └── perf.test.js      # Profiler math + layout benchmark
```

## 🔧 Installation

### Prerequisites

- Node.js 20.19+ or 22.12+

### Setup

```
git clone https://github.com/Mitra-88/MetalSlugFontRebornWeb.git
cd MetalSlugFontRebornWeb
npm install
```

### Develop

```
npm run dev
```

### Build and preview

```
npm run build
npm run preview
```

The build outputs static HTML/JS/CSS into `dist/` with relative paths, ready to drop onto GitHub Pages, Netlify, Cloudflare Workers or any static host (or bundle into a Tauri shell).

### Self-checks

```
npm test
```

## 📄 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
