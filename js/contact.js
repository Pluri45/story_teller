/* =========================================================
   contact.js: handles Contact, Testimonials and Footer.
   - Contact form with Formspree AJAX, honeypot and placeholder fallback
   - Testimonials loader (hidden while empty)
   - Dynamic footer year and Back to top smooth scrolling
   ========================================================= */
(function () {
  "use strict";

  if (!window.Site) return;
  var el = Site.el;

  /* ---------- Footer Interactions ---------- */

  var yearEl = document.getElementById("footer-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var topBtn = document.getElementById("footer-top-btn");
  if (topBtn) {
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: Site.reducedMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Testimonials Loader (Hidden while empty) ---------- */

  Site.loadJSON("testimonials")
    .then(function (data) {
      var sec = document.getElementById("testimonials");
      if (!sec) return;
      if (!data || !data.testimonials || !data.testimonials.length) {
        sec.hidden = true;
        return;
      }
      var codeEl = document.getElementById("testimonials-code");
      var headingEl = document.getElementById("testimonials-heading");
      var grid = document.getElementById("testimonials-grid");
      if (codeEl && data.code) codeEl.textContent = data.code;
      if (headingEl && data.title) headingEl.textContent = data.title;
      if (!grid) return;
      grid.innerHTML = "";
      data.testimonials.forEach(function (item) {
        grid.appendChild(el("article", { class: "testimonial-card" }, [
          el("blockquote", { class: "testimonial-card__quote" }, [
            el("p", { text: "“" + item.quote + "”" })
          ]),
          el("div", { class: "testimonial-card__author" }, [
            el("span", { class: "testimonial-card__name", text: item.name }),
            el("span", { class: "testimonial-card__meta", text: [item.role, item.company].filter(Boolean).join(", ") })
          ])
        ]));
      });
      sec.hidden = false;
    })
    .catch(function () {
      var sec = document.getElementById("testimonials");
      if (sec) sec.hidden = true;
    });

  /* ---------- Contact Section Loader ---------- */

  Site.loadJSON("contact")
    .then(function (data) {
      var codeEl = document.getElementById("contact-code");
      var headingEl = document.getElementById("contact-heading");
      var introEl = document.getElementById("contact-intro");
      var body = document.getElementById("contact-body");
      if (!body || !data) return;

      if (codeEl && data.code) codeEl.textContent = data.code;
      if (headingEl && data.title) headingEl.textContent = data.title;
      if (introEl && data.intro) introEl.textContent = data.intro;

      body.innerHTML = "";

      var f = data.form;
      var isPlaceholder = !f || !f.action || /\[PLACEHOLDER\]/i.test(f.action);

      // Render form only when the endpoint is real (hide while it is still a placeholder)
      if (!isPlaceholder) {
        var form = el("form", {
          class: "contact-form",
          action: f.action,
          method: "POST"
        });

        // Name and Email fields
        var row1 = el("div", { class: "contact-form__row" }, [
          el("div", { class: "contact-form__field" }, [
            el("label", { for: "contact-name", class: "contact-form__label", text: f.nameLabel }),
            el("input", {
              type: "text",
              id: "contact-name",
              name: "name",
              placeholder: f.namePlaceholder || "",
              required: "required",
              class: "contact-form__input"
            })
          ]),
          el("div", { class: "contact-form__field" }, [
            el("label", { for: "contact-email", class: "contact-form__label", text: f.emailLabel }),
            el("input", {
              type: "email",
              id: "contact-email",
              name: "email",
              placeholder: f.emailPlaceholder || "",
              required: "required",
              class: "contact-form__input"
            })
          ])
        ]);
        form.appendChild(row1);

        // Topic dropdown
        var select = el("select", {
          id: "contact-topic",
          name: "topic",
          required: "required",
          class: "contact-form__select"
        }, [
          el("option", { value: "", disabled: "disabled", selected: "selected", text: f.topicPlaceholder || "Select an option" })
        ]);
        (f.topics || []).forEach(function (topic) {
          select.appendChild(el("option", { value: topic, text: topic }));
        });
        var topicField = el("div", { class: "contact-form__field" }, [
          el("label", { for: "contact-topic", class: "contact-form__label", text: f.topicLabel }),
          select
        ]);
        form.appendChild(topicField);

        // Message field
        var messageField = el("div", { class: "contact-form__field" }, [
          el("label", { for: "contact-message", class: "contact-form__label", text: f.messageLabel }),
          el("textarea", {
            id: "contact-message",
            name: "message",
            rows: "5",
            placeholder: f.messagePlaceholder || "",
            required: "required",
            class: "contact-form__textarea"
          })
        ]);
        form.appendChild(messageField);

        // Anti-spam honeypot
        var honeypot = el("input", {
          type: "text",
          name: "_gotcha",
          class: "visually-hidden",
          tabindex: "-1",
          autocomplete: "off",
          "aria-hidden": "true"
        });
        form.appendChild(honeypot);

        // Status message container
        var statusEl = el("div", {
          class: "contact-status",
          role: "status",
          "aria-live": "polite",
          hidden: "hidden"
        });

        // Submit button
        var submitBtn = el("button", {
          type: "submit",
          class: "btn btn--primary contact-form__submit"
        }, [
          f.submitLabel || "Send message",
          el("span", { class: "btn__arrow", "aria-hidden": "true", text: "→" })
        ]);

        var actionsRow = el("div", { class: "contact-form__actions" }, [
          submitBtn,
          statusEl
        ]);
        form.appendChild(actionsRow);

        // AJAX submit without page reload
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          if (honeypot.value) {
            statusEl.textContent = f.successMessage;
            statusEl.className = "contact-status contact-status--success";
            statusEl.hidden = false;
            form.reset();
            return;
          }
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending...";
          var formData = new FormData(form);
          fetch(form.action, {
            method: "POST",
            body: formData,
            headers: { "Accept": "application/json" }
          }).then(function (res) {
            if (res.ok) {
              statusEl.textContent = f.successMessage;
              statusEl.className = "contact-status contact-status--success";
              statusEl.hidden = false;
              form.reset();
            } else {
              throw new Error("Form submission error");
            }
          }).catch(function () {
            statusEl.textContent = f.errorMessage;
            statusEl.className = "contact-status contact-status--error";
            statusEl.hidden = false;
          }).finally(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = f.submitLabel || "Send message";
            submitBtn.appendChild(el("span", { class: "btn__arrow", "aria-hidden": "true", text: "→" }));
          });
        });

        body.appendChild(form);
      }

      // Direct links block
      var linksWrap = el("div", { class: "contact-direct" });
      if (data.directLinksHeading) {
        linksWrap.appendChild(el("h3", { class: "contact-direct__heading", text: data.directLinksHeading }));
      }
      var linksList = el("div", { class: "contact-direct__links" });
      (data.directLinks || []).forEach(function (link) {
        var isExternal = /^https?:\/\//i.test(link.url);
        var attrs = {
          href: link.url,
          class: "btn" + (link.primary ? " btn--primary" : " btn--contact")
        };
        var children = [link.label];
        if (isExternal) {
          attrs.target = "_blank";
          attrs.rel = "noopener noreferrer";
          children.push(el("span", { class: "btn__arrow", "aria-hidden": "true", text: "↗" }));
          children.push(el("span", { class: "visually-hidden", text: " (opens in a new tab)" }));
        } else if (/^mailto:/i.test(link.url)) {
          children.push(el("span", { class: "btn__arrow", "aria-hidden": "true", text: "→" }));
        }
        linksList.appendChild(el("a", attrs, children));
      });
      linksWrap.appendChild(linksList);
      body.appendChild(linksWrap);
    })
    .catch(function (err) {
      console.error(err);
    });
})();
