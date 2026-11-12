/* =========================================================
   sections.js: builds page sections from /content JSON files.
   - Section 2: System status strip
   - Section 3: Engineering (expandable project cards)
   ========================================================= */
(function () {
  "use strict";

  if (!window.Site) return;
  var el = Site.el;

  /* ---------- Shared: Image slot with automatic placeholder fallback ---------- */

  function renderImageSlot(meta) {
    if (!meta) return null;
    var ratioParts = (meta.ratio || "16:10").split(":");
    var aspect = (ratioParts[0] || 16) + " / " + (ratioParts[1] || 10);

    var box = el("div", {
      class: "img-slot",
      style: "--slot-aspect:" + aspect
    });

    var placeholder = el("div", { class: "img-slot__placeholder" }, [
      el("span", { class: "img-slot__icon", "aria-hidden": "true", text: "[ IMG ]" }),
      el("span", { class: "img-slot__label", text: meta.label || ("Image · " + meta.ratio + " · /" + meta.src) })
    ]);
    box.appendChild(placeholder);

    if (meta.src && meta.src.indexOf("[PLACEHOLDER]") === -1) {
      var img = new Image();
      img.className = "img-slot__img";
      img.alt = meta.alt || "";
      img.loading = "lazy";
      img.onload = function () {
        box.classList.add("has-image");
      };
      img.onerror = function () {
        img.remove();
      };
      img.src = meta.src;
      box.appendChild(img);
    }

    return box;
  }

  /* ---------- Lens stage ordering (brings active lens section forward) ---------- */

  function syncLensSections(activeLens) {
    document.querySelectorAll("[data-lens-section]").forEach(function (sec) {
      var match = sec.getAttribute("data-lens-section") === activeLens;
      sec.classList.toggle("is-prioritised", match);
    });
    document.querySelectorAll("[data-lens-badge]").forEach(function (badge) {
      var match = badge.getAttribute("data-lens-badge") === activeLens;
      badge.hidden = !match;
    });
  }

  Site.onLensChange(syncLensSections);

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
    var captionEl = document.getElementById("status-caption");
    var grid = document.getElementById("status-grid");
    if (!grid || !stats || !stats.items) return;

    if (codeEl && stats.code) codeEl.textContent = stats.code;
    if (headingEl && stats.title) headingEl.textContent = stats.title;
    if (stateEl && stats.statusText) stateEl.textContent = stats.statusText;
    if (noteEl && stats.uptimeNote) noteEl.textContent = stats.uptimeNote;
    if (captionEl && stats.caption) captionEl.textContent = stats.caption;

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

      var srNode = el("span", {
        class: "visually-hidden",
        text: item.display
      });

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

  /* ---------- 3. Engineering (expandable project cards) ---------- */

  function renderDiagram(diagram) {
    if (!diagram || !diagram.nodes) return null;
    var track = el("div", { class: "arch-diagram__track", role: "list" });

    diagram.nodes.forEach(function (node, idx) {
      var box = el("div", { class: "arch-diagram__node", role: "listitem" }, [
        el("span", { class: "arch-diagram__step", text: node.step }),
        el("strong", { class: "arch-diagram__title", text: node.title }),
        el("span", { class: "arch-diagram__detail", text: node.detail })
      ]);
      track.appendChild(box);

      if (idx < diagram.nodes.length - 1) {
        var arrowSvg = '<svg viewBox="0 0 28 16" width="28" height="16" aria-hidden="true"><path d="M0 8H24M19 3L25 8L19 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        track.appendChild(el("span", {
          class: "arch-diagram__arrow",
          "aria-hidden": "true",
          html: arrowSvg
        }));
      }
    });

    return el("div", { class: "arch-diagram" }, [
      el("div", { class: "arch-diagram__head" }, [
        el("span", { class: "arch-diagram__tag", text: "SYSTEM ARCHITECTURE" }),
        el("span", { class: "arch-diagram__caption", text: diagram.caption || "" })
      ]),
      track
    ]);
  }

  function renderEngineering(data) {
    var grid = document.getElementById("eng-grid");
    if (!grid || !data) return;

    var meta = data.engineering || {};
    var codeEl = document.getElementById("eng-code");
    var headingEl = document.getElementById("eng-heading");
    var subEl = document.getElementById("eng-subtitle");
    if (codeEl && meta.code) codeEl.textContent = meta.code;
    if (headingEl && meta.title) headingEl.textContent = meta.title;
    if (subEl && meta.subtitle) subEl.textContent = meta.subtitle;

    var expandLabel = meta.expandLabel || "View architecture & stack";
    var collapseLabel = meta.collapseLabel || "Hide architecture & stack";

    var items = (data.projects || []).filter(function (p) {
      return p.lens === "engineering";
    });

    grid.innerHTML = "";

    items.forEach(function (proj, idx) {
      var isFirst = idx === 0;
      var panelId = "eng-panel-" + proj.id;

      // Metric pills in summary view
      var metricRow = el("ul", { class: "proj-card__metrics", "aria-label": "Key results" });
      (proj.metrics || []).forEach(function (m) {
        metricRow.appendChild(el("li", { class: "proj-card__metric", text: m }));
      });

      // Toggle button
      var toggleText = el("span", {
        class: "proj-card__toggle-text",
        text: isFirst ? collapseLabel : expandLabel
      });
      var toggleIcon = el("span", {
        class: "proj-card__toggle-icon",
        "aria-hidden": "true",
        text: isFirst ? "−" : "+"
      });
      var toggleBtn = el("button", {
        type: "button",
        class: "proj-card__toggle",
        "aria-expanded": isFirst ? "true" : "false",
        "aria-controls": panelId
      }, [toggleText, toggleIcon]);

      // Expandable drawer: architecture diagram + stack + highlights + screenshot slot
      var stackList = el("ul", { class: "proj-card__stack", "aria-label": "Stack used" });
      (proj.stack || []).forEach(function (tech) {
        stackList.appendChild(el("li", { class: "proj-card__chip", text: tech }));
      });

      var highlightsList = el("ul", { class: "proj-card__highlights" });
      (proj.highlights || []).forEach(function (h) {
        highlightsList.appendChild(el("li", { text: h }));
      });

      var drawerBottom = el("div", { class: "proj-card__drawer-grid" }, [
        el("div", { class: "proj-card__details" }, [
          el("div", { class: "proj-card__block" }, [
            el("h4", { class: "proj-card__subhead", text: "Stack used" }),
            stackList
          ]),
          el("div", { class: "proj-card__block" }, [
            el("h4", { class: "proj-card__subhead", text: "Implementation notes" }),
            highlightsList
          ])
        ]),
        renderImageSlot(proj.image)
      ]);

      var panel = el("div", {
        class: "proj-card__panel",
        id: panelId
      }, [
        renderDiagram(proj.diagram),
        drawerBottom
      ]);
      if (!isFirst) panel.hidden = true;

      var card = el("article", {
        class: "proj-card" + (isFirst ? " is-open" : ""),
        "data-lens": proj.lens
      }, [
        el("div", { class: "proj-card__main" }, [
          el("div", { class: "proj-card__meta" }, [
            el("span", { class: "proj-card__index", text: proj.index }),
            el("span", { class: "proj-card__org", text: proj.company + " · " + proj.period })
          ]),
          el("h3", { class: "proj-card__title", text: proj.title }),
          el("p", { class: "proj-card__summary", text: proj.summary }),
          el("div", { class: "proj-card__footer" }, [
            metricRow,
            toggleBtn
          ])
        ]),
        panel
      ]);

      toggleBtn.addEventListener("click", function () {
        var open = card.classList.toggle("is-open");
        panel.hidden = !open;
        toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
        toggleText.textContent = open ? collapseLabel : expandLabel;
        toggleIcon.textContent = open ? "−" : "+";
      });

      grid.appendChild(card);
    });
  }

  /* ---------- Load section data ---------- */

  Site.loadJSON("stats")
    .then(renderStatusStrip)
    .catch(function (err) { console.error(err); });

  Site.loadJSON("projects")
    .then(function (data) {
      renderEngineering(data);
      syncLensSections(Site.getLens() || "engineering");
    })
    .catch(function (err) { console.error(err); });
})();
