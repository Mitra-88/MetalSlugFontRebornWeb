(() => {
    const fontSelect = document.getElementById("font");
    const colorSelect = document.getElementById("color");
    if (!fontSelect || !colorSelect) return;

    const colorMap = {
        1: ["Blue", "Orange", "Gold"],
        2: ["Blue", "Orange", "Gold"],
        3: ["Blue", "Orange"],
        4: ["Blue", "Orange", "Yellow"],
        5: ["Orange"]
    };

    const updateColorOptions = () => {
        colorSelect.innerHTML = (colorMap[fontSelect.value] || [])
            .map(c => `<option value="${c.toLowerCase()}">${c}</option>`)
            .join("");
        colorSelect.dispatchEvent(new Event("change"));
    };

    fontSelect.addEventListener("change", updateColorOptions);
    updateColorOptions();
})();
