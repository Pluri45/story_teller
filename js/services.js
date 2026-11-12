/* =========================================================
   services.js: builds the Services section from content/services.json.
   If the file fails to load, fallback content in index.html stays.
   ========================================================= */
(function () {
  "use strict";

  if (!window.Site) return;
  var el = Site.el;

  function renderServices(data) {
    var codeEl = document.getElementById("services-code");
    var headingEl = document.getElementById("services-heading");
    var introEl = document.getElementById("services-intro");
    var body = document.getElementById("services-body");
    if (!body || !data) return;

    if (codeEl && data.code) codeEl.textContent = data.code;
    if (headingEl && data.title) headingEl.textContent = data.title;
    if (introEl && data.intro) introEl.textContent = data.intro;

    body.innerHTML = "";

    // Four service cards (no icons)
    var grid = el("div", { class: "services-grid" });
    (data.items || []).forEach(function (item) {
      grid.appendChild(el("article", { class: "service-card" }, [
        el("span", { class: "service-card__num", text: item.number, "aria-hidden": "true" }),
        el("h3", { class: "service-card__title", text: item.title }),
        el("p", { class: "service-card__desc", text: item.description })
      ]));
    });
    body.appendChild(grid);

    // Call to action block under cards
    if (data.cta) {
      var ctaBtn = el("a", {
        href: data.cta.buttonUrl || "#contact",
        class: "btn btn--primary services-cta__btn"
      }, [
        data.cta.buttonLabel || "Start a conversation",
        el("span", { class: "btn__arrow", "aria-hidden": "true", text: "→" })
      ]);

      ctaBtn.addEventListener("click", function (e) {
        var href = ctaBtn.getAttribute("href");
        if (href && href.startsWith("#")) {
          var target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: Site.reducedMotion ? "auto" : "smooth" });
            try { history.pushState(null, "", href); } catch (err) {}
          }
        }
      });

      body.appendChild(el("div", { class: "services-cta" }, [
        el("p", { class: "services-cta__text", text: data.cta.text }),
        ctaBtn
      ]));
    }
  }

  Site.loadJSON("services")
    .then(renderServices)
    .catch(function (err) {
      console.error(err);
    });
})();
