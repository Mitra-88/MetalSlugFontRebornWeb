from flask import Flask, render_template


def create_app():
    app = Flask(__name__)

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/supported")
    def supported():
        return render_template("supported.html")

    @app.get("/examples")
    def examples():
        return render_template("examples.html")

    return app


app = create_app()

if __name__ == "__main__":
    app.run()
