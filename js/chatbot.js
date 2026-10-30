/* ==========================================================================
   Alpine Ascents — Peak Assistant
   Fully functional rule-based AI assistant (keyword matching, no external
   API / no server needed — safe for a static site, works 100% offline).
   ========================================================================== */
(function () {
  "use strict";

  var KB = [
    { keys: ["hello", "hi", "hey", "salam", "assalam"], a: "Hello! 👋 I'm Peak Assistant. Ask me about mountaineering history, techniques, hazards, gear, records, organizations, or how to use this website." },
    { keys: ["history", "origin", "began", "started"], a: "Mountaineering as a sport began in the late 18th century, with the first ascent of Mont Blanc in 1786 usually marked as its birth. It grew into a global sport through the 'golden age' of alpinism in the mid-1800s. Check the History tab in the Mountaineering section for the full story!" },
    { keys: ["type", "style", "styles", "kinds"], a: "Common styles include Alpine climbing, Expedition/Himalayan style, Rock climbing, Ice climbing, and Ski mountaineering. Open the 'Types/Styles' tab above for details on each." },
    { keys: ["technique", "techniques", "skills", "how to climb"], a: "Core techniques include roped climbing, self-arrest with an ice axe, crevasse rescue, belaying, and route-finding. See the Techniques tab for a full breakdown." },
    { keys: ["shelter", "sheltering", "tent", "camp", "bivouac", "bivy"], a: "Shelters range from four-season tents and snow caves to bivouac sacks and mountain huts, chosen based on altitude, weather and expedition length. Full detail is in the Sheltering tab." },
    { keys: ["hazard", "danger", "dangerous", "risk", "avalanche", "crevasse", "altitude sickness", "ams", "frostbite", "hypothermia"], a: "Major hazards include avalanches, crevasses, altitude sickness (AMS/HAPE/HACE), rockfall, and extreme weather. Always check the Hazards tab and follow the General Guidelines before any climb." },
    { keys: ["record", "records", "everest", "k2", "fastest", "youngest", "oldest"], a: "We keep a paginated Records table with milestones like the first ascent of Everest (1953) and K2 (1954), youngest/oldest summiteers, and more. Scroll to the Records section to browse by page." },
    { keys: ["organization", "organisation", "club", "group", "location", "map", "guide service"], a: "The Organizations section lists climbing clubs and guide services with embedded maps for Nepal, the Alps and Patagonia, plus real success stories from past expeditions." },
    { keys: ["gallery", "photo", "picture", "image", "video"], a: "Our Gallery has filterable photos and videos — click 'Photos' or 'Videos' to filter, and click any thumbnail to open it full-screen." },
    { keys: ["latest", "new", "development", "technology", "gear", "gps", "drone"], a: "The Latest Developments section covers modern tools like satellite communicators, AI-assisted avalanche forecasting, lightweight gear and drone route-scouting." },
    { keys: ["guideline", "guidelines", "safety", "tips", "advice", "rules"], a: "See the General Guidelines section for a numbered safety checklist: acclimatization, gear checks, weather planning, the buddy system, permits, and Leave No Trace principles." },
    { keys: ["faq"], a: "Our FAQ section (just above the footer) answers the most common questions — click the + icon on any question to expand it." },
    { keys: ["signup", "sign up", "register", "create account"], a: "Click 'Sign Up' in the top navbar to create a demo account. After signing up you'll be redirected to the Login page automatically." },
    { keys: ["login", "log in", "sign in"], a: "Click 'Login' in the navbar, enter any name/email and password, and you'll be redirected to the Home page with a welcome message." },
    { keys: ["dark mode", "light mode", "theme", "dark", "light"], a: "Click the sun/moon icon in the navbar to switch between Dark and Light mode — your preference is remembered next time you visit." },
    { keys: ["contact", "email", "phone", "reach"], a: "You can reach the Alpine Ascents team using the Contact form at the bottom of the page, or the details in the footer." },
    { keys: ["mountaineering", "mountain climbing", "what is climbing", "about", "alpine ascents"], a: "Mountaineering is the sport of reaching high points in mountainous regions. Alpine Ascents is a portal with its history, styles, techniques, hazards, world records, partner clubs, gallery and safety guidelines — scroll down or use the navbar to explore." },
    { keys: ["pagination", "page", "pages", "next page"], a: "The Records table and the Gallery both use pagination — use the numbered buttons (and « » arrows) under them to move between pages." },
    { keys: ["who are you", "what are you", "your name"], a: "I'm Peak Assistant — a rule-based guide built right into this website to help you navigate mountaineering content quickly, entirely client-side." },
    { keys: ["thank", "thanks", "shukriya"], a: "You're welcome! Happy climbing — let me know if there's anything else you'd like to know. 🏔️" },
    { keys: ["bye", "goodbye", "see you"], a: "Goodbye and safe travels! Come back anytime you have more mountaineering questions. 👋" }
  ];

  var FALLBACKS = [
    "That's a great question! Try asking me about history, techniques, hazards, records, organizations, gallery, or guidelines.",
    "I'm not totally sure about that one, but I can help with mountaineering topics, website navigation, signup/login, or dark mode. Try rephrasing!",
    "Hmm, I don't have an answer for that yet. Try one of the quick suggestions below, or explore the sections in the navbar."
  ];

  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function matchesKeyword(text, keyword) {
    // Multi-word phrases ("sign up", "dark mode") are safe as plain substrings.
    // Single words need word-boundary matching so short words like "hi" don't
    // false-positive inside unrelated words like "history" or "this".
    if (keyword.indexOf(" ") !== -1) return text.indexOf(keyword) !== -1;
    // optional plural ending so "hazards", "photos", "clubs", "dangers" match their singular keyword
    return new RegExp("\\b" + escapeRegExp(keyword) + "(?:s|es)?\\b", "i").test(text);
  }

  function findAnswer(text) {
    var t = text.toLowerCase();
    for (var i = 0; i < KB.length; i++) {
      for (var j = 0; j < KB[i].keys.length; j++) {
        if (matchesKeyword(t, KB[i].keys[j])) return KB[i].a;
      }
    }
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("chatbotToggle");
    var win = document.getElementById("chatbotWindow");
    var closeBtn = document.getElementById("chatbotClose");
    var body = document.getElementById("chatbotBody");
    var form = document.getElementById("chatbotForm");
    var input = document.getElementById("chatbotInput");
    var suggestions = document.querySelectorAll(".chatbot-suggestions button");
    if (!toggle || !win) return;

    toggle.addEventListener("click", function () {
      win.classList.toggle("show");
      if (win.classList.contains("show")) input.focus();
    });
    if (closeBtn) closeBtn.addEventListener("click", function () { win.classList.remove("show"); });

    function addMessage(text, who) {
      var div = document.createElement("div");
      div.className = "msg " + who;
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    function respond(text) {
      addMessage(text, "user");
      var typing = document.createElement("div");
      typing.className = "msg bot typing";
      typing.innerHTML = "<span></span><span></span><span></span>";
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;
      var delay = 500 + Math.random() * 500;
      setTimeout(function () {
        typing.remove();
        addMessage(findAnswer(text), "bot");
      }, delay);
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var val = input.value.trim();
        if (!val) return;
        respond(val);
        input.value = "";
      });
    }

    suggestions.forEach(function (btn) {
      btn.addEventListener("click", function () { respond(btn.textContent); });
    });
  });
})();
