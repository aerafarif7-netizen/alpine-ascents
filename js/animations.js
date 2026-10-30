/* ==========================================================================
   Alpine Ascents — animations.js
   GSAP + ScrollTrigger: hero word-reveal, scroll-triggered section reveals,
   animated counters, tab/FAQ/lightbox polish, pointer-reactive card tilt.
   Falls back to instant-visible (no animation) if GSAP failed to load or the
   visitor prefers reduced motion — the site stays fully usable either way.
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof gsap === "undefined") { showAllReveals(); return; } // fallback: content stays visible without GSAP

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      showAllReveals();
      gsap.set(".reveal, .hero-slide-tag, .hero-content p, .hero-content .hero-btns", { opacity: 1, y: 0 });
      gsap.set(".hero-content h1 .word", { opacity: 1, y: 0 });
      document.querySelectorAll(".num[data-count]").forEach(function (el) {
        el.textContent = el.dataset.count + (el.dataset.suffix || "");
      });
      return;
    }

    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger); else showAllReveals();

    initNavbarEntrance();
    initHeroWordSplit();
    initHeroTimeline();
    initHeroParallax();
    initScrollReveals();
    initCounters();
    initTabTransitions();
    initFaqFade();
    initLightboxPop();
    initCardTilt();
    initRecordsRowStagger();
    initChatbotPop();
    window.aaAuthEntrance = initAuthEntrance;
  });

  function showAllReveals() {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------- Navbar drop-in ---------------- */
  function initNavbarEntrance() {
    var nav = document.querySelector(".navbar-custom");
    if (!nav) return;
    gsap.from(nav, { y: -90, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.05 });
  }

  /* ---------------- Hero: split headline into per-word masked spans ---------------- */
  function initHeroWordSplit() {
    document.querySelectorAll(".hero-content h1").forEach(function (h1) {
      if (h1.dataset.split) return;
      var words = h1.textContent.trim().split(/\s+/);
      h1.innerHTML = words.map(function (w) {
        return '<span class="word-mask"><span class="word">' + w + "</span></span>";
      }).join(" ");
      h1.dataset.split = "1";
    });
  }

  /* ---------------- Hero: per-slide entrance timeline ---------------- */
  function initHeroTimeline() {
    var slider = document.querySelector(".hero-slider");
    if (!slider) return;

    function playSlide(slideEl) {
      if (!slideEl) return;
      var tag = slideEl.querySelector(".hero-slide-tag");
      var words = slideEl.querySelectorAll(".hero-content h1 .word");
      var para = slideEl.querySelector(".hero-content p");
      var btns = slideEl.querySelector(".hero-content .hero-btns");

      gsap.set([tag, para, btns], { opacity: 0, y: 24 });
      gsap.set(words, { opacity: 0, y: "100%" });

      var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(tag, { opacity: 1, y: 0, duration: 0.4 }, 0.05)
        .to(words, { opacity: 1, y: "0%", duration: 0.5, stagger: 0.025 }, 0.15)
        .to(para, { opacity: 1, y: 0, duration: 0.45 }, "-=0.25")
        .to(btns, { opacity: 1, y: 0, duration: 0.45 }, "-=0.3");
    }

    slider.addEventListener("heroSlideChange", function (e) { playSlide(e.detail.slide); });
    // first slide: fire almost immediately so the reveal is never left waiting
    setTimeout(function () { playSlide(slider.querySelector(".hero-slide.active")); }, 150);
  }

  /* ---------------- Hero: GSAP-driven cursor parallax on the active Ken Burns layer ---------------- */
  function initHeroParallax() {
    var slider = document.querySelector(".hero-slider");
    if (!slider) return;
    slider.addEventListener("mousemove", function (e) {
      var kb = slider.querySelector(".hero-slide.active .kenburns");
      if (!kb) return;
      var rect = slider.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(kb, { x: -x * 22, y: -y * 22, scale: 1.08, duration: 0.8, ease: "power2.out", overwrite: "auto" });
    });
    slider.addEventListener("mouseleave", function () {
      var kb = slider.querySelector(".hero-slide.active .kenburns");
      if (kb) gsap.to(kb, { x: 0, y: 0, scale: 1.08, duration: 0.6, ease: "power2.out", overwrite: "auto" });
    });
  }

  /* ---------------- Scroll-triggered reveals (replaces the old IntersectionObserver version) ---------------- */
  function initScrollReveals() {
    if (!window.ScrollTrigger) return;
    ScrollTrigger.batch(".reveal", {
      start: "top 90%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, overwrite: true });
      }
    });
  }

  /* ---------------- Animated stat counters ---------------- */
  function initCounters() {
    var nums = document.querySelectorAll(".stat-item .num[data-count]");
    if (!nums.length) return;
    var trigger = window.ScrollTrigger ? { trigger: ".stats-strip", start: "top 85%", once: true } : null;

    function run() {
      nums.forEach(function (el) {
        var target = parseFloat(el.dataset.count);
        var suffix = el.dataset.suffix || "";
        var obj = { val: 0 };
        gsap.to(obj, {
          val: target, duration: 1.1, ease: "power2.out",
          onUpdate: function () { el.textContent = Math.round(obj.val) + suffix; }
        });
      });
    }
    if (trigger) {
      ScrollTrigger.create({ trigger: trigger.trigger, start: trigger.start, once: true, onEnter: run });
    } else {
      run();
    }
  }

  /* ---------------- Mountaineering topic tab transitions ---------------- */
  function initTabTransitions() {
    document.querySelectorAll('#topicTabs button[data-bs-toggle="tab"]').forEach(function (btn) {
      btn.addEventListener("shown.bs.tab", function (e) {
        var pane = document.querySelector(e.target.getAttribute("data-bs-target") + " .topic-pane");
        if (!pane) return;
        gsap.fromTo(pane, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" });
      });
    });
  }

  /* ---------------- FAQ answer fade-in (complements the CSS max-height slide) ---------------- */
  function initFaqFade() {
    document.querySelectorAll(".faq-question").forEach(function (q) {
      q.addEventListener("click", function () {
        var item = q.closest(".faq-item");
        if (item.classList.contains("open")) {
          var inner = item.querySelector(".faq-answer-inner");
          gsap.fromTo(inner, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.45, delay: 0.08, ease: "power2.out" });
        }
      });
    });
  }

  /* ---------------- Gallery lightbox pop-in ---------------- */
  function initLightboxPop() {
    var overlay = document.getElementById("lightboxOverlay");
    if (!overlay) return;
    document.querySelectorAll(".gallery-thumb").forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var content = overlay.querySelector(".lb-content");
        gsap.fromTo(content, { opacity: 0, scale: 0.85, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" });
      });
    });
  }

  /* ---------------- Pointer-reactive 3D tilt for feature cards ---------------- */
  function initCardTilt() {
    var cards = document.querySelectorAll(".dev-card, .story-card");
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, { rotateY: px * 10, rotateX: -py * 10, y: -6, duration: 0.5, ease: "power2.out", transformPerspective: 800 });
      });
      card.addEventListener("mouseleave", function () {
        gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.6, ease: "power3.out" });
      });
    });
  }

  /* ---------------- Records table rows stagger in once, on first scroll into view ---------------- */
  function initRecordsRowStagger() {
    var wrap = document.querySelector(".records-table-wrap");
    var rows = document.querySelectorAll("#recordsTable tbody tr");
    if (!wrap || !rows.length || !window.ScrollTrigger) return;
    gsap.set(rows, { opacity: 0, x: -24 });
    ScrollTrigger.create({
      trigger: wrap, start: "top 80%", once: true,
      onEnter: function () { gsap.to(rows, { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" }); }
    });
  }

  /* ---------------- Login / Signup card entrance ---------------- */
  function initAuthEntrance() {
    var card = document.querySelector(".auth-card");
    if (!card) return;
    gsap.fromTo(card, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", clearProps: "all" });
  }

  /* ---------------- Chatbot window: elastic pop on open ---------------- */
  function initChatbotPop() {
    var toggle = document.getElementById("chatbotToggle");
    var win = document.getElementById("chatbotWindow");
    if (!toggle || !win) return;
    toggle.addEventListener("click", function () {
      if (win.classList.contains("show")) {
        gsap.fromTo(win, { scale: 0.9, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.6)" });
      }
    });
  }
})();
