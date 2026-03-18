/**
 * LensVista — main.js
 *
 * Application entry point. Responsible for:
 *   1. Instantiating and initialising the SliderEngine
 *   2. Navbar scroll behaviour and mobile menu toggle
 *   3. Scroll reveal observer (IntersectionObserver)
 *   4. Contact / subscribe form interaction
 *   5. iOS 100vh fix
 *   6. Smooth scroll for anchor links
 *
 * Dependencies: slider.js (SliderEngine class must be loaded first)
 */

"use strict";

(function () {

  /* ============================================================
     UTILITY — wait for DOM
  ============================================================ */

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* ============================================================
     UTILITY — debounce
  ============================================================ */

  function debounce(fn, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  /* ============================================================
     1. SLIDER INITIALISATION
  ============================================================ */

  function initSlider() {
    if (typeof SliderEngine === "undefined") {
      console.error("[main.js] SliderEngine is not defined. Ensure slider.js is loaded first.");
      return;
    }

    const slider = new SliderEngine({
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
    });

    slider.init();

    /* Expose on window for debugging in browser console */
    window._lensVistaSlider = slider;
  }

  /* ============================================================
     2. NAVBAR — scroll state + mobile menu toggle
  ============================================================ */

  function initNavbar() {
    const navbar     = document.querySelector(".navbar");
    const hamburger  = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");

    if (!navbar) return;

    /* Scroll state */
    function onScroll() {
      if (window.scrollY > 80) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); /* Run once on load */

    /* Mobile menu toggle */
    if (hamburger && mobileMenu) {
      hamburger.addEventListener("click", function () {
        const isOpen = mobileMenu.classList.toggle("open");
        hamburger.setAttribute("aria-expanded", String(isOpen));
        mobileMenu.setAttribute("aria-hidden", String(!isOpen));
        document.body.style.overflow = isOpen ? "hidden" : "";
      });

      /* Close on link click */
      mobileMenu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          mobileMenu.classList.remove("open");
          hamburger.setAttribute("aria-expanded", "false");
          mobileMenu.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
        });
      });

      /* Close on Escape */
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
          mobileMenu.classList.remove("open");
          hamburger.setAttribute("aria-expanded", "false");
          mobileMenu.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
          hamburger.focus();
        }
      });
    }
  }

  /* ============================================================
     3. SCROLL REVEAL — IntersectionObserver
  ============================================================ */

  function initScrollReveal() {
    const targets = document.querySelectorAll(
      ".reveal, .reveal-up, .reveal-left, .reveal-right"
    );

    if (!targets.length) return;

    /* Skip animation for users who prefer reduced motion */
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      targets.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================================================
     4. SUBSCRIBE FORM
  ============================================================ */

  function initSubscribeForm() {
    const btn      = document.getElementById("subscribeBtn");
    const input    = document.getElementById("emailInput");
    const feedback = document.getElementById("formFeedback");

    if (!btn || !input) return;

    function validateEmail(email) {
      /* RFC 5322 simplified pattern */
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    function showFeedback(message, type) {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.className   = "form-feedback " + type;

      /* Auto-clear success message after 5 seconds */
      if (type === "success") {
        setTimeout(function () {
          feedback.textContent = "";
          feedback.className   = "form-feedback";
        }, 5000);
      }
    }

    function shakeInput() {
      input.style.transition = "transform 0.08s ease";
      const steps = [0, -6, 6, -4, 4, -2, 2, 0];
      let i = 0;
      const step = () => {
        if (i < steps.length) {
          input.style.transform = "translateX(" + steps[i] + "px)";
          i++;
          setTimeout(step, 55);
        } else {
          input.style.transform = "";
        }
      };
      step();
    }

    btn.addEventListener("click", function () {
      const email = input.value.trim();

      if (!email) {
        showFeedback("Please enter your email address.", "error");
        shakeInput();
        input.focus();
        return;
      }

      if (!validateEmail(email)) {
        showFeedback("That does not look like a valid email address.", "error");
        shakeInput();
        input.focus();
        return;
      }

      /* Simulate submission (replace with real API call if needed) */
      btn.textContent = "Subscribing...";
      btn.disabled    = true;

      setTimeout(function () {
        showFeedback(
          "You are subscribed! Watch your inbox for the first collection.",
          "success"
        );
        input.value     = "";
        btn.textContent = "Subscribe";
        btn.disabled    = false;
      }, 1200);
    });

    /* Allow Enter key submission */
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") btn.click();
    });
  }

  /* ============================================================
     5. iOS 100VH FIX
  ============================================================ */

  function initVhFix() {
    function setVh() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", vh + "px");
    }
    setVh();
    window.addEventListener("resize", debounce(setVh, 150));
  }

  /* ============================================================
     6. SMOOTH SCROLL for anchor links
  ============================================================ */

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const targetId = anchor.getAttribute("href");
        if (!targetId || targetId === "#") return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const offset = 72; /* Navbar height */
        const top    = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({ top: top, behavior: "smooth" });

        /* Move focus to target for accessibility */
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ============================================================
     BOOT — run all initialisers when DOM is ready
  ============================================================ */

  onReady(function () {
    initVhFix();
    initNavbar();
    initSlider();
    initScrollReveal();
    initSubscribeForm();
    initSmoothScroll();

    console.info("[LensVista] Application initialised successfully.");
  });

})();
