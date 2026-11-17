/* ==========================================================================
   SAADIA'S STUDIO & SALON — script.js
   Handles: preloader · sticky header · mobile nav · scroll reveal ·
            stat counters · testimonial slider · back-to-top · active links
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     SAFE QUERY HELPERS
  ------------------------------------------------------------------------ */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------------------
     PRELOADER
     Fades out once the page (or a max timeout) has loaded.
  ------------------------------------------------------------------------ */
  function initPreloader() {
    const preloader = $("#preloader");
    if (!preloader) return;

    const hide = () => {
      preloader.classList.add("hidden");
      // Remove from DOM after transition to free resources
      setTimeout(() => preloader.remove(), 900);
    };

    if (document.readyState === "complete") {
      setTimeout(hide, 500);
    } else {
      window.addEventListener("load", () => setTimeout(hide, 500), { once: true });
      // Fallback safety: never block longer than 3.5s
      setTimeout(hide, 3500);
    }
  }

  /* ------------------------------------------------------------------------
     STICKY HEADER
     Adds .scrolled class after a small scroll threshold.
  ------------------------------------------------------------------------ */
  function initStickyHeader() {
    const header = $("#header");
    if (!header) return;

    const THRESHOLD = 40;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle("scrolled", window.scrollY > THRESHOLD);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // set initial state
  }

  /* ------------------------------------------------------------------------
     MOBILE NAVIGATION
     Burger toggles .open on nav links + burger, locks body scroll,
     closes on link click / outside click / Escape.
  ------------------------------------------------------------------------ */
  function initMobileNav() {
    const burger   = $("#burger");
    const navLinks = $("#navLinks");
    if (!burger || !navLinks) return;

    const open = () => {
      burger.classList.add("open");
      navLinks.classList.add("open");
      document.body.classList.add("nav-open");
      burger.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      burger.classList.remove("open");
      navLinks.classList.remove("open");
      document.body.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
    };

    const toggle = () => {
      navLinks.classList.contains("open") ? close() : open();
    };

    burger.addEventListener("click", toggle);

    // Close when any nav link is clicked
    $$(".nav-link, .nav-cta-mobile .btn", navLinks).forEach((link) => {
      link.addEventListener("click", close);
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) close();
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!navLinks.classList.contains("open")) return;
      if (navLinks.contains(e.target) || burger.contains(e.target)) return;
      close();
    });

    // Close if resized to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 992 && navLinks.classList.contains("open")) close();
    });
  }

  /* ------------------------------------------------------------------------
     SCROLL REVEAL
     Uses IntersectionObserver to add .visible to .reveal elements.
     Elements are only observed once.
  ------------------------------------------------------------------------ */
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    // If reduced motion or no support, reveal everything immediately
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px",
      }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     STAT COUNTERS
     Animates elements with [data-count] when they enter the viewport.
     Supports decimals via data-decimal, and suffixes via data-suffix.
  ------------------------------------------------------------------------ */
  function initCounters() {
    const counters = $$("[data-count]");
    if (!counters.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const animate = (el) => {
      const target    = parseFloat(el.dataset.count) || 0;
      const decimals  = parseInt(el.dataset.decimal || "0", 10);
      const suffix    = el.dataset.suffix || "";
      const duration  = 1600;
      const startTime = performance.now();

      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const value    = target * easeOutCubic(progress);
        el.textContent = value.toFixed(decimals) + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toFixed(decimals) + suffix;
        }
      };

      requestAnimationFrame(step);
    };

    // Reduced motion or no observer → set final values instantly
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach((el) => {
        const decimals = parseInt(el.dataset.decimal || "0", 10);
        const suffix   = el.dataset.suffix || "";
        el.textContent = parseFloat(el.dataset.count).toFixed(decimals) + suffix;
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animate(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     TESTIMONIAL SLIDER
     Auto-rotates testimonials with dot navigation.
     Pauses on hover, respects reduced motion.
  ------------------------------------------------------------------------ */
  function initTestimonials() {
    const track = $("#testimonialTrack");
    const dots  = $("#testimonialDots");
    if (!track || !dots) return;

    const slides = $$(".testimonial", track);
    if (slides.length <= 1) return;

    let current = 0;
    let timer   = null;
    const INTERVAL = 6000;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Build dots
    slides.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
      if (i === 0) btn.classList.add("active");
      btn.addEventListener("click", () => {
        goTo(i);
        restart();
      });
      dots.appendChild(btn);
    });

    const dotEls = $$("button", dots);

    const goTo = (index) => {
      slides[current].classList.remove("active");
      dotEls[current].classList.remove("active");

      current = (index + slides.length) % slides.length;

      slides[current].classList.add("active");
      dotEls[current].classList.add("active");
    };

    const next = () => goTo(current + 1);

    const start = () => {
      if (prefersReduced) return;
      stop();
      timer = setInterval(next, INTERVAL);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const restart = () => {
      stop();
      start();
    };

    // Pause on hover / focus within
    const wrap = track.closest(".testimonial-wrap") || track;
    wrap.addEventListener("mouseenter", stop);
    wrap.addEventListener("mouseleave", start);
    wrap.addEventListener("focusin", stop);
    wrap.addEventListener("focusout", start);

    // Pause when tab is hidden (saves CPU)
    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : start();
    });

    // Swipe support (touch devices)
    let startX = 0;
    let isDragging = false;

    track.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      stop();
    }, { passive: true });

    track.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 50) {
        diff > 0 ? goTo(current + 1) : goTo(current - 1);
      }
      start();
    }, { passive: true });

    start();
  }

  /* ------------------------------------------------------------------------
     ACTIVE NAV LINK (SCROLL SPY)
     Highlights the nav link matching the section in view.
  ------------------------------------------------------------------------ */
  function initScrollSpy() {
    const navLinks = $$(".nav-link");
    if (!navLinks.length || !("IntersectionObserver" in window)) return;

    const sections = navLinks
      .map((link) => {
        const id = link.getAttribute("href");
        return id && id.startsWith("#") ? document.querySelector(id) : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    const setActive = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the most visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0, 0.15, 0.35, 0.6],
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------------
     BACK TO TOP
     Shows the button after scrolling; smooth scrolls to top on click.
  ------------------------------------------------------------------------ */
  function initBackToTop() {
    const btn = $("#toTop");
    if (!btn) return;

    const THRESHOLD = 500;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        btn.classList.toggle("show", window.scrollY > THRESHOLD);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ------------------------------------------------------------------------
     SMOOTH ANCHOR SCROLL (fallback for browsers without scroll-behavior)
     Also closes mobile menu after navigating.
  ------------------------------------------------------------------------ */
  function initSmoothAnchors() {
    const supportsSmooth = "scrollBehavior" in document.documentElement.style;
    if (supportsSmooth) return; // CSS handles it natively

    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (id === "#" || id.length < 2) return;

        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();

        const headerH = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue("--header-h"),
          10
        ) || 86;

        const top = target.getBoundingClientRect().top + window.scrollY - headerH + 2;

        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  }

  /* ------------------------------------------------------------------------
     YEAR IN FOOTER
     Keeps the copyright year current without editing HTML.
  ------------------------------------------------------------------------ */
  function initYear() {
    const yearEl = $("#year");
    if (!yearEl) return;
    const currentYear = new Date().getFullYear();
    // Keep the requested 2026 as a minimum (client brand year)
    yearEl.textContent = Math.max(currentYear, 2026);
  }

  /* ------------------------------------------------------------------------
     IMAGE LAZY-FALLBACK
     Adds a subtle fade-in once each image has loaded.
  ------------------------------------------------------------------------ */
  function initImageFade() {
    const imgs = $$("img");
    if (!imgs.length) return;

    imgs.forEach((img) => {
      if (img.complete) return;

      img.style.opacity = "0";
      img.style.transition = "opacity 0.7s ease";

      const show = () => {
        img.style.opacity = "1";
      };

      img.addEventListener("load", show, { once: true });
      img.addEventListener("error", show, { once: true });
    });
  }

  /* ------------------------------------------------------------------------
     INIT
  ------------------------------------------------------------------------ */
  function init() {
    initPreloader();
    initStickyHeader();
    initMobileNav();
    initReveal();
    initCounters();
    initTestimonials();
    initScrollSpy();
    initBackToTop();
    initSmoothAnchors();
    initYear();
    initImageFade();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();