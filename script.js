/* =============================================================
   QISSA — interactions
   Vanilla JS, no dependencies. Respects prefers-reduced-motion.
   ============================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- Menu category nav: scroll-affordance arrows (mobile) ---------- */
  document.querySelectorAll('.menu-nav-wrap').forEach(function (wrap) {
    var nav = wrap.querySelector('.menu-nav');
    var left = wrap.querySelector('.menu-nav__arrow--left');
    var right = wrap.querySelector('.menu-nav__arrow--right');
    if (!nav || !left || !right) return;
    function update() {
      var max = nav.scrollWidth - nav.clientWidth;
      left.classList.toggle('is-hidden', nav.scrollLeft <= 4);
      right.classList.toggle('is-hidden', nav.scrollLeft >= max - 4);
    }
    left.addEventListener('click', function () { nav.scrollBy({ left: -140, behavior: 'smooth' }); });
    right.addEventListener('click', function () { nav.scrollBy({ left: 140, behavior: 'smooth' }); });
    nav.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });
  /* ---------- Homepage announcement popup (once per session) ---------- */
  var popup = document.getElementById('popupOverlay');
  if (popup) {
    var popupKey = 'qissaPopupShown';
    var popupSeen = false;
    try { popupSeen = !!sessionStorage.getItem(popupKey); } catch (e) {}
    function closePopup() {
      popup.classList.remove('is-open');
      setTimeout(function () { popup.hidden = true; }, 450);
    }
    if (!popupSeen) {
      popup.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { popup.classList.add('is-open'); });
      });
      try { sessionStorage.setItem(popupKey, '1'); } catch (e) {}
    }
    popup.querySelectorAll('[data-popup-close]').forEach(function (el) {
      el.addEventListener('click', closePopup);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && popup.classList.contains('is-open')) closePopup();
    });
  }
  /* ---------- Header condense on scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 60);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Fullscreen nav overlay ---------- */
  var overlay = document.querySelector('.nav-overlay');
  var openBtn = document.querySelector('.menu-trigger');
  var closeBtn = document.querySelector('.nav-overlay__close');
  function setMenu(open) {
    if (!overlay) return;
    overlay.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (openBtn) openBtn.setAttribute('aria-expanded', open);
  }
  if (openBtn) openBtn.addEventListener('click', function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
  if (overlay) {
    overlay.querySelectorAll('.nav-list a').forEach(function (a, i) {
      a.style.setProperty('--i', i);
      a.addEventListener('click', function () { setMenu(false); });
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal, .reveal-line');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 3D tilt on dish cards ---------- */
  if (!isTouch && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var rect;
      card.addEventListener('mouseenter', function () { rect = card.getBoundingClientRect(); });
      card.addEventListener('mousemove', function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'perspective(900px) rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' + (-py * 7).toFixed(2) + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- Hero parallax ---------- */
  var heroMedia = document.querySelector('.hero__media video, .hero__media img');
  if (heroMedia && !reduce) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y < window.innerHeight) heroMedia.style.transform = 'scale(1.08) translateY(' + (y * 0.18).toFixed(1) + 'px)';
    }, { passive: true });
  }

  /* ---------- Full-bleed parallax bands ---------- */
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !reduce) {
    window.addEventListener('scroll', function () {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var progress = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        el.style.transform = 'translateY(' + (progress * -110).toFixed(1) + 'px)';
      });
    }, { passive: true });
  }

  /* ---------- Testimonial rotator ---------- */
  var testi = document.querySelector('.testi');
  if (testi) {
    var items = testi.querySelectorAll('.testi__item');
    var dotsWrap = document.querySelector('.testi__dots');
    var idx = 0, timer;
    items.forEach(function (_, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Review ' + (i + 1));
      // Dots live inside an aria-hidden container — keep keyboard focus off AT-hidden controls.
      b.setAttribute('tabindex', '-1');
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', function () { go(i); reset(); });
      if (dotsWrap) dotsWrap.appendChild(b);
    });
    var dots = dotsWrap ? dotsWrap.querySelectorAll('button') : [];
    function go(n) {
      items[idx].classList.remove('active');
      if (dots[idx]) dots[idx].classList.remove('active');
      idx = (n + items.length) % items.length;
      items[idx].classList.add('active');
      if (dots[idx]) dots[idx].classList.add('active');
    }
    function reset() { clearInterval(timer); timer = setInterval(function () { go(idx + 1); }, 5200); }
    if (!reduce && items.length > 1) reset();
  }

  /* ---------- Starfield canvas ---------- */
  var canvas = document.querySelector('.stars-canvas');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var stars = [], w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var mouse = { x: 0.5, y: 0.5 };
    var lastW = -1;
    function resize() {
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      var n = Math.min(180, Math.floor((window.innerWidth * window.innerHeight) / 9000));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          z: Math.random() * 0.9 + 0.1,
          r: (Math.random() * 1.1 + 0.3) * dpr,
          tw: Math.random() * Math.PI * 2,
          gold: Math.random() > 0.82
        });
      }
    }
    resize();
    var srT;
    window.addEventListener('resize', function () { clearTimeout(srT); srT = setTimeout(resize, 150); });
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX / window.innerWidth; mouse.y = e.clientY / window.innerHeight;
    }, { passive: true });
    var scrollY = 0;
    window.addEventListener('scroll', function () { scrollY = window.scrollY; }, { passive: true });
    var t = 0;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      t += 0.01;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var px = (mouse.x - 0.5) * s.z * 26 * dpr;
        var py = (mouse.y - 0.5) * s.z * 26 * dpr - (scrollY * s.z * 0.15 * dpr) % h;
        var yy = (s.y + py) % h; if (yy < 0) yy += h;
        var tw = 0.4 + 0.6 * Math.abs(Math.sin(s.tw + t * s.z * 2));
        ctx.beginPath();
        ctx.arc(s.x + px, yy, s.r, 0, Math.PI * 2);
        if (s.gold) ctx.fillStyle = 'rgba(233,205,138,' + (tw * 0.9) + ')';
        else ctx.fillStyle = 'rgba(246,241,231,' + (tw * 0.6) + ')';
        ctx.shadowBlur = s.gold ? 8 : 0;
        ctx.shadowColor = 'rgba(233,205,138,.6)';
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------- Count-up (rating + tale-in-numbers stats) ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    var so = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var end = parseFloat(el.getAttribute('data-count'));
        var dec = el.getAttribute('data-dec') != null ? +el.getAttribute('data-dec') : (end % 1 !== 0 ? 1 : 0);
        var suf = el.getAttribute('data-suffix') || '';
        var st = null;
        function step(ts) {
          if (!st) st = ts; var p = Math.min((ts - st) / 1500, 1);
          el.textContent = (end * (0.15 + 0.85 * (1 - Math.pow(1 - p, 3)))).toFixed(dec) + suf;
          if (p < 1) requestAnimationFrame(step); else el.textContent = end.toFixed(dec) + suf;
        }
        requestAnimationFrame(step); so.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { so.observe(el); });
  }

  /* ---------- Spice constellation ---------- */
  (function () {
    var stage = document.querySelector('.constellation__stage');
    if (!stage) return;
    var svg = stage.querySelector('.constellation__lines');
    var line = stage.querySelector('.constellation__line');
    var spices = Array.prototype.slice.call(stage.querySelectorAll('.spice'));
    var imgWrap = stage.querySelector('.constellation__img');
    var conImg = document.getElementById('conImg');
    var conSpice = document.getElementById('conSpice');
    var conDish = document.getElementById('conDish');
    var conRole = document.getElementById('conRole');
    var panel = stage.querySelector('.constellation__panel');
    var current = null, swapT;

    function drawLine(spice) {
      if (!svg || getComputedStyle(svg).display === 'none') { line.classList.remove('on'); return; }
      var s = stage.getBoundingClientRect();
      var d = spice.querySelector('.spice__dot').getBoundingClientRect();
      var p = panel.getBoundingClientRect();
      var x1 = d.left + d.width / 2 - s.left, y1 = d.top + d.height / 2 - s.top;
      var x2 = p.left - s.left, y2 = p.top + p.height / 2 - s.top;
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      var len = Math.hypot(x2 - x1, y2 - y1);
      line.classList.add('on');
      if (reduce) { line.style.strokeDasharray = 'none'; line.style.strokeDashoffset = 0; return; }
      line.style.transition = 'none';
      line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
      line.getBoundingClientRect();
      line.style.transition = '';
      line.style.strokeDashoffset = 0;
    }

    function activate(spice) {
      if (spice === current) { drawLine(spice); return; }
      spices.forEach(function (x) { x.classList.remove('active'); });
      spice.classList.add('active');
      conSpice.textContent = spice.querySelector('.spice__label').textContent;
      conDish.textContent = spice.getAttribute('data-dish');
      conRole.textContent = spice.getAttribute('data-role');
      var newSrc = spice.getAttribute('data-img');
      if (conImg.getAttribute('src') !== newSrc) {
        imgWrap.classList.add('swap');
        clearTimeout(swapT);
        swapT = setTimeout(function () { conImg.src = newSrc; imgWrap.classList.remove('swap'); }, 200);
      }
      current = spice;
      drawLine(spice);
    }

    spices.forEach(function (spice) {
      spice.setAttribute('type', 'button');
      spice.addEventListener('mouseenter', function () { activate(spice); });
      spice.addEventListener('focus', function () { activate(spice); });
      spice.addEventListener('click', function () { activate(spice); });
    });

    var rT;
    window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { if (current) drawLine(current); }, 150); }, { passive: true });
    window.addEventListener('load', function () { if (current) drawLine(current); });
    activate(spices[0]);
  })();

  /* ---------- Crawler-safe email assembly ---------- */
  document.querySelectorAll('.email-link').forEach(function (a) {
    var u = a.getAttribute('data-u'), d = a.getAttribute('data-d');
    if (!u || !d) return;
    var addr = u + String.fromCharCode(64) + d;
    var href = 'mailto:' + addr;
    var subj = a.getAttribute('data-subject');
    if (subj) href += '?subject=' + encodeURIComponent(subj);
    a.setAttribute('href', href);
  });

  /* ---------- The Masterpieces: stepped centered slider ---------- */
  (function () {
    var slider = document.querySelector('.mp-slider');
    if (!slider) return;
    var row = slider.querySelector('.mp-row');
    var originals = Array.prototype.slice.call(row.children);
    var n = originals.length;
    if (!n) return;

    // Three identical sets: lets us always step forward, then silently rewind.
    for (var s = 0; s < 2; s++) {
      originals.forEach(function (el) { row.appendChild(el.cloneNode(true)); });
    }
    var slides = Array.prototype.slice.call(row.children);
    slides.forEach(function (el) {
      var img = el.querySelector('img');
      if (img) img.draggable = false;
    });
    var idx = n; // start on the middle set

    function centerX(i) {
      var el = slides[i];
      return Math.round(slider.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2));
    }

    function paint(animate) {
      var x = centerX(idx);
      var t = animate ? 'transform .7s cubic-bezier(.22,1,.36,1)' : 'none';
      row.style.transition = t;
      row.style.transform = 'translate3d(' + x + 'px,0,0)';
      slides.forEach(function (s2, i) {
        var d = i - idx;
        var deg = d === 0 ? 0 : (d > 0 ? 10 : -10);
        s2.style.transition = t;
        s2.style.transform = 'rotate(' + deg + 'deg)';
        s2.classList.toggle('is-center', i === idx);
      });
    }

    // Sets are identical, so once a step carries idx into the next/previous
    // set, silently rewinding to the middle set once it settles is invisible.
    function goTo(newIdx, animate) {
      idx = newIdx;
      paint(animate);
      if (idx >= n * 2) {
        setTimeout(function () { idx -= n; paint(false); }, animate ? 760 : 0);
      } else if (idx < n) {
        setTimeout(function () { idx += n; paint(false); }, animate ? 760 : 0);
      }
    }

    paint(false);
    var rT;
    window.addEventListener('resize', function () {
      clearTimeout(rT);
      rT = setTimeout(function () { paint(false); }, 150);
    }, { passive: true });

    var timer = null;
    function step() { goTo(idx + 1, true); }
    function play() { stop(); timer = setInterval(step, 2000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    /* ---------- drag / swipe ---------- */
    var dragging = false, startX = 0, dragX = 0, baseX = 0, activePointerId = null;

    function onPointerDown(e) {
      if (dragging) return;
      dragging = true;
      activePointerId = e.pointerId;
      dragX = 0;
      startX = e.clientX;
      baseX = centerX(idx);
      stop();
      row.style.transition = 'none';
      slider.classList.add('is-dragging');
      if (slider.setPointerCapture) slider.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      dragX = e.clientX - startX;
      row.style.transform = 'translate3d(' + (baseX + dragX) + 'px,0,0)';
    }

    function onPointerUp(e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      dragging = false;
      activePointerId = null;
      slider.classList.remove('is-dragging');
      var threshold = 60;
      if (dragX <= -threshold) goTo(idx + 1, true);
      else if (dragX >= threshold) goTo(idx - 1, true);
      else paint(true);
      dragX = 0;
      if (!reduce) play();
    }

    slider.addEventListener('pointerdown', onPointerDown);
    slider.addEventListener('pointermove', onPointerMove);
    slider.addEventListener('pointerup', onPointerUp);
    slider.addEventListener('pointercancel', onPointerUp);

    if (reduce) return;

    play();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else play();
    });
  })();

  /* ---------- year ---------- */
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();

  /* =============================================================
     GUPSHUP THIKANA — MODALS & INTERACTIVE ORDERING
     ============================================================= */
  function showToast(msg) {
    var toast = document.querySelector('.gt-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'gt-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3200);
  }

  function openModal(id) {
    var modal = document.querySelector(id);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeModal(el) {
    var modal = el.closest('.gt-modal-overlay');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('[data-modal-target]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var target = btn.getAttribute('data-modal-target');
      openModal(target);
    });
  });

  document.querySelectorAll('.gt-modal-close, [data-modal-close]').forEach(function (btn) {
    btn.addEventListener('click', function () { closeModal(btn); });
  });

  document.querySelectorAll('.gt-modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.gt-modal-overlay.active').forEach(function (m) {
        m.classList.remove('active');
      });
      document.body.style.overflow = '';
    }
  });

  var reserveForm = document.getElementById('reservationForm');
  if (reserveForm) {
    reserveForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('resName') ? document.getElementById('resName').value : '';
      var phone = document.getElementById('resPhone') ? document.getElementById('resPhone').value : '';
      var guests = document.getElementById('resGuests') ? document.getElementById('resGuests').value : '2';
      var date = document.getElementById('resDate') ? document.getElementById('resDate').value : '';
      var time = document.getElementById('resTime') ? document.getElementById('resTime').value : '';
      var notes = document.getElementById('resNotes') ? document.getElementById('resNotes').value : '';
      var text = 'Namaste Gupshup Thikana! 🍽️ I would like to reserve a table:\n' +
        '• Name: ' + name + '\n' +
        '• Phone: ' + phone + '\n' +
        '• Guests: ' + guests + ' People\n' +
        '• Date: ' + date + '\n' +
        '• Time: ' + time + (notes ? ('\n• Note: ' + notes) : '') + '\n' +
        'Please confirm availability. Thank you!';
      var waUrl = 'https://wa.me/919145993363?text=' + encodeURIComponent(text);
      closeModal(reserveForm);
      showToast('🎉 Opening WhatsApp for instant reservation confirmation...');
      setTimeout(function () { window.open(waUrl, '_blank'); }, 700);
    });
  }

  var menuItems = [
    { name: 'Delhi Butter Handi Momos', cat: 'momos', price: 250, desc: 'Tender veg dimsums slow-simmered in rich tandoori butter gravy.' },
    { name: 'Tandoori Fried Momos', cat: 'momos', price: 180, desc: 'Crispy fried momos tossed with chaat masala & mint chutney.' },
    { name: 'Steamed Cheese Momos', cat: 'momos', price: 150, desc: 'Delicate steamed dumplings with molten cheese filling.' },
    { name: 'Double Cheese Corn Pizza', cat: 'pizzas', price: 110, desc: 'Golden crust with double mozzarella & sweet American corn.' },
    { name: 'Farmhouse Gourmet Pizza', cat: 'pizzas', price: 140, desc: 'Black olives, jalapenos, onions, capsicum & mozzarella.' },
    { name: 'Paneer Makhani Pizza', cat: 'pizzas', price: 160, desc: 'Tandoori spiced paneer cubes on rich makhani sauce base.' },
    { name: 'Skillet Melted Cheesy Maggi', cat: 'maggi', price: 100, desc: 'Double noodles with butter, corn, herbs & thick cheese pull.' },
    { name: 'Tandoori Tadka Maggi', cat: 'maggi', price: 80, desc: 'Spicy smoky maggi with veggies and homemade secret spices.' },
    { name: 'Cheese Corn Grilled Sandwich', cat: 'sandwiches', price: 130, desc: 'Triple-decker golden toasted bread loaded with sweet corn.' },
    { name: 'Bombay Masala Grill Sandwich', cat: 'sandwiches', price: 100, desc: 'Spiced potato mash, tomatoes, cucumber, mint chutney & cheese.' },
    { name: 'Artisanal Hazelnut Cold Coffee', cat: 'drinks', price: 120, desc: 'Chilled espresso with roasted hazelnut and dark chocolate drizzle.' },
    { name: 'Two-Swirl Mango Thick Shake', cat: 'drinks', price: 110, desc: 'Alphonso puree churned with thick cream and ice cream scoop.' },
    { name: 'Oreo KitKat Overload Shake', cat: 'drinks', price: 140, desc: 'Loaded chocolate shake with crushed oreo, kitkat and fudge.' },
    { name: 'Special Adrak Masala Chai', cat: 'drinks', price: 35, desc: 'Brewed fresh 24/7 with ginger, cardamom, clove and fresh milk.' },
    { name: 'Peri Peri Crispy French Fries', cat: 'starters', price: 90, desc: 'Crispy golden potato fingers tossed in fiery peri peri.' },
    { name: 'Chilli Paneer Dry', cat: 'starters', price: 160, desc: 'Crispy wok-tossed cottage cheese with bell peppers & garlic.' }
  ];

  var currentCat = 'all';
  var cart = {};

  function renderMenuGrid() {
    var grid = document.getElementById('gtMenuGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var filtered = currentCat === 'all' ? menuItems : menuItems.filter(function (x) { return x.cat === currentCat; });
    filtered.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'gt-menu-card';
      card.innerHTML = '<div class="info"><h4>' + item.name + '</h4><p>' + item.desc + '</p></div>' +
        '<div class="price-action"><div class="price">₹' + item.price + '</div>' +
        '<button type="button" class="add-btn" data-add-item="' + item.name + '">+ Add</button></div>';
      grid.appendChild(card);
    });

    grid.querySelectorAll('[data-add-item]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-add-item');
        var found = menuItems.find(function (m) { return m.name === name; });
        if (found) {
          cart[name] = (cart[name] || 0) + 1;
          updateCartUI();
          showToast('Added ' + name + ' to order!');
        }
      });
    });
  }

  function updateCartUI() {
    var count = 0, total = 0;
    for (var k in cart) {
      var item = menuItems.find(function (m) { return m.name === k; });
      if (item) {
        count += cart[k];
        total += item.price * cart[k];
      }
    }
    var badge = document.getElementById('cartBadge');
    var totalEl = document.getElementById('cartTotal');
    if (badge) badge.textContent = count;
    if (totalEl) totalEl.textContent = '₹' + total;
  }

  document.querySelectorAll('.gt-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.gt-tab-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentCat = btn.getAttribute('data-cat') || 'all';
      renderMenuGrid();
    });
  });

  var placeOrderBtn = document.getElementById('placeOrderBtn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', function () {
      var itemsList = [];
      var total = 0;
      for (var k in cart) {
        var item = menuItems.find(function (m) { return m.name === k; });
        if (item) {
          itemsList.push('• ' + k + ' x' + cart[k] + ' (₹' + (item.price * cart[k]) + ')');
          total += item.price * cart[k];
        }
      }
      if (itemsList.length === 0) {
        showToast('Please add items to your order first!');
        return;
      }
      var msg = 'Hello Gupshup Thikana! 🛵 I would like to place an order:\n\n' +
        itemsList.join('\n') + '\n\n' +
        'Total Amount: ₹' + total + '\n' +
        'Please confirm order and delivery time. Thank you!';
      var waUrl = 'https://wa.me/919145993363?text=' + encodeURIComponent(msg);
      window.open(waUrl, '_blank');
    });
  }

  renderMenuGrid();
  updateCartUI();

})();
