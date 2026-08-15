<div align="center">

# ✦ Cosmic APOD
**The universe, one day at a time.**

A beautifully crafted NASA Astronomy Picture of the Day explorer offering an immersive, space-themed way to discover our cosmos. Built for speed, discovery, and accessibility.

[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white)](#)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](#)
[![NASA API](https://img.shields.io/badge/NASA-APOD_API-0B3D91?logo=nasa&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#)

[Live Demo](https://cosmic-apod.vercel.app) • [Hack Club Stardance](https://stardance.hackclub.com/missions/nasa-page)

</div>

---

## 🔭 About The Project

Cosmic APOD is an independent, evolving prototype designed to bring NASA's Astronomy Picture of the Day (APOD) archive to life. While the NASA API provides incredible data, standard data views often lack the awe-inspiring atmosphere the subject matter deserves.

This application provides a **highly polished, observatory-like dashboard** complete with deep-space color palettes, an animated starfield canvas, glass-morphism UI elements, and a focus on both imagery and education. 

It was initially built as part of the [Hack Club Stardance: Give Your Website a Pulse](https://stardance.hackclub.com/missions/nasa-page) mission. Rather than just fulfilling the tutorial requirements, this project goes further by introducing state management, persistent local storage, interactive UI panels, and modern CSS architectural patterns.

*Note: This is an active prototype (V1). Check the [Roadmap](#-roadmap) to see what's planned for V2.*

---

## ✨ Features

### Currently Implemented (V1)
- **Daily APOD:** View today's Astronomy Picture of the Day with full metadata.
- **Date Navigation:** Jump to any specific day in the APOD archive (from June 16, 1995, to today).
- **Random Discovery:** A single click retrieves a random day in astronomy history.
- **Favorites:** Heart and save APODs. Persisted locally via `localStorage`.
- **History Tracking:** Automatically maintains a list of your recently viewed APODs.
- **Immersive Media:** Fullscreen lightbox for high-resolution images, plus seamless support for YouTube/Vimeo video APODs.
- **Sharing Capabilities:** Utilizes the Web Share API on supported devices, gracefully falling back to clipboard copying.
- **Atmospheric UI:** Features a dynamic, canvas-based animated starfield and refined CSS glass-morphism.

### Coming Next (V2)
- **Search & Filter:** Browse the APOD archive by keyword or category.
- **Personalization Preferences:** Dedicated settings for themes and reduced-motion preferences.
- **Improved Caching:** Service worker and persistent request deduplication to save NASA API bandwidth.
- **Accessibility Upgrades:** Comprehensive screen-reader testing and high-contrast modes.

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vite** | Lightning-fast development server and optimized production build |
| **Vanilla JavaScript** | Core application logic, API communication, and state management |
| **CSS** | Custom responsive UI, animations, CSS variables, and glass-morphism |
| **NASA APOD API** | The source of truth for daily astronomy data |
| **GitHub Actions** | Automated CI/CD pipeline for deploying the application |

---

## ⚙️ How It Works

Cosmic APOD follows a clean, vanilla JavaScript architectural pattern:

**User Interaction ↓ App State Manager ↓ NASA API Client ↓ Response Validation ↓ DOM Update**

1. The user requests a date (or clicks "Random").
2. The UI enters a skeleton/loading state to prevent layout shift.
3. The `nasa.js` module fetches data from the APOD endpoint.
4. Validation checks if the media is an image or video, handling HD sources.
5. `dom.js` orchestrates rendering the response, updating metadata, and injecting the canvas background.
6. User interactions (Favorites/History) are serialized and synced to `localStorage`.

---

## 🔌 API Documentation

This project integrates with the **[NASA Astronomy Picture of the Day (APOD) API](https://api.nasa.gov/)**.

- **Endpoint:** `https://api.nasa.gov/planetary/apod`
- **Authentication:** Requires a valid `api_key` passed as a query parameter.
- **Data Retrieved:** Date, title, explanation, media type (image/video), standard URL, and HD URL.

### Security Note on `VITE_NASA_API_KEY`
The application relies on a `.env` file for the API key during development. Because Vite is building a purely client-side application, any variable prefixed with `VITE_` is exposed to the browser. 
> ⚠️ **This is perfectly acceptable for the free, rate-limited public NASA API.** However, this pattern should **never** be used for sensitive credentials (e.g., AWS keys, database passwords, or payment tokens).

---

## 🚀 Setup Guide

### Requirements
- Node.js (v18 or higher)
- Git
- A [free NASA API key](https://api.nasa.gov/) (You can use `DEMO_KEY` temporarily, but rate limits apply).

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/gauravkhatriweb/cosmic-apod.git

# Navigate to the project directory
cd cosmic-apod

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env
```
Open `.env` and insert your NASA API key:
```env
VITE_NASA_API_KEY=your_api_key_here
```
*(Note: `.env` is included in `.gitignore` and must not be committed to the repository.)*

### 3. Development Server

```bash
npm run dev
```
Open `http://localhost:5173` to view the application in your browser.

### 4. Production Build & Preview

```bash
npm run build
npm run preview
```

---

## 🌐 Deployment

This project is configured for continuous deployment to **GitHub Pages** via GitHub Actions.

1. **GitHub Secrets:** Add your NASA API key as a repository secret named `VITE_NASA_API_KEY`.
2. **GitHub Pages Configuration:** In repository settings, set the source to "GitHub Actions".
3. **Trigger:** The workflow (`.github/workflows/deploy.yml`) will automatically build the Vite project and deploy the `dist` directory upon pushing to the `main` branch.

*(You can also preview the live deployment on Vercel: [Live Demo](https://cosmic-apod.vercel.app))*

---

## 📁 Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   └── favicon.svg             # Application favicon
├── src/
│   ├── api/
│   │   └── nasa.js             # API interaction logic
│   ├── components/
│   │   ├── favorites.js        # Favorites state management
│   │   ├── history.js          # History tracking logic
│   │   ├── lightbox.js         # Fullscreen media viewer
│   │   ├── panel.js            # Sidebar UI interactions
│   │   ├── share.js            # Sharing API integration
│   │   └── stars.js            # Canvas rendering
│   ├── utils/
│   │   ├── dates.js            # Date calculation utilities
│   │   ├── dom.js              # DOM manipulation and sanitization
│   │   └── storage.js          # LocalStorage wrapper
│   ├── main.js                 # Primary application entry point
│   └── style.css               # Global CSS and component styling
├── screenshots/                # Application preview images
├── .env.example                # Example environment file
├── .gitignore                  # Git ignored files configuration
├── index.html                  # Main HTML template
├── package.json                # Project metadata and scripts
├── vite.config.js              # Vite configuration
└── README.md                   # Project documentation
```

---

## 🧠 Development Philosophy

- **Start Simple:** Build a reliable core experience before introducing complexity.
- **Vanilla First:** Understand browser APIs and the DOM deeply before reaching for large UI frameworks.
- **Visual Polish Matters:** A beautiful interface encourages discovery. The data is incredible; the presentation should match.
- **Iterative Growth:** V1 proves the concept. V2 refines and expands it.

---

## 🗺 Roadmap

### V1 — Prototype (Current)
- [x] Core APOD integration
- [x] Date traversal & Random generation
- [x] Local storage for favorites and history
- [x] Fully responsive atmospheric UI
- [x] Media lightbox and video support

### V2 — The Upgrade (Planned)
- [ ] **Feature:** "On This Day" astronomy history.
- [ ] **Feature:** PWA support for offline caching of favorites.
- [ ] **Feature:** Astronomy education expansion (telescope info, terms).
- [ ] **Feature:** UI personalization (themes, high-contrast mode).
- [ ] **Feature:** Skeleton loading and optimized request caching.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📄 License
This project is licensed under the MIT License - see the `LICENSE` file for details.
