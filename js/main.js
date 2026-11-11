/* =========================================================
   main.js — loads content, runs the lens switcher and the hero.
   Other scripts (added in later sections) use window.Site.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lensListeners = [];

  /* ---------- Helpers shared with other scripts ---------- */

  // Fetch a JSON file from /content
  function loadJSON(name) {
    return fetch("content/" + name + ".json", { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error(name + ".json: HTTP " + res.status);
      return res.json();
    });
  }

  // Tiny element builder: el("a", { href: "#", class: "btn" }, "Text")
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else if (key === "html") node.innerHTML = attrs[key];
      else if (key === "style") node.setAttribute("style", attrs[key]);
      else node.setAttribute(key, attrs[key]);
    });
    [].concat(children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function showLoadWarning() {
    var warn = document.getElementById("load-warning");
    if (warn) warn.hidden = false;
  }

  /* ---------- Lens switcher ---------- */

  var profile = null;
  var currentLens = null;

  function renderSwitchers() {
    var switchers = document.querySelectorAll("[data-switcher]");
    switchers.forEach(function (box) {
      box.innerHTML = "";
      profile.lensOrder.forEach(function (key) {
        var lens = profile.lenses[key];
        var btn = el("button", {
          type: "button",
          class: "lens-btn",
          "data-lens": key,
          "aria-pressed": "false",
          style: "--lens-color:" + lens.accent
        }, [el("span", { class: "lens-btn__dot", "aria-hidden": "true" }), lens.label]);
        btn.addEventListener("click", function () { setLens(key); });
        box.appendChild(btn);
      });
    });
  }

  function setLens(key) {
    if (!profile.lenses[key] || key === currentLens) return;
    currentLens = key;
    root.setAttribute("data-lens", key);

    // Update every switcher (hero + sticky bar)
    document.querySelectorAll(".lens-btn").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.dataset.lens === key ? "true" : "false");
    });

    // Swap the hero subtitle with a quick fade
    var sub = document.getElementById("hero-subtitle");
    var text = profile.lenses[key].subtitle;
    if (reducedMotion || !sub.textContent) {
      sub.textContent = text;
    } else {
      sub.classList.add("is-changing");
      setTimeout(function () {
        sub.textContent = text;
        sub.classList.remove("is-changing");
      }, 250);
    }

    try { localStorage.setItem("lens", key); } catch (e) { /* private mode */ }

    // Tell later sections the lens changed
    lensListeners.forEach(function (fn) { fn(key); });
  }

  function onLensChange(fn) {
    lensListeners.push(fn);
    if (currentLens) fn(currentLens);
  }

  /* ---------- Hero ---------- */

  function renderHero() {
    document.getElementById("hero-name").textContent = profile.name.full;

    // Statement lines: words in [brackets] are coloured with the lens accent
    var statement = document.getElementById("hero-statement");
    statement.innerHTML = "";
    profile.statement.forEach(function (line) {
      var inner = el("span", { class: "hero__line-inner" });
      line.split(/(\[[^\]]+\])/).forEach(function (part) {
        if (!part) return;
        if (part.charAt(0) === "[") inner.appendChild(el("em", { text: part.slice(1, -1) }));
        else inner.appendChild(document.createTextNode(part));
      });
      statement.appendChild(el("span", { class: "hero__line" }, [inner]));
    });

    var img = document.getElementById("hero-img");
    img.alt = profile.photo.alt;

    var links = document.getElementById("hero-links");
    links.innerHTML = "";
    profile.links.forEach(function (link) {
      links.appendChild(el("a", {
        class: "btn",
        href: link.url,
        target: "_blank",
        rel: "noopener"
      }, [link.label, el("span", { class: "btn__arrow", "aria-hidden": "true", text: "↗" })]));
    });
    links.appendChild(el("a", {
      class: "btn btn--primary",
      href: "mailto:" + profile.email
    }, [profile.emailButtonLabel, el("span", { class: "btn__arrow", "aria-hidden": "true", text: "→" })]));
  }

  // Current accent colour as {r, g, b}. While a lens is changing, the browser
  // reports the in-between colour, so canvases can fade smoothly too.
  function getAccentRGB() {
    var v = getComputedStyle(root).getPropertyValue("--accent").trim();
    var m = v.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    var hex = v.replace("#", "");
    if (hex.length === 3) hex = hex.replace(/./g, "$&$&");
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
    return { r: 240, g: 107, b: 174 };
  }

  // Show the sticky bar once the hero switcher scrolls out of view
  function initTopbar() {
    var bar = document.getElementById("topbar");
    var heroSwitcher = document.getElementById("hero-switcher");
    if (!("IntersectionObserver" in window)) {
      bar.classList.add("is-visible");
      return;
    }
    new IntersectionObserver(function (entries) {
      var visible = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      bar.classList.toggle("is-visible", visible);
    }).observe(heroSwitcher);
  }

  /* ---------- Start ---------- */

  window.Site = {
    loadJSON: loadJSON,
    el: el,
    onLensChange: onLensChange,
    setLens: setLens,
    getLens: function () { return currentLens; },
    getAccentRGB: getAccentRGB,
    reducedMotion: reducedMotion,
    profile: function () { return profile; },
    ready: null
  };

  window.Site.ready = loadJSON("profile")
    .then(function (data) {
      profile = data;
      renderHero();
      renderSwitchers();
      var saved = null;
      try { saved = localStorage.getItem("lens"); } catch (e) { /* ignore */ }
      setLens(profile.lenses[saved] ? saved : profile.defaultLens);
      initTopbar();
      return profile;
    })
    .catch(function (err) {
      console.error(err);
      showLoadWarning();
    });
})();
