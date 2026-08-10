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
    const SAFE_LIMIT = 8192;
    const HARD_LIMIT = 16384;

    const FONT_SUPPORT = {
        1: {
            colors: ["blue", "orange", "gold"],
            lowerCase: true,
            upperCase: true,
            numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            symbols: [",", "*", "{", "}", "(", ")", "^", ":", "$", "=", "!", ">", "-", "∞", "<", "#", "%", ".", "+", "&", "?", '"', ";", "/", "~", "_", "|", "¥", "⛶", "©", "♥", "▲", "▼", "◀", "▶", "⋆", "★", "☞", "✖"]
        },
        2: {
            colors: ["blue", "orange", "gold"],
            lowerCase: true,
            upperCase: true,
            numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            symbols: [",", "=", "︷", "!", "-", ".", "+", "&", "?", "/", "♪", "✖"]
        },
        3: {
            colors: ["blue", "orange"],
            lowerCase: true,
            upperCase: true,
            numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            symbols: ["'", "{", "}", "(", ")", ":", ",", "=", "!", ">", "-", "<", ".", "+", "?", '"', ";", "/", "_", "|", "¥", "⛶", "©", "♥", "▲", "▼", "◀", "▶", "✖"]
        },
        4: {
            colors: ["blue", "orange", "yellow"],
            lowerCase: true,
            upperCase: true,
            numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            symbols: ["'", "*", "{", "}", "(", ")", "^", ":", "$", "=", "!", ">", "-", "<", "#", "%", ".", "+", "&", "?", '"', ";", "/", "~", "_", "¥", "⛶", "©", "♥", "▲", "▼", "◀", "▶", "✖"]
        },
        5: {
            colors: ["orange"],
            lowerCase: false,
            upperCase: true,
            numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            symbols: ["!", "?"]
        }
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
    const colorSelect = $("color");

    let genId = 0;
    let debounceId = 0;
    let assetsLoaded = 0;
    let totalAssetsToLoad = 0;
    const imgCache = new Map();
    const failedLoads = new Set();
    const loadingImages = new Set();

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

    function isCharSupported(fontId, char) {
        const support = FONT_SUPPORT[fontId];
        if (!support) return false;
        if (char >= "a" && char <= "z") return support.lowerCase;
        if (char >= "A" && char <= "Z") return support.upperCase;
        if (char >= "0" && char <= "9") return support.numbers.includes(parseInt(char, 10));
        return support.symbols.includes(char);
    }

    function getAssetsToPreload(fontId, color) {
        const support = FONT_SUPPORT[fontId];
        if (!support || !support.colors.includes(color)) return [];

        const chars = [];
        if (support.lowerCase)
            for (let i = 97; i <= 122; i++) chars.push(String.fromCharCode(i));
        if (support.upperCase)
            for (let i = 65; i <= 90; i++) chars.push(String.fromCharCode(i));
        for (const n of support.numbers) chars.push(String(n));
        chars.push(...support.symbols);

        return chars.map(c => getCharPath(fontId, color, c)).filter(Boolean);
    }

    function loadImage(src, retries = 1) {
        if (imgCache.has(src)) return Promise.resolve(imgCache.get(src));
        if (failedLoads.has(src)) return Promise.resolve(null);
        return new Promise((resolve) => {
            const img = new Image();
            loadingImages.add(img);
            img.onload = () => {
                imgCache.set(src, img);
                loadingImages.delete(img);
                resolve(img);
            };
            img.onerror = () => {
                loadingImages.delete(img);
                if (retries > 0) {
                    setTimeout(() => resolve(loadImage(src, retries - 1)), 50);
                } else {
                    failedLoads.add(src);
                    resolve(null);
                }
            };
            img.src = src;
        });
    }

    function getImageSync(src) {
        return imgCache.get(src) || null;
    }

    function updateColorOptions(fontId) {
        const support = FONT_SUPPORT[fontId];
        if (!support) return;
        const currentColor = colorSelect.value;

        colorSelect.innerHTML = '';
        support.colors.forEach(color => {
            const option = document.createElement("option");
            option.value = color;
            option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
            colorSelect.appendChild(option);
        });

        if (support.colors.includes(currentColor)) {
            colorSelect.value = currentColor;
        } else {
            colorSelect.value = support.colors[0] || "";
        }
    }

    async function preloadSelectedFontAssets(fontId, color) {
        const paths = getAssetsToPreload(fontId, color);
        if (paths.length === 0) return;

        totalAssetsToLoad = paths.length;
        assetsLoaded = 0;

        if (textInput.value.trim()) {
            setState("loading");
            errorMsgEl.textContent = `Preparing Font ${fontId} (${color})...`;
        }

        const updateProgress = (charPath) => {
            if (!textInput.value.trim()) return;

            let category = "assets";
            if (charPath.includes("lower-case")) category = "lowercase letters";
            else if (charPath.includes("upper-case")) category = "uppercase letters";
            else if (charPath.includes("numbers")) category = "numbers";
            else if (charPath.includes("symbols")) category = "symbols";

            const percent = Math.round((assetsLoaded / totalAssetsToLoad) * 100);
            errorMsgEl.textContent = `Loading font assets... ${percent}% (${assetsLoaded}/${totalAssetsToLoad}) - Fetching ${category}`;
        };

        const concurrencyLimit = 6;
        let index = 0;

        async function worker() {
            while (index < paths.length) {
                const currentIndex = index++;
                const path = paths[currentIndex];

                if (imgCache.has(path) || failedLoads.has(path)) {
                    assetsLoaded++;
                    updateProgress(path);
                    continue;
                }

                await loadImage(path);
                assetsLoaded++;
                updateProgress(path);
            }
        }

        const workers = [];
        for (let i = 0; i < Math.min(concurrencyLimit, paths.length); i++) {
            workers.push(worker());
        }

        await Promise.all(workers);
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

        let unsupportedChar = "";
        for (const line of lines) {
            for (const c of [...line]) {
                if (/\s/.test(c)) continue;
                if (!isCharSupported(font, c)) {
                    unsupportedChar = c;
                    break;
                }
            }
            if (unsupportedChar) break;
        }

        if (unsupportedChar) {
            if (myGen === genId) {
                errorMsgEl.innerHTML = "";
                const span = document.createElement("span");
                span.textContent = `The character '${unsupportedChar}' is not supported in this font. `;
                errorMsgEl.appendChild(span);
                const link = document.createElement("a");
                link.href = "/supported";
                link.textContent = "See supported characters.";
                errorMsgEl.appendChild(link);
                setState("error");
            }
            return;
        }

        let pendingAssets = [];
        for (const line of lines) {
            for (const c of [...line]) {
                if (/\s/.test(c)) continue;
                const path = getCharPath(font, color, c);
                if (path && !getImageSync(path) && !failedLoads.has(path)) {
                    pendingAssets.push(path);
                }
            }
        }

        if (pendingAssets.length > 0) {
            if (myGen === genId) {
                setState("loading");

                const missingChars = pendingAssets.slice(0, 8).map(p => {
                    const file = p.split('/').pop().replace('.png', '');
                    return file.length === 1 ? file : `[${file}]`;
                }).join(', ');

                errorMsgEl.textContent = `Fetching ${pendingAssets.length} specific character(s) needed for your text (e.g., ${missingChars})...`;

                Promise.all(pendingAssets.map(p => loadImage(p))).then(() => {
                    if (myGen === genId) generate();
                });
            }
            return;
        }

        let failedChar = "";
        for (const line of lines) {
            for (const c of [...line]) {
                if (/\s/.test(c)) continue;
                const path = getCharPath(font, color, c);
                if (path && getImageSync(path) === null && failedLoads.has(path)) {
                    failedChar = c;
                    break;
                }
            }
            if (failedChar) break;
        }

        if (failedChar) {
            if (myGen === genId) {
                errorMsgEl.innerHTML = "";
                const span = document.createElement("span");
                span.textContent = `The character '${failedChar}' failed to load. It might be missing from the server. `;
                errorMsgEl.appendChild(span);
                const link = document.createElement("a");
                link.href = "/supported";
                link.textContent = "See supported characters.";
                errorMsgEl.appendChild(link);
                setState("error");
            }
            return;
        }

        const lineData = [];
        let maxWidth = 0,
            totalHeight = 0;

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
                const img = getImageSync(path);

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

            lineData.push({
                chars: charData,
                lineWidth,
                lineHeight
            });
            maxWidth = Math.max(maxWidth, lineWidth);
            totalHeight += lineHeight;
            if (i < lines.length - 1) totalHeight += LINE_SPACING;
        }

        const w = Math.max(1, maxWidth);
        const h = Math.max(1, totalHeight);
        const finalW = w * scale;
        const finalH = h * scale;

        if (finalW > HARD_LIMIT || finalH > HARD_LIMIT) {
            if (myGen === genId) {
                errorMsgEl.textContent = `Output ${finalW}×${finalH}px exceeds the absolute browser limit of ${HARD_LIMIT}px. Please reduce text length or scale.`;
                setState("error");
            }
            return;
        }

        let sizeWarning = "";
        if (finalW > SAFE_LIMIT || finalH > SAFE_LIMIT) {
            sizeWarning = `Warning: Large image (${finalW}×${finalH}px). Rendering may lag or crash on lower-end devices.`;
        }

        if (myGen === genId) {
            errorMsgEl.textContent = sizeWarning || "Rendering image to canvas...";
        }

        canvas.width = finalW;
        canvas.height = finalH;
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
            if (i < lines.length - 1) y += LINE_SPACING;
        }

        imgMeta.textContent = `${finalW} × ${finalH} px`;

        errorMsgEl.textContent = sizeWarning;

        if (myGen === genId) setState("success");
    }

    function download() {
        if (!canvas.width || !canvas.height) return;
        canvas.toBlob(blob => {
            downloadBtn.textContent = "Download Image";
            downloadBtn.disabled = false;

            if (!blob) {
                errorMsgEl.textContent = "Download failed. The image might be too large for the browser to process. Try reducing the scale.";
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

        updateColorOptions(selectedFont);

        if (textInput.value.trim()) {
            setState("loading");
            errorMsgEl.textContent = `Switching to Font ${selectedFont}...`;
        }

        await preloadSelectedFontAssets(selectedFont, $("color").value);
        generate();
    });

    $("color").addEventListener("change", async () => {
        clearTimeout(debounceId);
        if (textInput.value.trim()) {
            setState("loading");
            errorMsgEl.textContent = `Switching color to ${$("color").value}...`;
        }
        await preloadSelectedFontAssets($("font").value, $("color").value);
        generate();
    });

    $("scale").addEventListener("change", () => {
        clearTimeout(debounceId);
        generate();
    });

    (async () => {
        updateColorOptions($("font").value);
        await preloadSelectedFontAssets($("font").value, $("color").value);
        if (textInput.value.trim()) {
            generate();
        }
    })();
})();