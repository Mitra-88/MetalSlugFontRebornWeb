from flask import Flask, render_template, request, redirect, url_for
from image_generation import generate_image, generate_filename, get_font_paths

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
        if request.method == "POST":
            text = request.form["text"]
            font = int(request.form["font"])
            color = request.form["color"]

            enable_line_breaks = "enable-line-breaks" in request.form
            max_words = int(request.form.get("max-words", 1))

            if not text.strip():
                return render_template("index.html", error="Text cannot be empty.")

            text = text.upper() if font == 5 else text

            font_paths = get_font_paths(font, color)

            max_words_param = max_words if enable_line_breaks else None

            filename = generate_filename()
            image_url, _ = generate_image(text, filename, font_paths, max_words=max_words_param)

            return redirect(url_for("result", output=image_url))

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
