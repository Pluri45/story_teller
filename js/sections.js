/* =========================================================
   sections.js: builds page sections from /content JSON files.
   - Section 2: System status strip
   - Section 3: Selected work (filterable featured case studies + project cards)
   ========================================================= */
(function () {
  "use strict";

  if (!window.Site) return;
  var el = Site.el;

  function cleanCheckPrefix(text) {
    if (!text) return "";
    return String(text).replace(/^\[CHECK\]\s*/i, "");
  }

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
    }, { threshold: 0.2 });

    observer.observe(strip);
  }

  /* ---------- 3. Selected work (filterable case studies & projects) ---------- */

  var workData = null;
  var currentFilter = "all";
  var categoryMap = {};

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
        var arrowRightSvg = '<svg class="arch-diagram__arrow-h" viewBox="0 0 28 16" width="28" height="16" aria-hidden="true"><path d="M0 8H24M19 3L25 8L19 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        var arrowDownSvg = '<svg class="arch-diagram__arrow-v" viewBox="0 0 16 24" width="16" height="24" aria-hidden="true"><path d="M8 0V20M3 15L8 21L13 15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        track.appendChild(el("span", {
          class: "arch-diagram__arrow",
          "aria-hidden": "true",
          html: arrowRightSvg + arrowDownSvg
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

  function buildProjectCard(proj, isFeatured, defaultOpen, meta) {
    var expandLabel = meta.expandLabel || "View architecture";
    var collapseLabel = meta.collapseLabel || "Hide architecture";
    var panelId = "work-panel-" + proj.id;

    // Stack chips
    var stackList = el("ul", { class: "proj-card__stack", "aria-label": "Stack" });
    (proj.stack || []).forEach(function (tech) {
      stackList.appendChild(el("li", { class: "proj-card__chip", text: tech }));
    });

    // Category tags
    var catRow = el("ul", { class: "proj-card__cats", "aria-label": "Categories" });
    (proj.categories || []).forEach(function (cId) {
      if (categoryMap[cId]) {
        catRow.appendChild(el("li", { class: "proj-card__cat", text: categoryMap[cId] }));
      }
    });

    // Expandable architecture toggle button (at least 44px tall)
    var toggleText = el("span", {
      class: "proj-card__toggle-text",
      text: defaultOpen ? collapseLabel : expandLabel
    });
    var toggleIcon = el("span", {
      class: "proj-card__toggle-icon",
      "aria-hidden": "true",
      text: defaultOpen ? "−" : "+"
    });
    var toggleBtn = el("button", {
      type: "button",
      class: "proj-card__toggle",
      "aria-expanded": defaultOpen ? "true" : "false",
      "aria-controls": panelId
    }, [toggleText, toggleIcon]);

    var panel = el("div", {
      class: "proj-card__panel",
      id: panelId
    }, [renderDiagram(proj.diagram)]);
    if (!defaultOpen) panel.hidden = true;

    // Problem -> What I built -> The result blocks
    var stepsGrid = el("div", { class: "proj-card__story" }, [
      el("div", { class: "proj-card__story-step" }, [
        el("h4", { class: "proj-card__subhead", text: "The problem" }),
        el("p", { class: "proj-card__body", text: cleanCheckPrefix(proj.problem) })
      ]),
      el("div", { class: "proj-card__story-step" }, [
        el("h4", { class: "proj-card__subhead", text: "What I built" }),
        el("p", { class: "proj-card__body", text: cleanCheckPrefix(proj.built) })
      ]),
      el("div", { class: "proj-card__story-step proj-card__story-step--result" }, [
        el("h4", { class: "proj-card__subhead", text: "The result" }),
        el("p", { class: "proj-card__body", text: cleanCheckPrefix(proj.result) })
      ])
    ]);

    var stackBlock = el("div", { class: "proj-card__stack-row" }, [
      el("span", { class: "proj-card__stack-label", text: "Stack" }),
      stackList
    ]);

    var card = el("article", {
      class: "proj-card " + (isFeatured ? "proj-card--featured" : "proj-card--compact") + (defaultOpen ? " is-open" : ""),
      "data-categories": (proj.categories || []).join(" ")
    }, [
      el("div", { class: "proj-card__main" }, [
        el("div", { class: "proj-card__meta" }, [
          el("div", { class: "proj-card__meta-left" }, [
            el("span", { class: "proj-card__index", text: proj.index }),
            el("span", { class: "proj-card__org", text: proj.company + " · " + proj.period })
          ]),
          el("span", { class: "proj-card__lead-metric", text: proj.leadMetric })
        ]),
        el("div", { class: "proj-card__head-row" }, [
          el("h3", { class: "proj-card__title", text: proj.title }),
          catRow
        ]),
        stepsGrid,
        el("div", { class: "proj-card__footer" }, [
          stackBlock,
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

    return card;
  }

  function applyWorkFilter(filterId, animate) {
    if (!workData) return;
    currentFilter = filterId || "all";

    // Update filter tab ARIA states
    var tabs = document.querySelectorAll(".work-filter-btn");
    tabs.forEach(function (btn) {
      var active = btn.getAttribute("data-filter") === currentFilter;
      btn.setAttribute("aria-selected", active ? "true" : "false");
      btn.setAttribute("tabindex", active ? "0" : "-1");
      btn.classList.toggle("is-active", active);
    });

    var stage = document.getElementById("work-stage");
    var doUpdate = function () {
      var featuredGroup = document.getElementById("work-featured-group");
      var moreGroup = document.getElementById("work-more-group");
      var featuredCount = 0;
      var moreCount = 0;

      document.querySelectorAll("#work-featured-grid .proj-card").forEach(function (card) {
        var cats = (card.getAttribute("data-categories") || "").split(" ");
        var show = currentFilter === "all" || cats.indexOf(currentFilter) !== -1;
        card.hidden = !show;
        if (show) featuredCount++;
      });

      document.querySelectorAll("#work-more-grid .proj-card").forEach(function (card) {
        var cats = (card.getAttribute("data-categories") || "").split(" ");
        var show = currentFilter === "all" || cats.indexOf(currentFilter) !== -1;
        card.hidden = !show;
        if (show) moreCount++;
      });

      if (featuredGroup) featuredGroup.hidden = featuredCount === 0;
      if (moreGroup) moreGroup.hidden = moreCount === 0;
    };

    if (animate && !Site.reducedMotion && stage) {
      stage.classList.add("is-filtering");
      setTimeout(function () {
        doUpdate();
        stage.classList.remove("is-filtering");
      }, 160);
    } else {
      doUpdate();
    }
  }

  function renderSelectedWork(data) {
    workData = data;
    var meta = data.section || {};
    var codeEl = document.getElementById("work-code");
    var headingEl = document.getElementById("work-heading");
    var subEl = document.getElementById("work-subtitle");
    var featHeading = document.getElementById("work-featured-heading");
    var moreHeading = document.getElementById("work-more-heading");
    var filterBar = document.getElementById("work-filters");
    var featGrid = document.getElementById("work-featured-grid");
    var moreGrid = document.getElementById("work-more-grid");

    if (!filterBar || !featGrid || !moreGrid) return;

    if (codeEl && meta.code) codeEl.textContent = meta.code;
    if (headingEl && meta.title) headingEl.textContent = meta.title;
    if (subEl && meta.subtitle) subEl.textContent = meta.subtitle;
    if (featHeading && meta.featuredHeading) featHeading.textContent = meta.featuredHeading;
    if (moreHeading && meta.moreHeading) moreHeading.textContent = meta.moreHeading;

    categoryMap = {};
    filterBar.innerHTML = "";
    var filterBtns = [];

    (data.filters || []).forEach(function (f) {
      if (f.id !== "all") categoryMap[f.id] = f.label;
      var btn = el("button", {
        type: "button",
        class: "work-filter-btn" + (f.id === "all" ? " is-active" : ""),
        role: "tab",
        "data-filter": f.id,
        "aria-selected": f.id === "all" ? "true" : "false",
        tabindex: f.id === "all" ? "0" : "-1",
        text: f.label
      });
      btn.addEventListener("click", function () {
        applyWorkFilter(f.id, true);
      });
      filterBar.appendChild(btn);
      filterBtns.push(btn);
    });

    // Keyboard navigation (Left/Right/Home/End) across filter tabs
    filterBar.addEventListener("keydown", function (e) {
      var idx = filterBtns.indexOf(document.activeElement);
      if (idx === -1) return;
      var nextIdx = -1;
      if (e.key === "ArrowRight") nextIdx = (idx + 1) % filterBtns.length;
      else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + filterBtns.length) % filterBtns.length;
      else if (e.key === "Home") nextIdx = 0;
      else if (e.key === "End") nextIdx = filterBtns.length - 1;

      if (nextIdx !== -1) {
        e.preventDefault();
        filterBtns[nextIdx].focus();
        applyWorkFilter(filterBtns[nextIdx].getAttribute("data-filter"), true);
      }
    });

    featGrid.innerHTML = "";
    moreGrid.innerHTML = "";

    var featuredIdx = 0;
    (data.projects || []).forEach(function (proj) {
      if (proj.featured) {
        var card = buildProjectCard(proj, true, featuredIdx === 0, meta);
        featGrid.appendChild(card);
        featuredIdx++;
      } else {
        var compactCard = buildProjectCard(proj, false, false, meta);
        moreGrid.appendChild(compactCard);
      }
    });

    var urlFilter = new URLSearchParams(window.location.search).get("filter");
    applyWorkFilter(urlFilter || "all", false);
  }

  // Connect hero lens switcher to Selected Work filters (and Writing section jump)
  Site.onLensChange(function (lensKey, userTriggered) {
    if (!userTriggered || !workData) return;
    if (lensKey === "writing") {
      var writingSec = document.getElementById("writing");
      if (writingSec) {
        writingSec.scrollIntoView({ behavior: Site.reducedMotion ? "auto" : "smooth" });
      }
      return;
    }
    var map = (workData && workData.lensToFilter) || {
      engineering: "backend",
      operations: "operations",
      finance: "quant"
    };
    if (map[lensKey]) {
      applyWorkFilter(map[lensKey], true);
    }
  });

  /* ---------- Load section data ---------- */

  Site.loadJSON("stats")
    .then(renderStatusStrip)
    .catch(function (err) { console.error(err); });

  Site.loadJSON("projects")
    .then(renderSelectedWork)
    .catch(function (err) { console.error(err); });
})();
