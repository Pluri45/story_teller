/* =========================================================
   main.js: loads content, runs the lens switcher and the hero.
   Other scripts (added in later sections) use window.Site.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lensListeners = [];

  // Apply URL or saved lens before first paint so there is no colour flash on load
  try {
    var earlyLens = new URLSearchParams(window.location.search).get("lens") || localStorage.getItem("lens_v2");
    if (earlyLens) root.setAttribute("data-lens", earlyLens);
  } catch (e) { /* ignore */ }

  /* Official monochrome Simple Icons paths (24×24 viewBox, simpleicons.org) */
  var TOOL_ICONS = {
    rust: "M23.835 11.301a1.076 1.076 0 0 0-.695-.883l-.78-.26a9.61 9.61 0 0 0-.294-1.425l.57-.6c.35-.369.392-.937.102-1.353l-.572-.821a1.076 1.076 0 0 0-1.318-.35l-.758.318a9.73 9.73 0 0 0-1.15-.843l.162-.806a1.076 1.076 0 0 0-.596-1.189l-.897-.435a1.076 1.076 0 0 0-1.347.258l-.524.642a9.69 9.69 0 0 0-1.41-.325l-.24-.788a1.076 1.076 0 0 0-1.03-.762h-.998a1.076 1.076 0 0 0-1.03.762l-.24.788a9.69 9.69 0 0 0-1.41.325l-.524-.642a1.076 1.076 0 0 0-1.347-.258l-.897.435a1.076 1.076 0 0 0-.596 1.189l.162.806a9.73 9.73 0 0 0-1.15.843l-.758-.318a1.076 1.076 0 0 0-1.318.35l-.572.821a1.076 1.076 0 0 0 .102 1.353l.57.6a9.61 9.61 0 0 0-.294 1.425l-.78.26a1.076 1.076 0 0 0-.695.883L.02 12.29c-.07.502.212.987.69 1.156l.778.274c.08.48.187.953.32 1.415l-.56.61c-.342.373-.376.938-.083 1.35l.582.815c.293.412.842.548 1.308.326l.752-.358c.362.304.748.583 1.155.835l-.148.81c-.09.497.163.994.618 1.21l.904.428c.456.216 1.003.095 1.334-.294l.514-.605c.462.132.935.236 1.416.31l.252.785c.154.48.6.806 1.104.806h.998c.504 0 .95-.326 1.104-.806l.252-.785c.481-.074.954-.178 1.416-.31l.514.605c.331.389.878.51 1.334.294l.904-.428c.455-.216.708-.713.618-1.21l-.148-.81c.407-.252.793-.531 1.155-.835l.752.358c.466.222 1.015.086 1.308-.326l.582-.815c.293-.412.259-.977-.083-1.35l-.56-.61c.133-.462.24-.935.32-1.415l.778-.274c.478-.169.76-.654.69-1.156l-.145-.989zM12 18.42a6.42 6.42 0 1 1 0-12.84 6.42 6.42 0 0 1 0 12.84zm-3.25-8.92h4.18c1.58 0 2.62.82 2.62 2.12 0 .95-.56 1.66-1.46 1.94l1.78 2.44h-2.16l-1.52-2.22h-1.12v2.22H8.75V9.5zm1.8 1.54v1.36h2.1c.58 0 .94-.26.94-.68 0-.42-.36-.68-.94-.68h-2.1z",
    laravel: "M23.642 5.43a.364.364 0 0 1 .014.1v5.149c0 .135-.073.26-.189.326l-4.323 2.49v4.934a.378.378 0 0 1-.188.326L9.93 23.949a.337.337 0 0 1-.066.028c-.018.006-.037.01-.056.013-.03.005-.062.005-.093 0-.02-.003-.038-.007-.056-.013a.337.337 0 0 1-.066-.028L.567 18.755a.376.376 0 0 1-.189-.326V2.974c0-.033.005-.066.014-.098.008-.03.02-.058.037-.084.015-.024.034-.047.055-.066.022-.02.046-.036.073-.05L4.88.187a.378.378 0 0 1 .377 0l4.323 2.49c.027.014.051.03.073.05.021.019.04.042.055.066.017.026.029.054.037.084.009.032.014.065.014.098v9.572l3.57-2.057V5.53c0-.034.005-.067.014-.1.008-.03.02-.058.037-.083.015-.025.034-.047.056-.066.021-.02.046-.037.072-.05l4.323-2.49a.378.378 0 0 1 .377 0l4.323 2.49c.054.031.099.076.13.131.016.025.028.053.037.083zm-.766 4.922V6.18l-1.564.9-2.006 1.156v4.173l3.57-2.057zm-4.323 7.85v-4.175l-1.978 1.14-6.069 3.493v4.225l8.047-4.683zM1.132 3.624v14.588l8.047 4.636v-4.225L4.956 16.19a.377.377 0 0 1-.189-.326V5.68l-3.635-2.056zm3.937-2.68L1.499 3.001l3.57 2.057 3.57-2.057-3.57-2.057zm1.028 11.494l2.919-1.682V3.624l-1.564.9-2.005 1.156v7.152l.65-.394zM19.135 3.49l-3.57 2.057 3.57 2.057 3.57-2.057-3.57-2.057zm-.377 4.765l-2.006-1.156-1.564-.9v4.173l2.006 1.156 1.564.9V8.255zm-8.996 9.722l5.702-3.283 2.344-1.35-3.568-2.057-4.323 2.49-3.598 2.073 3.443 2.127z",
    typescript: "M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z",
    python: "M14.25.18l.9.2.73.26c.6.25 1.15.6 1.6 1.06.45.45.8 1 .99 1.61.24.75.31 1.54.28 2.33v3.81c0 1.4-1.15 2.55-2.55 2.55H9.95c-1.72 0-3.15 1.43-3.15 3.15v2.38h5.1v.93H5.56c-.85 0-1.66-.19-2.4-.57a4.68 4.68 0 0 1-2.2-2.52 7.59 7.59 0 0 1-.4-2.55v-2.1c0-.88.16-1.74.5-2.55.34-.81.86-1.52 1.55-2.07.7-.55 1.54-.88 2.42-.94h7.12V6.3H6.8v-.95h7.45V2.98c0-.54-.45-.98-.98-.98h-2.54C9.5 2 8.28 2.3 7.21 2.89l-.26-.88A10.74 10.74 0 0 1 11.73.12c.84-.03 1.69.01 2.52.06zm-3.6 1.98a.92.92 0 1 0 0 1.84.92.92 0 0 0 0-1.84zm7.79 4.38c.85 0 1.66.19 2.4.57a4.68 4.68 0 0 1 2.2 2.52c.28.82.41 1.68.4 2.55v2.1c0 .88-.16-1.74-.5 2.55-.34.81-.86 1.52-1.55 2.07-.7.55-1.54.88-2.42.94H11.85v1.36h5.35v.95H9.75v2.37c0 .54.45.98.98.98h2.54c1.23 0 2.45-.3 3.52-.89l.26.88a10.74 10.74 0 0 1-4.78 1.89c-.84.03-1.69-.01-2.52-.06l-.9-.2-.73-.26a4.89 4.89 0 0 1-1.6-1.06 4.79 4.79 0 0 1-.99-1.61 6.72 6.72 0 0 1-.28-2.33v-3.81c0-1.4 1.15-2.55 2.55-2.55h6.25c1.72 0 3.15-1.43 3.15-3.15V7.47h-5.1v-.93h6.34zm-5.09 13.46a.92.92 0 1 0 0 1.84.92.92 0 0 0 0-1.84z",
    postgresql: "M17.128 0a10.134 10.134 0 0 0-2.755.403l-.063.02A10.923 10.923 0 0 0 12.1.4c-2.29-.292-4.632.39-5.826 1.07A9.622 9.622 0 0 0 .99 3.63C-.382 6.322-.25 9.973.84 12.694c1.09 2.72 2.86 4.652 4.303 4.353.68-.14 1.24-.675 1.666-1.356.32.387.723.672 1.218.782.226.05.46.07.7.06v3.78c0 1.238.49 2.262 1.418 2.96.715.537 1.653.763 2.548.723.896-.04 1.75-.345 2.223-.96.494-.643.628-1.576.628-2.79v-3.32c.59-.143 1.15-.398 1.63-.77.775-.6 1.298-1.482 1.54-2.596.597.148 1.258.19 1.918.046 1.448-.316 2.755-1.47 3.24-3.314.66-2.51.402-6.11-1.366-8.215C21.227.602 19.222-.003 17.128 0zm-.11 1.65c1.662 0 3.235.487 4.242 1.685 1.38 1.643 1.594 4.71 1.05 6.78-.352 1.34-1.266 2.13-2.228 2.34-.425.093-.882.06-1.318-.058.044-.48.055-.983.027-1.506-.112-2.08-.855-4.365-2.257-5.828-.398-.415-.97-.116-.87.45.285 1.608.847 3.27.94 4.985.08 1.487-.145 2.735-.836 3.553-.472.558-1.15.92-2.012 1.078v-2.99c.73-.26 1.34-.77 1.72-1.477.59-1.096.65-2.58.38-4.09-.1-.557-.78-.65-.97-.12-.41 1.14-.92 2.244-1.69 2.97-.58.547-1.31.87-2.25.81-.94-.06-1.67-.48-2.18-1.12-.77-.97-1.08-2.38-1.06-3.82.01-.85.17-1.7.46-2.46.51-1.33 1.48-2.34 2.86-2.62 1.25-.25 2.66.04 3.85.67.42.22.87-.23.62-.63-.86-1.37-2.45-2.15-4.18-2.15-.39 0-.78.04-1.17.12-1.92.39-3.36 1.75-4.06 3.57-.35.91-.54 1.92-.55 2.94-.02 1.78.38 3.56 1.42 4.86.44.55 1.01.98 1.69 1.25-.32.51-.73.88-1.18.97-.72.15-2.13-1.28-3.07-3.63-.94-2.35-1.06-5.46.08-7.66.85-1.64 2.78-1.88 4.41-1.67 1.98.25 4.02-.38 5.02-.95.73-.42 1.91-.86 3.16-.86zm-5.21 4.88a1.12 1.12 0 1 0 0 2.24 1.12 1.12 0 0 0 0-2.24zm5.62.18a1.05 1.05 0 1 0 0 2.1 1.05 1.05 0 0 0 0-2.1zm-3.68 8.64v4.7c0 .95-.11 1.62-.35 1.93-.23.3-.73.48-1.32.5-.59.03-1.2-.12-1.64-.45-.58-.43-.88-1.08-.88-1.97v-3.77c.95-.08 1.83-.44 2.52-1.02.53.06 1.09.08 1.67.08z",
    docker: "M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z",
    linux: "M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 0 0-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 0 1-.004-.021l-.004-.024a1.807 1.807 0 0 1-.15.706.953.953 0 0 1-.213.335.71.71 0 0 0-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 0 0-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.265.088-.404v-.02a1.21 1.21 0 0 0-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132-.096 0-.184.06-.26.132a.8.8 0 0 0-.205.334 1.18 1.18 0 0 0-.09.468v.088c-.082-.01-.162-.03-.242-.062a1.45 1.45 0 0 1 .098-.665c.1-.268.234-.533.428-.666.19-.198.414-.267.667-.267zm-3.204.062c.197 0 .365.064.518.198.156.134.274.333.356.533.084.198.13.467.13.733 0 .2-.037.4-.098.6-.036.066-.077.133-.122.199-.067-.02-.137-.03-.21-.032-.073 0-.148.012-.222.032.043-.088.07-.18.082-.266.02-.133.014-.267-.01-.4-.024-.133-.07-.267-.137-.333-.065-.133-.148-.2-.242-.2-.096 0-.18.067-.246.2-.067.066-.114.2-.138.333-.024.133-.03.267-.01.4.012.086.038.178.082.266-.198.058-.395.146-.576.266a1.81 1.81 0 0 1-.162-.8c0-.266.046-.535.13-.733.082-.2.2-.399.356-.533.153-.134.321-.198.518-.198zm1.584 1.729c.464 0 .927.133 1.385.398.459.198.813.533.896.866.058.248-.05.524-.316.798-.266.274-.683.54-1.158.665-.474.125-.996.125-1.47 0-.475-.125-.892-.391-1.158-.665-.266-.274-.374-.55-.316-.798.083-.333.437-.668.896-.866.458-.265.921-.398 1.385-.398z"
  };

  /* ---------- Helpers shared with other scripts ---------- */

  function loadJSON(name) {
    return fetch("content/" + name + ".json", { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error(name + ".json: HTTP " + res.status);
      return res.json();
    });
  }

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

  /* ---------- Light / dark theme switcher ---------- */

  var SUN_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5V5.2M12 18.8V21.5M4.22 4.22L6.13 6.13M17.87 17.87L19.78 19.78M2.5 12H5.2M18.8 12H21.5M4.22 19.78L6.13 17.87M17.87 6.13L19.78 4.22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var MOON_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M20.2 14.6A8.2 8.2 0 0 1 9.4 3.8a8.2 8.2 0 1 0 10.8 10.8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

  function getTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function applyTheme(theme, persist) {
    var next = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", next);

    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", next === "light" ? "#F4EEE3" : "#3A0E1E");

    var label = next === "dark" ? "Switch to light theme" : "Switch to dark theme";
    var icon = next === "dark" ? SUN_SVG : MOON_SVG;

    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.innerHTML = icon;
    });

    if (persist) {
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
    }
  }

  function initThemeToggles() {
    applyTheme(getTheme(), false);

    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyTheme(getTheme() === "dark" ? "light" : "dark", true);
      });
    });

    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: light)");
      var onSchemeChange = function (e) {
        var saved = null;
        try { saved = localStorage.getItem("theme"); } catch (err) { /* ignore */ }
        if (!saved) applyTheme(e.matches ? "light" : "dark", false);
      };
      if (mq.addEventListener) mq.addEventListener("change", onSchemeChange);
    }
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
        btn.addEventListener("click", function () { setLens(key, true); });
        box.appendChild(btn);
      });
    });
  }

  function setLens(key, persist) {
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

    if (persist) {
      try { localStorage.setItem("lens_v2", key); } catch (e) { /* private mode */ }
    }

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

    var spec = document.getElementById("hero-spec");
    if (spec && profile.photo.spec) spec.textContent = profile.photo.spec;

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

    renderTools();
    renderMarquee();
  }

  function renderTools() {
    var labelEl = document.getElementById("hero-tools-label");
    var listEl = document.getElementById("hero-tools-list");
    if (!listEl || !profile.tools) return;
    if (labelEl && profile.toolsLabel) labelEl.textContent = profile.toolsLabel;
    listEl.innerHTML = "";

    profile.tools.forEach(function (tool) {
      var path = TOOL_ICONS[tool.id] || "";
      var svg = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="' + path + '"/></svg>';
      var li = el("li", { class: "hero__tool", tabindex: "0", "data-tooltip": tool.label, "aria-label": tool.label }, [
        el("span", { class: "hero__tool-icon", html: svg }),
        el("span", { class: "hero__tool-tip", "aria-hidden": "true", text: tool.label })
      ]);
      listEl.appendChild(li);
    });
  }

  function renderMarquee() {
    var track = document.getElementById("hero-band-track");
    if (!track || !profile.marquee) return;
    track.innerHTML = "";
    // Duplicate the sequence 3 times so wide screens scroll seamlessly
    for (var copy = 0; copy < 3; copy++) {
      var group = el("div", {
        class: "hero__band-group",
        "aria-hidden": copy > 0 ? "true" : "false"
      });
      profile.marquee.forEach(function (item) {
        group.appendChild(el("span", { class: "hero__band-item", text: item }));
        group.appendChild(el("span", { class: "hero__band-star", "aria-hidden": "true", text: "✦" }));
      });
      track.appendChild(group);
    }
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
    getTheme: getTheme,
    setTheme: function (t) { applyTheme(t, true); },
    reducedMotion: reducedMotion,
    profile: function () { return profile; },
    ready: null
  };

  initThemeToggles();

  window.Site.ready = loadJSON("profile")
    .then(function (data) {
      profile = data;
      renderHero();
      renderSwitchers();
      var saved = null;
      try { saved = localStorage.getItem("lens_v2"); } catch (e) { /* ignore */ }
      var urlLens = new URLSearchParams(window.location.search).get("lens");
      var initial = profile.lenses[urlLens] ? urlLens : (profile.lenses[saved] ? saved : profile.defaultLens);
      setLens(initial, false);
      initTopbar();
      return profile;
    })
    .catch(function (err) {
      console.error(err);
      showLoadWarning();
    });
})();
