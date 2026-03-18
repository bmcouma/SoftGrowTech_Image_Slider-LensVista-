# 🌍 LensVista — Immersive Image Slider

LensVista is a premium, full-viewport travel photography showcase built around an engineered image slider experience. It goes beyond the standard carousel to deliver a cinematic, magazine-grade interface powered entirely by vanilla web standards.

> See the world differently.

---

## 🔗 Live Preview

Open `index.html` directly in any modern browser. No server, no build tools, no dependencies.

---

## ✨ Features

### Slider Engine (beyond requirements)
- **Direction-aware transitions** — separate CSS animations for next/previous navigation
- **Auto-play with progress bar** — animated progress indicator synchronised to the interval
- **Keyboard navigation** — `← →` arrows navigate slides; `Space` pauses / resumes
- **Touch & swipe support** — mobile-friendly swipe detection with vertical scroll fallback
- **Pause on hover** — auto-play pauses when the user hovers over the slider
- **Per-slide content** — each slide has a category label, title, description, and CTA
- **Animated slide counter** — smooth numeric transition on every slide change
- **Thumbnail strip** — click any thumbnail to jump directly to that slide
- **Progress indicator dots** — animated fill bars synchronised to auto-play timing
- **Play / Pause toggle** — dedicated UI button with ARIA state management

### Accessibility
- Full ARIA roles (`carousel`, `group`, `tab`, `tablist`, `live`)
- ARIA live region announces the current slide to screen readers
- `aria-hidden` toggled correctly on non-active slides
- Keyboard focus management with `tabindex` control on slide CTAs
- Skip navigation link for keyboard users
- Respects `prefers-reduced-motion` — all animations disabled for users who prefer it
- Visible `:focus-visible` outlines throughout

### Full Website
- Fixed navbar with scroll state, mobile hamburger menu, and overlay
- Collections grid section with hover zoom effects
- About section with animated statistics
- Email subscription form with validation, shake feedback, and simulated submission
- Fully responsive — mobile, tablet, desktop
- Scroll reveal animations via IntersectionObserver

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic structure, ARIA roles, accessibility |
| **CSS3** | Custom design system, CSS variables, Grid, Flexbox, animations |
| **Vanilla JavaScript (ES6+)** | OOP slider engine, event handling, IntersectionObserver |
| **Google Fonts** | Cormorant Garamond (display) + DM Sans (UI) |
| **Unsplash** | Open-source photography under the Unsplash License |

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| Base | `#0a0a0c` | Page background |
| Surface | `#111115` | Section backgrounds |
| Gold | `#e8b86d` | Primary accent, CTAs |
| Teal | `#6b9fa8` | Secondary accent |
| Text | `#f2f0ea` | Primary text |
| Muted | `#888880` | Secondary text |

**Typography:** Cormorant Garamond (headings, display) · DM Sans (UI, body)

---

## 📁 Project Structure

```text
LensVista/
├── index.html            ← Semantic structure, ARIA, all sections
├── css/
│   ├── style.css         ← Full design system and component styles
│   └── animations.css    ← All keyframes and transition utilities
└── js/
    ├── slider.js         ← SliderEngine class (OOP, fully decoupled)
    └── main.js           ← App initialisation, navbar, scroll reveal
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `→` | Next slide |
| `←` | Previous slide |
| `Space` | Pause / Resume auto-play |

---

## 🚀 Setup

```bash
# Clone the repository
git clone https://github.com/bmcouma/SoftGrowTech_Image_Slider-LensVista-.git

# Navigate into the project
cd SoftGrowTech_Image_Slider-LensVista-

# Open in browser
open index.html
```

Requires an active internet connection to load Google Fonts and Unsplash imagery.

---

## 📄 License

This project is open source under the MIT License.  
Photography sourced from [Unsplash](https://unsplash.com) under the Unsplash License.  
Typography from [Google Fonts](https://fonts.google.com) under the Open Font License.
