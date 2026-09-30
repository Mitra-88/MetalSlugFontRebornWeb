export const SPECIAL_CHARACTERS = {
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
    "ȧ": "A-1",
    "ä": "A-2",
    "ā": "A-3",
    "á": "A-4",
    "à": "A-5",
    "â": "A-6",
    "ã": "A-7",
    "ė": "E-1",
    "ë": "E-2",
    "é": "E-3",
    "ê": "E-5",
    "í": "I-1",
    "ö": "O-1",
    "ō": "O-2",
    "ó": "O-3",
    "ô": "O-4",
    "õ": "O-5",
    "ü": "U-1",
    "ū": "U-2",
    "ú": "U-3",
    "Ⅰ": "One",
    "Ⅱ": "Two",
    "Ⅲ": "Three",
    "Ⅳ": "Four",
    "Ⅴ": "Five",
};

const FONT_SYMBOL_OVERRIDES = {
    2: { "á": "A-3", "é": "E-4", "ú": "U-4" },
};

export const SPACE_WIDTH = 25;
export const EMPTY_LINE_HEIGHT = 50;
export const LINE_SPACING = 15;
export const SAFE_LIMIT = 8192;
export const HARD_LIMIT = 16384;

export const FONT_SUPPORT = {
    1: {
        colors: ["blue", "orange", "gold"],
        lowerCase: true,
        upperCase: true,
        numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        symbols: [",", "*", "{", "}", "(", ")", "[", "]", "'", "^", ":", "$", "=", "!", ">", "-", "∞", "<", "#", "%", ".", "+", "&", "?", '"', ";", "/", "~", "_", "|", "¥", "⛶", "©", "♥", "▲", "▼", "◀", "▶", "⋆", "★", "☞", "✖", "ȧ", "ä", "ā", "á", "à", "â", "ã", "ė", "ë", "é", "ê", "í", "ö", "ō", "ó", "ô", "õ", "ü", "ū", "ú"]
    },
    2: {
        colors: ["blue", "orange", "gold"],
        lowerCase: true,
        upperCase: true,
        numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        symbols: [",", "=", "︷", "!", "-", ".", "+", "&", "?", "/", "♪", "✖", "ȧ", "ä", "á", "ė", "ë", "é", "ö", "ü", "ū", "ú", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"]
    },
    3: {
        colors: ["blue", "orange"],
        lowerCase: true,
        upperCase: true,
        numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        symbols: ["'", "{", "}", "(", ")", "[", "]", ":", ",", "=", "!", ">", "-", "<", ".", "+", "&", "*", "^", "$", "#", "%", "~", "?", '"', ";", "/", "_", "|", "¥", "⛶", "©", "♥", "▲", "▼", "◀", "▶", "✖"]
    },
    4: {
        colors: ["blue", "orange", "yellow"],
        lowerCase: true,
        upperCase: true,
        numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        symbols: ["'", "*", "{", "}", "(", ")", "[", "]", ",", "^", ":", "$", "=", "!", ">", "-", "<", "#", "%", ".", "+", "&", "?", '"', ";", "/", "~", "_", "|", "¥", "⛶", "©", "♥", "▲", "▼", "◀", "▶", "✖"]
    },
    5: {
        colors: ["orange"],
        lowerCase: false,
        upperCase: true,
        numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        symbols: ["!", "?"]
    }
};

export function getCharPath(font, color, char) {
    if (!isCharSupported(font, char)) return null;
    const base = `./assets/fonts/font-${font}/ms-${color}`;
    if (char >= "a" && char <= "z") return `${base}/letters/lower-case/${char}.png`;
    if (char >= "A" && char <= "Z") return `${base}/letters/upper-case/${char}.png`;
    if (char >= "0" && char <= "9") return `${base}/numbers/${char}.png`;
    const name = FONT_SYMBOL_OVERRIDES[font]?.[char] ?? SPECIAL_CHARACTERS[char];
    return name ? `${base}/symbols/${name}.png` : null;
}

export function isCharSupported(fontId, char) {
    const support = FONT_SUPPORT[fontId];
    if (!support) return false;
    if (char >= "a" && char <= "z") return support.lowerCase;
    if (char >= "A" && char <= "Z") return support.upperCase;
    if (char >= "0" && char <= "9") return support.numbers.includes(parseInt(char, 10));
    return support.symbols.includes(char);
}

export function collectUnsupported(fontId, text) {
    const skipped = [];
    for (const line of text.split("\n")) {
        for (const c of [...line]) {
            if (/\s/.test(c)) continue;
            if (!isCharSupported(fontId, c) && !skipped.includes(c)) skipped.push(c);
        }
    }
    return skipped;
}

export function getTextCharPaths(fontId, color, text) {
    const paths = [];
    for (const line of text.split("\n")) {
        for (const c of [...line]) {
            if (/\s/.test(c)) continue;
            const path = getCharPath(fontId, color, c);
            if (path) paths.push(path);
        }
    }
    return [...new Set(paths)];
}

export function getAssetsToPreload(fontId, color) {
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
