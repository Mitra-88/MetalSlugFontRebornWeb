# MetalSlugFontRebornWeb

Webapp version of [MetalSlugFontReborn](https://github.com/Mitra-88/MetalSlugFontReborn).

## 🚀 Demo

Visit the live instance: [https://vermeil.pythonanywhere.com](https://vermeil.pythonanywhere.com)

## 🛠️ Technology Stack

- **Backend**: Python with Flask
- **Image Processing**: Pillow (PIL)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Font Assets**: Custom sprite sheets from MetalSlugFontReborn
- **Deployment**: PythonAnywhere

## 📁 Project Structure

```
src/
├── app.py                    # Flask application entry point
├── image_generation.py       # Core image generation logic
├── special_characters.py     # Character mapping for symbols
├── static/
│   ├── assets/
│   │   ├── fonts/            # Character sprite assets
│   │   ├── examples/         # Example images
│   │   └── icons/            # App icons and favicon
│   ├── css/
│   │   ├── base.css          # Base styles
│   │   ├── index.css         # Main page styles
│   │   ├── examples.css      # Examples page styles
│   │   ├── supported.css     # Supported characters page styles
│   │   └── minified/         # Minified CSS files
│   ├── js/
│   │   ├── fonts.js          # Font/color selection logic
│   │   └── minified/         # Minified JS files
│   └── manifest.json         # PWA manifest
└── templates/
    ├── index.html            # Main generator page
    ├── examples.html         # Font examples gallery
    └── supported.html        # Character support reference
```

## 🔧 Installation

### Prerequisites

- Python 3.10+
- pip

### Setup

```
git clone https://github.com/Mitra-88/MetalSlugFontRebornWeb.git
cd MetalSlugFontRebornWeb
pip install -r requirements.txt
python src/app.py
```

The application will be available at `http://localhost:5000`.

## 📄 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

Here's a version of that "Tools & Technologies" section formatted for the MetalSlugFontRebornWeb README:

---

## 🛠️ Tools & Technologies

- [Flask](https://flask.palletsprojects.com/en/stable/): Backend web framework
- [Pillow](https://pillow.readthedocs.io/en/stable/): Image processing and rendering
- [PythonAnywhere](https://www.pythonanywhere.com/): Production hosting
