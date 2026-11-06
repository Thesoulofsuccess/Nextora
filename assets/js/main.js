/* Nextora Technologies — site behaviour (no dependencies) */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Header: mega menu + mobile menu
     --------------------------------------------------------- */
  var mega = $('#mega');
  var mnav = $('#mnav');
  var burger = $('.burger');
  var navBtns = $$('.nav-btn');
  var activeMenu = null;

  function setMega(id) {
    activeMenu = id;
    mega.hidden = !id;
    navBtns.forEach(function (b) { b.setAttribute('aria-expanded', String(b.dataset.menu === id)); });
    $$('.mega-col', mega).forEach(function (c) { c.classList.toggle('is-active', c.dataset.col === id); });
  }
  function setMobile(open) {
    mnav.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  navBtns.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      setMega(activeMenu === b.dataset.menu ? null : b.dataset.menu);
    });
  });
  burger.addEventListener('click', function (e) { e.stopPropagation(); setMega(null); setMobile(mnav.hidden); });
  $('[data-close-mega]').addEventListener('click', function () { setMega(null); });
  document.addEventListener('click', function (e) {
    if (activeMenu && !mega.contains(e.target)) setMega(null);
    if (!mnav.hidden && !mnav.contains(e.target) && e.target !== burger) setMobile(false);
  });
  $$('a', mega).concat($$('a', mnav)).forEach(function (a) {
    a.addEventListener('click', function () { setMega(null); setMobile(false); });
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1080) setMobile(false); });

  // Header: faint shadow once the page scrolls
  var header = $('.site-header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------------------------------------------------------
     Hero: three streams converging (canvas 2D)
     --------------------------------------------------------- */
  var focusStream = null;
  (function hero() {
    var cv = $('.hero-canvas');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var section = $('.hero');
    var COL = ['91,22,20', '196,132,14', '84,92,104'];
    var S = [
      { id: 'people', y: 0.13, spread: 0.15, amp: 0.035, speed: 0.55, delay: 0.15, lane: -1, pulse: 0.06 },
      { id: 'technology', y: 0.5, spread: 0.10, amp: 0.012, speed: 1.35, delay: 0.4, lane: 0, pulse: 0.24 },
      { id: 'infrastructure', y: 0.87, spread: 0.13, amp: 0.004, speed: 0.22, delay: 0.65, lane: 1, pulse: 0.04 }
    ];
    var mx = 0, my = 0, tmx = 0, tmy = 0, raf = 0, visible = true, t0 = performance.now();
    var ease = function (x) { return x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3); };
    var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var bez = function (a, b, c, d, u) { var v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; };

    section.addEventListener('pointermove', function (e) {
      var r = section.getBoundingClientRect();
      tmx = (e.clientX - r.left) / r.width - 0.5; tmy = (e.clientY - r.top) / r.height - 0.5;
    });
    section.addEventListener('pointerleave', function () { tmx = 0; tmy = 0; });

    function draw(t) {
      var W = cv.clientWidth, H = cv.clientHeight;
      if (!W || !H) return;
      var narrow = W < 760, N = narrow ? 14 : 22;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var pw = Math.round(W * dpr), ph = Math.round(H * dpr);
      if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      var k = ease((t - 1.0) / 2.8);
      var Cx = W * (narrow ? 0.62 : 0.75) + mx * W * 0.03, Cy = H * (narrow ? 0.5 : 0.47) + my * H * 0.06;
      var endX = W + 20, span = endX - Cx, A = H * (narrow ? 0.03 : 0.024);
      if (k > 0) {
        var r0 = (narrow ? 70 : 150) * k, hg = ctx.createRadialGradient(Cx, Cy, 0, Cx, Cy, r0);
        hg.addColorStop(0, 'rgba(255,255,255,' + (0.8 * k) + ')'); hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(Cx, Cy, r0, 0, 6.2832); ctx.fill();
      }
      var a0 = narrow ? 0.0 : 0.33, a1 = narrow ? 0.18 : 0.47;
      for (var si = 0; si < 3; si++) {
        var s = S[si], rgb = COL[si], ap = ease((t - s.delay) / 1.8);
        if (ap <= 0) continue;
        var dim = focusStream && focusStream !== s.id ? 0.16 : 1;
        var g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(a0, 'rgba(' + rgb + ',0)');
        g.addColorStop(a1, 'rgba(' + rgb + ',0.6)'); g.addColorStop(0.62, 'rgba(' + rgb + ',1)');
        g.addColorStop(0.84, 'rgba(' + rgb + ',0.7)'); g.addColorStop(1, 'rgba(' + rgb + ',0.05)');
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * ap * 1.05, H); ctx.clip();
        ctx.strokeStyle = g;
        for (var i = 0; i < N; i++) {
          var o = i / (N - 1) - 0.5, phs = i * 0.41 + si * 2.3;
          var wob = s.amp * H * (Math.sin(t * s.speed + phs) + 0.5 * Math.sin(t * s.speed * 0.53 + phs * 1.7));
          var sy = H * s.y + o * H * s.spread + wob;
          var lane = s.lane * H * 0.004 + o * H * 0.022;
          var freeY = H * s.y * 0.7 + Cy * 0.3 + o * H * s.spread * 0.55 + wob * 0.7;
          var ey = freeY + (Cy + lane * 0.5 - freeY) * k;
          var outFree = H * s.y + o * H * s.spread * 0.8 + wob;
          var c1x = W * (narrow ? 0.2 : 0.44), c1y = sy + wob * 0.6;
          var c2x = Cx - W * 0.13, c2y = ey + o * H * 0.05 * (1 - k * 0.7);
          var yAt = (function (ey, outFree, lane, o, si) {
            return function (x) {
              var f = (x - Cx) / span, sm = f * f * (3 - 2 * f), free = ey + (outFree - ey) * sm, env = Math.min(1, f * 3.2);
              var conv = Cy + lane * (0.5 + f * 1.3) + A * env * Math.sin(f * 6.4 + si * 2.094 - t * 0.45 + o * 0.5);
              return free + (conv - free) * k;
            };
          })(ey, outFree, lane, o, si);
          ctx.beginPath(); ctx.moveTo(-20, sy); ctx.bezierCurveTo(c1x, c1y, c2x, c2y, Cx, ey);
          for (var x = Cx + 10; x <= endX; x += 10) ctx.lineTo(x, yAt(x));
          var core = i === Math.floor(N / 2) || i === Math.floor(N / 2) - 5 || i === Math.floor(N / 2) + 5;
          ctx.globalAlpha = (core ? 0.8 : 0.5) * dim; ctx.lineWidth = core ? 1.3 : 0.9; ctx.stroke();
          if (i % 4 === 0 && !reduceMotion) {
            var u = (t * s.pulse * (1 + (i % 5) * 0.12) + i * 0.137) % 1, px, py;
            if (u < 0.62) { var v = u / 0.62; px = bez(-20, c1x, c2x, Cx, v); py = bez(sy, c1y, c2y, ey, v); }
            else { px = Cx + ((u - 0.62) / 0.38) * span; py = yAt(px); }
            var fade = clamp((px - W * (narrow ? 0.1 : 0.42)) / (W * 0.14)) * clamp((endX - px) / (W * 0.16));
            if (fade > 0) { ctx.globalAlpha = 0.85 * dim * fade; ctx.fillStyle = 'rgb(' + rgb + ')'; ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 6.2832); ctx.fill(); }
          }
        }
        ctx.restore();
      }
      if (k > 0) { ctx.globalAlpha = k; ctx.fillStyle = '#5B1614'; ctx.beginPath(); ctx.arc(Cx, Cy, 2.6, 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    function loop() {
      raf = 0;
      draw(reduceMotion ? 10 : (performance.now() - t0) / 1000);
      if (!reduceMotion && visible && !document.hidden) raf = requestAnimationFrame(loop);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !raf && !reduceMotion) loop(); }).observe(cv);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible && !raf && !reduceMotion) loop(); });
    window.addEventListener('resize', function () { if (reduceMotion) draw(10); });
    loop();

    // Stream rail: highlight one pillar
    var rail = $('.rail');
    $$('.rail button').forEach(function (b) {
      var on = function () {
        focusStream = b.dataset.stream; rail.classList.add('has-focus');
        $$('.rail button').forEach(function (x) { var f = x === b; x.classList.toggle('is-focus', f); x.setAttribute('aria-pressed', String(f)); });
        if (reduceMotion) draw(10);
      };
      var off = function () {
        focusStream = null; rail.classList.remove('has-focus');
        $$('.rail button').forEach(function (x) { x.classList.remove('is-focus'); x.setAttribute('aria-pressed', 'false'); });
        if (reduceMotion) draw(10);
      };
      b.addEventListener('pointerenter', on); b.addEventListener('pointerleave', off);
      b.addEventListener('focus', on); b.addEventListener('blur', off);
      b.addEventListener('click', on);
    });
  })();

  /* ---------------------------------------------------------
     People: expanding photo panels
     --------------------------------------------------------- */
  var panels = $$('[data-panel]');
  panels.forEach(function (p) {
    var open = function () {
      panels.forEach(function (x) { var o = x === p; x.classList.toggle('is-open', o); x.setAttribute('aria-expanded', String(o)); });
    };
    p.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') open(); });
    p.addEventListener('focus', open);
    p.addEventListener('click', open);
  });

  /* ---------------------------------------------------------
     Capabilities: outcome picker
     --------------------------------------------------------- */
  var IMG = {
    aisle: ['assets/img/photos/aisle.jpg', 'A data centre aisle lined with server racks'],
    tech: ['assets/img/photos/tech.jpg', 'Fibre optic cables connected to a network switch'],
    infra: ['assets/img/photos/infra.jpg', 'An engineer connecting cables in a server rack'],
    connect: ['assets/img/photos/connect.jpg', 'An office reception desk with a phone and headset'],
    team: ['assets/img/photos/team.jpg', 'IT professionals working together around a laptop']
  };
  var CAPS = {
    run: { n: '01', word: 'Run', service: 'Cloud & infrastructure', p: 0, t: 1, i: 1, img: 'aisle', outcome: 'Keep systems available, fast and cost-efficient.', desc: 'Cloud and on-premises infrastructure, designed, migrated and managed around how your business runs.', services: ['Cloud migrations', 'Hybrid cloud', 'Server, storage & virtualisation', 'Data centre management', 'Cost optimisation'] },
    protect: { n: '02', word: 'Protect', service: 'Network & security', p: 0, t: 1, i: 0, img: 'tech', outcome: 'Secure every layer, from the network to the endpoint.', desc: 'Fast, reliable networks with protection in depth, from firewalls through to a Zero Trust architecture.', services: ['LAN, WAN & wireless', 'Firewall & VPN', 'Intrusion prevention', 'Endpoint & server security', 'Zero Trust'] },
    recover: { n: '03', word: 'Recover', service: 'DR, BCP & backup', p: 0, t: 0, i: 1, img: 'infra', outcome: 'Get back to business when something fails.', desc: 'Backup, disaster recovery and continuity planning built around your recovery objectives, and tested with regular DR drills.', services: ['Cloud & on-premises backup', 'RPO/RTO-driven DR planning', 'High-availability architecture', 'DR drills & compliance support'] },
    connect: { n: '04', word: 'Connect', service: 'Telephony & communications', p: 0, t: 1, i: 0, img: 'connect', outcome: 'Keep teams and customers connected, anywhere, anytime.', desc: 'Voice and unified communications for offices and call centres.', services: ['VoIP & IP-PBX deployment', 'Unified communications', 'Call centre setup & integration', 'SIP trunking & number portability'] },
    equip: { n: '05', word: 'Equip', service: 'Rent-A-Hardware', p: 0, t: 0, i: 1, img: 'infra', outcome: 'Top-tier IT equipment, without the upfront investment.', desc: 'Flexible rental terms for projects, events and growing teams, with maintenance and support included.', services: ['Servers, storage & networking gear', 'Laptops, desktops & peripherals', 'On-demand scaling', 'Maintenance & support included'] },
    advise: { n: '06', word: 'Advise', service: 'Consultancy services', p: 1, t: 1, i: 1, img: 'team', outcome: 'Align technology with your business goals.', desc: 'Senior IT expertise to plan what comes next, from strategy and roadmaps to procurement.', services: ['IT strategy & roadmap', 'Cloud adoption & cost optimisation', 'Network & security assessment', 'Procurement & vendor management'] },
    people: { n: '07', word: 'People', service: 'IT & Non-IT workforce', p: 1, t: 0, i: 0, img: 'team', outcome: 'The right people, in the right roles.', desc: 'Pre-screened IT and non-IT candidates on permanent, contract, project or on-demand terms, with quick shortlisting and support from sourcing through to compliance.', services: ['IT staffing', 'Non-IT staffing', 'Flexible hiring models', 'Quick turnaround', 'End-to-end support'] }
  };
  var PCOL = { p: '#5B1614', t: '#C4840E', i: '#545C68' }, DIM = '#D3CCC3';
  var cd = {};
  $$('[data-cd]').forEach(function (el) { cd[el.dataset.cd] = el; });
  function showCap(id) {
    var c = CAPS[id]; if (!c) return;
    $$('.cap-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.capId === id)); });
    var im = IMG[c.img];
    cd.img.src = im[0]; cd.img.alt = im[1];
    cd.label.textContent = c.n + ' — ' + c.word + ' · ' + c.service;
    var draws = [c.p ? 'People' : null, c.t ? 'Technology' : null, c.i ? 'Infrastructure' : null].filter(Boolean);
    cd.draws.textContent = 'Draws on: ' + draws.join(' · ');
    cd.svg.setAttribute('aria-label', c.word + ' draws on ' + draws.join(', '));
    cd.outcome.textContent = c.outcome;
    cd.desc.textContent = c.desc;
    ['p', 't', 'i'].forEach(function (k) {
      var path = cd.svg.querySelector('[data-p="' + k + '"]');
      path.setAttribute('stroke', c[k] ? PCOL[k] : DIM);
      path.setAttribute('stroke-width', c[k] ? '3' : '1.4');
    });
    cd.services.innerHTML = '';
    c.services.forEach(function (s) { var li = document.createElement('li'); li.textContent = s; cd.services.appendChild(li); });
    cd.cta.textContent = 'Talk to us about ' + c.word + ' →';
  }
  $$('.cap-btn').forEach(function (b) { b.addEventListener('click', function () { showCap(b.dataset.capId); }); });
  $$('[data-cap]').forEach(function (a) { a.addEventListener('click', function () { showCap(a.dataset.cap); }); });

  /* ---------------------------------------------------------
     Why Nextora: separate providers vs one partner
     --------------------------------------------------------- */
  $$('[data-why]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.why;
      $$('[data-why]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('[data-why-state]').forEach(function (s) { s.hidden = s.dataset.whyState !== v; });
    });
  });

  /* ---------------------------------------------------------
     Forms (contact + gated profile) → api/lead.php
     --------------------------------------------------------- */
  var topicBtns = $$('.topic-list button');
  var topic = '';
  function setTopic(t) {
    topic = t;
    topicBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.textContent.trim() === t)); });
  }
  topicBtns.forEach(function (b) {
    b.addEventListener('click', function () { setTopic(topic === b.textContent.trim() ? '' : b.textContent.trim()); });
  });
  $$('[data-topic]').forEach(function (a) { a.addEventListener('click', function () { setTopic(a.dataset.topic); }); });

  function post(payload) {
    return fetch('api/lead.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload), credentials: 'same-origin'
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false }; }).then(function (j) { j.status = r.status; return j; });
    });
  }
  var FALLBACK = 'Sorry, something went wrong. Please email info@nextoratechnologies.com or call +91 73040 47029.';
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var cf = $('#contact-form');
  if (cf) cf.addEventListener('submit', function (e) {
    e.preventDefault();
    var st = $('.form-status', cf), btn = $('button[type="submit"]', cf);
    var data = { type: 'contact', name: cf.elements['name'].value.trim(), email: cf.elements['email'].value.trim(), message: cf.elements['message'].value.trim(), topic: topic, website: cf.elements['website'].value };
    st.className = 'form-status';
    if (!data.name) { st.textContent = 'Please enter your name.'; st.classList.add('is-error'); cf.elements['name'].focus(); return; }
    if (!data.email) { st.textContent = 'Please enter your work email or phone number.'; st.classList.add('is-error'); cf.elements['email'].focus(); return; }
    btn.disabled = true; st.textContent = 'Sending…';
    post(data).then(function (j) {
      btn.disabled = false;
      if (j.ok) { cf.reset(); setTopic(''); st.textContent = 'Thank you. A senior member of our team will be in touch shortly.'; st.classList.add('is-ok'); }
      else { st.textContent = j.error || FALLBACK; st.classList.add('is-error'); }
    }).catch(function () { btn.disabled = false; st.textContent = FALLBACK; st.classList.add('is-error'); });
  });

  // Gated business-profile download
  var gate = $('#gate'), gf = $('#gate-form'), done = $('.modal-done', gate), lastFocus = null;
  function openGate() {
    lastFocus = document.activeElement;
    setMega(null); setMobile(false);
    gate.hidden = false; document.body.style.overflow = 'hidden';
    var first = done.hidden ? gf.elements['name'] : $('[data-download]', gate);
    setTimeout(function () { first.focus(); }, 30);
  }
  function closeGate() {
    gate.hidden = true; document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-gate]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openGate(); }); });
  $$('[data-close-gate]').forEach(function (b) { b.addEventListener('click', closeGate); });
  gate.addEventListener('click', function (e) { if (e.target === gate) closeGate(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!gate.hidden) closeGate(); setMega(null); setMobile(false); }
    if (e.key === 'Tab' && !gate.hidden) {
      var f = $$('a[href], button:not([disabled]), input:not([tabindex="-1"])', gate).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  if (location.hash === '#profile') openGate();

  gf.addEventListener('submit', function (e) {
    e.preventDefault();
    var st = $('.form-status', gf), btn = $('button[type="submit"]', gf);
    var data = { type: 'profile', name: gf.elements['name'].value.trim(), email: gf.elements['email'].value.trim(), company: gf.elements['company'].value.trim(), website: gf.elements['website'].value };
    st.className = 'form-status';
    if (!data.name) { st.textContent = 'Please enter your name.'; st.classList.add('is-error'); gf.elements['name'].focus(); return; }
    if (!emailRe.test(data.email)) { st.textContent = 'Please enter a valid work email.'; st.classList.add('is-error'); gf.elements['email'].focus(); return; }
    btn.disabled = true; st.textContent = 'One moment…';
    post(data).then(function (j) {
      btn.disabled = false;
      if (j.ok) {
        $('[data-first]', gate).textContent = data.name.split(' ')[0] || 'there';
        if (j.download) $('[data-download]', gate).href = j.download;
        gf.hidden = true; done.hidden = false; st.textContent = '';
        $('h2', done).focus();
      } else { st.textContent = j.error || FALLBACK; st.classList.add('is-error'); }
    }).catch(function () { btn.disabled = false; st.textContent = FALLBACK; st.classList.add('is-error'); });
  });

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
