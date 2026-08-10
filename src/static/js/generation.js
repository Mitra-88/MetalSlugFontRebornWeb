    (() => {
        "use strict";

        const SPECIAL_CHARACTERS = {
            "!": "Exclamation",
            "?": "Question",
            "'": "Apostrophe",
            "*": "Asterisk",
            "(": "Bracket-Left",
            "{": "Bracket-Left-2",
            "[": "Bracket-Left-3",
            ")": "Bracket-Right",
            "}": "Bracket-Right-2",
            "]": "Bracket-Right-3",
            "^": "Caret",
            ":": "Colon",
            "$": "Dollar",
            "=": "Equals",
            ">": "Greater-than",
            "-": "Hyphen",
            "∞": "Infinity",
            "<": "Less-than",
            "#": "Number",
            "%": "Percent",
            ".": "Period",
            "+": "Plus",
            '"': "Quotation",
            ";": "Semicolon",
            "/": "Slash",
            "~": "Tilde",
            "_": "Underscore",
            "|": "Vertical-bar",
            ",": "Comma",
            "&": "Ampersand",
            "♥": "Heart",
            "©": "Copyright",
            "⛶": "Square",
            "◀": "Left",
            "▲": "Up",
            "▶": "Right",
            "▼": "Down",
            "★": "Star",
            "⋆": "Mini-Star",
            "☞": "Hand",
            "¥": "Yen",
            "♪": "Musical-Note",
            "︷": "Up-Arrow",
            "✖": "Cross",
        };

        const SPACE_WIDTH = 25;
        const EMPTY_LINE_HEIGHT = 50;
        const LINE_SPACING = 15;
        const MAX_DIMENSION = 4000;

        const FONTS_MAP = {
            1: ["blue", "orange", "gold"],
            2: ["blue", "orange", "gold"],
            3: ["blue", "orange"],
            4: ["blue", "orange", "yellow"],
            5: ["orange"]
        };

        const $ = id => document.getElementById(id);
        const form = $("form");
        const textInput = $("text-input");
        const output = $("output-section");
        const canvas = $("result-canvas");
        const errorMsgEl = $("error-msg");
        const imgMeta = $("img-meta");
        const downloadBtn = $("download-link");
        const charCount = $("char-count");

        let genId = 0;
        let debounceId = 0;
        const imgCache = new Map();
        const failedLoads = new Set();

        const setState = s => {
            output.dataset.state = s;
        };

        function getCharPath(font, color, char) {
            const base = `./static/assets/fonts/font-${font}/ms-${color}`;
            if (char >= "a" && char <= "z") return `${base}/letters/lower-case/${char}.png`;
            if (char >= "A" && char <= "Z") return `${base}/letters/upper-case/${char}.png`;
            if (char >= "0" && char <= "9") return `${base}/numbers/${char}.png`;
            const name = SPECIAL_CHARACTERS[char];
            return name ? `${base}/symbols/${name}.png` : null;
        }

        function loadImage(src) {
            if (imgCache.has(src)) return Promise.resolve(imgCache.get(src));
            if (failedLoads.has(src)) return Promise.resolve(null);
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    imgCache.set(src, img);
                    resolve(img);
                };
                img.onerror = () => {
                    failedLoads.add(src);
                    resolve(null);
                };
                img.src = src;
            });
        }

        function getImageSync(src) {
            return imgCache.get(src) || null;
        }

        async function preloadSelectedFontAssets(fontId) {
            const colors = FONTS_MAP[fontId];
            if (!colors) return;

            const promises = [];
            const charsToLoad = [];
            for (let i = 97; i <= 122; i++) charsToLoad.push(String.fromCharCode(i));
            for (let i = 65; i <= 90; i++) charsToLoad.push(String.fromCharCode(i));
            for (let i = 48; i <= 57; i++) charsToLoad.push(String.fromCharCode(i));
            for (const key in SPECIAL_CHARACTERS) charsToLoad.push(key);

            for (const color of colors) {
                for (const char of charsToLoad) {
                    const path = getCharPath(fontId, color, char);
                    if (path) promises.push(loadImage(path));
                }
            }

            await Promise.all(promises);
        }

        function generate() {
            const myGen = ++genId;
            const raw = textInput.value;

            if (!raw.trim()) {
                if (myGen === genId) {
                    setState("idle");
                    canvas.width = 0;
                    canvas.height = 0;
                }
                return;
            }

            const font = $("font").value;
            const color = $("color").value;
            const scale = parseInt($("scale").value, 10);
            const text = font === "5" ? raw.toUpperCase() : raw;

            const lines = text.split("\n");
            const lineData = [];
            let maxWidth = 0,
                totalHeight = 0;
            let hasError = false;
            let errorMsg = "";
            let unsupportedChar = "";

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) {
                    lineData.push({
                        empty: true,
                        height: EMPTY_LINE_HEIGHT
                    });
                    totalHeight += EMPTY_LINE_HEIGHT;
                    if (i < lines.length - 1) totalHeight += LINE_SPACING;
                    continue;
                }

                const chars = [...line];
                let lineWidth = 0,
                    lineHeight = 0;
                const charData = [];

                for (const c of chars) {
                    if (/\s/.test(c)) {
                        charData.push({
                            space: true,
                            width: SPACE_WIDTH
                        });
                        lineWidth += SPACE_WIDTH;
                        continue;
                    }

                    const path = getCharPath(font, color, c);
                    if (!path) {
                        hasError = true;
                        errorMsg = `The character '${c}' is not supported.`;
                        unsupportedChar = c;
                        break;
                    }

                    const img = getImageSync(path);
                    if (!img) {
                        hasError = true;
                        errorMsg = `Loading assets... please wait.`;
                        loadImage(path).then(() => generate());
                        break;
                    }

                    const w = img.naturalWidth;
                    const h = img.naturalHeight;
                    charData.push({
                        img,
                        width: w,
                        height: h
                    });
                    lineWidth += w;
                    lineHeight = Math.max(lineHeight, h);
                }

                if (hasError) break;

                lineData.push({
                    chars: charData,
                    lineWidth,
                    lineHeight
                });
                maxWidth = Math.max(maxWidth, lineWidth);
                totalHeight += lineHeight;
                if (i < lines.length - 1) totalHeight += LINE_SPACING;
            }

            if (hasError) {
                if (myGen === genId) {
                    errorMsgEl.innerHTML = "";
                    const span = document.createElement("span");
                    span.textContent = errorMsg + " ";
                    errorMsgEl.appendChild(span);

                    if (unsupportedChar) {
                        const link = document.createElement("a");
                        link.href = "/supported";
                        link.textContent = "See supported characters.";
                        errorMsgEl.appendChild(link);
                    }
                    setState("error");
                }
                return;
            }

            const w = Math.max(1, maxWidth);
            const h = Math.max(1, totalHeight);

            if (w * scale > MAX_DIMENSION || h * scale > MAX_DIMENSION) {
                if (myGen === genId) {
                    errorMsgEl.textContent = `Output ${w * scale}×${h * scale}px exceeds the ${MAX_DIMENSION}×${MAX_DIMENSION}px limit. Reduce text length or scale.`;
                    setState("error");
                }
                return;
            }

            canvas.width = w * scale;
            canvas.height = h * scale;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            if (scale !== 1) ctx.scale(scale, scale);
            ctx.clearRect(0, 0, w, h);

            let y = 0;
            for (let i = 0; i < lineData.length; i++) {
                const ld = lineData[i];
                if (ld.empty) {
                    y += ld.height;
                } else {
                    let x = 0;
                    for (const c of ld.chars) {
                        if (!c.space) {
                            ctx.drawImage(c.img, x, y + ld.lineHeight - c.height);
                        }
                        x += c.width;
                    }
                    y += ld.lineHeight;
                }
                if (i < lineData.length - 1) y += LINE_SPACING;
            }

            imgMeta.textContent = `${w * scale} × ${h * scale} px`;
            if (myGen === genId) setState("success");
        }

        function download() {
            if (!canvas.width || !canvas.height) return;

            downloadBtn.textContent = "Preparing…";
            downloadBtn.disabled = true;

            canvas.toBlob(blob => {
                downloadBtn.textContent = "Download Image";
                downloadBtn.disabled = false;

                if (!blob) {
                    errorMsgEl.textContent = "Download failed. Try again.";
                    setState("error");
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

        form.addEventListener("submit", e => e.preventDefault());
        downloadBtn.addEventListener("click", download);

        textInput.addEventListener("input", () => {
            charCount.textContent = `${textInput.value.length} characters`;
            clearTimeout(debounceId);
            if (!textInput.value.trim()) {
                setState("idle");
                canvas.width = 0;
                canvas.height = 0;
                return;
            }
            debounceId = setTimeout(generate, 50);
        });

        $("font").addEventListener("change", async () => {
            clearTimeout(debounceId);
            const selectedFont = $("font").value;

            if (textInput.value.trim()) {
                setState("loading");
            }

            await preloadSelectedFontAssets(selectedFont);
            generate();
        });

        for (const id of ["color", "scale"]) {
            $(id).addEventListener("change", () => {
                clearTimeout(debounceId);
                generate();
            });
        }

        (async () => {
            await preloadSelectedFontAssets($("font").value);
            if (textInput.value.trim()) {
                generate();
            }
        })();
    })();