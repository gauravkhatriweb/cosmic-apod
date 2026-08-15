# ✦ Cosmic APOD

> *The universe, one day at a time.*

A beautifully crafted **NASA Astronomy Picture of the Day** explorer with date navigation, favorites, history, and sharing — built with Vite and vanilla JavaScript.

Built for the [Hack Club Stardance](https://stardance.hackclub.com/) "Give Your Website a Pulse" mission.

![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Daily APOD** | View today's Astronomy Picture of the Day with full metadata |
| **Date Navigation** | Browse any APOD from June 16, 1995 to today |
| **Random Discovery** | Discover a random APOD from NASA's archive |
| **Favorites** | Heart your favorite APODs — persisted in localStorage |
| **History** | Automatically tracks your recently viewed APODs |
| **Fullscreen Lightbox** | View images and videos in an immersive fullscreen modal |
| **Sharing** | Share APODs via Web Share API or clipboard with date-encoded URLs |
| **HD Images** | One-click access to high-resolution source images |
| **Video Support** | Gracefully handles video APODs (YouTube embeds, etc.) |
| **Responsive Design** | Looks great on phones, tablets, and desktops |
| **Accessibility** | Keyboard navigation, ARIA labels, focus management, reduced motion |
| **Space Atmosphere** | Animated star field, nebula gradients, glass-morphism cards |
| **Keyboard Shortcuts** | Arrow keys to navigate between dates |

---

## 🛠 Tech Stack

- **[Vite](https://vitejs.dev/)** — Fast build tool and dev server
- **Vanilla JavaScript** — ES modules, async/await, no frameworks
- **CSS** — Custom properties, animations, responsive grid, glass-morphism
- **[NASA APOD API](https://api.nasa.gov/)** — Astronomy Picture of the Day data
- **GitHub Pages** — Static deployment via GitHub Actions

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A free [NASA API key](https://api.nasa.gov/) (or use `DEMO_KEY` for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/gauravkhatriweb/cosmic-apod.git
cd cosmic-apod

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your NASA API key
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_NASA_API_KEY` | Your NASA API key | Yes |

### Getting a NASA API Key

1. Visit [https://api.nasa.gov/](https://api.nasa.gov/)
2. Fill out the form to generate a free API key
3. Copy the key into your `.env` file

> **⚠️ Important:** Vite inlines `VITE_*` environment variables into the client-side JavaScript bundle at build time. This means the API key is **visible in the browser**. This is perfectly fine for a free, public NASA API key — but **never use this pattern for genuinely sensitive secrets** like private API keys, passwords, or tokens.

---

## 🌐 Deployment (GitHub Pages)

This project deploys automatically via GitHub Actions.

### Setup

1. **Push to GitHub** as a repository named `cosmic-apod` (or update `base` in `vite.config.js`)

2. **Add the API key as a repository secret:**
   - Go to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `VITE_NASA_API_KEY`
   - Value: your NASA API key

3. **Enable GitHub Pages:**
   - Go to **Settings → Pages**
   - Source: **GitHub Actions**

4. **Push to `main`** — the workflow will build and deploy automatically.

Your site will be live at `https://<your-username>.github.io/cosmic-apod/`

---

## 📁 Project Structure

```
cosmic-apod/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── public/
│   └── favicon.svg             # App icon
├── src/
│   ├── api/
│   │   └── nasa.js             # NASA APOD API client
│   ├── components/
│   │   ├── favorites.js        # Favorites manager (localStorage)
│   │   ├── history.js          # History manager (localStorage)
│   │   ├── lightbox.js         # Fullscreen media modal
│   │   ├── panel.js            # Side panel (favorites/history list)
│   │   ├── share.js            # Web Share API + clipboard fallback
│   │   └── stars.js            # Animated star field canvas
│   ├── utils/
│   │   ├── dates.js            # Date formatting and navigation
│   │   ├── dom.js              # DOM helpers, escaping, toasts
│   │   └── storage.js          # Safe localStorage wrapper
│   ├── main.js                 # Application entry point
│   └── style.css               # Complete design system
├── .env                        # Local env vars (git-ignored)
├── .env.example                # Env var template
├── .gitignore
├── index.html                  # HTML entry point
├── package.json
├── vite.config.js
└── README.md
```

---

## ♿ Accessibility

- Semantic HTML5 elements (`<header>`, `<main>`, `<article>`, `<nav>`, `<footer>`)
- Single `<h1>` per page with proper heading hierarchy
- Skip-to-content link
- Keyboard navigable — all interactive elements reachable via Tab
- Arrow key date navigation
- Visible focus indicators
- ARIA labels on buttons and controls
- Accessible modals with focus trapping and Escape-to-close
- `prefers-reduced-motion` respected — animations disabled for users who request it
- Sufficient color contrast ratios

---

## 🎨 Design Philosophy

Cosmic APOD's visual identity draws from:

- **NASA mission control** — clean data presentation, monospace accents
- **Modern editorial photography** — the image is always the hero
- **Futuristic observatory dashboard** — glass-morphism, deep-space palette, subtle glow

The design avoids:
- Excessive glow or neon effects
- Copying NASA's website
- Generic AI-generated aesthetics

---

## 📝 Credits

- **Data:** [NASA APOD API](https://api.nasa.gov/) — Astronomy Picture of the Day
- **Fonts:** [Inter](https://rsms.me/inter/) & [Space Grotesk](https://floriankarsten.github.io/space-grotesk/) via Google Fonts
- **Built for:** [Hack Club Stardance](https://stardance.hackclub.com/) — "Give Your Website a Pulse" mission

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
