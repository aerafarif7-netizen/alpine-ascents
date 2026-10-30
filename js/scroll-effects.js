/* ==========================================================================
   Alpine Ascents — scroll-effects.js
   Scroll-based animations (GSAP ScrollTrigger):
   progress bar, hero parallax fade, split-word section titles, About image
   wipe + parallax, slide-in columns, staggered cards, guideline/FAQ cascades,
   contact + footer reveals.
   Loaded BEFORE animations.js so the elements handled here are taken out of the
   generic ".reveal" fade-up. Skipped completely for reduced-motion visitors, and
   if GSAP is missing the site simply shows everything.
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof gsap === "undefined" || !window.ScrollTrigger) return;
    if (!document.getElementById("home")) return; // long home page only
    gsap.registerPlugin(ScrollTrigger);

    initProgressBar();
    initHeroScroll();
    initSectionHeaders();
    initAbout();
    initCards();
    initGuidelines();
    initFaq();
    initContactFooter();
    initStatsStrip();

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  });

  /* take an element out of the generic .reveal fade-up so it can be animated here */
  function own(el) {
    if (!el) return el;
    el.classList.remove("reveal");
    el.style.opacity = "";
    el.style.transform = "";
    return el;
  }
  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* ---------- 1. top progress bar ---------- */
  function initProgressBar() {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    gsap.to(bar, {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 }
    });
  }

  /* ---------- 2. hero content drifts up + fades while you scroll away ---------- */
  function initHeroScroll() {
    var hero = document.querySelector(".hero-slider");
    if (!hero) return;
    var st = { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 };
    gsap.to(".hero-slide .hero-content", { y: 140, opacity: 0.0, ease: "none", scrollTrigger: st });
    gsap.to(".hero-dots, .hero-nav-btn", { opacity: 0, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "40% top", scrub: true } });
  }

  /* ---------- 3. section headers: eyebrow drops in, title words rise from a mask, subtitle fades ---------- */
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    var spans = [];
    words.forEach(function (w, i) {
      var mask = document.createElement("span");
      mask.className = "sw-mask";
      var inner = document.createElement("span");
      inner.className = "sw";
      inner.textContent = w;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      spans.push(inner);
    });
    return spans;
  }

  function initSectionHeaders() {
    all("section .text-center.reveal").forEach(function (head) {
      var eyebrow = head.querySelector(".eyebrow");
      var title = head.querySelector(".section-title");
      var sub = head.querySelector(".section-sub");
      if (!eyebrow || !title) return; // e.g. the plain <h4> heading keeps the default reveal
      own(head);
      var words = splitWords(title);
      var tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: head, start: "top 82%", once: true }
      });
      tl.from(eyebrow, { y: -18, opacity: 0, duration: 0.5 })
        .from(words, { yPercent: 110, opacity: 0, duration: 0.7, stagger: 0.07 }, "-=0.25");
      if (sub) tl.from(sub, { y: 18, opacity: 0, duration: 0.6 }, "-=0.35");
    });
  }

  /* ---------- 4. About: text slides from the left, photo is wiped open + parallax ---------- */
  function initAbout() {
    var cols = all("#about .row > .col-lg-6");
    if (cols.length < 2) return;
    var textCol = own(cols[0]), imgCol = own(cols[1]);
    var img = imgCol.querySelector("img");

    gsap.from(textCol.children, {
      x: -70, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: textCol, start: "top 80%", once: true }
    });

    if (img) {
      gsap.fromTo(img,
        { clipPath: "inset(0 100% 0 0 round 24px)", scale: 1.18 },
        { clipPath: "inset(0 0% 0 0 round 24px)", scale: 1, duration: 1.3, ease: "power3.inOut",
          scrollTrigger: { trigger: imgCol, start: "top 80%", once: true } });
      // gentle scroll-linked parallax on the wrapper (not the img, so the wipe stays untouched)
      gsap.fromTo(imgCol, { y: 40 }, { y: -40, ease: "none",
        scrollTrigger: { trigger: "#about", start: "top bottom", end: "bottom top", scrub: 0.8 } });
    }

    // the tab section below: tabs pop in one by one, panel rises
    var tabs = all("#topicTabs .nav-item");
    var tabsWrap = own(document.getElementById("topicTabs"));
    if (tabs.length) gsap.from(tabs, { y: 26, opacity: 0, scale: 0.9, duration: 0.5, ease: "back.out(1.6)", stagger: 0.08,
      scrollTrigger: { trigger: "#mountaineering .tab-content, #topicTabs", start: "top 88%", once: true } });
    var panel = own(document.querySelector("#mountaineering .tab-content"));
    if (panel) gsap.from(panel, { y: 60, opacity: 0, scale: 0.97, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: panel, start: "top 90%", once: true } });
  }

  /* ---------- 5. cards: staggered pop-ins, alternate directions ---------- */
  function initCards() {
    // Latest developments — cards pop up with a slight rotation, icons spin in
    var dev = all("#latest .row > .col-md-4.reveal").map(own);
    if (dev.length) {
      gsap.from(dev, { y: 70, opacity: 0, rotate: 2.5, scale: 0.94, duration: 0.8, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: "#latest .row.g-4", start: "top 85%", once: true } });
      gsap.from("#latest .icon-box", { rotate: -180, scale: 0, duration: 0.8, ease: "back.out(1.8)", stagger: 0.12, delay: 0.25,
        scrollTrigger: { trigger: "#latest .row.g-4", start: "top 85%", once: true } });
    }

    // Organizations — map cards rise, story cards swing in from the sides
    var maps = all("#organizations .map-card").map(function (m) { return own(m.parentElement); });
    if (maps.length) gsap.from(maps, { y: 80, opacity: 0, duration: 0.85, ease: "power3.out", stagger: 0.15,
      scrollTrigger: { trigger: maps[0], start: "top 88%", once: true } });

    var stories = all("#organizations .story-card").map(function (m) { return own(m.parentElement); });
    stories.forEach(function (col, i) {
      var from = i === 0 ? -80 : (i === 2 ? 80 : 0);
      gsap.from(col, { x: from, y: from === 0 ? 70 : 0, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: col, start: "top 90%", once: true } });
    });
  }

  /* ---------- 6. Guidelines: left column slides in, the six steps cascade from the right ---------- */
  function initGuidelines() {
    var left = own(document.querySelector("#guidelines .col-lg-5.reveal"));
    var right = own(document.querySelector("#guidelines .col-lg-7.reveal"));
    if (left) gsap.from(left.children, { x: -60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: left, start: "top 80%", once: true } });
    if (!right) return;

    all("#guidelines .guideline-item").forEach(function (item) {
      gsap.from(item, { x: 90, opacity: 0, duration: 0.75, ease: "power3.out",
        scrollTrigger: { trigger: item, start: "top 90%", once: true } });
      var num = item.querySelector(".num");
      if (num) gsap.from(num, { scale: 0, rotate: -90, duration: 0.6, ease: "back.out(2)", delay: 0.2,
        scrollTrigger: { trigger: item, start: "top 90%", once: true } });
    });
  }

  /* ---------- 7. FAQ: questions cascade up one by one ---------- */
  function initFaq() {
    own(document.querySelector("#faq .row.justify-content-center.reveal"));
    var items = all("#faq .faq-item");
    if (!items.length) return;
    gsap.from(items, { y: 50, opacity: 0, duration: 0.65, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: "#faq .faq-list", start: "top 85%", once: true } });
  }

  /* ---------- 8. Contact + footer ---------- */
  function initContactFooter() {
    var left = own(document.querySelector("#contact .col-lg-5.reveal"));
    var right = own(document.querySelector("#contact .col-lg-7.reveal"));
    if (left) gsap.from(left.children, { x: -60, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: left, start: "top 82%", once: true } });
    if (right) gsap.from(right, { x: 80, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: right, start: "top 85%", once: true } });

    var cols = all(".site-footer .row.g-4 > div");
    if (cols.length) gsap.from(cols, { y: 40, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: ".site-footer", start: "top 92%", once: true } });
  }

  /* ---------- 9. Stats strip: the four numbers rise one after another ---------- */
  function initStatsStrip() {
    var items = all(".stats-strip .stat-item");
    if (items.length) gsap.from(items, { y: 40, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: ".stats-strip", start: "top 95%", once: true } });
  }
})();
