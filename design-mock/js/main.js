(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Mobile nav ── */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      links.classList.toggle('open', open);
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav')) setOpen(false);
    });
  }

  /* ── Hero word rotator ── */
  var rot = document.querySelector('.rot');
  if (rot) {
    var words = Array.prototype.slice.call(rot.querySelectorAll('.w'));
    var i = 0;
    var measure = function () {
      var probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit';
      rot.appendChild(probe);
      words.forEach(function (w) { probe.textContent = w.textContent; w._w = Math.ceil(probe.getBoundingClientRect().width) + 2; });
      rot.removeChild(probe);
      rot.style.width = words[i]._w + 'px';
    };
    words[0].classList.add('on');
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);
    if (!reduce) {
      setInterval(function () {
        var prev = i;
        i = (i + 1) % words.length;
        words.forEach(function (w) { w.classList.remove('on', 'out'); });
        words[prev].classList.add('out');
        words[i].classList.add('on');
        rot.style.width = words[i]._w + 'px';
      }, 2600);
    }
  }

  /* ── Seamless scroll: sticky reveal, step fills ──
     Adapted from 21st.dev "Timeline" + "Sticky Scroll Reveal". Pure scroll-linked
     state, recomputed in one rAF per scroll; nothing animates on load. */
  (function () {
    var main = document.getElementById('main');
    if (!main) return;
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

    // Sticky scroll reveal
    var list = document.querySelector('[data-sticky-list]');
    var panel = document.querySelector('[data-sticky-panel]');
    var runway = document.querySelector('[data-runway]');
    var items = list ? Array.prototype.slice.call(list.querySelectorAll('li[data-key]')) : [];
    // must match the runway media query in styles.css
    var pinned = window.matchMedia('(min-width: 901px) and (min-height: 820px)');
    var active = null;

    // Step rails
    var rails = Array.prototype.slice.call(document.querySelectorAll('.steps, .timeline'));

    function setActive(key) {
      if (key === active) return;
      active = key;
      items.forEach(function (li) { li.classList.toggle('is-active', li.dataset.key === key); });
      if (panel) Array.prototype.forEach.call(panel.querySelectorAll('[data-part]'), function (p) {
        p.classList.toggle('is-lit', p.dataset.part === key);
      });
    }

    function update() {
      var vh = window.innerHeight;

      if (items.length && runway) {
        // Each item owns an equal slice of the pinned runway, so no item can be
        // skipped however fast the wheel moves.
        var live = pinned.matches;
        list.classList.toggle('is-live', live);
        if (panel) panel.classList.toggle('is-live', live);
        if (live) {
          var rr = runway.getBoundingClientRect();
          var span = Math.max(1, rr.height - vh);
          var prog = clamp(-rr.top / span, 0, 0.9999);
          setActive(items[Math.floor(prog * items.length)].dataset.key);
        } else {
          setActive(null);
        }
      }

      rails.forEach(function (wrap) {
        var r = wrap.getBoundingClientRect();
        var p = clamp((vh * 0.85 - r.top) / (vh * 0.45), 0, 1);
        var lines = wrap.querySelectorAll('.rail-line');
        var dots = wrap.querySelectorAll('.dot, .tl-dot');
        var n = Math.max(lines.length, 1);
        Array.prototype.forEach.call(lines, function (l, i) { l.style.setProperty('--f', clamp(p * n - i, 0, 1).toFixed(3)); });
        Array.prototype.forEach.call(dots, function (d, i) { d.classList.toggle('on', p * n >= i && p > 0); });
      });
    }

    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }
    function refresh() { update(); }

    refresh();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', refresh);
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  })();

  /* ── Services list ──
     Desktop: hovering a row focuses it and a card follows the cursor with what the
     client gets from that service (pattern: 21st.dev "Services with Animated Hover
     Modal" / "Hover Image List"). Touch: each row has a "What you get" toggle instead. */
  (function () {
    var wrap = document.querySelector('.srows-wrap');
    if (!wrap) return;
    var rows = Array.prototype.slice.call(wrap.querySelectorAll('.srow[data-n]'));

    // Touch / keyboard: inline disclosure
    rows.forEach(function (row) {
      var btn = row.querySelector('.srow-toggle');
      var more = row.querySelector('.srow-more');
      if (!btn || !more) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        more.hidden = !open;
        row.classList.toggle('is-open', open);
      });
    });

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var preview = wrap.querySelector('.srow-preview');
    var numEl = preview.querySelector('.pv-num');
    var titleEl = preview.querySelector('.pv-title');
    var bodyEl = preview.querySelector('.pv-body');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var x = 0, y = 0, tx = 0, ty = 0, raf = null, current = null;

    function fill(row) {
      numEl.textContent = row.dataset.n;
      titleEl.textContent = row.querySelector('.srow-link').textContent;
      var src = row.querySelector('.srow-more');
      var copy = document.createDocumentFragment();
      Array.prototype.forEach.call(src.children, function (c) { copy.appendChild(c.cloneNode(true)); });
      bodyEl.replaceChildren(copy);
    }
    function place() { preview.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }
    function loop() {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      place();
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : null;
    }
    function target(e) {
      var r = wrap.getBoundingClientRect();
      var w = preview.offsetWidth, h = preview.offsetHeight;
      var px = e.clientX - r.left + 28;
      if (e.clientX + 28 + w > window.innerWidth - 16) px = e.clientX - r.left - w - 28; // flip left near the edge
      tx = px;
      ty = Math.max(-40, Math.min(r.height - h + 40, e.clientY - r.top - h / 2));
    }

    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function (e) {
        if (current !== row) { fill(row); current = row; }
        target(e);
        if (!preview.classList.contains('is-on')) { x = tx; y = ty; place(); }
        preview.classList.add('is-on');
      });
      row.addEventListener('mouseleave', function () { preview.classList.remove('is-on'); });
      // keyboard: show the card beside the focused row
      var link = row.querySelector('.srow-link');
      link.addEventListener('focus', function () {
        if (current !== row) { fill(row); current = row; }
        var r = wrap.getBoundingClientRect(), b = link.getBoundingClientRect();
        x = tx = b.right - r.left + 28;
        y = ty = b.top - r.top - 20;
        place();
        preview.classList.add('is-on');
      });
      link.addEventListener('blur', function () { preview.classList.remove('is-on'); });
    });
    wrap.addEventListener('mousemove', function (e) {
      target(e);
      if (still) { x = tx; y = ty; place(); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    });
  })();

  /* ── Booking ── */
  var form = document.getElementById('book-form');
  if (!form) return;

  var MAIL = 'sales@serenedge.com';
  var state = { topic: 'Web Development' };
  // Preselect the topic when arriving from a Services row (book.html?topic=...)
  try {
    var wanted = new URLSearchParams(window.location.search).get('topic');
    if (wanted && document.querySelector('#topics [data-topic="' + wanted.replace(/"/g, '') + '"]')) state.topic = wanted;
  } catch (e) {}

  var $ = function (id) { return document.getElementById(id); };
  var topicsEl = $('topics'), sumEl = $('summary'), errEl = $('form-err');

  function renderTopics() {
    Array.prototype.forEach.call(topicsEl.children, function (b) {
      var on = b.dataset.topic === state.topic;
      b.classList.toggle('is-sel', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
  function summary() { return state.topic + ' · 90-minute discovery call · Free'; }
  function renderSummary() { sumEl.textContent = summary(); }

  topicsEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.topic = b.dataset.topic; renderTopics(); renderSummary(); errEl.hidden = true;
  });

  var nameEl = $('bk-name'), emailEl = $('bk-email'), msgEl = $('bk-msg');
  [nameEl, emailEl, msgEl].forEach(function (el) {
    el.addEventListener('input', function () { el.removeAttribute('aria-invalid'); errEl.hidden = true; });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
    var nameOk = !!nameEl.value.trim(), msgOk = !!msgEl.value.trim();
    nameEl.setAttribute('aria-invalid', String(!nameOk));
    emailEl.setAttribute('aria-invalid', String(!emailOk));
    msgEl.setAttribute('aria-invalid', String(!msgOk));
    if (!(nameOk && emailOk && msgOk)) {
      errEl.hidden = false;
      (!nameOk ? nameEl : !emailOk ? emailEl : msgEl).focus();
      return;
    }
    var subject = 'Discovery call: ' + state.topic + ' · ' + nameEl.value.trim();
    var body = [
      'Topic: ' + state.topic,
      'Name: ' + nameEl.value.trim(),
      'Email: ' + emailEl.value.trim(),
      '',
      msgEl.value.trim()
    ].join('\n');
    $('recap').textContent = summary();
    form.hidden = true;
    $('sent').hidden = false;
    $('sent').focus();
    window.location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });

  $('book-again').addEventListener('click', function () {
    form.reset();
    state.topic = 'Web Development';
    [nameEl, emailEl, msgEl].forEach(function (el) { el.removeAttribute('aria-invalid'); });
    renderTopics(); renderSummary(); errEl.hidden = true;
    $('sent').hidden = true; form.hidden = false;
  });

  renderTopics(); renderSummary();
})();
