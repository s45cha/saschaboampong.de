/* ============================================================
   Shared behaviour for all redesign directions
   - sticky nav state
   - mobile menu
   - scroll reveal (IntersectionObserver)
   - exclusive FAQ accordion
   - contact form (preview-safe)
   ============================================================ */
(function () {
  'use strict';

  /* ---- Sticky nav ---- */
  var nav = document.querySelector('[data-nav]');
  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 16);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-menu]');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }

  /* ---- Scroll reveal ---- */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    // Reveal anything already in view on load
    setTimeout(function () {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 60);
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- FAQ: only one open at a time ---- */
  var faqs = document.querySelectorAll('details.faq__item');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) faqs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---- Marquee: duplicate items for seamless loop ---- */
  var track = document.querySelector('[data-marquee]');
  if (track && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    track.innerHTML += track.innerHTML;
  }

  /* ---- Contact form → Cloudflare Pages Function /kontakt ---- */
  var form = document.querySelector('[data-form]');
  if (form) {
    var btn = form.querySelector('[type="submit"]');
    var okEl = form.querySelector('[data-success]');
    var errEl = form.querySelector('[data-error]');
    var btnLabel = btn ? btn.innerHTML : '';

    function reset() {
      if (okEl) okEl.classList.remove('is-visible');
      if (errEl) errEl.classList.remove('is-visible');
    }
    function showOk(msg) { if (okEl) { okEl.textContent = '✓ ' + msg; okEl.classList.add('is-visible'); } }
    function showErr(msg) { if (errEl) { errEl.textContent = msg; errEl.classList.add('is-visible'); } }
    function busy(on) {
      if (!btn) return;
      btn.disabled = on;
      btn.innerHTML = on ? 'Senden …' : btnLabel;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      reset();
      var data = {
        name: (form.querySelector('#name') || {}).value || '',
        email: (form.querySelector('#email') || {}).value || '',
        nachricht: (form.querySelector('#nachricht') || {}).value || ''
      };
      data.name = data.name.trim(); data.email = data.email.trim(); data.nachricht = data.nachricht.trim();
      if (!data.name || !data.email || !data.nachricht) { showErr('Bitte fülle alle Felder aus.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { showErr('Bitte gib eine gültige E-Mail-Adresse ein.'); return; }

      var key = form.getAttribute('data-access-key') || '';
      // Honeypot: if filled, silently "succeed" (likely a bot)
      var honey = form.querySelector('[name="botcheck"]');
      busy(true);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: key,
          subject: 'Neue Nachricht von ' + data.name + ' – saschaboampong.de',
          from_name: 'saschaboampong.de',
          name: data.name,
          email: data.email,
          message: data.nachricht,
          botcheck: honey && honey.checked ? true : false
        })
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, j: j }; }); })
        .then(function (r) {
          if (r.ok && r.j.success) { showOk('Deine Nachricht wurde gesendet. Ich melde mich persönlich bei dir.'); form.reset(); }
          else { showErr((r.j && r.j.message) || 'Senden fehlgeschlagen. Bitte schreib direkt an hallo@saschaboampong.de.'); }
        })
        .catch(function () { showErr('Senden fehlgeschlagen. Bitte schreib direkt an hallo@saschaboampong.de.'); })
        .finally(function () { busy(false); });
    });
  }
})();
