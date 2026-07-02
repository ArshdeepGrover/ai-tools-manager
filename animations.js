/* ============================================================
   AI TOOLS HUB — Scroll effects & entrance animations
   Non-invasive: enhances the existing UI without touching data logic.
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mark that JS-driven animations are active. Gating the initial hidden
  // states on this class keeps all content visible if this file fails to load.
  document.documentElement.classList.add("js-ready");

  /* ---------- Scroll progress bar ---------- */
  function initScrollProgress() {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;
    const update = () => {
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- Sticky nav "scrolled" state ---------- */
  function initNavScroll() {
    const nav = document.getElementById("main-nav");
    if (!nav) return;
    const update = () => {
      if (window.scrollY > 24) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const revealEls = document.querySelectorAll(".reveal");
    if (prefersReduced) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    if (!("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ---------- Animated number counters (hero stats) ---------- */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.count || "0");
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach((el) => {
        el.textContent = (el.dataset.count || "0") + (el.dataset.suffix || "");
      });
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 },
    );
    counters.forEach((el) => observer.observe(el));
  }

  /* ---------- Reveal dynamically rendered tool cards ---------- */
  function initToolCardReveal() {
    const main = document.getElementById("main-content");
    if (!main) return;

    const cardObserver =
      "IntersectionObserver" in window && !prefersReduced
        ? new IntersectionObserver(
            (entries, obs) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  const delay = parseInt(
                    entry.target.dataset.revealDelay || "0",
                    10,
                  );
                  setTimeout(
                    () => entry.target.classList.add("card-in"),
                    delay,
                  );
                  obs.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
          )
        : null;

    const process = () => {
      const cards = main.querySelectorAll(".card-hover:not([data-observed])");
      cards.forEach((card, i) => {
        card.setAttribute("data-observed", "1");
        // stagger cards within the same batch
        card.dataset.revealDelay = String((i % 6) * 70);
        if (cardObserver) cardObserver.observe(card);
        else card.classList.add("card-in");
      });
    };

    // Initial pass + observe future re-renders (search/filter/show-more)
    process();
    const mo = new MutationObserver(() => process());
    mo.observe(main, { childList: true, subtree: true });
  }

  /* ---------- Subtle parallax on hero orbs ---------- */
  function initHeroParallax() {
    if (prefersReduced) return;
    const orbs = document.querySelectorAll(".hero-orb");
    if (!orbs.length) return;
    const hero = document.querySelector(".hero-section");
    if (!hero) return;
    hero.addEventListener(
      "mousemove",
      (e) => {
        const rect = hero.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        orbs.forEach((orb, i) => {
          const depth = (i + 1) * 14;
          orb.style.translate = `${cx * depth}px ${cy * depth}px`;
        });
      },
      { passive: true },
    );
  }

  function init() {
    initScrollProgress();
    initNavScroll();
    initReveal();
    initCounters();
    initToolCardReveal();
    initHeroParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
