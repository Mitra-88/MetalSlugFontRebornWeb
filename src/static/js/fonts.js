document.addEventListener("DOMContentLoaded", () => {
    const fontSelect = document.getElementById("font");
    const colorSelect = document.getElementById("color");

    if (!fontSelect || !colorSelect) return;

    const colorOptionsMap = {
        Blue: "Blue",
        Orange: "Orange",
        Gold: "Gold",
        Yellow: "Yellow"
    };

    const colorMap = {
        1: ["Blue", "Orange", "Gold"],
        2: ["Blue", "Orange", "Gold"],
        3: ["Blue", "Orange"],
        4: ["Blue", "Orange", "Yellow"],
        5: ["Orange"]
    };

    const updateColorOptions = () => {
        const colors = colorMap[fontSelect.value] || [];
        colorSelect.innerHTML = colors.map(color => {
            const value = color.toLowerCase();
            return `<option value="${value}">${colorOptionsMap[color]}</option>`;
        }).join("");
        colorSelect.dispatchEvent(new Event("change"));
    };

    fontSelect.addEventListener("change", updateColorOptions);
    updateColorOptions();
});
