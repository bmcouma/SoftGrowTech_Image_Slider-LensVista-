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
      interval:          4500,  /* Reduced for non-stop action */
      pauseOnHover:      false, /* Completely nonstop */
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
     4. CONTACT / SUBSCRIBE FORM
  ============================================================ */

  function initSubscribeForm() {
    const form    = document.getElementById("subscribeForm");
    const email   = document.getElementById("emailInput");
    const error   = document.getElementById("emailError");
    const success = document.getElementById("formSuccess");

    if (!form || !email) return;

    function shakeInput() {
      email.style.transition = "transform 0.08s ease";
      const steps = [0, -6, 6, -4, 4, -2, 2, 0];
      let i = 0;
      const step = () => {
        if (i < steps.length) {
          email.style.transform = "translateX(" + steps[i] + "px)";
          i++;
          setTimeout(step, 55);
        } else {
          email.style.transform = "";
        }
      };
      step();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const emailVal = email.value.trim();
      const btn = form.querySelector('button[type="submit"]');

      if (!emailVal || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal))) {
        if (error) error.textContent = "Please enter a valid email address.";
        shakeInput();
        email.focus();
        return;
      }
      
      if (error) error.textContent = "";

      /* Simulate network request */
      const originalText = btn.textContent;
      btn.textContent = "Sending...";
      btn.disabled = true;

      setTimeout(function () {
        if (success) success.style.display = "block";
        form.reset();
        btn.textContent = originalText;
        btn.disabled = false;
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          if (success) success.style.display = "none";
        }, 5000);
      }, 1200);
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
     7. COUNTERS — Auto-animate stats on scroll
  ============================================================ */
  function initCounters() {
    const counters = document.querySelectorAll(".counter");
    if (!counters.length) return;

    const observer = new IntersectionObserver(function (entries, ob) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const target = +entry.target.getAttribute("data-target");
          const duration = 2000;
          let current = 0;
          let startTime = null;

          function animateCount(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percent = Math.min(progress / duration, 1);
            
            // easeOutQuart 
            const easeOut = 1 - Math.pow(1 - percent, 4);
            current = Math.floor(easeOut * target);

            entry.target.textContent = current;

            if (percent < 1) {
              window.requestAnimationFrame(animateCount);
            } else {
              entry.target.textContent = target; // Ensure it ends exactly on target
            }
          }

          window.requestAnimationFrame(animateCount);
          ob.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================================================
     8. OPEN-METEO API — Live Slide Weather
  ============================================================ */
  function initWeatherAPI() {
    const coords = [
      { lat: 36.3932, lon: 25.4615 }, // Santorini
      { lat: -50.9423, lon: -73.4068 }, // Patagonia
      { lat: 29.1170, lon: 110.4791 }, // Zhangjiajie
      { lat: 31.1158, lon: -4.4357 }, // Sahara
      { lat: 51.1784, lon: -115.5708 }, // Banff
      { lat: 40.6358, lon: 14.6042 }  // Amalfi
    ];
    
    const tempEl = document.getElementById("weatherTemp");
    const widget = document.getElementById("weatherWidget");
    if (!tempEl || !widget) return;

    let abortController = null;

    function updateWeather() {
       const currentSlide = document.querySelector(".slide.active");
       if (!currentSlide) return;
       const index = parseInt(currentSlide.getAttribute("data-index"), 10);
       if (isNaN(index)) return;
       
       const c = coords[index];

       // Abort previous fetch if pending
       if (abortController) abortController.abort();
       abortController = new AbortController();

       tempEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--clr-gold)" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Syncing...`;
       
       fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current_weather=true`, { signal: abortController.signal })
         .then(res => res.json())
         .then(data => {
           const temp = Math.round(data.current_weather.temperature);
           let cond = "🌍";
           switch(data.current_weather.weathercode) {
             case 0: cond = "☀️"; break; 
             case 1: case 2: case 3: cond = "⛅"; break; 
             case 45: case 48: cond = "🌫️"; break;
             case 51: case 53: case 55: case 61: case 63: case 65: cond = "🌧️"; break;
             case 71: case 73: case 75: cond = "❄️"; break;
             case 95: case 96: case 99: cond = "⛈️"; break;
             default: cond = "⛅";
           }
           tempEl.innerHTML = `<span style="font-size:1.1rem">${cond}</span> &nbsp;Live <span style="color:var(--clr-gold);">${temp}°C</span>`;
         })
         .catch(err => {
           if (err.name !== 'AbortError') {
             tempEl.innerHTML = `🌍 &nbsp;Offline`;
           }
         });
    }

    // Initial load
    updateWeather();

    // Listen to changes in DOM for slides gaining `.active` class
    const track = document.getElementById("slidesTrack");
    if (track) {
      const observer = new MutationObserver((mutations) => {
         mutations.forEach(m => {
            if (m.attributeName === "class" && m.target.classList.contains("active")) {
               updateWeather();
            }
         });
      });
      observer.observe(track, { attributes: true, subtree: true });
    }
  }

  /* ============================================================
     9. INSPIRATION API — Travel Quote
  ============================================================ */
  function initQuoteAPI() {
    const textEls = document.querySelectorAll(".api-quote-text");
    const authorEls = document.querySelectorAll(".api-quote-author");
    if (!textEls.length || !authorEls.length) return;

    // We use a reliable mock fallback, but attempt to fetch a real quote natively.
    const fallbackQuotes = [
      { text: "Photography is the story I fail to put into words.", author: "Destin Sparks" },
      { text: "To travel is to discover that everyone is wrong about other countries.", author: "Aldous Huxley" },
      { text: "The world is a book, and those who do not travel read only a page.", author: "Saint Augustine" },
      { text: "Only photograph what you love.", author: "Tim Walker" },
      { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" }
    ];

    fetch("https://dummyjson.com/quotes/random")
      .then(res => res.json())
      .then(data => {
        // DummyJSON gives random quotes. Populate all instances (for the infinite marquee duplicate).
        textEls.forEach(el => el.innerHTML = `"${data.quote}"`);
        authorEls.forEach(el => el.innerHTML = `&mdash; ${data.author}`);
      })
      .catch(() => {
        // Fallback to our curated travel photography quotes if the API is blocked
        const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        textEls.forEach(el => el.innerHTML = `"${random.text}"`);
        authorEls.forEach(el => el.innerHTML = `&mdash; ${random.author}`);
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
    initCounters();
    initSubscribeForm();
    initSmoothScroll();
    initWeatherAPI();
    initQuoteAPI();

    console.info("[LensVista] Application initialised successfully.");
  });

})();
