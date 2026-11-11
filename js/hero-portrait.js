/* =========================================================
   hero-portrait.js — draws the portrait as a halftone dot grid
   and handles the scan-line reveal of the real photo.
   ========================================================= */
(function () {
  "use strict";

  var wrap = document.getElementById("hero-portrait");
  if (!wrap || !window.Site) return;

  var img = document.getElementById("hero-img");
  var canvas = document.getElementById("hero-dots");
  var ctx = canvas.getContext("2d");
  var reduced = Site.reducedMotion;

  // Reduced motion: just show the real photo, no dots and no interaction
  if (reduced) {
    wrap.classList.add("is-static");
    wrap.removeAttribute("role");
    wrap.removeAttribute("tabindex");
    wrap.removeAttribute("aria-pressed");
    wrap.removeAttribute("aria-label");
    return;
  }

  var sample = null;          // small copy of the photo we read colours from
  var SAMPLE_SCALE = 0.25;
  var dots = [];              // [{x, y, r, a}]
  var W = 0, H = 0, dpr = 1;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function smoothstep(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  // Shrink the photo once and keep its pixel data
  function prepareSample() {
    var off = document.createElement("canvas");
    off.width = Math.round(img.naturalWidth * SAMPLE_SCALE);
    off.height = Math.round(img.naturalHeight * SAMPLE_SCALE);
    var octx = off.getContext("2d");
    octx.drawImage(img, 0, 0, off.width, off.height);
    try {
      sample = { w: off.width, h: off.height, data: octx.getImageData(0, 0, off.width, off.height).data };
    } catch (e) {
      // Happens when the page is opened from the file system instead of a server
      console.warn("Portrait dots need a web server (Live Server).", e);
      wrap.classList.add("is-static");
    }
  }

  // Work out where every dot goes and how big it is
  function buildDots() {
    if (!sample) return;
    var rect = wrap.getBoundingClientRect();
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Same "cover, aligned to top" maths as the <img> uses, so dots line up with the photo
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var scale = Math.max(W / iw, H / ih);
    var ox = (W - iw * scale) / 2, oy = 0;

    var step = clamp(Math.round(W / 72), 4, 9);
    var rowH = step * 0.866;   // rows packed in a honeycomb pattern
    dots = [];

    for (var row = 0, y = step / 2; y < H; row++, y += rowH) {
      var shift = row % 2 ? step / 2 : 0;
      for (var x = step / 2 + shift; x < W; x += step) {
        var sx = Math.floor(((x - ox) / scale) * SAMPLE_SCALE);
        var sy = Math.floor(((y - oy) / scale) * SAMPLE_SCALE);
        if (sx < 0 || sy < 0 || sx >= sample.w || sy >= sample.h) continue;

        var i = (sy * sample.w + sx) * 4;
        var r = sample.data[i], g = sample.data[i + 1], b = sample.data[i + 2];

        // The studio backdrop is magenta (red and blue high, green low).
        // Measure how "magenta" a pixel is and drop those dots, leaving a silhouette.
        var magenta = (Math.min(r, b) - g) / 255;
        var keep = 1 - smoothstep(0.055, 0.11, magenta);
        if (keep < 0.05) continue;

        // Brighter areas → bigger dots (with a minimum so the dark shirt still shows)
        var lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        var size = 0.22 + 0.78 * clamp((lum - 0.04) / 0.5, 0, 1);
        var radius = step * 0.5 * size * 0.95;
        if (radius < 0.4) continue;

        dots.push({ x: x, y: y, r: radius, a: keep });
      }
    }
    draw();
  }

  // Paint the dots in the current accent colour (batched by opacity for speed)
  function draw() {
    var c = Site.getAccentRGB();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgb(" + c.r + "," + c.g + "," + c.b + ")";
    var buckets = [[], [], [], []];
    dots.forEach(function (d) { buckets[Math.min(3, Math.floor(d.a * 4))].push(d); });
    buckets.forEach(function (list, idx) {
      if (!list.length) return;
      ctx.globalAlpha = (idx + 1) / 4;
      ctx.beginPath();
      list.forEach(function (d) {
        ctx.moveTo(d.x + d.r, d.y);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      });
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // While the lens colour is fading, keep repainting so the dots fade with it
  var colourAnim = 0;
  function animateColour() {
    var until = performance.now() + 700;
    cancelAnimationFrame(colourAnim);
    (function tick() {
      draw();
      if (performance.now() < until) colourAnim = requestAnimationFrame(tick);
    })();
  }

  /* ---------- Scan-line reveal ---------- */

  var scanTimer = 0;
  function setRevealed(on) {
    if (wrap.classList.contains("is-revealed") === on) return;
    wrap.classList.toggle("is-revealed", on);
    wrap.setAttribute("aria-pressed", on ? "true" : "false");
    wrap.classList.add("is-scanning");
    clearTimeout(scanTimer);
    scanTimer = setTimeout(function () { wrap.classList.remove("is-scanning"); }, 1000);
  }
  function toggle() { setRevealed(!wrap.classList.contains("is-revealed")); }

  var canHover = window.matchMedia("(hover: hover)").matches;
  if (canHover) {
    wrap.addEventListener("pointerenter", function () { setRevealed(true); });
    wrap.addEventListener("pointerleave", function () { setRevealed(false); });
  } else {
    wrap.addEventListener("click", toggle);
  }
  wrap.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
  });

  /* ---------- Start ---------- */

  function init() {
    prepareSample();
    buildDots();
    Site.onLensChange(animateColour);
    if ("ResizeObserver" in window) {
      var t;
      new ResizeObserver(function () { clearTimeout(t); t = setTimeout(buildDots, 120); }).observe(wrap);
    }
  }

  if (img.complete && img.naturalWidth) init();
  else img.addEventListener("load", init, { once: true });
})();
