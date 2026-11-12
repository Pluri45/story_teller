/* =========================================================
   sections.js: builds page sections from /content JSON files.
   Section 2: System status strip (monitoring dashboard).
   ========================================================= */
(function () {
  "use strict";

  if (!window.Site) return;
  var el = Site.el;

  /* ---------- 2. System status strip ---------- */

  function formatNumber(val, decimals) {
    if (decimals > 0) return val.toFixed(decimals);
    return Math.round(val).toLocaleString("en-GB");
  }

  function animateStatValue(node, item) {
    if (Site.reducedMotion) {
      node.textContent = item.prefix + formatNumber(item.value, item.decimals) + item.suffix;
      return;
    }
    var duration = 1100;
    var start = performance.now();
    var target = item.value;

    function tick(now) {
      var progress = Math.min(1, (now - start) / duration);
      // Ease-out cubic so the counter settles smoothly
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;
      node.textContent = item.prefix + formatNumber(current, item.decimals) + item.suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        node.textContent = item.prefix + formatNumber(target, item.decimals) + item.suffix;
      }
    }

    requestAnimationFrame(tick);
  }

  function renderStatusStrip(stats) {
    var codeEl = document.getElementById("status-code");
    var headingEl = document.getElementById("status-heading");
    var stateEl = document.getElementById("status-state");
    var noteEl = document.getElementById("status-note");
    var grid = document.getElementById("status-grid");
    if (!grid || !stats || !stats.items) return;

    if (codeEl && stats.code) codeEl.textContent = stats.code;
    if (headingEl && stats.title) headingEl.textContent = stats.title;
    if (stateEl && stats.statusText) stateEl.textContent = stats.statusText;
    if (noteEl && stats.uptimeNote) noteEl.textContent = stats.uptimeNote;

    grid.innerHTML = "";
    var valueNodes = [];

    stats.items.forEach(function (item, idx) {
      var initialText = Site.reducedMotion
        ? item.prefix + formatNumber(item.value, item.decimals) + item.suffix
        : item.prefix + formatNumber(0, item.decimals) + item.suffix;

      var numNode = el("span", {
        class: "status-card__num",
        "aria-hidden": "true",
        text: initialText
      });

      // Screen readers get the final static number right away
      var srNode = el("span", {
        class: "visually-hidden",
        text: item.display
      });

      // Small 8-segment telemetry bar row so each card looks like a monitoring readout
      var bars = el("div", { class: "status-card__bars", "aria-hidden": "true" });
      for (var b = 0; b < 8; b++) {
        bars.appendChild(el("span", { class: "status-card__bar" }));
      }

      var card = el("div", { class: "status-card" }, [
        el("div", { class: "status-card__top" }, [
          el("span", { class: "status-card__index", text: "0" + (idx + 1) }),
          bars
        ]),
        el("dd", { class: "status-card__value" }, [numNode, srNode]),
        el("dt", { class: "status-card__label", text: item.label }),
        el("p", { class: "status-card__note", text: item.note })
      ]);

      grid.appendChild(card);
      valueNodes.push({ node: numNode, item: item });
    });

    // Count up once when the strip enters the viewport
    if (Site.reducedMotion || !("IntersectionObserver" in window)) {
      valueNodes.forEach(function (entry) {
        entry.node.textContent = entry.item.prefix + formatNumber(entry.item.value, entry.item.decimals) + entry.item.suffix;
      });
      return;
    }

    var strip = document.getElementById("status");
    var hasRun = false;
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !hasRun) {
        hasRun = true;
        valueNodes.forEach(function (entry) {
          animateStatValue(entry.node, entry.item);
        });
        observer.disconnect();
      }
    }, { threshold: 0.25 });

    observer.observe(strip);
  }

  Site.loadJSON("stats")
    .then(renderStatusStrip)
    .catch(function (err) {
      console.error(err);
    });
})();
