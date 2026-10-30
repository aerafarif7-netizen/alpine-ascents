/* ==========================================================================
   Alpine Ascents — cursor.js
   Charcoal grey circle cursor: small dot + a ring that trails the mouse.
   Only runs for mouse / trackpad devices; phones and tablets keep normal touch.
   ========================================================================== */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    var root = document.documentElement;
    function make(cls) { var el = document.createElement("div"); el.className = cls; document.body.appendChild(el); return el; }
    var dot = make("cursor-dot"), ring = make("cursor-ring");
    root.classList.add("has-cursor");

    var HOVER = "a, button, .page-btn, .faq-question, .gallery-thumb, .filter-btn, .hero-dot, .hero-nav-btn, .theme-toggle, .lightbox-close, .chatbot-close, label, select, summary, [role='button']";
    var TEXT = "input:not([type='checkbox']):not([type='radio']):not([type='submit']), textarea";
    var mx = -100, my = -100, rx = -100, ry = -100, started = false, lastText = false, lastHover = false;

    var raf = 0;
    function loop() {
      rx += (mx - rx) * 0.35;
      ry += (my - ry) * 0.35;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      // stop the loop once the ring has caught up (no more 60fps work while the mouse is still)
      if (Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1) { raf = 0; return; }
      raf = requestAnimationFrame(loop);
    }

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0) translate(-50%,-50%)";
      if (!started) { started = true; rx = mx; ry = my; }
      if (!raf) raf = requestAnimationFrame(loop);
      root.classList.add("cursor-on");
      var t = e.target;
      if (t && t.closest) {
        var isText = !!t.closest(TEXT);
        var isHover = !isText && !!t.closest(HOVER);
        if (isText !== lastText) { ring.classList.toggle("is-text", isText); lastText = isText; }
        if (isHover !== lastHover) { ring.classList.toggle("is-hover", isHover); lastHover = isHover; }
      }
    }, { passive: true });

    // maps / YouTube live inside iframes where the page cannot follow the mouse: hide the circle there
    document.addEventListener("mouseover", function (e) { if (e.target && e.target.tagName === "IFRAME") root.classList.remove("cursor-on"); });
    document.addEventListener("mouseleave", function () { root.classList.remove("cursor-on"); });
    document.addEventListener("mouseenter", function () { if (started) root.classList.add("cursor-on"); });
    document.addEventListener("mousedown", function () { ring.classList.add("is-down"); });
    document.addEventListener("mouseup", function () { ring.classList.remove("is-down"); });

  });
})();
