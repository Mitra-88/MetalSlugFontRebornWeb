import asyncio

from flask import Flask, Response, render_template, request
from PIL import Image

from image_generation import generate_image


def create_app():
    app = Flask(__name__)

    @app.get("/")
    async def index():
        return render_template("index.html")

    @app.get("/supported")
    async def supported():
        return render_template("supported.html")

    @app.get("/examples")
    async def examples():
        return render_template("examples.html")

    def parse_params():
        text = request.form.get("text", "")
        if not text.strip():
            return None, ({"error": "Text cannot be empty."}, 400)

        try:
            font = int(request.form.get("font", 1))
            scale = max(1, min(int(request.form.get("scale", 1)), 4))
            compress_level = max(0, min(int(request.form.get("compress", 6)), 9))
        except ValueError:
            return None, ({"error": "Invalid numeric parameter."}, 400)

        color = request.form.get("color", "blue")
        text = text.upper() if font == 5 else text
        return (text, font, color, scale, compress_level), None

    async def generate_response(args, download=False):
        try:
            raw_img_bytes, (w, h) = await asyncio.to_thread(generate_image, *args)
        except FileNotFoundError as e:
            return {"error": str(e), "unsupported": "FileNotFoundError"}, 404
        except ValueError as e:
            return {"error": str(e)}, 422
        except Image.DecompressionBombError:
            return {"error": "Image too large. Reduce text or scale."}, 422

        headers = {
            "X-Image-Width": str(w),
            "X-Image-Height": str(h)
        }
        if download:
            headers["Content-Disposition"] = "attachment; filename=metal-slug-generated.png"

        return Response(raw_img_bytes, mimetype="image/png", headers=headers)

    @app.post("/api/generate")
    async def api_generate():
        args, err = parse_params()
        if err:
            return err
        return await generate_response(args)

    @app.post("/api/download")
    async def api_download():
        args, err = parse_params()
        if err:
            return err
        return await generate_response(args, download=True)

    return app

app = create_app()

if __name__ == "__main__":
    app.run()
