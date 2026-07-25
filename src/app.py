import io
from flask import Flask, render_template, request, Response
from image_generation import generate_image

app = Flask(__name__)

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
    try:
        text = request.form.get("text", "")
        font = int(request.form.get("font", 1))
        color = request.form.get("color", "blue")

        if not text.strip():
            return {"error": "Text cannot be empty."}, 400

        text = text.upper() if font == 5 else text
        raw_img_bytes, _ = generate_image(text, font, color, uncompressed=True)
        
        return Response(io.BytesIO(raw_img_bytes), mimetype="image/png")

    except FileNotFoundError as error:
        return {"error": f"{error}", "unsupported": "FileNotFoundError"}, 404
    except Exception as error:
        return {"error": f"Error: {error}"}, 500

@app.route("/api/download", methods=["POST"])
def api_download():
    try:
        text = request.form.get("text", "")
        font = int(request.form.get("font", 1))
        color = request.form.get("color", "blue")

        if not text.strip():
            return {"error": "Text cannot be empty."}, 400

        text = text.upper() if font == 5 else text
        raw_img_bytes, _ = generate_image(text, font, color, uncompressed=False)

        return Response(
            io.BytesIO(raw_img_bytes), 
            mimetype="image/png",
            headers={"Content-Disposition": "attachment; filename=metal-slug-mission.png"}
        )

    except FileNotFoundError as error:
        return {"error": f"{error}", "unsupported": "FileNotFoundError"}, 404
    except Exception as error:
        return {"error": f"Error: {error}"}, 500

if __name__ == "__main__":
    app.run()
