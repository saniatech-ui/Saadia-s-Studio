/* ==========================================================================
   SAADIA'S STUDIO & SALON BY SAADIA SAIF — script.js
   Haute Couture Bridal Atelier Interactive Engine
   - Fixed Glassmorphism Header Scroll State & Active Section Scroll Spy
   - Mobile Navigation Drawer with Focus & Escape Handling
   - Interactive Couture Service Filter Tabs (.couture-tab / .couture-service-card)
   - Bridal Date & Appointment Modal -> Direct WhatsApp Concierge (923214602220)
   - Scroll Reveal Observer & Dynamic Copyright Year
   ========================================================================== */

(function () {
  "use strict";

  const WHATSAPP_NUMBER = "923214602220";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ------------------------------------------------------------------------
     FIXED GLASSMORPHISM HEADER SCROLL STATE
  ------------------------------------------------------------------------ */
  function initStickyHeader() {
    const header = $("#siteHeader");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------------
     MOBILE NAVIGATION DRAWER
  ------------------------------------------------------------------------ */
  function initMobileMenu() {
    const toggle = $("#menuToggle");
    const navList = $("#navList");
    if (!toggle || !navList) return;

    const openMenu = () => {
      toggle.classList.add("is-open");
      navList.classList.add("is-open");
      document.body.classList.add("menu-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    const closeMenu = () => {
      toggle.classList.remove("is-open");
      navList.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      navList.classList.contains("is-open") ? closeMenu() : openMenu();
    });

    $$("a, button", navList).forEach((control) => {
      control.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (!navList.classList.contains("is-open")) return;
      if (navList.contains(event.target) || toggle.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navList.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 880 && navList.classList.contains("is-open")) {
        closeMenu();
      }
    });
  }

  /* ------------------------------------------------------------------------
     ACTIVE SECTION SCROLL SPY
  ------------------------------------------------------------------------ */
  function initScrollSpy() {
    const navLinks = $$(".nav-link");
    if (!navLinks.length || !("IntersectionObserver" in window)) return;

    const sections = navLinks
      .map((link) => {
        const href = link.getAttribute("href");
        return href && href.startsWith("#") ? $(href) : null;
      })
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const activeId = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
          });
        });
      },
      {
        rootMargin: "-38% 0px -48% 0px",
        threshold: 0.08
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------------
     INTERACTIVE COUTURE SERVICE FILTER TABS
  ------------------------------------------------------------------------ */
  function initServiceTabs() {
    const tabs = $$(".couture-tab");
    const grid = $("#servicesGrid");
    const cards = $$(".couture-service-card", grid || document);
    if (!tabs.length || !cards.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const filter = tab.dataset.filter || "all";

        tabs.forEach((item) => {
          const isSelected = item === tab;
          item.classList.toggle("active", isSelected);
          item.setAttribute("aria-selected", isSelected ? "true" : "false");
        });

        cards.forEach((card) => {
          const category = card.dataset.category || "";
          const isMatch = filter === "all" || category === filter;
          card.classList.toggle("is-hidden", !isMatch);
          if (isMatch) {
            card.classList.add("is-visible");
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     BRIDAL DATE & APPOINTMENT MODAL -> WHATSAPP CONCIERGE
  ------------------------------------------------------------------------ */
  function initBookingModal() {
    const modal = $("#bookingModal");
    const backdrop = $("#modalBackdrop");
    const closeBtn = $("#modalClose");
    const form = $("#bookingForm");
    const serviceSelect = $("#serviceSelect");
    const dateInput = $("#preferredDate");
    const triggers = $$(".js-open-booking");

    if (!modal || !form) return;

    let lastFocusedElement = null;

    if (dateInput) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      dateInput.min = `${year}-${month}-${day}`;
    }

    const openModal = (presetService) => {
      lastFocusedElement = document.activeElement;

      if (presetService && serviceSelect) {
        const match = Array.from(serviceSelect.options).find((opt) =>
          opt.value.toLowerCase().includes(presetService.toLowerCase())
        );
        if (match) {
          serviceSelect.value = match.value;
        }
      }

      modal.hidden = false;
      document.body.classList.add("modal-open");

      const nameField = $("#clientName");
      if (nameField) {
        setTimeout(() => nameField.focus(), 40);
      }
    };

    const closeModal = () => {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
      }
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        openModal(trigger.dataset.service || "");
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const clientName = ($("#clientName")?.value || "").trim();
      const selectedService =
        serviceSelect?.value || "Signature Bridal Makeup (Baraat, Walima, Nikkah)";
      const rawDate = dateInput?.value || "";
      const timeSlot = $("#timeSlot")?.value || "";
      const notes = ($("#bookingNotes")?.value || "").trim();

      let formattedDate = rawDate;
      if (rawDate) {
        const parsed = new Date(`${rawDate}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) {
          formattedDate = parsed.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
          });
        }
      }

      const messageLines = [
        "Assalam-o-Alaikum Saadia Api! I would like to reserve an appointment at Saadia's Studio & Salon.",
        "",
        `*Client Name:* ${clientName}`,
        `*Couture Service:* ${selectedService}`,
        `*Preferred Date:* ${formattedDate}`,
        `*Time Window:* ${timeSlot}`
      ];

      if (notes) {
        messageLines.push(`*Notes:* ${notes}`);
      }

      const encodedMessage = encodeURIComponent(messageLines.join("\n"));
      const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

      window.open(whatsappHref, "_blank", "noopener,noreferrer");
      closeModal();
    });
  }

  /* ------------------------------------------------------------------------
     SCROLL REVEAL OBSERVER
  ------------------------------------------------------------------------ */
  function initScrollReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -36px 0px"
      }
    );

    items.forEach((item) => observer.observe(item));
  }

  /* ------------------------------------------------------------------------
     DYNAMIC COPYRIGHT YEAR
  ------------------------------------------------------------------------ */
  function initFooterYear() {
    const yearEl = $("#currentYear");
    if (!yearEl) return;
    yearEl.textContent = String(Math.max(new Date().getFullYear(), 2026));
  }

  /* ------------------------------------------------------------------------
     INITIALIZE ATELIER SCRIPTS
  ------------------------------------------------------------------------ */
  function init() {
    initStickyHeader();
    initMobileMenu();
    initScrollSpy();
    initServiceTabs();
    initBookingModal();
    initScrollReveal();
    initFooterYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();