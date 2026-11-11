/* =========================================================
   hero-bg.js — the animated canvas behind the hero.
   One "scene" per lens; scenes crossfade when the lens changes.
   ========================================================= */
(function () {
  "use strict";

  var canvas = document.getElementById("hero-bg");
  if (!canvas || !window.Site) return;

  var hero = canvas.parentElement;
  var ctx = canvas.getContext("2d");
  var reduced = Site.reducedMotion;

  var BASE = 0.2;          // normal opacity of elements (15–25% range)
  var MOUSE_RADIUS = 170;  // how far the "brighten near the mouse" effect reaches
  var FADE_TIME = 0.9;     // seconds for the crossfade between lenses

  var W = 0, H = 0, dpr = 1;
  var mouse = null;
  var color = { r: 240, g: 107, b: 174 };
  var current = null, previous = null, fade = 1;
  var rafId = 0, lastTime = 0;
  var tabVisible = !document.hidden, onScreen = true;

  /* ---------- small helpers ---------- */

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function isPhone() { return W < 768; }
  function maxElements() { return isPhone() ? 28 : 60; }

  // 0..1 — how close a point is to the mouse
  function nearMouse(x, y) {
    if (!mouse) return 0;
    var d = Math.hypot(x - mouse.x, y - mouse.y);
    return d < MOUSE_RADIUS ? 1 - d / MOUSE_RADIUS : 0;
  }

  // Final opacity for an element: base level, brighter near the mouse, times scene fade
  function alphaAt(x, y, level, sceneAlpha) {
    return Math.min(1, BASE * level + 0.55 * nearMouse(x, y)) * sceneAlpha;
  }

  function rgb() { return "rgb(" + color.r + "," + color.g + "," + color.b + ")"; }

  /* =========================================================
     Scenes
     ========================================================= */

  // ---- Engineering: network of nodes with pulses travelling along links ----
  function EngineeringScene() {
    var nodes = [], pulses = [];
    var link = isPhone() ? 110 : 150;
    for (var i = 0; i < maxElements(); i++) {
      var angle = rand(0, Math.PI * 2), speed = rand(5, 14);
      nodes.push({ x: rand(0, W), y: rand(0, H), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
    }

    this.update = function (dt) {
      nodes.forEach(function (n) {
        n.x += n.vx * dt; n.y += n.vy * dt;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      // Occasionally start a pulse between two linked nodes
      if (pulses.length < 8 && Math.random() < dt * 3) {
        var a = pick(nodes), best = null, bestD = link;
        nodes.forEach(function (b) {
          var d = Math.hypot(a.x - b.x, a.y - b.y);
          if (b !== a && d < bestD && Math.random() < 0.5) { best = b; bestD = d; }
        });
        if (best) pulses.push({ a: a, b: best, t: 0 });
      }
      pulses = pulses.filter(function (p) {
        p.t += dt * 0.8;
        return p.t < 1 && Math.hypot(p.a.x - p.b.x, p.a.y - p.b.y) < link * 1.1;
      });
    };

    this.draw = function (s) {
      var i, j, a, b, d;
      ctx.strokeStyle = ctx.fillStyle = rgb();
      ctx.lineWidth = 1;
      // links
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          a = nodes[i]; b = nodes[j];
          d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) {
            ctx.globalAlpha = alphaAt((a.x + b.x) / 2, (a.y + b.y) / 2, 1 - d / link, s);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // nodes
      nodes.forEach(function (n) {
        ctx.globalAlpha = alphaAt(n.x, n.y, 1.4, s);
        ctx.beginPath(); ctx.arc(n.x, n.y, 2, 0, Math.PI * 2); ctx.fill();
      });
      // pulses
      pulses.forEach(function (p) {
        var x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.globalAlpha = alphaAt(x, y, 3, s);
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      });
      // nearest nodes reach out to the cursor
      if (mouse) {
        nodes
          .map(function (n) { return { n: n, d: Math.hypot(n.x - mouse.x, n.y - mouse.y) }; })
          .filter(function (o) { return o.d < 230; })
          .sort(function (p, q) { return p.d - q.d; })
          .slice(0, 5)
          .forEach(function (o) {
            ctx.globalAlpha = (1 - o.d / 230) * 0.6 * s;
            ctx.beginPath(); ctx.moveTo(o.n.x, o.n.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          });
      }
    };
  }

  // ---- Operations: faint grid with blinking status dots ----
  function OperationsScene() {
    var cell = isPhone() ? 36 : 48;
    var cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    var dots = [];
    for (var i = 0; i < maxElements(); i++) {
      var on = Math.random() < 0.5;
      dots.push({
        x: Math.floor(rand(1, cols)) * cell,
        y: Math.floor(rand(1, rows)) * cell,
        on: on, level: on ? 1 : 0.12, timer: rand(0.3, 4), ring: 0
      });
    }

    this.update = function (dt) {
      dots.forEach(function (d) {
        d.timer -= dt;
        if (d.timer <= 0) {
          d.on = !d.on;
          d.timer = rand(0.4, 3.5);
          if (d.on) d.ring = 1;
        }
        var target = d.on ? 1 : 0.12;
        d.level += (target - d.level) * Math.min(1, dt * 6);
        d.ring = Math.max(0, d.ring - dt * 1.2);
      });
    };

    this.draw = function (s) {
      ctx.strokeStyle = ctx.fillStyle = rgb();
      ctx.lineWidth = 1;
      // grid
      ctx.globalAlpha = BASE * 0.35 * s;
      ctx.beginPath();
      for (var x = cell; x < W; x += cell) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
      for (var y = cell; y < H; y += cell) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
      ctx.stroke();
      // status dots (+ a ring that expands when a dot switches on)
      dots.forEach(function (d) {
        ctx.globalAlpha = alphaAt(d.x, d.y, d.level * 1.6, s);
        ctx.beginPath(); ctx.arc(d.x, d.y, 3, 0, Math.PI * 2); ctx.fill();
        if (d.ring > 0) {
          ctx.globalAlpha = d.ring * BASE * 1.5 * s;
          ctx.beginPath(); ctx.arc(d.x, d.y, 3 + (1 - d.ring) * 12, 0, Math.PI * 2); ctx.stroke();
        }
      });
    };
  }

  // ---- Finance: chart lines that draw across, with drifting ticker numbers ----
  function FinanceScene() {
    var lineCount = isPhone() ? 2 : 3;
    var lines = [], numbers = [];

    function makeLine(delay) {
      var pts = [], y = rand(H * 0.2, H * 0.85), step = 26;
      for (var x = -step; x <= W + step; x += step) {
        y = Math.max(H * 0.1, Math.min(H * 0.92, y + rand(-22, 20)));
        pts.push({ x: x, y: y });
      }
      return { pts: pts, head: -step - delay, speed: W / rand(8, 12), hold: 1.5, fade: 1 };
    }
    function tickerText() {
      var kind = Math.random();
      if (kind < 0.4) return (Math.random() < 0.6 ? "+" : "−") + rand(0, 3).toFixed(2) + "%";
      if (kind < 0.7) return rand(0.85, 0.99).toFixed(3);
      return rand(10, 999).toFixed(1);
    }
    function makeNumber(x) {
      return { x: x, y: rand(20, H - 20), vx: -rand(8, 20), text: tickerText(), size: Math.round(rand(11, 14)) };
    }

    for (var i = 0; i < lineCount; i++) lines.push(makeLine(i * W * 0.35));
    for (var k = 0; k < maxElements() - lineCount; k++) numbers.push(makeNumber(rand(0, W)));

    this.update = function (dt) {
      lines.forEach(function (l, idx) {
        if (l.head < W + 30) l.head += l.speed * dt;
        else if (l.hold > 0) l.hold -= dt;
        else {
          l.fade -= dt * 0.6;
          if (l.fade <= 0) lines[idx] = makeLine(rand(0, W * 0.3));
        }
      });
      numbers.forEach(function (n, idx) {
        n.x += n.vx * dt;
        if (n.x < -80) numbers[idx] = makeNumber(W + rand(0, 60));
      });
    };

    this.draw = function (s) {
      ctx.strokeStyle = ctx.fillStyle = rgb();
      // chart lines
      ctx.lineWidth = 1.5;
      lines.forEach(function (l) {
        var pts = l.pts, last = null;
        ctx.globalAlpha = BASE * 1.3 * l.fade * s;
        ctx.beginPath();
        for (var i = 0; i < pts.length && pts[i].x <= l.head; i++) {
          if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y);
          last = pts[i];
        }
        ctx.stroke();
        if (last && l.head < W + 30) {
          ctx.globalAlpha = alphaAt(last.x, last.y, 3, s) * l.fade;
          ctx.beginPath(); ctx.arc(last.x, last.y, 3, 0, Math.PI * 2); ctx.fill();
        }
      });
      // ticker numbers
      numbers.forEach(function (n) {
        ctx.font = n.size + 'px "JetBrains Mono", ui-monospace, monospace';
        ctx.globalAlpha = alphaAt(n.x, n.y, 0.9, s);
        ctx.fillText(n.text, n.x, n.y);
      });
    };
  }

  // ---- Writing: letters and short words type themselves, float up and fade ----
  function WritingScene() {
    var WORDS = ["once", "ink", "myth", "story", "the", "and", "we", "dream", "begin",
                 "said", "river", "light", "home", "why", "—", "…", "chapter", "voice"];
    var LETTERS = "abcdefghijklmnopqrstuvwxyz";
    var items = [];

    function make(fromBottom) {
      var word = Math.random() < 0.45;
      return {
        x: rand(10, W - 60),
        y: fromBottom ? H + rand(0, 40) : rand(H * 0.2, H),
        vy: -rand(8, 22),
        text: word ? pick(WORDS) : pick(LETTERS.split("")),
        shown: fromBottom ? 0 : 99,
        size: Math.round(word ? rand(14, 22) : rand(16, 30)),
        age: fromBottom ? 0 : rand(0, 4),
        life: rand(7, 13)
      };
    }
    for (var i = 0; i < maxElements(); i++) items.push(make(false));

    this.update = function (dt) {
      items.forEach(function (it, idx) {
        it.age += dt;
        it.y += it.vy * dt;
        it.shown += dt * 10;                    // typewriter: ~10 characters per second
        if (it.age > it.life || it.y < -30) items[idx] = make(true);
      });
    };

    this.draw = function (s) {
      ctx.fillStyle = rgb();
      items.forEach(function (it) {
        var fadeIn = Math.min(1, it.age / 1.2);
        var fadeOut = Math.min(1, (it.life - it.age) / (it.life * 0.35));
        ctx.font = "italic " + it.size + 'px "Fraunces", Georgia, serif';
        ctx.globalAlpha = alphaAt(it.x, it.y, 1.3 * Math.max(0, Math.min(fadeIn, fadeOut)), s);
        ctx.fillText(it.text.slice(0, Math.floor(it.shown)), it.x, it.y);
      });
    };
  }

  var SCENES = {
    engineering: EngineeringScene,
    operations: OperationsScene,
    finance: FinanceScene,
    writing: WritingScene
  };
  var currentKey = null;

  /* =========================================================
     Engine: sizing, loop, crossfade, pausing
     ========================================================= */

  function resize() {
    var rect = hero.getBoundingClientRect();
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (currentKey) {
      current = new SCENES[currentKey]();
      previous = null;
      fade = 1;
      if (reduced) drawStill();
    }
  }

  function render() {
    color = Site.getAccentRGB();
    ctx.clearRect(0, 0, W, H);
    if (previous && fade < 1) previous.draw(1 - fade);
    if (current) current.draw(previous ? fade : 1);
    ctx.globalAlpha = 1;
  }

  function frame(time) {
    var dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
    lastTime = time;
    if (current) current.update(dt);
    if (previous) {
      previous.update(dt);
      fade += dt / FADE_TIME;
      if (fade >= 1) { previous = null; fade = 1; }
    }
    render();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (reduced || rafId || !tabVisible || !onScreen) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // Reduced motion: advance the scene a little, then draw a single still frame
  function drawStill() {
    for (var i = 0; i < 60; i++) current.update(0.05);
    render();
  }

  function setScene(key) {
    if (!SCENES[key] || key === currentKey) return;
    currentKey = key;
    if (reduced || !current) {
      current = new SCENES[key]();
      previous = null;
      fade = 1;
      if (reduced) {
        // wait one frame so the accent colour has switched before drawing
        requestAnimationFrame(drawStill);
      }
      return;
    }
    previous = current;
    current = new SCENES[key]();
    fade = 0;
  }

  /* ---------- wiring ---------- */

  resize();

  if ("ResizeObserver" in window) {
    var resizeTimer;
    new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }).observe(hero);
  }

  hero.addEventListener("pointermove", function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  hero.addEventListener("pointerleave", function () { mouse = null; });

  document.addEventListener("visibilitychange", function () {
    tabVisible = !document.hidden;
    if (tabVisible) start(); else stop();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start(); else stop();
    }).observe(hero);
  }

  Site.onLensChange(function (key) {
    setScene(key);
    start();
  });

  // Redraw once fonts arrive so ticker numbers and letters use the right typefaces
  if (document.fonts && reduced) {
    document.fonts.ready.then(function () { if (current) render(); });
  }
})();
