(function () {
  'use strict';
  var d = document;

  /* menu mobilne */
  var burger = d.getElementById('burger'), menu = d.getElementById('menu');
  function zamknij() { menu.classList.remove('otwarte'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); }
  burger.addEventListener('click', function () {
    var o = menu.classList.toggle('otwarte');
    burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    burger.setAttribute('aria-label', o ? 'Zamknij menu' : 'Otwórz menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') zamknij(); });

  /* aktywna pozycja menu */
  var linki = [].slice.call(menu.querySelectorAll(':scope > a')).filter(function (a) { return (a.getAttribute('href') || '').charAt(0) === '#'; });
  var cele = linki.map(function (a) { return d.querySelector(a.getAttribute('href')); });
  function aktywna() {
    var y = window.scrollY + window.innerHeight * 0.3, ix = -1;
    cele.forEach(function (s, i) { if (s && s.getBoundingClientRect().top + window.scrollY <= y) ix = i; });
    linki.forEach(function (a, i) { if (i === ix) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  if (linki.length) { window.addEventListener('scroll', aktywna, { passive: true }); aktywna(); }

  /* pomocnicze do galerii: płynność (bez przy reduced-motion), pozycja najbliższego zdjęcia (lewa krawędź) */
  function plynnie() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }
  function pozycje(tor) { var a = tor.getBoundingClientRect(); return [].map.call(tor.children, function (el) { return tor.scrollLeft + el.getBoundingClientRect().left - a.left - (parseFloat(getComputedStyle(tor).paddingLeft) || 0); }); }
  function najblizsza(tor) {
    var max = tor.scrollWidth - tor.clientWidth, best = 0, dmin = Infinity;
    pozycje(tor).forEach(function (x) { x = Math.max(0, Math.min(max, x)); var dd = Math.abs(x - tor.scrollLeft); if (dd < dmin) { dmin = dd; best = x; } });
    return best;
  }

  /* przeciąganie myszą (galerie w kartach i tory poziome) */
  function ciagnij(tor) {
    var x0 = 0, s0 = 0, ruch = false, wcisniety = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      wcisniety = true; ruch = false; x0 = e.clientX; s0 = tor.scrollLeft; e.preventDefault();
    });
    window.addEventListener('pointermove', function (e) {
      if (!wcisniety) return;
      var dx = e.clientX - x0;
      if (!ruch && Math.abs(dx) > 4) { ruch = true; tor.classList.add('ciagnie'); }
      if (ruch) tor.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!wcisniety) return;
      wcisniety = false;
      if (ruch) {
        tor.classList.remove('ciagnie');
        tor.scrollTo({ left: najblizsza(tor), behavior: plynnie() });
      }
    });
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); ruch = false; } }, true);
  }
  [].forEach.call(d.querySelectorAll('[data-ciagnij]'), ciagnij);

  var strzL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  var strzP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  [].forEach.call(d.querySelectorAll('[data-galeria]'), function (g) {
    var tor = g.querySelector('.tor'), n = tor.children.length;
    if (n < 2) { var c1 = d.createElement('span'); c1.className = 'licznik'; c1.textContent = '1 / 1'; g.appendChild(c1); return; }
    var nazwa = g.dataset.nazwa || '';
    tor.setAttribute('tabindex', '0');
    tor.setAttribute('aria-label', 'Zdjęcia ' + nazwa + ', przesuń w bok');
    var l = d.createElement('button'), p = d.createElement('button'), c = d.createElement('span');
    l.className = 'strz l'; p.className = 'strz p'; c.className = 'licznik';
    l.type = p.type = 'button'; l.innerHTML = strzL; p.innerHTML = strzP;
    l.setAttribute('aria-label', 'Poprzednie zdjęcie'); p.setAttribute('aria-label', 'Następne zdjęcie');
    g.appendChild(l); g.appendChild(p); g.appendChild(c);
    function ix() { return Math.round(tor.scrollLeft / tor.clientWidth); }
    function idz(i) { i = (i + n) % n; tor.scrollTo({ left: i * tor.clientWidth, behavior: 'smooth' }); }
    function licz() { c.textContent = (ix() + 1) + ' / ' + n; }
    l.addEventListener('click', function () { idz(ix() - 1); });
    p.addEventListener('click', function () { idz(ix() + 1); });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(ix() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(ix() - 1); }
    });
    tor.addEventListener('scroll', licz, { passive: true });
    licz();
    ciagnij(tor);
  });

  /* tory poziome (ogródek, okolica): pas w szerokości treści, od zdjęcia 1, przewijanie w prawo i z powrotem.
     Strzałki (komputer) przesuwają o jedno zdjęcie; na początku „wstecz”, na końcu „dalej” nieaktywne. */
  [].forEach.call(d.querySelectorAll('.tor-poziomy'), function (tor) {
    var kafle = tor.querySelectorAll('.kafel'), n = kafle.length;
    [].forEach.call(kafle, function (k, i) { var s = d.createElement('span'); s.className = 'licznik'; s.textContent = (i + 1) + ' / ' + n; k.appendChild(s); });
    var nav = d.createElement('div'); nav.className = 'tor-nav';
    nav.innerHTML = '<button type="button" class="strz-t" aria-label="Poprzednie zdjęcie">' + strzL + '</button><button type="button" class="strz-t" aria-label="Następne zdjęcie">' + strzP + '</button>';
    tor.parentNode.insertBefore(nav, tor);
    var b = nav.querySelectorAll('button');
    var cel0 = null, dotyk = false;
    function idz(kier) {
      var max = tor.scrollWidth - tor.clientWidth, x = cel0 !== null ? cel0 : tor.scrollLeft, poz = pozycje(tor).map(function (v) { return Math.max(0, Math.min(max, v)); }), cel = x;
      if (kier > 0) { for (var i = 0; i < poz.length; i++) if (poz[i] > x + 4) { cel = poz[i]; break; } }
      else { for (var j = poz.length - 1; j >= 0; j--) if (poz[j] < x - 4) { cel = poz[j]; break; } }
      cel0 = cel; tor.scrollTo({ left: cel, behavior: plynnie() });
    }
    /* po zatrzymaniu: koniec serii kliknięć; dociągnięcie do krawędzi zdjęcia, gdyby przeglądarka nie dosnapowała */
    function koniec() {
      cel0 = null;
      if (dotyk || tor.classList.contains('ciagnie')) return;
      var x = najblizsza(tor); if (Math.abs(x - tor.scrollLeft) > 2) tor.scrollTo({ left: x, behavior: plynnie() });
    }
    tor.addEventListener('touchstart', function () { dotyk = true; }, { passive: true });
    tor.addEventListener('touchend', function () { dotyk = false; setTimeout(koniec, 400); }, { passive: true });
    tor.addEventListener('touchcancel', function () { dotyk = false; }, { passive: true });
    if ('onscrollend' in window) tor.addEventListener('scrollend', koniec);
    else { var tk; tor.addEventListener('scroll', function () { clearTimeout(tk); tk = setTimeout(koniec, 180); }, { passive: true }); }
    b[0].addEventListener('click', function () { idz(-1); });
    b[1].addEventListener('click', function () { idz(1); });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); }
    });
    function stan() { b[0].disabled = tor.scrollLeft < 4; b[1].disabled = tor.scrollLeft + tor.clientWidth > tor.scrollWidth - 4; }
    tor.addEventListener('scroll', stan, { passive: true }); window.addEventListener('resize', stan); stan();
    if ('IntersectionObserver' in window) { var io2 = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io2.disconnect(); stan(); } }); io2.observe(tor); }
  });

  /* formularz zapytania o turnus */
  var f = d.getElementById('formularz'), info = d.getElementById('info-form');
  if (f) {
    var przyj = f.querySelector('[name="przyjazd"]'), uw = d.getElementById('uwaga-sob');
    if (przyj && uw) przyj.addEventListener('change', function () {
      var v = przyj.value; if (!v) { uw.hidden = true; return; }
      var p = v.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
      uw.hidden = dt.getDay() === 6;
    });
    var odsw = false;
    f.addEventListener('focusin', function () {
      if (odsw || !window.DS || !DS.ajax) return; odsw = true;
      fetch(DS.ajax + '?action=ds_token', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.t) f.querySelector('[name="t"]').value = j.t; }).catch(function () {});
    });
    var komunikat = function (tekst, klasa) { info.className = 'info-form' + (klasa ? ' ' + klasa : ''); info.textContent = tekst; };
    f.addEventListener('submit', function (e) {
      var brak = [].filter.call(f.querySelectorAll('[required]'), function (el) { return !el.value.trim(); });
      var tel = f.querySelector('[name="telefon"]'), em = f.querySelector('[name="email"]');
      if (brak.length) { e.preventDefault(); brak[0].focus(); komunikat('Proszę uzupełnić datę przyjazdu i imię.', 'blad'); return; }
      if (!tel.value.trim() && !em.value.trim()) { e.preventDefault(); tel.focus(); komunikat('Proszę podać telefon albo e-mail, żebyśmy mogli odpowiedzieć.', 'blad'); return; }
      if (em.value.trim() && !em.checkValidity()) { e.preventDefault(); em.focus(); komunikat('Proszę sprawdzić adres e-mail.', 'blad'); return; }
      if (f.dataset.test) { e.preventDefault(); komunikat(f.dataset.test, 'ok'); return; }
      if (!window.fetch || !window.FormData || !window.DS || !DS.ajax) return; // zwykłe wysłanie formularza
      e.preventDefault();
      var b = f.querySelector('button[type="submit"]'); b.disabled = true;
      komunikat('Wysyłanie...', '');
      var dane = new FormData(f); dane.append('ajax', '1');
      fetch(DS.ajax, { method: 'POST', body: dane, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          komunikat(j.msg || 'Dziękujemy.', j.ok ? 'ok' : 'blad');
          if (j.ok) { f.reset(); if (uw) uw.hidden = true; }
        })
        .catch(function () { komunikat('Nie udało się wysłać zapytania. Proszę zadzwonić albo spróbować ponownie.', 'blad'); })
        .then(function () { b.disabled = false; });
    });
  }

  /* dolny pasek na telefonie po przewinięciu za przycisk w hero */
  var pasek = d.getElementById('pasek'), cta = d.getElementById('hero-cta'), rez = d.getElementById('termin');
  if ('IntersectionObserver' in window && pasek && cta) {
    var zaHero = false, wRez = false;
    function ustaw() { var w = zaHero && !wRez; pasek.classList.toggle('widac', w); pasek.setAttribute('aria-hidden', w ? 'false' : 'true'); [].forEach.call(pasek.querySelectorAll('a'), function (a) { a.tabIndex = w ? 0 : -1; }); }
    new IntersectionObserver(function (en) { zaHero = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; ustaw(); }).observe(cta);
    new IntersectionObserver(function (en) { wRez = en[0].isIntersecting; ustaw(); }, { threshold: 0.15 }).observe(rez);
  }

  /* baner cookies (widoczny od razu w HTML) i mapa Google ładowana przy przewinięciu */
  var ck = d.getElementById('cookies'), mapa = d.getElementById('mapa');
  function zgoda() { try { return localStorage.getItem('sielanka-zgoda'); } catch (err) { return null; } }
  function wlaczMape() {
    if (!mapa || mapa.querySelector('iframe')) return;
    var z = mapa.querySelector('.mapa-zastep'); if (z) z.hidden = true;
    var i = d.createElement('iframe');
    i.title = 'Mapa dojazdu: Domki Sielanka, ul. Wczasowa 6, Dąbki';
    i.src = mapa.dataset.src; i.loading = 'lazy'; i.referrerPolicy = 'no-referrer-when-downgrade'; i.allowFullscreen = true;
    mapa.appendChild(i);
  }
  function stanMapy() {
    if (!mapa || mapa.querySelector('iframe')) return;
    if (zgoda() === 'nie') { mapa.querySelector('.mapa-zastep').hidden = false; } else { wlaczMape(); }
  }
  if (mapa) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); stanMapy(); } }, { rootMargin: '400px 0px' });
      io.observe(mapa);
    } else { stanMapy(); }
    mapa.addEventListener('click', function (e) { if (e.target.closest('[data-mapa-pokaz]')) wlaczMape(); });
  }
  if (ck) {
    if (zgoda()) ck.hidden = true;
    ck.addEventListener('click', function (e) {
      var b = e.target.closest('[data-zgoda]'); if (!b) return;
      try { localStorage.setItem('sielanka-zgoda', b.dataset.zgoda); } catch (err) {}
      ck.hidden = true;
      if (b.dataset.zgoda === 'tak' && mapa && mapa.querySelector('.mapa-zastep') && !mapa.querySelector('.mapa-zastep').hidden) wlaczMape();
    });
    [].forEach.call(d.querySelectorAll('[data-cookies-ustawienia]'), function (b) { b.addEventListener('click', function () { ck.hidden = false; ck.querySelector('button').focus(); }); });
  }
})();
