/* =========================================================
   writing.js: builds the Writing section from content/writing.json.
   If the file fails to load, fallback content in index.html stays.
   ========================================================= */
(function () {
  "use strict";

  if (!window.Site) return;
  var el = Site.el;

  // Real <a> link button with external attributes and accessible label
  function externalButton(label, url, extraClass) {
    return el("a", {
      class: "btn" + (extraClass ? " " + extraClass : ""),
      href: url,
      target: "_blank",
      rel: "noopener noreferrer"
    }, [
      label,
      el("span", { class: "btn__arrow", "aria-hidden": "true", text: "↗" }),
      el("span", { class: "visually-hidden", text: " (opens in a new tab)" })
    ]);
  }

  // Section subheading (e.g. "Newsletter", "Fiction", "Recognition")
  function groupHeading(text) {
    return el("h3", { class: "writing__group-heading", text: text });
  }

  // Renders the Substack block: newsletter card + 3 post cards
  function renderNewsletter(n) {
    var posts = el("ul", { class: "writing__posts" });
    (n.posts || []).forEach(function (post) {
      posts.appendChild(el("li", { class: "post-card" }, [
        el("time", { class: "post-card__date", datetime: post.date, text: post.dateLabel }),
        el("h4", { class: "post-card__title" }, [
          el("a", {
            href: post.url,
            target: "_blank",
            rel: "noopener noreferrer",
            class: "post-card__link"
          }, [
            post.title,
            el("span", { class: "visually-hidden", text: " (opens in a new tab)" })
          ])
        ]),
        el("p", { class: "post-card__teaser", text: post.teaser }),
        el("span", { class: "post-card__more", "aria-hidden": "true", text: (n.readLabel || "Read post") + " ↗" })
      ]));
    });

    return el("div", { class: "writing__block" }, [
      groupHeading(n.heading),
      el("article", { class: "writing-card writing-card--newsletter" }, [
        el("div", { class: "writing-card__text" }, [
          el("h4", { class: "writing-card__title", text: n.name }),
          el("p", { class: "writing-card__body", text: n.description })
        ]),
        externalButton(n.buttonLabel, n.url, "btn--writing")
      ]),
      n.postsHeading ? el("h4", { class: "writing__subheading", text: n.postsHeading }) : null,
      posts
    ]);
  }

  // Renders the Fiction block: featured story card in reading style
  function renderFiction(f) {
    var children = [
      el("p", { class: "story-card__meta" }, [
        el("time", { class: "story-card__date", datetime: f.date, text: f.dateLabel })
      ]),
      el("h4", { class: "story-card__title", text: f.title }),
      el("p", { class: "story-card__note", text: f.note })
    ];

    // Show excerpt only if present and non-empty (omit area when empty)
    if (f.excerpt && f.excerpt.trim() && !/\[PLACEHOLDER/i.test(f.excerpt)) {
      children.push(el("blockquote", { class: "story-card__excerpt" }, [
        el("p", { text: f.excerpt })
      ]));
    }

    children.push(externalButton(f.buttonLabel, f.url, "btn--writing"));

    return el("div", { class: "writing__block" }, [
      groupHeading(f.heading),
      el("article", { class: "writing-card story-card" }, children)
    ]);
  }

  // Renders the Recognition block: 2 items side by side on wide screens, stacked on phones
  function renderRecognition(r) {
    var grid = el("div", { class: "recognition-grid" });
    (r.items || []).forEach(function (item) {
      grid.appendChild(el("article", { class: "writing-card recognition-card" }, [
        el("h4", { class: "recognition-card__title", text: item.title })
      ]));
    });

    return el("div", { class: "writing__block" }, [
      groupHeading(r.heading || "Recognition"),
      grid
    ]);
  }

  // Renders the Qdevs People Series card; hides button if url is empty
  function renderSeries(s) {
    var cardChildren = [
      el("div", { class: "series-card__text" }, [
        el("h4", { class: "writing-card__title", text: s.title || s.name }),
        el("p", { class: "writing-card__body", text: s.description || s.text })
      ])
    ];

    if (s.url && s.url.trim() && !/\[PLACEHOLDER/i.test(s.url)) {
      cardChildren.push(externalButton(s.buttonLabel || "Watch / listen", s.url, "btn--writing"));
    }

    return el("div", { class: "writing__block" }, [
      groupHeading(s.heading || "Conversations"),
      el("article", { class: "writing-card series-card" }, cardChildren)
    ]);
  }

  // Smoothly scroll to the Writing section (instant if reduced motion is preferred)
  function scrollToWriting() {
    var writingSec = document.getElementById("writing");
    if (writingSec) {
      writingSec.scrollIntoView({ behavior: Site.reducedMotion ? "auto" : "smooth" });
    }
  }

  // Main render entry point
  function renderWriting(data) {
    var codeEl = document.getElementById("writing-code");
    var headingEl = document.getElementById("writing-heading");
    var introEl = document.getElementById("writing-intro");
    var body = document.getElementById("writing-body");
    if (!body || !data) return;

    if (codeEl && data.code) codeEl.textContent = data.code;
    if (headingEl && data.title) headingEl.textContent = data.title;
    if (introEl && data.intro) introEl.textContent = data.intro;

    body.innerHTML = "";
    if (data.newsletter) body.appendChild(renderNewsletter(data.newsletter));
    if (data.fiction) body.appendChild(renderFiction(data.fiction));
    if (data.recognition) body.appendChild(renderRecognition(data.recognition));
    if (data.series) body.appendChild(renderSeries(data.series));
  }

  // Make the Writing lens button in hero and sticky bar scroll smoothly to this section
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest('[data-lens="writing"]');
    if (btn) {
      scrollToWriting();
    }
  });

  Site.loadJSON("writing")
    .then(renderWriting)
    .catch(function (err) {
      console.error(err);
      var body = document.getElementById("writing-body");
      if (body && !body.children.length) {
        body.innerHTML = '<p class="writing__fallback">My essays and stories are hosted on <a href="https://oolutolaowolabi.substack.com" target="_blank" rel="noopener noreferrer">Substack</a>.</p>';
      }
    });
})();
