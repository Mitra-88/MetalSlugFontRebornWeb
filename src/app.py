import base64
from flask import Flask, render_template, request
from image_generation import generate_image, get_font_paths

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

@app.route("/", methods=["POST"])
def form():
    try:
        text = request.form["text"]
        font = int(request.form["font"])
        color = request.form["color"]

        if not text.strip():
            return render_template("index.html", error="Text cannot be empty.")

        text = text.upper() if font == 5 else text

        font_paths = get_font_paths(font, color)

        raw_img_bytes, _ = generate_image(text, font_paths)

        encoded_img = base64.b64encode(raw_img_bytes).decode("utf-8")
        data_url = f"data:image/png;base64,{encoded_img}"

        return render_template("results.html", output=data_url)

    except FileNotFoundError as error:
        return render_template(
            "index.html", error=f"{error}", unsupported="FileNotFoundError"
        )

    except Exception as error:
        return render_template("index.html", error=f"Error: {error}")

@app.route("/results")
def result():
    output = request.args.get("output")
    return render_template("results.html", output=output)

if __name__ == "__main__":
    app.run()
