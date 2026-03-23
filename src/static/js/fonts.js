document.addEventListener("DOMContentLoaded", function () {
    const fontSelect = document.getElementById("font");
    const colorSelect = document.getElementById("color");

    const colorOptionsMap = new Map([
        ["Blue", "Blue"],
        ["Orange", "Orange"],
        ["Gold", "Gold"],
        ["Yellow", "Yellow"]
    ]);

    const colorMap = new Map([
        ["1", new Set(["Blue", "Orange", "Gold"])],
        ["2", new Set(["Blue", "Orange", "Gold"])],
        ["3", new Set(["Blue", "Orange"])],
        ["4", new Set(["Blue", "Orange", "Yellow"])],
        ["5", new Set(["Orange"])]
    ]);

    if (!fontSelect || !colorSelect) {
        return;
    }

    fontSelect.value = fontSelect.dataset.selected || fontSelect.value;
    updateColorOptions();
    fontSelect.addEventListener("change", updateColorOptions);

    function updateColorOptions() {
        const fontValue = fontSelect.value;
        const colors = colorMap.get(fontValue) || new Set();
        const previousSelection = colorSelect.dataset.selected || colorSelect.value;
        const colorOptions = [...colors].map((color) => {
            const value = color.toLowerCase();
            const text = colorOptionsMap.get(color);
            const selected = previousSelection === value ? " selected" : "";
            return `<option value="${value}"${selected}>${text}</option>`;
        }).join("");

        colorSelect.innerHTML = colorOptions;
        colorSelect.dataset.selected = colorSelect.value;
    }
});

function insertLineBreak() {
    const input = document.getElementById("text-input");
    const cursorPos = input.selectionStart;
    const text = input.value;
    const before = text.substring(0, cursorPos);
    const after = text.substring(cursorPos);
    input.value = before + "\n" + after;
    input.selectionStart = input.selectionEnd = cursorPos + 1;
    input.focus();
}

function toggleLineBreakOptions() {
    const checkbox = document.getElementById("enable-line-breaks");
    const container = document.getElementById("max-words-container");

    if (checkbox.checked) {
        container.style.opacity = "1";
        container.style.pointerEvents = "auto";
    } else {
        container.style.opacity = "0";
        container.style.pointerEvents = "none";
    }
}
