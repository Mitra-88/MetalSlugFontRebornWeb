import io
from pathlib import Path
from functools import lru_cache
from PIL import Image
from special_characters import special_characters

Image.MAX_IMAGE_PIXELS = 16_000_000  # 4000×4000

TRANSPARENT_COLOR = (0, 0, 0, 0)
IMAGE_MODE = "RGBA"

SPACE_CHARACTER_WIDTH = 25
SPACE_CHARACTER_HEIGHT = 1
EMPTY_LINE_HEIGHT = 50
LINE_SPACING = 15

MAX_DIMENSION = 4000


def get_font_paths(font, color):
    base = Path("src/static/assets/fonts") / f"font-{font}" / f"ms-{color}"
    return {
        "letters": base / "letters",
        "numbers": base / "numbers",
        "symbols": base / "symbols",
    }


@lru_cache(maxsize=512)
def load_image_cached(path):
    if path and Path(path).is_file():
        return Image.open(path).convert("RGBA")
    return None


def create_character_image(character, font, color):
    if character.isspace():
        return Image.new(IMAGE_MODE, (SPACE_CHARACTER_WIDTH, SPACE_CHARACTER_HEIGHT), TRANSPARENT_COLOR)

    base = get_font_paths(font, color)
    if character.islower():
        path = base["letters"] / "lower-case" / f"{character}.png"
    elif character.isupper():
        path = base["letters"] / "upper-case" / f"{character}.png"
    elif character.isdigit():
        path = base["numbers"] / f"{character}.png"
    else:
        path = base["symbols"] / f"{special_characters.get(character, '')}.png"

    img = load_image_cached(path)
    if img is None:
        raise FileNotFoundError(f"The character '{character}' is not supported.")
    return img


def generate_image(text, font, color, scale=1, compress_level=6):
    lines = text.split("\n")

    unique_chars = set(text) - {"\n"}
    char_images = {c: create_character_image(c, font, color) for c in unique_chars}

    line_images = []
    max_width = total_height = 0

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            line_height = EMPTY_LINE_HEIGHT
            line_img = Image.new(IMAGE_MODE, (1, line_height), TRANSPARENT_COLOR)
            line_images.append(line_img)
            total_height += line_height
            if i < len(lines) - 1:
                total_height += LINE_SPACING
            continue

        line_width = sum(char_images[c].width for c in line)
        line_height = max(char_images[c].height for c in line)
        line_img = Image.new(IMAGE_MODE, (line_width, line_height), TRANSPARENT_COLOR)

        x = 0
        for char in line:
            img = char_images[char]
            line_img.paste(img, (x, line_height - img.height), img)
            x += img.width

        line_images.append(line_img)
        max_width = max(max_width, line_width)
        total_height += line_height

        if i < len(lines) - 1:
            total_height += LINE_SPACING

    w = max(1, max_width)
    h = max(1, total_height)

    if w * scale > MAX_DIMENSION or h * scale > MAX_DIMENSION:
        raise ValueError(
            f"Output {w * scale}×{h * scale}px exceeds the {MAX_DIMENSION}×{MAX_DIMENSION}px limit. "
            f"Reduce text length or scale."
        )

    final_image = Image.new(IMAGE_MODE, (w, h), TRANSPARENT_COLOR)
    y = 0
    for i, img in enumerate(line_images):
        final_image.paste(img, (0, y), img)
        y += img.height
        if i < len(line_images) - 1:
            y += LINE_SPACING

    if scale > 1:
        final_image = final_image.resize((w * scale, h * scale), Image.NEAREST)

    img_io = io.BytesIO()
    final_image.save(img_io, format="PNG", compress_level=compress_level)
    img_io.seek(0)

    return img_io.getvalue(), (final_image.width, final_image.height)
