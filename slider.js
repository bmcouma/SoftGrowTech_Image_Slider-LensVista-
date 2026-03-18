/**
 * LensVista — slider.js
 *
 * SliderEngine: A fully self-contained, OOP image slider engine.
 *
 * Responsibilities:
 *   - Slide navigation (goTo, next, prev)
 *   - Direction-aware CSS animation classes
 *   - Auto-play with configurable interval
 *   - Progress bar synchronisation
 *   - Keyboard navigation (← →  Space)
 *   - Touch / swipe support
 *   - Pause on hover
 *   - Dot indicator updates
 *   - Thumbnail strip updates
 *   - Slide counter updates
 *   - ARIA live region announcements
 *   - Resize handling
 *
 * Dependencies: None. Vanilla JS (ES6+). No external libraries.
 *
 * Usage (see main.js):
 *   const slider = new SliderEngine({ ... });
 *   slider.init();
 */

"use strict";

class SliderEngine {

  /**
   * @param {Object} options
   * @param {string}  options.containerSelector  CSS selector for the slider root
   * @param {string}  options.trackSelector      CSS selector for the slides track
   * @param {string}  options.slideSelector      CSS selector for individual slides
   * @param {string}  options.prevBtnId          ID of the previous button
   * @param {string}  options.nextBtnId          ID of the next button
   * @param {string}  options.indicatorsId       ID of the indicators container
   * @param {string}  options.thumbnailsId       ID of the thumbnail strip
   * @param {string}  options.progressFillId     ID of the progress fill bar
   * @param {string}  options.counterCurrentId   ID of the current-count element
   * @param {string}  options.counterTotalId     ID of the total-count element
   * @param {string}  options.announcerId        ID of the ARIA announcer element
   * @param {string}  options.autoplayToggleId   ID of the play/pause toggle button
   * @param {number}  options.interval           Auto-play interval in milliseconds
   * @param {boolean} options.pauseOnHover       Whether to pause auto-play on hover
   * @param {boolean} options.loop               Whether to loop at the ends
   */
  constructor(options = {}) {
    this._cfg = Object.assign({
      containerSelector: "#lensVistaSlider",
      trackSelector:     "#slidesTrack",
      slideSelector:     ".slide",
      prevBtnId:         "prevBtn",
      nextBtnId:         "nextBtn",
      indicatorsId:      "slideIndicators",
      thumbnailsId:      "thumbnailStrip",
      progressFillId:    "progressFill",
      counterCurrentId:  "counterCurrent",
      counterTotalId:    "counterTotal",
      announcerId:       "sliderAnnouncer",
      autoplayToggleId:  "autoplayToggle",
      interval:          6000,
      pauseOnHover:      true,
      loop:              true,
    }, options);

    /* ---- State ---- */
    this._current      = 0;
    this._previous     = 0;
    this._total        = 0;
    this._isPlaying    = true;
    this._isAnimating  = false;
    this._autoTimer    = null;
    this._progressRaf  = null;
    this._progressStart = null;
    this._touchStartX  = 0;
    this._touchStartY  = 0;
    this._touchThreshold = 45;  /* px — minimum swipe distance */
    this._resizeTimer  = null;

    /* ---- DOM references (populated by _queryDOM) ---- */
    this._container    = null;
    this._track        = null;
    this._slides       = [];
    this._prevBtn      = null;
    this._nextBtn      = null;
    this._indicators   = [];
    this._thumbnails   = [];
    this._progressFill = null;
    this._counterCurr  = null;
    this._counterTotal = null;
    this._announcer    = null;
    this._autoToggle   = null;
  }

  /* ============================================================
     PUBLIC API
  ============================================================ */

  /**
   * Initialise the slider. Must be called once after DOM is ready.
   */
  init() {
    if (!this._queryDOM()) {
      console.warn("[SliderEngine] Required DOM elements not found. Aborting init.");
      return;
    }

    this._total = this._slides.length;

    if (this._total < 2) {
      console.warn("[SliderEngine] Slider requires at least 2 slides.");
      return;
    }

    this._updateCounter(this._current);
    this._updateCounterTotal();
    this._updateIndicators(this._current);
    this._updateThumbnails(this._current);
    this._updateActiveSlide(this._current);

    this._bindEvents();
    this._startAutoPlay();

    console.info(
      "[SliderEngine] Initialised. Slides: " + this._total +
      " | Interval: " + this._cfg.interval + "ms"
    );
  }

  /**
   * Navigate to a specific slide index.
   * @param {number} index  Target slide index (0-based)
   * @param {string} [dir]  Direction hint: "next" | "prev"
   */
  goTo(index, dir) {
    if (this._isAnimating) return;
    if (index === this._current) return;
    if (index < 0 || index >= this._total) return;

    /* Determine direction if not supplied */
    const direction = dir || (index > this._current ? "next" : "prev");

    this._previous = this._current;
    this._current  = index;

    this._isAnimating = true;
    this._transition(this._previous, this._current, direction);

    this._updateCounter(this._current);
    this._updateIndicators(this._current);
    this._updateThumbnails(this._current);
    this._announceSlide(this._current);

    if (this._isPlaying) {
      this._resetAutoPlay();
    }
  }

  /**
   * Advance to the next slide.
   */
  next() {
    let target = this._current + 1;
    if (target >= this._total) {
      target = this._cfg.loop ? 0 : this._current;
    }
    this.goTo(target, "next");
  }

  /**
   * Return to the previous slide.
   */
  prev() {
    let target = this._current - 1;
    if (target < 0) {
      target = this._cfg.loop ? this._total - 1 : 0;
    }
    this.goTo(target, "prev");
  }

  /**
   * Start auto-play.
   */
  startAutoPlay() {
    this._isPlaying = true;
    this._startAutoPlay();
    this._updateAutoPlayToggle(true);
  }

  /**
   * Stop auto-play.
   */
  stopAutoPlay() {
    this._isPlaying = false;
    this._clearAutoPlay();
    this._clearProgress();
    this._updateAutoPlayToggle(false);
  }

  /**
   * Toggle auto-play state.
   */
  toggleAutoPlay() {
    if (this._isPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  /**
   * Return the current slide index.
   * @returns {number}
   */
  getCurrentIndex() {
    return this._current;
  }

  /**
   * Return the total number of slides.
   * @returns {number}
   */
  getTotalSlides() {
    return this._total;
  }

  /* ============================================================
     PRIVATE — DOM QUERY
  ============================================================ */

  _queryDOM() {
    this._container    = document.querySelector(this._cfg.containerSelector);
    this._track        = document.querySelector(this._cfg.trackSelector);
    this._prevBtn      = document.getElementById(this._cfg.prevBtnId);
    this._nextBtn      = document.getElementById(this._cfg.nextBtnId);
    this._progressFill = document.getElementById(this._cfg.progressFillId);
    this._counterCurr  = document.getElementById(this._cfg.counterCurrentId);
    this._counterTotal = document.getElementById(this._cfg.counterTotalId);
    this._announcer    = document.getElementById(this._cfg.announcerId);
    this._autoToggle   = document.getElementById(this._cfg.autoplayToggleId);

    if (!this._container || !this._track) return false;

    this._slides = Array.from(this._track.querySelectorAll(this._cfg.slideSelector));

    const indicatorsContainer = document.getElementById(this._cfg.indicatorsId);
    if (indicatorsContainer) {
      this._indicators = Array.from(indicatorsContainer.querySelectorAll(".indicator"));
    }

    const thumbnailsContainer = document.getElementById(this._cfg.thumbnailsId);
    if (thumbnailsContainer) {
      this._thumbnails = Array.from(thumbnailsContainer.querySelectorAll(".thumbnail"));
    }

    return true;
  }

  /* ============================================================
     PRIVATE — EVENT BINDING
  ============================================================ */

  _bindEvents() {
    /* Navigation buttons */
    if (this._prevBtn) {
      this._prevBtn.addEventListener("click", () => this.prev());
    }
    if (this._nextBtn) {
      this._nextBtn.addEventListener("click", () => this.next());
    }

    /* Dot indicators */
    this._indicators.forEach((dot) => {
      dot.addEventListener("click", () => {
        const idx = parseInt(dot.getAttribute("data-index"), 10);
        if (!isNaN(idx)) this.goTo(idx);
      });
    });

    /* Thumbnail clicks */
    this._thumbnails.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const idx = parseInt(thumb.getAttribute("data-index"), 10);
        if (!isNaN(idx)) this.goTo(idx);
      });
    });

    /* Auto-play toggle */
    if (this._autoToggle) {
      this._autoToggle.addEventListener("click", () => this.toggleAutoPlay());
    }

    /* Keyboard navigation */
    document.addEventListener("keydown", (e) => this._handleKeydown(e));

    /* Touch / swipe */
    this._container.addEventListener("touchstart", (e) => this._handleTouchStart(e), { passive: true });
    this._container.addEventListener("touchend",   (e) => this._handleTouchEnd(e),   { passive: true });

    /* Pause on hover */
    if (this._cfg.pauseOnHover) {
      this._container.addEventListener("mouseenter", () => {
        if (this._isPlaying) {
          this._clearAutoPlay();
          this._pauseProgress();
        }
      });
      this._container.addEventListener("mouseleave", () => {
        if (this._isPlaying) {
          this._startAutoPlay();
          this._resumeProgress();
        }
      });
    }

    /* Resize — debounced */
    window.addEventListener("resize", () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._handleResize(), 200);
    });

    /* Visibility change — pause when tab is hidden */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this._clearAutoPlay();
      } else if (this._isPlaying) {
        this._startAutoPlay();
      }
    });
  }

  /* ============================================================
     PRIVATE — TRANSITION ENGINE
  ============================================================ */

  /**
   * Apply direction-aware CSS animation classes to outgoing
   * and incoming slides, then clean up after animation completes.
   */
  _transition(fromIdx, toIdx, direction) {
    const fromSlide = this._slides[fromIdx];
    const toSlide   = this._slides[toIdx];

    const exitClass   = direction === "next" ? "exiting-next" : "exiting-prev";
    const enterClass  = direction === "next" ? "entering-next" : "entering-prev";
    const animDuration = 750; /* ms — matches CSS animation duration */

    /* Hide the outgoing slide */
    fromSlide.classList.remove("active");
    fromSlide.setAttribute("aria-hidden", "true");
    fromSlide.querySelectorAll(".slide-cta").forEach((el) => {
      el.setAttribute("tabindex", "-1");
    });

    /* Trigger exit animation on outgoing slide */
    fromSlide.classList.add(exitClass);

    /* Make incoming slide visible and animate in */
    toSlide.classList.add("active", enterClass);
    toSlide.setAttribute("aria-hidden", "false");
    toSlide.querySelectorAll(".slide-cta").forEach((el) => {
      el.setAttribute("tabindex", "0");
    });

    /* Clean up animation classes after they complete */
    const cleanup = () => {
      fromSlide.classList.remove(exitClass);
      toSlide.classList.remove(enterClass);
      this._isAnimating = false;
    };

    setTimeout(cleanup, animDuration + 50);
  }

  /* ============================================================
     PRIVATE — AUTO-PLAY & PROGRESS
  ============================================================ */

  _startAutoPlay() {
    this._clearAutoPlay();
    this._startProgress();
    this._autoTimer = setInterval(() => {
      this.next();
    }, this._cfg.interval);
  }

  _resetAutoPlay() {
    this._clearAutoPlay();
    this._startAutoPlay();
  }

  _clearAutoPlay() {
    if (this._autoTimer) {
      clearInterval(this._autoTimer);
      this._autoTimer = null;
    }
    this._clearProgress();
  }

  _startProgress() {
    if (!this._progressFill) return;

    /* Reset the fill */
    this._progressFill.classList.remove("running");
    /* Force reflow to restart animation */
    void this._progressFill.offsetWidth;
    this._progressFill.classList.add("running");

    /* Also reset and restart active indicator fill */
    const activeIndicator = this._indicators.find((d) =>
      d.classList.contains("active")
    );
    if (activeIndicator) {
      activeIndicator.classList.remove("active");
      void activeIndicator.offsetWidth;
      activeIndicator.classList.add("active");
    }
  }

  _clearProgress() {
    if (!this._progressFill) return;
    this._progressFill.classList.remove("running");
  }

  _pauseProgress() {
    if (!this._progressFill) return;
    this._progressFill.style.animationPlayState = "paused";

    const activeIndicator = this._indicators.find((d) =>
      d.classList.contains("active")
    );
    if (activeIndicator) {
      activeIndicator.style.setProperty("--anim-state", "paused");
      activeIndicator.style.animationPlayState = "paused";
    }
  }

  _resumeProgress() {
    if (!this._progressFill) return;
    this._progressFill.style.animationPlayState = "running";

    const activeIndicator = this._indicators.find((d) =>
      d.classList.contains("active")
    );
    if (activeIndicator) {
      activeIndicator.style.animationPlayState = "running";
    }
  }

  /* ============================================================
     PRIVATE — UI UPDATES
  ============================================================ */

  _updateActiveSlide(index) {
    this._slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add("active");
        slide.setAttribute("aria-hidden", "false");
      } else {
        slide.classList.remove("active");
        slide.setAttribute("aria-hidden", "true");
      }
    });
  }

  _updateIndicators(index) {
    this._indicators.forEach((dot, i) => {
      const isActive = i === index;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    /* Restart indicator animation for new active dot */
    const activeDot = this._indicators[index];
    if (activeDot && this._isPlaying) {
      activeDot.classList.remove("active");
      void activeDot.offsetWidth;
      activeDot.classList.add("active");
    }
  }

  _updateThumbnails(index) {
    this._thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });
  }

  _updateCounter(index) {
    if (!this._counterCurr) return;
    const padded = String(index + 1).padStart(2, "0");
    /* Animate the number change */
    this._counterCurr.style.opacity = "0";
    this._counterCurr.style.transform = "translateY(-8px)";
    setTimeout(() => {
      this._counterCurr.textContent = padded;
      this._counterCurr.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      this._counterCurr.style.opacity = "1";
      this._counterCurr.style.transform = "translateY(0)";
    }, 150);
  }

  _updateCounterTotal() {
    if (!this._counterTotal) return;
    this._counterTotal.textContent = String(this._total).padStart(2, "0");
  }

  _updateAutoPlayToggle(playing) {
    if (!this._autoToggle) return;
    const pauseIcon = this._autoToggle.querySelector(".pause-icon");
    const playIcon  = this._autoToggle.querySelector(".play-icon");

    if (playing) {
      this._autoToggle.setAttribute("aria-label", "Pause automatic slideshow");
      this._autoToggle.setAttribute("aria-pressed", "false");
      if (pauseIcon) pauseIcon.style.display = "";
      if (playIcon)  playIcon.style.display  = "none";
    } else {
      this._autoToggle.setAttribute("aria-label", "Resume automatic slideshow");
      this._autoToggle.setAttribute("aria-pressed", "true");
      if (pauseIcon) pauseIcon.style.display = "none";
      if (playIcon)  playIcon.style.display  = "";
    }
  }

  /* ============================================================
     PRIVATE — ACCESSIBILITY ANNOUNCER
  ============================================================ */

  _announceSlide(index) {
    if (!this._announcer) return;
    const slide = this._slides[index];
    if (!slide) return;
    const label = slide.getAttribute("aria-label") || ("Slide " + (index + 1));
    /* Clear then set forces screen readers to re-announce */
    this._announcer.textContent = "";
    setTimeout(() => {
      this._announcer.textContent = label;
    }, 100);
  }

  /* ============================================================
     PRIVATE — KEYBOARD HANDLER
  ============================================================ */

  _handleKeydown(e) {
    /* Only act if the slider section or its children are focused,
       or if focus is on body / document (no specific element focused) */
    const active = document.activeElement;
    const sliderFocused =
      !active ||
      active === document.body ||
      this._container.contains(active);

    if (!sliderFocused) return;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        this.next();
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.prev();
        break;
      case " ": /* Spacebar */
        /* Only intercept space if the slider section is in view */
        if (this._isSliderInViewport()) {
          e.preventDefault();
          this.toggleAutoPlay();
        }
        break;
    }
  }

  /* ============================================================
     PRIVATE — TOUCH / SWIPE HANDLER
  ============================================================ */

  _handleTouchStart(e) {
    const touch = e.changedTouches[0];
    this._touchStartX = touch.clientX;
    this._touchStartY = touch.clientY;
  }

  _handleTouchEnd(e) {
    const touch  = e.changedTouches[0];
    const deltaX = touch.clientX - this._touchStartX;
    const deltaY = touch.clientY - this._touchStartY;

    /* Ignore mostly-vertical swipes to allow normal scrolling */
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    if (Math.abs(deltaX) < this._touchThreshold) return;

    if (deltaX < 0) {
      this.next();
    } else {
      this.prev();
    }
  }

  /* ============================================================
     PRIVATE — RESIZE HANDLER
  ============================================================ */

  _handleResize() {
    /*
     * On mobile, 100vh can change when the browser toolbar shows/hides.
     * Force a layout recalculation by momentarily touching the container height.
     * This is a common pattern for fixing the iOS 100vh issue.
     */
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", vh + "px");
  }

  /* ============================================================
     PRIVATE — UTILITY
  ============================================================ */

  _isSliderInViewport() {
    if (!this._container) return false;
    const rect = this._container.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

}

/* Export for module environments (no-op in browser without bundler) */
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = SliderEngine;
}
