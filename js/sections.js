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

  // Builds one project card: collapsed summary plus an expandable full story
  function buildProjectCard(proj, meta) {
    var readLabel = meta.readLabel || "Read case study";
    var closeLabel = meta.closeLabel || "Close case study";
    var archOpenLabel = meta.expandLabel || "View architecture";
    var archCloseLabel = meta.collapseLabel || "Hide architecture";
    var storyId = "work-story-" + proj.id;
    var archId = "work-arch-" + proj.id;

    // Main toggle: "Read case study +" / "Close case study −"
    var readText = el("span", { text: readLabel });
    var readIcon = el("span", { class: "proj-card__toggle-icon", "aria-hidden": "true", text: "+" });
    var readBtn = el("button", {
      type: "button",
      class: "proj-card__read",
      "aria-expanded": "false",
      "aria-controls": storyId
    }, [readText, readIcon]);

    // Secondary toggle inside the story for the architecture diagram
    var archText = el("span", { text: archOpenLabel });
    var archIcon = el("span", { class: "proj-card__toggle-icon", "aria-hidden": "true", text: "+" });
    var archBtn = el("button", {
      type: "button",
      class: "proj-card__toggle",
      "aria-expanded": "false",
      "aria-controls": archId
    }, [archText, archIcon]);
    var archPanel = el("div", { class: "proj-card__arch", id: archId }, [renderDiagram(proj.diagram)]);
    archPanel.hidden = true;

    var stackList = el("ul", { class: "proj-card__stack", "aria-label": "Stack" });
    (proj.stack || []).forEach(function (tech) {
      stackList.appendChild(el("li", { class: "proj-card__chip", text: tech }));
    });

    function storyPart(heading, text, extraClass) {
      return el("div", { class: "proj-card__part" + (extraClass ? " " + extraClass : "") }, [
        el("h4", { class: "proj-card__subhead", text: heading }),
        el("p", { class: "proj-card__body", text: cleanCheckPrefix(text) })
      ]);
    }

    // Expandable region (grid-rows trick gives a smooth height animation)
    var story = el("div", { class: "proj-card__expand", id: storyId }, [
      el("div", { class: "proj-card__expand-inner" }, [
        el("div", { class: "proj-card__story" }, [
          storyPart("The problem", proj.problem),
          storyPart("What I built", proj.built),
          storyPart("The result", proj.result, "proj-card__part--result")
        ]),
        el("div", { class: "proj-card__stack-row" }, [
          el("span", { class: "proj-card__stack-label", text: "Stack" }),
          stackList
        ]),
        archBtn,
        archPanel
      ])
    ]);

    var card = el("article", {
      class: "proj-card",
      "data-categories": (proj.categories || []).join(" ")
    }, [
      el("p", { class: "proj-card__meta" }, [
        el("span", { class: "proj-card__index", text: proj.index }),
        el("span", { class: "proj-card__org", text: proj.company + " · " + proj.period })
      ]),
      el("div", { class: "proj-card__head" }, [
        el("h3", { class: "proj-card__title", text: proj.title }),
        el("span", { class: "proj-card__lead-metric", text: proj.leadMetric })
      ]),
      el("p", { class: "proj-card__summary", text: proj.summary }),
      readBtn,
      story
    ]);

    // Animate from the current height to the target, then settle on "auto" so content can reflow
    readBtn.addEventListener("click", function () {
      var open = !card.classList.contains("is-open");
      story.style.height = story.scrollHeight + "px";
      if (open) {
        card.classList.add("is-open");
      } else {
        void story.offsetHeight; // force reflow so the collapse animates from the measured height
        story.style.height = "0px";
        card.classList.remove("is-open");
      }
      clearTimeout(story._settle);
      story._settle = setTimeout(function () {
        story.style.height = open ? "auto" : "";
      }, Site.reducedMotion ? 0 : 360);
      readBtn.setAttribute("aria-expanded", open ? "true" : "false");
      readText.textContent = open ? closeLabel : readLabel;
      readIcon.textContent = open ? "−" : "+";
    });

    archBtn.addEventListener("click", function () {
      var open = archPanel.hidden;
      archPanel.hidden = !open;
      archBtn.setAttribute("aria-expanded", open ? "true" : "false");
      archText.textContent = open ? archCloseLabel : archOpenLabel;
      archIcon.textContent = open ? "−" : "+";
    });

    return card;
  }

  // Shows only cards whose categories include the chosen filter
  function applyWorkFilter(filterId, animate) {
    if (!workData) return;
    currentFilter = filterId || "all";

    document.querySelectorAll(".work-filter-btn").forEach(function (btn) {
      var active = btn.getAttribute("data-filter") === currentFilter;
      btn.setAttribute("aria-selected", active ? "true" : "false");
      btn.setAttribute("tabindex", active ? "0" : "-1");
      btn.classList.toggle("is-active", active);
    });

    var stage = document.getElementById("work-stage");
    var doUpdate = function () {
      [["work-featured-grid", "work-featured-group"], ["work-more-grid", "work-more-group"]].forEach(function (ids) {
        var count = 0;
        document.querySelectorAll("#" + ids[0] + " > [data-categories]").forEach(function (item) {
          var cats = item.getAttribute("data-categories").split(" ");
          var show = currentFilter === "all" || cats.indexOf(currentFilter) !== -1;
          item.hidden = !show;
          if (show) count++;
        });
        var group = document.getElementById(ids[1]);
        if (group) group.hidden = count === 0;
      });
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

  // Maps a hero lens to its filter tab (Writing has no filter)
  function filterForLens(lensKey) {
    var map = { engineering: "backend", operations: "operations", finance: "quant" };
    if (workData && workData.lensToFilter) map = workData.lensToFilter;
    return map[lensKey] || null;
  }

  function renderSelectedWork(data) {
    workData = data;
    var meta = data.section || {};
    var filterBar = document.getElementById("work-filters");
    var featGrid = document.getElementById("work-featured-grid");
    var moreGrid = document.getElementById("work-more-grid");
    if (!filterBar || !featGrid || !moreGrid) return;

    [["work-code", "code"], ["work-heading", "title"], ["work-subtitle", "subtitle"],
     ["work-featured-heading", "featuredHeading"], ["work-more-heading", "moreHeading"]].forEach(function (pair) {
      var node = document.getElementById(pair[0]);
      if (node && meta[pair[1]]) node.textContent = meta[pair[1]];
    });

    filterBar.innerHTML = "";
    var filterBtns = [];
    (data.filters || []).forEach(function (f) {
      var btn = el("button", {
        type: "button",
        class: "work-filter-btn",
        role: "tab",
        "data-filter": f.id,
        "aria-selected": "false",
        tabindex: "-1",
        text: f.label
      });
      btn.addEventListener("click", function () { applyWorkFilter(f.id, true); });
      filterBar.appendChild(btn);
      filterBtns.push(btn);
    });

    // Keyboard navigation (Left/Right/Home/End) across filter tabs
    filterBar.addEventListener("keydown", function (e) {
      var idx = filterBtns.indexOf(document.activeElement);
      if (idx === -1) return;
      var next = -1;
      if (e.key === "ArrowRight") next = (idx + 1) % filterBtns.length;
      else if (e.key === "ArrowLeft") next = (idx - 1 + filterBtns.length) % filterBtns.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = filterBtns.length - 1;
      if (next !== -1) {
        e.preventDefault();
        filterBtns[next].focus();
        applyWorkFilter(filterBtns[next].getAttribute("data-filter"), true);
      }
    });

    featGrid.innerHTML = "";
    moreGrid.innerHTML = "";
    (data.projects || []).forEach(function (proj) {
      var card = buildProjectCard(proj, meta);
      if (proj.featured) {
        // Featured cards sit in a slot so dividers only appear between visible items
        var slot = el("div", { class: "work-slot", "data-categories": card.getAttribute("data-categories") }, [card]);
        card.removeAttribute("data-categories");
        featGrid.appendChild(slot);
      } else {
        moreGrid.appendChild(card);
      }
    });

    // Start on the filter that matches the current lens (or URL ?filter=)
    var urlFilter = new URLSearchParams(window.location.search).get("filter");
    applyWorkFilter(urlFilter || filterForLens(Site.getLens()) || "all", false);
  }

  // Keep the filter in step with the hero lens; Writing jumps to its section
  Site.onLensChange(function (lensKey, userTriggered) {
    if (!workData) return;
    if (lensKey === "writing") {
      if (!userTriggered) return;
      var writingSec = document.getElementById("writing");
      if (writingSec) writingSec.scrollIntoView({ behavior: Site.reducedMotion ? "auto" : "smooth" });
      return;
    }
    var filterId = filterForLens(lensKey);
    if (filterId) applyWorkFilter(filterId, userTriggered);
  });

  /* ---------- Load section data ---------- */

  Site.loadJSON("stats")
    .then(renderStatusStrip)
    .catch(function (err) { console.error(err); });

  Site.loadJSON("projects")
    .then(renderSelectedWork)
    .catch(function (err) { console.error(err); });
})();
