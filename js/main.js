/* ==========================================================================
   Alpine Ascents — main.js
   Navbar, theme toggle, hero slider, ticker, visitor counter,
   scroll-reveal, FAQ accordion, records pagination, gallery + lightbox.
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initPreloader();
    initTheme();
    initNavbar();
    initHeroSlider();
    initTicker();
    initFaq();
    initRecordsPagination();
    initGallery();
    initContactForm();
    initYear();
  });

  /* ---------------- Preloader ---------------- */
  function initPreloader() {
    var pre = document.getElementById("preloader");
    if (!pre) return;
    window.addEventListener("load", function () {
      setTimeout(function () { pre.classList.add("hide"); }, 120);
    });
  }

  /* ---------------- Theme (dark / light) ---------------- */
  function initTheme() {
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem("aa-theme"); } catch (e) {}
    var theme = saved || "light"; // default is light; visitor can switch to dark
    root.setAttribute("data-theme", theme);
    updateToggleIcon(theme);

    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var current = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", current);
        try { localStorage.setItem("aa-theme", current); } catch (e) {}
        updateToggleIcon(current);
      });
    });

    function updateToggleIcon(t) {
      document.querySelectorAll(".theme-toggle i").forEach(function (icon) {
        icon.className = t === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
      });
    }
  }

  /* ---------------- Navbar: scroll shrink + active link + mobile close ---------------- */
  function initNavbar() {
    var nav = document.querySelector(".navbar-custom");
    if (nav) {
      window.addEventListener("scroll", function () {
        nav.classList.toggle("scrolled", window.scrollY > 40);
      });
    }

    var links = document.querySelectorAll(".nav-link-custom[href^='#']");
    var sections = [];
    links.forEach(function (l) {
      var id = l.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) sections.push({ id: id, el: sec, link: l });
    });

    function onScrollSpy() {
      var pos = window.scrollY + 140;
      var current = sections[0];
      sections.forEach(function (s) {
        if (pos >= s.el.offsetTop) current = s;
      });
      links.forEach(function (l) { l.classList.remove("active"); });
      if (current) current.link.classList.add("active");
    }
    if (sections.length) {
      window.addEventListener("scroll", onScrollSpy);
      onScrollSpy();
    }

    // collapse mobile menu after clicking a link
    var collapseEl = document.getElementById("mainNavbar");
    var togglerIcon = document.querySelector(".navbar-toggler i");
    if (collapseEl && window.bootstrap) {
      // (the "Mountaineering" dropdown toggle is skipped: tapping it must open its submenu, not close the menu)
      document.querySelectorAll("#mainNavbar .nav-link-custom:not(.dropdown-toggle), #mainNavbar .dropdown-item").forEach(function (a) {
        a.addEventListener("click", function () {
          var bsCollapse = window.bootstrap.Collapse.getInstance(collapseEl);
          if (bsCollapse && window.innerWidth < 1200) bsCollapse.hide();
        });
      });
      // hamburger <-> close icon swap + background scroll lock for the full-screen mobile menu
      collapseEl.addEventListener("show.bs.collapse", function () {
        if (togglerIcon) togglerIcon.className = "bi bi-x-lg fs-4";
        document.body.style.overflow = "hidden";
      });
      collapseEl.addEventListener("hide.bs.collapse", function () {
        if (togglerIcon) togglerIcon.className = "bi bi-list fs-2";
        document.body.style.overflow = "";
      });
    }
  }

  /* ---------------- Hero Slider (autoplay + manual, 3D parallax tilt) ---------------- */
  function initHeroSlider() {
    var slider = document.querySelector(".hero-slider");
    if (!slider) return;
    var slides = slider.querySelectorAll(".hero-slide");
    var dotsWrap = slider.querySelector(".hero-dots");
    var idx = 0, timer = null;
    var AUTOPLAY_MS = 6500;

    slides.forEach(function (s, i) {
      var dot = document.createElement("div");
      dot.className = "hero-dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", function () { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll(".hero-dot");

    function goTo(i) {
      slides[idx].classList.remove("active");
      dots[idx].classList.remove("active");
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add("active");
      dots[idx].classList.add("active");
      slider.dispatchEvent(new CustomEvent("heroSlideChange", { detail: { slide: slides[idx], index: idx } }));
    }
    function next() { if (document.documentElement.classList.contains("auth-open")) return; goTo(idx + 1); } // don't animate behind the login popup
    function prev() { goTo(idx - 1); }
    function restart() { clearInterval(timer); timer = setInterval(next, AUTOPLAY_MS); }

    var nextBtn = slider.querySelector(".hero-nav-next");
    var prevBtn = slider.querySelector(".hero-nav-prev");
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restart(); });

    // pause on hover, resume on leave
    slider.addEventListener("mouseenter", function () { clearInterval(timer); });
    slider.addEventListener("mouseleave", restart);

    // swipe support
    var touchStartX = 0;
    slider.addEventListener("touchstart", function (e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    slider.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); restart(); }
    }, { passive: true });

    restart();
    slider.dispatchEvent(new CustomEvent("heroSlideChange", { detail: { slide: slides[idx], index: idx } }));
  }

  /* ---------------- Ticker: live date/time + geolocation ---------------- */
  function initTicker() {
    var dateEl = document.getElementById("tickerDate");
    var timeEl = document.getElementById("tickerTime");
    var locEl = document.getElementById("tickerLocation");
    if (!dateEl && !timeEl && !locEl) return;

    function tick() {
      var now = new Date();
      if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      if (timeEl) timeEl.textContent = now.toLocaleTimeString();
    }
    tick();
    setInterval(tick, 1000);

    if (locEl) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (pos) {
          var lat = pos.coords.latitude.toFixed(2), lon = pos.coords.longitude.toFixed(2);
          locEl.textContent = "Lat " + lat + ", Lon " + lon;
          fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + pos.coords.latitude + "&longitude=" + pos.coords.longitude + "&localityLanguage=en")
            .then(function (r) { return r.json(); })
            .then(function (data) {
              var place = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(Boolean).join(", ");
              if (place) locEl.textContent = place;
            })
            .catch(function () { /* keep lat/lon fallback */ });
        }, function () {
          locEl.textContent = "Location unavailable — enable location access to see your position";
        }, { timeout: 8000 });
      } else {
        locEl.textContent = "Geolocation not supported by this browser";
      }
    }
  }

  /* ---------------- FAQ accordion (plus / close) ---------------- */
  function initFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var q = item.querySelector(".faq-question");
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        item.closest(".faq-list").querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
        if (!isOpen) item.classList.add("open");
      });
    });
  }

  /* ---------------- Records table pagination ---------------- */
  function initRecordsPagination() {
    var rows = document.querySelectorAll("#recordsTable tbody tr");
    var pager = document.getElementById("recordsPager");
    if (!rows.length || !pager) return;
    var perPage = 4;
    var pageCount = Math.ceil(rows.length / perPage);
    var current = 1;

    function render() {
      rows.forEach(function (row, i) {
        var page = Math.floor(i / perPage) + 1;
        row.style.display = page === current ? "" : "none";
      });
      pager.innerHTML = "";
      addBtn("«", current - 1, current === 1);
      for (var p = 1; p <= pageCount; p++) {
        addBtn(String(p), p, false, p === current);
      }
      addBtn("»", current + 1, current === pageCount);
    }
    function addBtn(label, target, disabled, active) {
      var b = document.createElement("div");
      b.className = "page-btn" + (disabled ? " disabled" : "") + (active ? " active" : "");
      b.textContent = label;
      if (!disabled) {
        b.addEventListener("click", function () {
          current = Math.min(Math.max(1, target), pageCount);
          render();
          document.getElementById("records").scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      pager.appendChild(b);
    }
    render();
  }

  /* ---------------- Gallery filter + lightbox ---------------- */
  function initGallery() {
    var items = document.querySelectorAll(".gallery-item");
    if (!items.length) return;
    var filterBtns = document.querySelectorAll(".gallery-filters .filter-btn");
    var perPage = 6;
    var current = 1;
    var activeFilter = "all";

    function getFiltered() {
      return Array.prototype.filter.call(items, function (it) {
        return activeFilter === "all" || it.dataset.type === activeFilter;
      });
    }
    function render() {
      var filtered = getFiltered();
      items.forEach(function (it) { it.classList.remove("show"); });
      var pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
      if (current > pageCount) current = pageCount;
      filtered.forEach(function (it, i) {
        var page = Math.floor(i / perPage) + 1;
        if (page === current) it.classList.add("show");
      });
      renderPager(pageCount);
      // tile videos loop directly in the grid; only the visible page's videos play
      items.forEach(function (it) {
        var v = it.querySelector(".gallery-thumb video");
        if (!v) return;
        if (it.classList.contains("show")) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else v.pause();
      });
    }
    function renderPager(pageCount) {
      var pager = document.getElementById("galleryPager");
      if (!pager) return;
      pager.innerHTML = "";
      if (pageCount <= 1) return;
      var addBtn = function (label, target, disabled, active) {
        var b = document.createElement("div");
        b.className = "page-btn" + (disabled ? " disabled" : "") + (active ? " active" : "");
        b.textContent = label;
        if (!disabled) b.addEventListener("click", function () { current = target; render(); });
        pager.appendChild(b);
      };
      addBtn("«", current - 1, current === 1);
      for (var p = 1; p <= pageCount; p++) addBtn(String(p), p, false, p === current);
      addBtn("»", current + 1, current === pageCount);
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        current = 1;
        render();
      });
    });

    // lightbox
    var overlay = document.getElementById("lightboxOverlay");
    var content = overlay ? overlay.querySelector(".lb-content") : null;
    items.forEach(function (it) {
      it.querySelector(".gallery-thumb").addEventListener("click", function () {
        if (!overlay) return;
        var type = it.dataset.type;
        if (type === "video" && it.dataset.videoSrc) {
          content.innerHTML = '<video src="' + it.dataset.videoSrc + '" controls autoplay loop playsinline></video>';
        } else if (type === "video") {
          content.innerHTML = '<iframe src="https://www.youtube.com/embed/' + it.dataset.video + '?autoplay=1&rel=0" title="Gallery video" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
        } else {
          content.innerHTML = '<img src="' + it.dataset.full + '" alt="Mountaineering gallery image">';
        }
        overlay.classList.add("show");
        document.querySelectorAll(".gallery-thumb video").forEach(function (v) { v.pause(); });
        document.body.style.overflow = "hidden";
      });
    });
    if (overlay) {
      function closeLightbox() {
        overlay.classList.remove("show");
        content.innerHTML = ""; // also stops a playing video
        render(); // resume the looping tile videos
        document.body.style.overflow = "";
      }
      overlay.addEventListener("click", function (e) {
        // closest() because the click usually lands on the <i> icon inside the X button
        if (e.target === overlay || e.target.closest(".lightbox-close")) closeLightbox();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.classList.contains("show")) closeLightbox();
      });
    }

    render();
  }

  /* ---------------- Contact form (static demo) ---------------- */
  function initContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type='submit']");
      var original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Message Sent!';
      form.reset();
      setTimeout(function () { btn.disabled = false; btn.innerHTML = original; }, 2600);
    });
  }

  function initYear() {
    var y = document.getElementById("currentYear");
    if (y) y.textContent = new Date().getFullYear();
  }
})();
