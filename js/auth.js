/* ==========================================================================
   Alpine Ascents — auth.js
   Working demo authentication (no server): accounts are stored in the
   visitor's own browser (localStorage), so
     - Sign Up really creates an account (duplicate emails are rejected)
     - Login only works with an email + password that was signed up
     - the navbar shows the logged-in user + a Logout button
   Passwords are stored hashed (SHA-256) — still a front-end demo, not real security.
   ========================================================================== */
(function () {
  "use strict";

  var USERS_KEY = "aa-users";
  var SESSION_KEY = "aa-session";

  /* ---------- tiny storage helpers (never crash if storage is blocked) ---------- */
  function read(store, key, fallback) {
    try { var v = store.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function write(store, key, val) { try { store.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function getUsers() { return read(window.localStorage, USERS_KEY, []); }
  function getSession() { return read(window.localStorage, SESSION_KEY, null) || read(window.sessionStorage, SESSION_KEY, null); }
  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function hashPassword(email, pw) {
    var text = "aa::" + email + "::" + pw;
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      });
    }
    return Promise.resolve("b64:" + btoa(unescape(encodeURIComponent(text)))); // fallback for very old browsers
  }

  document.addEventListener("DOMContentLoaded", function () {
    initModeSwitch();
    handleSignup();
    handleLogin();
    handleForgot();
    applyAuthUI();
    showQueryToast();
  });

  /* ---------- UI helpers ---------- */
  function setLoading(btn, label) {
    btn.dataset.original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>' + label;
  }
  function resetBtn(btn) {
    btn.disabled = false;
    if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
  }
  function showAlert(msg, type) {
    var box = document.getElementById("authAlert");
    if (!box) return;
    box.textContent = msg;
    box.className = "auth-alert" + (type === "info" ? " info" : "");
    box.hidden = false;
  }
  function hideAlert() {
    var box = document.getElementById("authAlert");
    if (box) box.hidden = true;
  }
  function showToast(text) {
    var toast = document.getElementById("toastMsg");
    if (!toast || !text) return;
    toast.querySelector("span").textContent = text;
    requestAnimationFrame(function () {
      toast.classList.add("show");
      setTimeout(function () { toast.classList.remove("show"); }, 4500);
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Login / Sign Up popup + switch (all inside index.html) ---------- */
  var setAuthMode = function () {};
  function initModeSwitch() {
    var modal = document.getElementById("authModal");
    var card = document.getElementById("authCard");
    if (!modal || !card) return;
    var root = document.documentElement;

    function setMode(mode, updateHash) {
      if (mode !== "signup") mode = "login";
      card.setAttribute("data-mode", mode);
      card.querySelectorAll(".auth-panel, .av-text [data-for]").forEach(function (el) {
        el.hidden = el.getAttribute("data-for") !== mode;
      });
      card.querySelectorAll(".auth-tab").forEach(function (t) {
        t.classList.toggle("active", t.getAttribute("data-mode") === mode);
      });
      hideAlert();
      if (updateHash && !modal.hidden && window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search + "#" + mode);
      }
    }
    setAuthMode = setMode;

    function openModal(mode) {
      setMode(mode, false);
      var wasHidden = modal.hidden;
      modal.hidden = false;
      root.classList.add("auth-open");
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search + "#" + (mode === "signup" ? "signup" : "login"));
      }
      if (wasHidden && window.gsap && window.aaAuthEntrance) { try { window.aaAuthEntrance(); } catch (e) {} }
    }
    function closeModal() {
      if (modal.hidden) return;
      modal.hidden = true;
      root.classList.remove("auth-open");
      if (window.history && window.history.replaceState && /^#(login|signup)$/.test(window.location.hash)) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    }

    // any Login / Sign Up link or button on the page opens the popup
    document.addEventListener("click", function (e) {
      var opener = e.target.closest && e.target.closest("[data-auth-open]");
      if (opener) { e.preventDefault(); openModal(opener.getAttribute("data-auth-open")); return; }
      if (e.target.closest && e.target.closest("[data-auth-close]")) { e.preventDefault(); closeModal(); return; }
      if (!modal.hidden && (e.target === modal || (e.target.classList && e.target.classList.contains("auth-wrap")))) closeModal();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

    // tabs + "Sign Up / Login" text links inside the card
    card.querySelectorAll(".auth-tab, .auth-switch").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); setMode(el.getAttribute("data-mode"), true); });
    });

    window.addEventListener("hashchange", function () {
      if (window.location.hash === "#signup") openModal("signup");
      else if (window.location.hash === "#login") openModal("login");
    });
    if (window.location.hash === "#signup") openModal("signup");
    else if (window.location.hash === "#login") openModal("login");

    window.aaOpenAuth = openModal;
    window.aaCloseAuth = closeModal;
  }

  /* ---------- Sign up ---------- */
  function handleSignup() {
    var form = document.getElementById("signupForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hideAlert();
      if (!form.checkValidity()) { form.classList.add("was-validated"); return; }
      var inputs = form.querySelectorAll("input.form-control");
      var name = inputs[0].value.trim();
      var email = inputs[1].value.trim().toLowerCase();
      var pw = inputs[2].value;
      if (!name) { form.classList.add("was-validated"); return; }

      var users = getUsers();
      var exists = users.some(function (u) { return u.email === email; });
      if (exists) { showAlert("An account with this email already exists. Please log in instead."); return; }

      var btn = form.querySelector("button[type='submit']");
      setLoading(btn, "Creating your account...");
      hashPassword(email, pw).then(function (hash) {
        users.push({ name: name, email: email, pass: hash });
        write(window.localStorage, USERS_KEY, users);
        setTimeout(function () {
          resetBtn(btn);
          form.reset();
          form.classList.remove("was-validated");
          setAuthMode("login", true);
          showAlert("Account created successfully! Please log in to continue.", "info");
          showToast("Account created successfully! Please log in to continue.");
        }, 300);
      }).catch(function () {
        resetBtn(btn);
        showAlert("Sorry, the account could not be saved in this browser.");
      });
    });
  }

  /* ---------- Login ---------- */
  function handleLogin() {
    var form = document.getElementById("loginForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hideAlert();
      if (!form.checkValidity()) { form.classList.add("was-validated"); return; }
      var email = form.querySelector("input[type='email']").value.trim().toLowerCase();
      var pw = form.querySelector("input[type='password']").value;
      var remember = form.querySelector("#remember");

      var user = getUsers().filter(function (u) { return u.email === email; })[0];
      if (!user) { showAlert("No account found with this email. Please sign up first."); return; }

      var btn = form.querySelector("button[type='submit']");
      setLoading(btn, "Signing you in...");
      hashPassword(email, pw).then(function (hash) {
        if (hash !== user.pass) {
          resetBtn(btn);
          showAlert("Incorrect password. Please try again.");
          return;
        }
        var session = { name: user.name, email: user.email };
        write(remember && remember.checked ? window.localStorage : window.sessionStorage, SESSION_KEY, session);
        setTimeout(function () {
          resetBtn(btn);
          form.reset();
          form.classList.remove("was-validated");
          if (window.aaCloseAuth) window.aaCloseAuth();
          applyAuthUI();
          showToast("Login successful — welcome back, " + user.name.split(" ")[0] + "!");
        }, 250);
      });
    });
  }

  function handleForgot() {
    var link = document.getElementById("forgotLink");
    if (!link) return;
    link.addEventListener("click", function (e) {
      e.preventDefault();
      showAlert("Password reset isn't available on this demo site. If you forgot it, sign up again with a different email.", "info");
    });
  }

  /* ---------- Navbar: show logged-in user + Logout (home page) ---------- */
  var originalAuthHTML = null;
  function bindLogout() {
    document.querySelectorAll(".logout-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        clearSession();
        applyAuthUI();
        showToast("You have been logged out.");
      });
    });
  }
  function applyAuthUI() {
    var holders = document.querySelectorAll(".auth-links");
    if (!holders.length) return;
    if (originalAuthHTML === null) originalAuthHTML = Array.prototype.map.call(holders, function (h) { return h.innerHTML; });
    var session = getSession();
    holders.forEach(function (h, i) {
      if (!session) { h.innerHTML = originalAuthHTML[i]; return; }
      var first = escapeHtml(session.name.split(" ")[0]);
      var initial = escapeHtml(session.name.trim().charAt(0).toUpperCase());
      h.innerHTML =
        '<span class="user-chip" title="' + escapeHtml(session.name) + '"><span class="avatar">' + initial + '</span><span class="uname">Hi, ' + first + '</span></span>' +
        '<button type="button" class="btn btn-outline-brand btn-sm logout-btn">Logout <i class="bi bi-box-arrow-right ms-1"></i></button>';
    });
    bindLogout();
  }

  /* ---------- Toast after redirect ---------- */
  function showQueryToast() {
    var params = new URLSearchParams(window.location.search);
    var text = "";
    if (params.get("registered")) text = "Account created successfully! Please log in to continue.";
    if (params.get("login")) {
      var s = getSession();
      text = "Login successful — welcome back" + (s ? ", " + s.name.split(" ")[0] : "") + "!";
    }
    if (params.get("logout")) text = "You have been logged out.";
    if (!text) return;
    showToast(text);
    // clean the URL so a refresh doesn't re-trigger the toast
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
  }
})();
