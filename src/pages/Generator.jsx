import { For, Show, createMemo, createSignal, onMount } from "solid-js";
import { Activity, Check, ChevronDown, Download, Image, Info, TriangleAlert } from "../lib/icons.jsx";
import { COLOR_HEX, Page, PaletteMenu, ThemeToggle } from "./../Page.jsx";
import { FONT_SUPPORT, HARD_LIMIT, collectUnsupported } from "../lib/fonts.js";
import {
    getMissingPaths,
    loadImage,
    preloadIdle,
    renderToCanvas,
    resetFailures,
} from "../lib/render.js";
import * as perf from "../lib/perf.js";

const FONTS = ["1", "2", "3", "4", "5"];
const SCALES = [
    { value: 1, label: "1×" },
    { value: 2, label: "2×" },
    { value: 3, label: "3×" },
    { value: 4, label: "4×" },
];

function Segmented(props) {
    const index = () => Math.max(0, props.options.findIndex((o) => o.value === props.value));
    return (
        <div class="m3-seg bg-surface-highest" role="radiogroup" aria-label={props.label}>
            <div
                class="m3-seg-thumb"
                style={{ width: `${100 / props.options.length}%`, transform: `translateX(${index() * 100}%)` }}
            />
            <For each={props.options}>
                {(o) => (
                    <button
                        type="button"
                        role="radio"
                        aria-checked={o.value === props.value}
                        class="m3-seg-btn"
                        classList={{ selected: o.value === props.value }}
                        onClick={() => props.onChange(o.value)}
                    >
                        <Show when={o.value === props.value}>
                            <Check size={15} class="pop-in" />
                        </Show>
                        <span class="truncate">{o.label}</span>
                    </button>
                )}
            </For>
        </div>
    );
}

function ColorChips(props) {
    return (
        <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
            <For each={props.options}>
                {(c) => (
                    <button
                        type="button"
                        role="radio"
                        aria-checked={c === props.value}
                        class="m3-chip"
                        classList={{ selected: c === props.value }}
                        onClick={() => props.onChange(c)}
                    >
                        <span class="color-dot" style={{ background: COLOR_HEX[c] }} />
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                        <Show when={c === props.value}>
                            <Check size={14} class="pop-in" />
                        </Show>
                    </button>
                )}
            </For>
        </div>
    );
}

function FieldLabel(props) {
    return <p class="mb-2 text-label-m text-on-surface-variant">{props.children}</p>;
}

const SETTINGS_KEY = "msfb-settings";

function loadSettings() {
    try {
        const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (!parsed || typeof parsed !== "object") return {};
        const font = ["1", "2", "3", "4", "5"].includes(parsed.font) ? parsed.font : "1";
        const colors = FONT_SUPPORT[font].colors;
        return {
            font,
            color: colors.includes(parsed.color) ? parsed.color : colors[0],
            scale: [1, 2, 3, 4].includes(parsed.scale) ? parsed.scale : 1,
        };
    } catch {
        return {};
    }
}

export default function Generator() {
    const saved = loadSettings();
    const [text, setText] = createSignal("");
    const [font, setFont] = createSignal(saved.font ?? "1");
    const [color, setColor] = createSignal(saved.color ?? "blue");
    const [scale, setScale] = createSignal(saved.scale ?? 1);
    const [status, setStatus] = createSignal("idle");
    const [errorMsg, setErrorMsg] = createSignal("");
    const [errorLink, setErrorLink] = createSignal(false);
    const [errorKind, setErrorKind] = createSignal("");
    const [warning, setWarning] = createSignal("");
    const [imgMeta, setImgMeta] = createSignal("");
    const [sample, setSample] = createSignal(null);
    const [showPerf, setShowPerf] = createSignal(false);
    const [loadingCount, setLoadingCount] = createSignal(0);
    const [skipped, setSkipped] = createSignal([]);

    let canvas;
    let genId = 0;
    let debounceId = 0;

    const fontColors = createMemo(() => FONT_SUPPORT[font()].colors);
    const perfStats = createMemo(() => (sample() ? perf.stats() : null));
    const recentSamples = createMemo(() => (sample() ? perf.samples().slice(-5) : []));

    const fail = (msg, link, kind = "") => {
        setErrorMsg(msg);
        setErrorLink(link);
        setErrorKind(kind);
        setWarning("");
        setSkipped([]);
        setImgMeta("");
        setSample(null);
        setStatus("error");
    };

    const clearCanvas = () => {
        canvas.width = 0;
        canvas.height = 0;
    };

    async function generate(loadBefore = 0) {
        const id = ++genId;
        const raw = text();
        if (!raw.trim()) {
            setStatus("idle");
            setErrorMsg("");
            setErrorKind("");
            setWarning("");
            setSkipped([]);
            setSample(null);
            clearCanvas();
            return;
        }

        const f = font();
        const processed = f === "5" ? raw.toUpperCase() : raw;
        const started = performance.now();

        const missing = getMissingPaths(f, color(), processed);
        if (missing.length > 0) {
            if (id !== genId) return;
            setLoadingCount(missing.length);
            setStatus("loading");
            await Promise.all(missing.map((p) => loadImage(p)));
            if (id !== genId) return;
            return generate(loadBefore + (performance.now() - started));
        }

        const res = renderToCanvas(canvas, { font: f, color: color(), text: processed, scale: scale() });
        if (id !== genId) return;

        if (res.error === "failed") {
            fail(`The character '${res.char}' failed to load, so it cannot be drawn. `, true, "failed");
        } else if (res.error === "empty") {
            fail("None of these characters can be drawn with this font. ", true, "empty");
        } else if (res.error === "too-large") {
            fail(`Output ${res.width}×${res.height}px exceeds the absolute browser limit of ${HARD_LIMIT}px. Please reduce text length or scale.`, false, "too-large");
        } else {
            setErrorKind("");
            setImgMeta(`${res.width} × ${res.height} px`);
            setWarning(res.warning);
            setSkipped(collectUnsupported(f, processed));
            setStatus("success");
            if (res.sample) {
                res.sample.phases.load = loadBefore;
                setSample({ ...res.sample, phases: { ...res.sample.phases } });
            }
            preloadIdle(f, color());
            if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                canvas.animate?.(
                    [{ opacity: 0.35, transform: "scale(0.985)" }, { opacity: 1, transform: "scale(1)" }],
                    { duration: 200, easing: "cubic-bezier(0.05, 0.7, 0.1, 1)" }
                );
            }
        }
    }

    function onTextInput(e) {
        setText(e.currentTarget.value);
        clearTimeout(debounceId);
        if (!text().trim()) {
            genId++;
            setStatus("idle");
            setErrorMsg("");
            setErrorKind("");
            setWarning("");
            setSkipped([]);
            setSample(null);
            clearCanvas();
            return;
        }
        debounceId = setTimeout(() => generate(), 50);
    }

    function saveSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ font: font(), color: color(), scale: scale() }));
    }

    const revalidate = (apply) => {
        clearTimeout(debounceId);
        genId++;
        apply();
        saveSettings();
        generate();
    };

    function onFontChange(f) {
        revalidate(() => {
            setFont(f);
            const colors = FONT_SUPPORT[f].colors;
            const nextColor = colors.includes(color()) ? color() : colors[0];
            setColor(nextColor);
            preloadIdle(f, nextColor);
        });
    }

    function onColorChange(c) {
        revalidate(() => {
            setColor(c);
            preloadIdle(font(), c);
        });
    }

    function onScaleChange(s) {
        revalidate(() => setScale(s));
    }

    function retryFailed() {
        resetFailures();
        generate();
    }

    onMount(() => {
        preloadIdle(font(), color());
    });

    function download() {
        if (!canvas.width || !canvas.height) return;
        canvas.toBlob((blob) => {
            if (!blob) {
                fail("Download failed. The image might be too large for the browser to process. Try reducing the scale.", false);
                return;
            }
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement("a"), {
                href: url,
                download: "metal-slug-generated.png",
            });
            a.click();
            URL.revokeObjectURL(url);
        }, "image/png");
    }

    const cacheHitPct = () => {
        const s = sample();
        if (!s || !s.sprites) return 100;
        return Math.round((s.cacheHits / Math.max(1, s.sprites)) * 100);
    };

    return (
        <Page
            actions={
                <>
                    <PaletteMenu />
                    <ThemeToggle />
                </>
            }
            links={[
                { href: "./supported.html", label: "Supported characters" },
                { href: "./examples.html", label: "Browse examples" },
                { href: "https://github.com/Mitra-88/MetalSlugFontRebornWeb", label: "GitHub" },
            ]}
        >
            <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[400px_1fr]">
                <section class="rise-in card p-5 sm:p-6">
                    <h1 class="text-headline-s">Forge pixel text</h1>
                    <p class="mt-1 text-body-m text-on-surface-variant">
                        Type anything and watch it render live with the classic Metal Slug arcade sprites.
                    </p>

                    <div class="mt-5 flex flex-col gap-5">
                        <div class="m3-field" data-empty={text() === ""}>
                            <textarea id="text-input" placeholder=" " required value={text()} onInput={onTextInput} />
                            <label for="text-input">Your text</label>
                            <span class="char-count" aria-live="polite">{text().length} characters</span>
                        </div>

                        <div>
                            <FieldLabel>Font variant</FieldLabel>
                            <Segmented
                                label="Font variant"
                                options={FONTS.map((n) => ({ value: n, label: `Font ${n}` }))}
                                value={font()}
                                onChange={onFontChange}
                            />
                        </div>

                        <div>
                            <FieldLabel>Color</FieldLabel>
                            <ColorChips options={fontColors()} value={color()} onChange={onColorChange} />
                        </div>

                        <div>
                            <FieldLabel>Output scale</FieldLabel>
                            <Segmented label="Output scale" options={SCALES} value={scale()} onChange={onScaleChange} />
                        </div>
                    </div>
                </section>

                <section class="rise-in card p-5 sm:p-6" style={{ "animation-delay": "80ms" }}>
                    <div class="flex items-center justify-between gap-3">
                        <h2 class="text-title-m">Preview</h2>
                        <span
                            class="state-chip"
                            aria-live="polite"
                            classList={{
                                success: status() === "success",
                                loading: status() === "loading",
                                error: status() === "error",
                                idle: status() === "idle",
                            }}
                        >
                            {status() === "success" && "Ready"}
                            {status() === "loading" && "Rendering"}
                            {status() === "error" && "Error"}
                            {status() === "idle" && "Waiting"}
                        </span>
                    </div>

                    <div class="stage relative mt-4 grid min-h-[260px] place-items-center overflow-hidden p-4 sm:min-h-[300px]" aria-busy={status() === "loading"}>
                        <canvas
                            ref={canvas}
                            class="pixelated relative z-10 max-h-[360px] max-w-full object-contain"
                            classList={{ invisible: status() === "error" }}
                            role="img"
                            aria-label={`Rendered preview: ${text() || "nothing yet"}`}
                        />
                        <Show when={status() === "loading"}>
                            <div class="stage-overlay absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-surface-lowest/85 text-on-surface-variant">
                                <div class="m3-progress" />
                                <p class="text-body-m">
                                    Fetching {loadingCount()} sprite{loadingCount() === 1 ? "" : "s"}
                                </p>
                            </div>
                        </Show>
                        <Show when={status() === "idle"}>
                            <div class="stage-overlay absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-center text-on-surface-variant">
                                <div class="flex size-14 items-center justify-center rounded-2xl bg-surface-container">
                                    <Image size={24} />
                                </div>
                                <p class="text-body-m">
                                    Nothing here yet
                                    <br />
                                    <span class="text-body-s">Type on the left and the preview paints itself.</span>
                                </p>
                            </div>
                        </Show>
                        <Show when={status() === "error"}>
                            <div class="stage-overlay absolute inset-0 z-20 flex items-center justify-center bg-surface-lowest/85 p-4">
                                <div class="error-box max-w-md" role="alert">
                                    <span class="mr-1 inline-flex align-[-3px]">
                                        <TriangleAlert size={18} />
                                    </span>
                                    {errorMsg()}
                                    <Show when={errorLink()}>
                                        <a href="./supported.html">See supported characters</a>
                                    </Show>
                                    <Show when={errorKind() === "failed"}>
                                        {" "}
                                        <button
                                            type="button"
                                            class="cursor-pointer border-none bg-transparent p-0 font-semibold text-inherit underline underline-offset-2"
                                            onClick={retryFailed}
                                        >
                                            Try again
                                        </button>
                                    </Show>
                                </div>
                            </div>
                        </Show>
                    </div>

                    <Show when={warning()}>
                        <p class="rise-in mt-3 rounded-lg bg-primary-container px-3 py-2 text-body-s text-on-primary-container">{warning()}</p>
                    </Show>

                    <Show when={skipped().length > 0}>
                        <p class="rise-in mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-secondary-container px-3 py-2 text-body-s text-on-secondary-container">
                            <Info size={14} class="shrink-0" />
                            <span>
                                Skipped {skipped().length} unsupported {skipped().length === 1 ? "character" : "characters"}:
                                <span class="mono font-semibold"> {skipped().join("  ")}</span>
                            </span>
                            <a href="./supported.html" class="ml-auto font-semibold underline underline-offset-2">
                                See what is supported
                            </a>
                        </p>
                    </Show>

                    <Show when={imgMeta()}>
                        <div class="rise-in mt-4 flex flex-wrap items-center gap-2">
                            <span class="chip-static mono">{imgMeta()}</span>
                            <Show when={sample()}>
                                <span class="chip-static mono">
                                    <Activity size={13} />
                                    {sample().total.toFixed(1)} ms
                                </span>
                                <span class="chip-static mono">{sample().sprites} {sample().sprites === 1 ? "sprite" : "sprites"}</span>
                                <span class="chip-static mono">{cacheHitPct()}% cached</span>
                                <button type="button" class="m3-chip" onClick={() => setShowPerf(!showPerf())} aria-expanded={showPerf()}>
                                    Details
                                    <ChevronDown size={14} class="transition-transform duration-300" classList={{ "rotate-180": showPerf() }} />
                                </button>
                            </Show>
                        </div>
                    </Show>

                    <Show when={showPerf() && perfStats()}>
                        <div class="rise-in mt-3 overflow-x-auto rounded-xl border border-outline-variant">
                            <table class="mono w-full min-w-[340px] text-left text-body-s text-on-surface-variant">
                                <thead class="bg-surface-container text-label-s">
                                    <tr>
                                        <th class="px-3 py-2 font-semibold">run</th>
                                        <th class="px-3 py-2 font-semibold">load</th>
                                        <th class="px-3 py-2 font-semibold">layout</th>
                                        <th class="px-3 py-2 font-semibold">draw</th>
                                        <th class="px-3 py-2 font-semibold">total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <For each={recentSamples()}>
                                        {(s, i) => (
                                            <tr classList={{ "bg-surface-container-low": i() % 2 === 0 }}>
                                                <td class="px-3 py-1.5">{Math.max(1, perf.stats().count - recentSamples().length + i() + 1)}</td>
                                                <td class="px-3 py-1.5">{(s.phases.load ?? 0).toFixed(1)}</td>
                                                <td class="px-3 py-1.5">{(s.phases.layout ?? 0).toFixed(2)}</td>
                                                <td class="px-3 py-1.5">{(s.phases.draw ?? 0).toFixed(2)}</td>
                                                <td class="px-3 py-1.5 text-on-surface">{s.total.toFixed(2)}</td>
                                            </tr>
                                        )}
                                    </For>
                                    <tr class="bg-surface-high text-on-surface">
                                        <td class="px-3 py-1.5 font-semibold">p95</td>
                                        <td class="px-3 py-1.5">{(perfStats().phases.load?.p95 ?? 0).toFixed(1)}</td>
                                        <td class="px-3 py-1.5">{(perfStats().phases.layout?.p95 ?? 0).toFixed(2)}</td>
                                        <td class="px-3 py-1.5">{(perfStats().phases.draw?.p95 ?? 0).toFixed(2)}</td>
                                        <td class="px-3 py-1.5">{perfStats().p95.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p class="mt-2 text-body-s text-on-surface-variant">
                            Last {perfStats().count} renders sampled. Sprites decode once into GPU bitmaps and layouts are memoized per text.
                        </p>
                    </Show>

                    <button type="button" class="btn btn-filled mt-4 w-full" onClick={download} disabled={status() !== "success"}>
                        <Download size={18} />
                        Download PNG
                    </button>
                </section>
            </div>
        </Page>
    );
}
