import * as perf from "./perf.js";
import {
    EMPTY_LINE_HEIGHT,
    HARD_LIMIT,
    LINE_SPACING,
    SAFE_LIMIT,
    SPACE_WIDTH,
    getAssetsToPreload,
    getCharPath,
    getTextCharPaths,
} from "./fonts.js";

const imgCache = new Map();
const failedLoads = new Set();
const layoutMemo = new Map();
const LAYOUT_MEMO_CAP = 48;

async function decode(img) {
    if (typeof createImageBitmap === "function") {
        try {
            return await createImageBitmap(img);
        } catch {
            return img;
        }
    }
    return img;
}

function getImage(path) {
    return imgCache.get(path) ?? null;
}

const LOAD_TIMEOUT = 8000;

export function loadImage(path, retries = 1) {
    if (imgCache.has(path)) return Promise.resolve(imgCache.get(path));
    if (failedLoads.has(path)) return Promise.resolve(null);
    return new Promise((resolve) => {
        const img = new Image();
        let settled = false;
        const timer = setTimeout(() => settle(false), LOAD_TIMEOUT);
        const settle = async (ok) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (!ok) {
                if (retries > 0) setTimeout(() => resolve(loadImage(path, retries - 1)), 50);
                else {
                    failedLoads.add(path);
                    resolve(null);
                }
                return;
            }
            failedLoads.delete(path);
            const drawable = await decode(img);
            const entry = { drawable, w: drawable.width, h: drawable.height };
            imgCache.set(path, entry);
            resolve(entry);
        };
        img.onload = () => settle(true);
        img.onerror = () => settle(false);
        img.src = path;
    });
}

export function resetFailures() {
    failedLoads.clear();
}

export function getMissingPaths(font, color, text) {
    return getTextCharPaths(font, color, text).filter(
        (path) => !imgCache.has(path) && !failedLoads.has(path)
    );
}

const idleTarget = { id: "" };
const activeChains = new Set();

export function preloadIdle(fontId, color, batch = 10) {
    const paths = getAssetsToPreload(fontId, color).filter((p) => !imgCache.has(p));
    if (paths.length === 0) return;

    const target = `${fontId}|${color}`;
    idleTarget.id = target;
    if (activeChains.has(target)) return;
    activeChains.add(target);

    let cursor = 0;
    const idle = (callback) =>
        typeof requestIdleCallback === "function"
            ? requestIdleCallback(callback, { timeout: 1200 })
            : setTimeout(() => callback(false), 32);

    const step = () => {
        if (idleTarget.id !== target) {
            activeChains.delete(target);
            return;
        }
        let loaded = 0;
        while (cursor < paths.length && loaded < batch) {
            loadImage(paths[cursor++]);
            loaded++;
        }
        if (cursor < paths.length) idle(step);
        else activeChains.delete(target);
    };
    idle(step);
}

export function computeLayout(lines, getImage, font, color) {
    const lineData = [];
    let maxWidth = 0;
    let totalHeight = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            lineData.push({ empty: true, height: EMPTY_LINE_HEIGHT });
            totalHeight += EMPTY_LINE_HEIGHT;
            if (i < lines.length - 1) totalHeight += LINE_SPACING;
            continue;
        }

        let lineWidth = 0;
        let lineHeight = 0;
        const charData = [];

        for (const c of [...line]) {
            if (/\s/.test(c)) {
                charData.push({ space: true, width: SPACE_WIDTH });
                lineWidth += SPACE_WIDTH;
                continue;
            }
            const path = getCharPath(font, color, c);
            if (!path) continue;
            const entry = getImage(path);
            if (!entry) return null;
            charData.push({ sprite: entry, width: entry.w, height: entry.h });
            lineWidth += entry.w;
            lineHeight = Math.max(lineHeight, entry.h);
        }

        lineData.push({ chars: charData, lineWidth, lineHeight });
        maxWidth = Math.max(maxWidth, lineWidth);
        totalHeight += lineHeight;
        if (i < lines.length - 1) totalHeight += LINE_SPACING;
    }

    return { lines: lineData, width: maxWidth, height: totalHeight };
}

export function getLayout(font, color, text, getImageFn = getImage) {
    const key = `${font}|${color}|${text}`;
    if (layoutMemo.has(key)) {
        const cached = layoutMemo.get(key);
        layoutMemo.delete(key);
        layoutMemo.set(key, cached);
        return cached;
    }
    const layout = computeLayout(text.split("\n"), getImageFn, font, color);
    if (layout === null) return null;
    if (layoutMemo.size >= LAYOUT_MEMO_CAP) {
        layoutMemo.delete(layoutMemo.keys().next().value);
    }
    layoutMemo.set(key, layout);
    return layout;
}

export function drawLayout(canvas, layout, scale) {
    const w = Math.max(1, layout.width);
    const h = Math.max(1, layout.height);

    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    if (scale !== 1) ctx.scale(scale, scale);

    let y = 0;
    for (let i = 0; i < layout.lines.length; i++) {
        const ld = layout.lines[i];
        if (ld.empty) {
            y += ld.height;
        } else {
            let x = 0;
            for (const c of ld.chars) {
                if (!c.space) ctx.drawImage(c.sprite.drawable, x, y + ld.lineHeight - c.height);
                x += c.width;
            }
            y += ld.lineHeight;
        }
        if (i < layout.lines.length - 1) y += LINE_SPACING;
    }
}

export function renderToCanvas(canvas, { font, color, text, scale }) {
    const token = perf.begin({ font, color, scale, chars: [...text].length });

    const lines = text.split("\n");
    let failedChar = "";
    outer: for (const line of lines) {
        for (const c of [...line]) {
            if (/\s/.test(c)) continue;
            const path = getCharPath(font, color, c);
            if (path && !imgCache.has(path) && failedLoads.has(path)) {
                failedChar = c;
                break outer;
            }
        }
    }
    if (failedChar) {
        perf.cancel(token);
        return { error: "failed", char: failedChar };
    }

    const layout = getLayout(font, color, text);
    if (layout === null) {
        perf.cancel(token);
        return { error: "failed", char: text[0] ?? "" };
    }
    if (layout.width === 0) {
        perf.cancel(token);
        return { error: "empty" };
    }
    perf.mark(token, "layout");

    const finalW = Math.max(1, layout.width) * scale;
    const finalH = Math.max(1, layout.height) * scale;

    if (finalW > HARD_LIMIT || finalH > HARD_LIMIT) {
        perf.cancel(token);
        return { error: "too-large", width: finalW, height: finalH };
    }

    drawLayout(canvas, layout, scale);

    let warning = "";
    if (finalW > SAFE_LIMIT || finalH > SAFE_LIMIT) {
        warning = `Warning: Large image (${finalW}×${finalH}px). Rendering may lag or crash on lower-end devices.`;
    }

    const usedPaths = getTextCharPaths(font, color, text);
    const sample = perf.end(token, {
        sprites: usedPaths.length,
        cacheHits: usedPaths.filter((p) => imgCache.has(p)).length,
    });
    return { width: finalW, height: finalH, warning, sample };
}
