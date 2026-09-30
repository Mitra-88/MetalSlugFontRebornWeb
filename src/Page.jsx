import { For, Show, createSignal, onMount, onCleanup } from "solid-js";
import { ArrowLeft, Check, Moon, Palette, Sun } from "./lib/icons.jsx";

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const COLOR_HEX = {
    blue: "#4d8dff",
    orange: "#ff8c1a",
    gold: "#e8b93b",
    yellow: "#f5d33f",
};

export const PALETTES = [
    { id: "amber", label: "Amber Forge", dot: "#964e00" },
    { id: "verdant", label: "Verdant", dot: "#386a20" },
    { id: "azure", label: "Azure", dot: "#415f91" },
];

const SCHEME_TINTS = {
    amber: ["#fff8f2", "#17120c"],
    verdant: ["#f8faf0", "#11140c"],
    azure: ["#f9f9ff", "#111318"],
};

function applyThemeColorMeta(theme) {
    const palette = document.documentElement.dataset.palette ?? "amber";
    const tint = SCHEME_TINTS[palette]?.[theme === "light" ? 0 : 1];
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tint);
}

export function ColorDot(props) {
    return <span class="color-dot" style={{ background: COLOR_HEX[props.color] ?? "var(--m3-outline)" }} />;
}

function withThemeTransition(apply) {
    const root = document.documentElement;
    root.classList.add("theme-fade");
    apply();
    setTimeout(() => root.classList.remove("theme-fade"), 450);
}

export function ThemeToggle() {
    const [theme, setTheme] = createSignal(document.documentElement.dataset.theme === "light" ? "light" : "dark");

    onMount(() => {
        const scheme = window.matchMedia("(prefers-color-scheme: light)");
        const onChange = (e) => {
            if (localStorage.getItem("msfb-theme")) return;
            const next = e.matches ? "light" : "dark";
            document.documentElement.dataset.theme = next;
            applyThemeColorMeta(next);
            setTheme(next);
        };
        scheme.addEventListener("change", onChange);
        onCleanup(() => scheme.removeEventListener("change", onChange));
    });

    const toggle = () => {
        const next = theme() === "dark" ? "light" : "dark";
        withThemeTransition(() => {
            document.documentElement.dataset.theme = next;
            localStorage.setItem("msfb-theme", next);
            applyThemeColorMeta(next);
        });
        setTheme(next);
    };

    return (
        <button type="button" class="icon-btn" onClick={toggle} aria-label={`Switch to ${theme() === "dark" ? "light" : "dark"} theme`}>
            <Show when={theme() === "dark"} fallback={<Moon size={20} />}>
                <Sun size={20} />
            </Show>
        </button>
    );
}

export function PaletteMenu() {
    const [open, setOpen] = createSignal(false);
    const stored = document.documentElement.dataset.palette ?? "amber";
    const [current, setCurrent] = createSignal(PALETTES.some((p) => p.id === stored) ? stored : "amber");

    const pick = (id) => {
        withThemeTransition(() => {
            if (id === "amber") delete document.documentElement.dataset.palette;
            else document.documentElement.dataset.palette = id;
            localStorage.setItem("msfb-palette", id);
            applyThemeColorMeta(document.documentElement.dataset.theme);
        });
        setCurrent(id);
        setOpen(false);
    };

    return (
        <div class="relative">
            <Show when={open()}>
                <div class="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            </Show>
            <button
                type="button"
                class="icon-btn relative z-50"
                onClick={() => setOpen(!open())}
                aria-label="Choose color scheme"
                aria-expanded={open()}
            >
                <Palette size={20} />
            </button>
            <Show when={open()}>
                <div class="absolute right-0 top-12 z-50 w-48 rounded-xl bg-surface-container p-2 shadow-e2" role="menu">
                    <For each={PALETTES}>
                        {(p) => (
                            <button
                                type="button"
                                role="menuitemradio"
                                aria-checked={current() === p.id}
                                class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body-m text-on-surface transition-colors duration-150 hover:bg-on-surface/10"
                                onClick={() => pick(p.id)}
                            >
                                <span class="color-dot" style={{ background: p.dot }} />
                                {p.label}
                                <Show when={current() === p.id}>
                                    <Check size={16} class="ml-auto text-on-surface-variant" />
                                </Show>
                            </button>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}

export function AppBar(props) {
    return (
        <header class="app-bar">
            <div class="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
                <Show when={props.back} fallback={<img src="./assets/icons/Raubtier.webp" alt="" class="size-9 select-none object-contain" />}>
                    <a href="./index.html" class="icon-btn -ml-2" aria-label="Back to generator">
                        <ArrowLeft size={20} />
                    </a>
                </Show>
                <a href="./index.html" class="text-title-l no-underline outline-offset-4" style={{ color: "var(--m3-on-surface)" }}>
                    Metal Slug Font <span style={{ color: "var(--m3-primary)" }}>Reborn</span>
                </a>
                <div class="ml-auto flex items-center gap-1">
                    {props.actions}
                </div>
            </div>
        </header>
    );
}

export function Page(props) {
    return (
        <div class="flex min-h-dvh flex-col">
            <AppBar back={props.back} actions={props.actions} />
            <main class="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
                {props.children}
            </main>
            <footer class="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
                <div class="flex flex-wrap items-center justify-center gap-1 border-t border-outline-variant pt-6 text-body-m text-on-surface-variant">
                    <For each={props.links}>
                        {(link, i) => (
                            <>
                                <Show when={i() > 0}>
                                    <span class="px-1 opacity-50">·</span>
                                </Show>
                                <a href={link.href} class="footer-link">
                                    {link.label}
                                </a>
                            </>
                        )}
                    </For>
                </div>
                <p class="mt-3 text-center text-body-s text-on-surface-variant">
                    Fan tool for the Metal Slug font sprites. Metal Slug is a trademark of SNK Corporation.
                </p>
            </footer>
        </div>
    );
}
