import io
from flask import Flask, render_template, request, Response
from PIL import Image
from image_generation import generate_image

app = Flask(__name__)


def _parse_params():
    text = request.form.get("text", "")
    font = int(request.form.get("font", 1))
    color = request.form.get("color", "blue")
    scale = min(max(int(request.form.get("scale", 1)), 1), 4)
    compress_level = min(max(int(request.form.get("compress", 6)), 0), 9)

    if not text.strip():
        return None, None, None, None, None, ({"error": "Text cannot be empty."}, 400)

    text = text.upper() if font == 5 else text
    return text, font, color, scale, compress_level, None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/supported")
def supported():
    return render_template("supported.html")


@app.route("/examples")
def examples():
    return render_template("examples.html")


@app.route("/api/generate", methods=["POST"])
def api_generate():
    text, font, color, scale, compress_level, err = _parse_params()
    if err:
        return err

    try:
        raw_img_bytes, (w, h) = generate_image(text, font, color, scale, compress_level)
        return Response(
            io.BytesIO(raw_img_bytes),
            mimetype="image/png",
            headers={"X-Image-Width": str(w), "X-Image-Height": str(h)},
        )
    except FileNotFoundError as e:
        return {"error": str(e), "unsupported": "FileNotFoundError"}, 404
    except ValueError as e:
        return {"error": str(e)}, 422
    except Image.DecompressionBombError:
        return {"error": "Image too large. Reduce text or scale."}, 422
    except Exception as e:
        return {"error": f"Error: {e}"}, 500


@app.route("/api/download", methods=["POST"])
def api_download():
    text, font, color, scale, compress_level, err = _parse_params()
    if err:
        return err

    try:
        raw_img_bytes, _ = generate_image(text, font, color, scale, compress_level)
        return Response(
            io.BytesIO(raw_img_bytes),
            mimetype="image/png",
            headers={"Content-Disposition": "attachment; filename=metal-slug-generated.png"},
        )
    except FileNotFoundError as e:
        return {"error": str(e), "unsupported": "FileNotFoundError"}, 404
    except ValueError as e:
        return {"error": str(e)}, 422
    except Image.DecompressionBombError:
        return {"error": "Image too large. Reduce text or scale."}, 422
    except Exception as e:
        return {"error": f"Error: {e}"}, 500


if __name__ == "__main__":
    app.run()
