# MetalSlugFontRebornWeb

Web app version of [MetalSlugFontReborn](https://github.com/Mitra-88/MetalSlugFontReborn). _This branch reimplements it to run entirely client-side_

## 🚀 Demo

Visit the live instance: [https://vermeil.pythonanywhere.com](https://vermeil.pythonanywhere.com) or [https://metalslugfontrebornweb.mitra88dev.workers.dev/](https://metalslugfontrebornweb.mitra88dev.workers.dev/)

## 📁 Project Structure

```
src/
├── static/
│   ├── assets/
│   │   ├── examples/     # Example images
│   │   ├── fonts/        # Character sprite assets (5 fonts, various colors)
│   │   └── icons/        # App icons and favicon
│   ├── css/              # Stylesheets
│   └── js/               # Application logic
├── index.html            # Main generator page
├── examples.html         # Font examples gallery
└── supported.html        # Character support reference
```

## 🔧 Installation

### Prerequisites

- Modern web browser (Chrome, Brave, Firefox, Edge)

### Setup

```
git clone https://github.com/Mitra-88/MetalSlugFontRebornWeb.git
cd MetalSlugFontRebornWeb
```

Open `src/index.html` in your browser or serve with any static file server:

Using Python 3:
```
python -m http.server 8000
```

Using Node.js (with serve):
```
npx serve src
```

The application will be available at `http://localhost:8000`.

## 📄 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
