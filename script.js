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
     GUPSHUP THIKANA — LIVE BILLING & WHATSAPP RECEIPT SYSTEM
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

  /* Complete Official Menu Database (100% matched with Gupshup Thikana Menu Card) */
  var menuItems = [
    {
        "id": "bg1",
        "name": "Aloo Tikki Burger",
        "cat": "burger",
        "price": 35,
        "desc": "Classic spiced potato patty, onion slices & house burger dressing."
    },
    {
        "id": "bg2",
        "name": "Masala Magic Burger",
        "cat": "burger",
        "price": 45,
        "desc": "Spicy zesty potato patty with mint-chilli sauce & crunch."
    },
    {
        "id": "bg3",
        "name": "Supreme Aloo Tikki Burger",
        "cat": "burger",
        "price": 65,
        "desc": "Loaded double layer patty with fresh lettuce, onions & tangy sauce."
    },
    {
        "id": "bg4",
        "name": "Cheese Burger",
        "cat": "burger",
        "price": 70,
        "desc": "Crispy veggie patty blanketed in melted rich cheese slice."
    },
    {
        "id": "bg5",
        "name": "Extra Cheese Slice",
        "cat": "burger",
        "price": 20,
        "desc": "Add on extra rich melted cheddar cheese slice."
    },
    {
        "id": "vp1",
        "name": "Mumbai Vada Pav",
        "cat": "burger",
        "price": 50,
        "desc": "Authentic Mumbai style batata vada with spicy red garlic dry chutney."
    },
    {
        "id": "vp2",
        "name": "Schezwan Vada Pav",
        "cat": "burger",
        "price": 60,
        "desc": "Spicy street style vada pav spiked with fiery schezwan sauce."
    },
    {
        "id": "vp3",
        "name": "Cheese Vada Pav",
        "cat": "burger",
        "price": 80,
        "desc": "Melted cheese slice layered over hot crispy batata vada."
    },
    {
        "id": "cs1",
        "name": "Mayonnaise Sandwich",
        "cat": "sandwiches",
        "price": 60,
        "desc": "Chilled creamy mayonnaise tossed with crunchy veggies."
    },
    {
        "id": "cs2",
        "name": "Bombay Masala Sandwich",
        "cat": "sandwiches",
        "price": 60,
        "desc": "Spiced potato masala with beet, tomato, cucumber & green chutney."
    },
    {
        "id": "cs3",
        "name": "Vegetable Sandwich",
        "cat": "sandwiches",
        "price": 80,
        "desc": "Fresh farm veggies stacked between soft bread with butter."
    },
    {
        "id": "cs4",
        "name": "Veg Cheese Sandwich",
        "cat": "sandwiches",
        "price": 90,
        "desc": "Crispy chilled veggies with a thick blanket of cheese."
    },
    {
        "id": "gs1",
        "name": "Bombay Street Sandwich",
        "cat": "sandwiches",
        "price": 80,
        "desc": "Golden toasted street style sandwich with spiced potato & spices."
    },
    {
        "id": "gs2",
        "name": "Veg. Grilled Sandwich",
        "cat": "sandwiches",
        "price": 99,
        "desc": "Triple layered golden grilled sandwich packed with fresh veggies."
    },
    {
        "id": "gs3",
        "name": "Paneer Makhani Sandwich",
        "cat": "sandwiches",
        "price": 120,
        "desc": "Succulent paneer cubes simmered in creamy makhani gravy."
    },
    {
        "id": "gs4",
        "name": "Kadhai Paneer Sandwich",
        "cat": "sandwiches",
        "price": 120,
        "desc": "Wok-tossed kadhai spiced paneer with bell peppers & herbs."
    },
    {
        "id": "gs5",
        "name": "Paneer Korma Sandwich",
        "cat": "sandwiches",
        "price": 130,
        "desc": "Rich and velvety korma spiced paneer filling golden toasted."
    },
    {
        "id": "gs6",
        "name": "Smokey Veg. Grilled Sandwich",
        "cat": "sandwiches",
        "price": 130,
        "desc": "Char-grilled smokey veggies with house special seasoning."
    },
    {
        "id": "gs7",
        "name": "Cheese Corn Bite Sandwich",
        "cat": "sandwiches",
        "price": 130,
        "desc": "Sweet American corn loaded with melted mozzarella cheese."
    },
    {
        "id": "gs8",
        "name": "Paneer Lababdar Sandwich",
        "cat": "sandwiches",
        "price": 140,
        "desc": "Rich lababdar gravy paneer cubes grilled to golden perfection."
    },
    {
        "id": "gs9",
        "name": "Paneer Tikka Sandwich",
        "cat": "sandwiches",
        "price": 150,
        "desc": "Tandoori marinated paneer tikka slices grilled with cheese."
    },
    {
        "id": "bs1",
        "name": "Punjabi Veg. Sandwich (Baked)",
        "cat": "sandwiches",
        "price": 140,
        "desc": "Oven-baked robust Punjabi spiced veggies topped with melted cheese."
    },
    {
        "id": "bs2",
        "name": "Makhani Veg. Sandwich (Baked)",
        "cat": "sandwiches",
        "price": 150,
        "desc": "Baked sandwich drenched in buttery makhani sauce & cheese."
    },
    {
        "id": "bs3",
        "name": "Kadhai Veg. Sandwich (Baked)",
        "cat": "sandwiches",
        "price": 150,
        "desc": "Oven-baked sandwich with fiery kadhai veggies and golden crust."
    },
    {
        "id": "bs4",
        "name": "Cheese Veg. Sandwich (Baked)",
        "cat": "sandwiches",
        "price": 160,
        "desc": "Heavy loaded cheese baked over spiced veggie filling."
    },
    {
        "id": "ht1",
        "name": "Apni Chai",
        "cat": "tea",
        "price": 25,
        "desc": "Classic home-style kadak milk tea brewed fresh 24/7."
    },
    {
        "id": "ht2",
        "name": "Ginger Elaichi Tea",
        "cat": "tea",
        "price": 30,
        "desc": "Infused with crushed fresh ginger root and green cardamom."
    },
    {
        "id": "ht3",
        "name": "Masala Tea",
        "cat": "tea",
        "price": 35,
        "desc": "Secret 5-spice royal masala blend simmered in fresh milk."
    },
    {
        "id": "ht4",
        "name": "Lemon Ginger Tea",
        "cat": "tea",
        "price": 50,
        "desc": "Zesty fresh lemon juice with steeped crushed ginger."
    },
    {
        "id": "ht5",
        "name": "Green Tea",
        "cat": "tea",
        "price": 50,
        "desc": "Antioxidant rich whole leaf organic green tea."
    },
    {
        "id": "ht6",
        "name": "Kesar Elaichi Tea",
        "cat": "tea",
        "price": 70,
        "desc": "Premium saffron strands and aromatic green cardamom milk tea."
    },
    {
        "id": "it1",
        "name": "Peach Ice Tea",
        "cat": "tea",
        "price": 80,
        "desc": "Sweet sun-ripened peach syrup shaken with chilled brewed tea."
    },
    {
        "id": "it2",
        "name": "Lemon Ice Tea",
        "cat": "tea",
        "price": 80,
        "desc": "Zesty fresh lemon & mint shaken with crushed ice and iced tea."
    },
    {
        "id": "it3",
        "name": "Green Apple Ice Tea",
        "cat": "tea",
        "price": 100,
        "desc": "Crisp sour green apple essence with invigorating iced tea."
    },
    {
        "id": "it4",
        "name": "Red Bull Ice Tea",
        "cat": "tea",
        "price": 150,
        "desc": "High-energy boost of Red Bull infused with iced tea and lime."
    },
    {
        "id": "it5",
        "name": "Raspberry Ice Tea",
        "cat": "tea",
        "price": 110,
        "desc": "Sweet tart wild raspberry syrup shaken over chilled iced tea."
    },
    {
        "id": "hc1",
        "name": "Regular Coffee (Small)",
        "cat": "coffee",
        "price": 40,
        "desc": "Steaming hot espresso brewed with creamy milk."
    },
    {
        "id": "hc2",
        "name": "Regular Coffee (Large)",
        "cat": "coffee",
        "price": 70,
        "desc": "Large cup of steaming hot classic barista coffee."
    },
    {
        "id": "hc3",
        "name": "Classic Caramel Coffee (Small)",
        "cat": "coffee",
        "price": 60,
        "desc": "Rich caramel swirl blended into hot frothy coffee."
    },
    {
        "id": "hc4",
        "name": "Classic Caramel Coffee (Large)",
        "cat": "coffee",
        "price": 80,
        "desc": "Large hot coffee infused with sweet buttery caramel."
    },
    {
        "id": "hc5",
        "name": "Irish Coffee (Small)",
        "cat": "coffee",
        "price": 60,
        "desc": "Aromatic Irish cream essence in rich dark roast."
    },
    {
        "id": "hc6",
        "name": "Irish Coffee (Large)",
        "cat": "coffee",
        "price": 90,
        "desc": "Large cup of velvety Irish cream hot brew."
    },
    {
        "id": "hc7",
        "name": "Hazelnut Coffee (Small)",
        "cat": "coffee",
        "price": 70,
        "desc": "Toasted hazelnut flavor folded into hot velvety espresso."
    },
    {
        "id": "hc8",
        "name": "Hazelnut Coffee (Large)",
        "cat": "coffee",
        "price": 90,
        "desc": "Large cup of rich roasted hazelnut hot coffee."
    },
    {
        "id": "cc1",
        "name": "Cold Coffee (Small)",
        "cat": "coffee",
        "price": 50,
        "desc": "Chilled espresso shaken with milk, sugar and crushed ice."
    },
    {
        "id": "cc2",
        "name": "Cold Coffee (Large)",
        "cat": "coffee",
        "price": 80,
        "desc": "Large glass of classic creamy barista cold coffee."
    },
    {
        "id": "cc3",
        "name": "Caramel Cold Coffee (Small)",
        "cat": "coffee",
        "price": 70,
        "desc": "Buttery caramel syrup swirled in chilled creamy coffee."
    },
    {
        "id": "cc4",
        "name": "Caramel Cold Coffee (Large)",
        "cat": "coffee",
        "price": 90,
        "desc": "Large caramel cold coffee with golden drizzle."
    },
    {
        "id": "cc5",
        "name": "Chocolate Coffee (Small)",
        "cat": "coffee",
        "price": 70,
        "desc": "Dark Dutch cocoa blended with chilled espresso."
    },
    {
        "id": "cc6",
        "name": "Chocolate Coffee (Large)",
        "cat": "coffee",
        "price": 90,
        "desc": "Large cold coffee loaded with rich chocolate fudge."
    },
    {
        "id": "cc7",
        "name": "Cold Coffee with Ice Cream (Small)",
        "cat": "coffee",
        "price": 80,
        "desc": "Chilled thick coffee crowned with a vanilla scoop."
    },
    {
        "id": "cc8",
        "name": "Cold Coffee with Ice Cream (Large)",
        "cat": "coffee",
        "price": 110,
        "desc": "Large cold coffee with double vanilla ice cream scoop."
    },
    {
        "id": "cc9",
        "name": "Irish Cold Coffee (Small)",
        "cat": "coffee",
        "price": 80,
        "desc": "Chilled Irish cream cold coffee over ice."
    },
    {
        "id": "cc10",
        "name": "Irish Cold Coffee (Large)",
        "cat": "coffee",
        "price": 110,
        "desc": "Large creamy Irish cold brew shake."
    },
    {
        "id": "cc11",
        "name": "Hazelnut Cold Coffee (Small)",
        "cat": "coffee",
        "price": 80,
        "desc": "Roasted hazelnut shaken with cold milk and espresso."
    },
    {
        "id": "cc12",
        "name": "Hazelnut Cold Coffee (Large)",
        "cat": "coffee",
        "price": 110,
        "desc": "Large artisanal hazelnut cold coffee."
    },
    {
        "id": "cc13",
        "name": "Coffee with Ice Cream & Choco Chips (Small)",
        "cat": "coffee",
        "price": 90,
        "desc": "Topped with ice cream scoop and dark choco chips."
    },
    {
        "id": "cc14",
        "name": "Coffee with Ice Cream & Choco Chips (Large)",
        "cat": "coffee",
        "price": 120,
        "desc": "Large cold coffee with ice cream & crunchy choco chips."
    },
    {
        "id": "gb1",
        "name": "Plain Garlic Bread",
        "cat": "pasta",
        "price": 60,
        "desc": "Toasted baguette slices rubbed with roasted garlic herb butter."
    },
    {
        "id": "gb2",
        "name": "Cheese Garlic Bread",
        "cat": "pasta",
        "price": 90,
        "desc": "Melted mozzarella layered over garlic herb butter toast."
    },
    {
        "id": "gb3",
        "name": "Double Cheese Garlic Bread",
        "cat": "pasta",
        "price": 110,
        "desc": "Double layer of rich stretchy cheese over crispy garlic toast."
    },
    {
        "id": "gb4",
        "name": "Veggie Cheese Garlic Bread",
        "cat": "pasta",
        "price": 130,
        "desc": "Topped with sweet corn, jalapenos, onions & molten cheese."
    },
    {
        "id": "ps1",
        "name": "Red Pasta",
        "cat": "pasta",
        "price": 110,
        "desc": "Penne tossed in spicy tangy tomato-basil arrabbiata sauce."
    },
    {
        "id": "ps2",
        "name": "White Pasta",
        "cat": "pasta",
        "price": 150,
        "desc": "Rich velvety alfredo cream sauce tossed with sweet corn & herbs."
    },
    {
        "id": "ps3",
        "name": "Pink Pasta",
        "cat": "pasta",
        "price": 160,
        "desc": "Chef special blend of tangy marinara and velvety cream sauce."
    },
    {
        "id": "ps4",
        "name": "Tandoori Creamy Pasta",
        "cat": "pasta",
        "price": 180,
        "desc": "Spicy tandoori spiced sauce with smoked veggies & cheese."
    },
    {
        "id": "ps5",
        "name": "Makhani Creamy Pasta",
        "cat": "pasta",
        "price": 180,
        "desc": "Buttery rich makhani gravy tossed with Italian penne."
    },
    {
        "id": "ps6",
        "name": "Kadhai Pasta",
        "cat": "pasta",
        "price": 180,
        "desc": "Wok tossed spicy kadhai masala pasta with bell peppers."
    },
    {
        "id": "ps7",
        "name": "Mac. Cheese Pasta",
        "cat": "pasta",
        "price": 199,
        "desc": "Classic macaroni baked in thick creamy Cheddar & mozzarella sauce."
    },
    {
        "id": "ps8",
        "name": "Mac. Tomato Backed Pasta",
        "cat": "pasta",
        "price": 199,
        "desc": "Oven-baked macaroni in rich tomato ragu with golden cheese crust."
    },
    {
        "id": "fr1",
        "name": "Masala Fries",
        "cat": "fries_nachos",
        "price": 80,
        "desc": "Crispy golden french fries tossed in spicy chatpata masala."
    },
    {
        "id": "fr2",
        "name": "Mexican Fries",
        "cat": "fries_nachos",
        "price": 90,
        "desc": "Fries dusted with tangy Mexican salsa seasoning."
    },
    {
        "id": "fr3",
        "name": "Peri Peri Fries",
        "cat": "fries_nachos",
        "price": 90,
        "desc": "Fiery peri peri spiced crispy golden potato fries."
    },
    {
        "id": "fr4",
        "name": "Cheesy Loaded Fries",
        "cat": "fries_nachos",
        "price": 110,
        "desc": "Crispy fries smothered in liquid cheese & jalapeño relish."
    },
    {
        "id": "fr5",
        "name": "Tandoori Loaded Fries",
        "cat": "fries_nachos",
        "price": 110,
        "desc": "Loaded fries topped with tandoori gravy & herbs."
    },
    {
        "id": "fr6",
        "name": "Extra Dip",
        "cat": "fries_nachos",
        "price": 20,
        "desc": "Side of creamy mayo, garlic dip or schezwan dip."
    },
    {
        "id": "nc1",
        "name": "Nachos With Dip",
        "cat": "fries_nachos",
        "price": 90,
        "desc": "Crispy corn tortilla chips served with cheesy salsa dip."
    },
    {
        "id": "nc2",
        "name": "Cheese Nachos",
        "cat": "fries_nachos",
        "price": 120,
        "desc": "Tortilla chips smothered in melted yellow cheese sauce."
    },
    {
        "id": "nc3",
        "name": "Masala Cheese Nachos",
        "cat": "fries_nachos",
        "price": 140,
        "desc": "Topped with chopped tomatoes, onions, spices & cheese."
    },
    {
        "id": "nc4",
        "name": "Baked Cheese Nachos",
        "cat": "fries_nachos",
        "price": 160,
        "desc": "Oven-baked nachos with olives, jalapeños & golden bubbling cheese."
    },
    {
        "id": "ch1",
        "name": "Crunchy Chaat (Kurkure)",
        "cat": "chaat",
        "price": 70,
        "desc": "Crispy kurkure tossed with onions, tomatoes, lemon & chaat masala."
    },
    {
        "id": "ch2",
        "name": "Tangy Bhel (Rings)",
        "cat": "chaat",
        "price": 70,
        "desc": "Tangy puffed rings bhel tossed with fresh mint & tamarind chutneys."
    },
    {
        "id": "ch3",
        "name": "Kurkure Bhel",
        "cat": "chaat",
        "price": 80,
        "desc": "Spicy fusion bhel tossed with crunchy kurkure and chutneys."
    },
    {
        "id": "ch4",
        "name": "Crispy Corn",
        "cat": "chaat",
        "price": 110,
        "desc": "Golden fried sweet corn kernels tossed with pepper and spices."
    },
    {
        "id": "ch5",
        "name": "Veg. Spring Roll (6 pcs)",
        "cat": "chaat",
        "price": 120,
        "desc": "Crispy golden fried rolls stuffed with seasoned wok veggies."
    },
    {
        "id": "mk1",
        "name": "Spicy Mango Mocktail",
        "cat": "mocktails",
        "price": 90,
        "desc": "Alphonso mango juice with a fiery kick of green chilli & rock salt."
    },
    {
        "id": "mk2",
        "name": "Malt Beer (Non-Alcoholic)",
        "cat": "mocktails",
        "price": 90,
        "desc": "Chilled roasted malt non-alcoholic refreshing brew."
    },
    {
        "id": "mk3",
        "name": "Blue Lagoon",
        "cat": "mocktails",
        "price": 110,
        "desc": "Blue curaçao syrup, lemon juice, soda and crushed ice."
    },
    {
        "id": "mk4",
        "name": "Pina Colada",
        "cat": "mocktails",
        "price": 110,
        "desc": "Chilled blend of pineapple juice, coconut cream and crushed ice."
    },
    {
        "id": "mk5",
        "name": "Lychee Booster",
        "cat": "mocktails",
        "price": 110,
        "desc": "Sweet lychee nectar shaken with fresh mint and citrus."
    },
    {
        "id": "mk6",
        "name": "Virgin Mojito",
        "cat": "mocktails",
        "price": 110,
        "desc": "Muddled fresh mint, lime chunks, cane sugar & sparkling soda."
    },
    {
        "id": "mk7",
        "name": "Tropical Mojito",
        "cat": "mocktails",
        "price": 120,
        "desc": "Exotic tropical fruits muddled with fresh mint and fizz."
    },
    {
        "id": "mk8",
        "name": "Raspberry Mojito",
        "cat": "mocktails",
        "price": 120,
        "desc": "Wild raspberry syrup shaken with crushed mint and soda."
    },
    {
        "id": "mk9",
        "name": "Mix Berry Mojito",
        "cat": "mocktails",
        "price": 130,
        "desc": "Blackberry, raspberry and blueberry crush with sparkling soda."
    },
    {
        "id": "mk10",
        "name": "Green Apple Mojito",
        "cat": "mocktails",
        "price": 130,
        "desc": "Tangy green apple syrup with fresh lime and mint fizz."
    },
    {
        "id": "mk11",
        "name": "Bull Mojito",
        "cat": "mocktails",
        "price": 130,
        "desc": "Red Bull energy boost muddled with fresh mint, lime and ice."
    },
    {
        "id": "lm1",
        "name": "Fresh Lime Water",
        "cat": "mocktails",
        "price": 60,
        "desc": "Freshly squeezed lemon with rock salt and sweet cane sugar."
    },
    {
        "id": "lm2",
        "name": "Fresh Lime Soda",
        "cat": "mocktails",
        "price": 80,
        "desc": "Crisp sparkling soda with freshly squeezed lime and cumin."
    },
    {
        "id": "lm3",
        "name": "Masala Lemonade",
        "cat": "mocktails",
        "price": 100,
        "desc": "Spiced lemonade with roasted cumin, black salt and mint."
    },
    {
        "id": "lm4",
        "name": "Watermelon Lemonade",
        "cat": "mocktails",
        "price": 100,
        "desc": "Fresh watermelon juice shaken with lime and chilled soda."
    },
    {
        "id": "sh1",
        "name": "Chocolate Shake",
        "cat": "shakes",
        "price": 90,
        "desc": "Creamy chilled chocolate thick shake."
    },
    {
        "id": "sh2",
        "name": "Butter Scotch Shake",
        "cat": "shakes",
        "price": 100,
        "desc": "Velvety butterscotch shake with caramelized praline crunch."
    },
    {
        "id": "sh3",
        "name": "Strawberry Shake",
        "cat": "shakes",
        "price": 100,
        "desc": "Sweet strawberry cream shake with berry drizzle."
    },
    {
        "id": "sh4",
        "name": "Paan Shake",
        "cat": "shakes",
        "price": 100,
        "desc": "Royal refreshing meetha paan infused thick dairy shake."
    },
    {
        "id": "sh5",
        "name": "Banana Caramel Shake",
        "cat": "shakes",
        "price": 120,
        "desc": "Ripe bananas blended with golden caramel and ice cream."
    },
    {
        "id": "sh6",
        "name": "Oreo Shake",
        "cat": "shakes",
        "price": 120,
        "desc": "Crushed chocolate Oreo cookies churned with vanilla cream."
    },
    {
        "id": "sh7",
        "name": "Kit Kat Shake",
        "cat": "shakes",
        "price": 120,
        "desc": "Crispy KitKat wafer bars blended into thick chocolate shake."
    },
    {
        "id": "sh8",
        "name": "Blueberry Shake",
        "cat": "shakes",
        "price": 130,
        "desc": "Wild blueberry puree blended with thick dairy ice cream."
    },
    {
        "id": "sh9",
        "name": "DBC Shake (Death By Chocolate)",
        "cat": "shakes",
        "price": 150,
        "desc": "Overloaded with dark chocolate, brownie bits and fudge."
    },
    {
        "id": "sh10",
        "name": "Butterscotch Oreo Shake",
        "cat": "shakes",
        "price": 150,
        "desc": "Crunchy butterscotch praline married with crushed Oreo."
    },
    {
        "id": "sh11",
        "name": "Peanut Butter Shake",
        "cat": "shakes",
        "price": 150,
        "desc": "Creamy peanut butter churned with vanilla ice cream."
    },
    {
        "id": "sh12",
        "name": "Peanut Butter Oreo Shake",
        "cat": "shakes",
        "price": 180,
        "desc": "Indulgent blend of crunchy peanut butter and Oreo cookies."
    },
    {
        "id": "sh13",
        "name": "Hazelnut Brownie Shake",
        "cat": "shakes",
        "price": 180,
        "desc": "Chewy chocolate brownie and roasted hazelnut thick shake."
    },
    {
        "id": "sp1",
        "name": "Delhi Butter Handi Momos",
        "cat": "momos",
        "price": 250,
        "desc": "Tender veg dimsums slow-simmered in rich tandoori butter gravy in clay pot."
    },
    {
        "id": "sp2",
        "name": "Tandoori Fried Momos",
        "cat": "momos",
        "price": 180,
        "desc": "Crispy fried momos tossed with chaat masala & fresh mint chutney."
    },
    {
        "id": "sp3",
        "name": "Double Cheese Corn Pizza",
        "cat": "pizza",
        "price": 110,
        "desc": "Golden crust with double mozzarella & sweet American corn."
    },
    {
        "id": "sp4",
        "name": "Farmhouse Gourmet Pizza",
        "cat": "pizza",
        "price": 140,
        "desc": "Black olives, fiery jalapenos, onions, capsicum & mozzarella."
    },
    {
        "id": "sp5",
        "name": "Skillet Melted Cheesy Maggi",
        "cat": "maggi",
        "price": 100,
        "desc": "Double noodles with butter, corn, herbs & thick cheese pull."
    }
];


  var currentCat = 'all';
  var cart = {}; // { id: count }
  var orderType = 'Home Delivery';
  var lastWhatsAppUrl = '';

  /* Render Menu Grid with Steppers */
  function renderMenuGrid() {
    var grid = document.getElementById('gtMenuGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var filtered = currentCat === 'all' ? menuItems : menuItems.filter(function (x) { return x.cat === currentCat; });
    filtered.forEach(function (item) {
      var qty = cart[item.id] || 0;
      var card = document.createElement('div');
      card.className = 'gt-menu-card';
      card.innerHTML = 
        '<div class="info">' +
          '<h4>' + item.name + '</h4>' +
          '<p>' + item.desc + '</p>' +
        '</div>' +
        '<div class="price-action">' +
          '<div class="price">₹' + item.price + '</div>' +
          (qty === 0 
            ? '<button type="button" class="add-btn" data-id="' + item.id + '">+ Add</button>'
            : '<div class="qty-stepper">' +
                '<button type="button" class="qty-btn" data-action="dec" data-id="' + item.id + '">−</button>' +
                '<span class="qty-val">' + qty + '</span>' +
                '<button type="button" class="qty-btn" data-action="inc" data-id="' + item.id + '">+</button>' +
              '</div>'
          ) +
        '</div>';
      grid.appendChild(card);
    });

    grid.querySelectorAll('.add-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        cart[id] = 1;
        renderMenuGrid();
        updateCartAndBill();
        showToast('Added to order!');
      });
    });

    grid.querySelectorAll('.qty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var action = btn.getAttribute('data-action');
        if (action === 'inc') {
          cart[id] = (cart[id] || 0) + 1;
        } else if (action === 'dec') {
          if (cart[id] > 1) cart[id]--;
          else delete cart[id];
        }
        renderMenuGrid();
        updateCartAndBill();
      });
    });
  }

  /* Update Cart List & Total calculations */
  function updateCartAndBill() {
    var listEl = document.getElementById('cartItemsList');
    var badge = document.getElementById('cartBadge');
    var subtotalEl = document.getElementById('billSubtotal');
    var grandTotalEl = document.getElementById('billGrandTotal');
    
    var totalCount = 0;
    var subtotal = 0;
    var hasItems = false;

    if (listEl) listEl.innerHTML = '';

    for (var id in cart) {
      var count = cart[id];
      var item = menuItems.find(function (m) { return m.id === id; });
      if (item && count > 0) {
        hasItems = true;
        totalCount += count;
        var lineTotal = item.price * count;
        subtotal += lineTotal;

        if (listEl) {
          var row = document.createElement('div');
          row.className = 'cart-row';
          row.innerHTML = 
            '<div><b>' + count + 'x</b> ' + item.name + '</div>' +
            '<div class="cart-price">₹' + lineTotal + '</div>';
          listEl.appendChild(row);
        }
      }
    }

    if (!hasItems && listEl) {
      listEl.innerHTML = '<p style="color:var(--cream-faint);font-size:0.85rem;text-align:center;padding:20px 0;">No items added yet. Click <b>+ Add</b> on any dish!</p>';
    }

    if (badge) badge.textContent = totalCount + ' Items';
    if (subtotalEl) subtotalEl.textContent = '₹' + subtotal;
    if (grandTotalEl) grandTotalEl.textContent = '₹' + subtotal;
  }

  /* Order Type Switcher */
  document.querySelectorAll('.order-type-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.order-type-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      orderType = btn.getAttribute('data-type');
      
      var locLabel = document.getElementById('custLocLabel');
      var locInput = document.getElementById('custLoc');
      if (orderType === 'Dine-In') {
        if (locLabel) locLabel.textContent = 'Table Number *';
        if (locInput) locInput.placeholder = 'e.g. Table 4 or Corner Lounge';
      } else if (orderType === 'Takeaway') {
        if (locLabel) locLabel.textContent = 'Pickup Time / Vehicle No (Optional)';
        if (locInput) locInput.placeholder = 'e.g. Ready in 15 mins';
      } else {
        if (locLabel) locLabel.textContent = 'Delivery Address *';
        if (locInput) locInput.placeholder = 'House / Flat No, Street, Landmark';
      }
    });
  });

  /* Category tabs in menu modal */
  document.querySelectorAll('.gt-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.gt-tab-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentCat = btn.getAttribute('data-cat') || 'all';
      renderMenuGrid();
    });
  });

  /* Place Order & Generate Receipt */
  var placeOrderBtn = document.getElementById('placeOrderBtn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', function () {
      var name = (document.getElementById('custName') ? document.getElementById('custName').value : '').trim();
      var phone = (document.getElementById('custPhone') ? document.getElementById('custPhone').value : '').trim();
      var loc = (document.getElementById('custLoc') ? document.getElementById('custLoc').value : '').trim();
      var notes = (document.getElementById('custNotes') ? document.getElementById('custNotes').value : '').trim();

      var items = [];
      var total = 0;
      for (var id in cart) {
        var count = cart[id];
        var item = menuItems.find(function (m) { return m.id === id; });
        if (item && count > 0) {
          items.push({ name: item.name, qty: count, price: item.price, total: item.price * count });
          total += item.price * count;
        }
      }

      if (items.length === 0) {
        showToast('Please add dishes to your order first!');
        return;
      }
      if (!name) {
        showToast('Please enter your name!');
        if (document.getElementById('custName')) document.getElementById('custName').focus();
        return;
      }
      if (!phone) {
        showToast('Please enter your phone number!');
        if (document.getElementById('custPhone')) document.getElementById('custPhone').focus();
        return;
      }
      if (orderType !== 'Takeaway' && !loc) {
        showToast(orderType === 'Dine-In' ? 'Please specify your Table Number!' : 'Please enter your delivery address!');
        if (document.getElementById('custLoc')) document.getElementById('custLoc').focus();
        return;
      }

      // Generate Unique Receipt ID and Timestamp
      var receiptId = '#GT-' + Math.floor(1000 + Math.random() * 9000);
      var now = new Date();
      var dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      var timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      // 1. Build Formatted WhatsApp Receipt Text (Just like a restaurant bill)
      var itemLines = items.map(function (it) {
        var padName = it.name.length > 22 ? it.name.substring(0, 20) + '..' : it.name;
        return ' ' + it.qty + 'x  ' + padName + '  : ₹' + it.total;
      }).join('\n');

      var waReceipt = 
        '╔═══════════════════════════════╗\n' +
        '   🧾 *GUPSHUP THIKANA* 🍽️\n' +
        '   _Cafe & Restaurant · Open 24/7_\n' +
        '   📍 Kalwar Rd, near D-Mart, Jhotwara\n' +
        '   📞 +91 91459 93363 / +91 96608 46011\n' +
        '╚═══════════════════════════════╝\n\n' +
        '*DINING & ORDER RECEIPT*\n' +
        '───────────────────────────────\n' +
        '• Receipt No : *' + receiptId + '*\n' +
        '• Date/Time  : ' + dateStr + ', ' + timeStr + '\n' +
        '• Order Type : *' + orderType.toUpperCase() + '*\n' +
        '• Status     : *ORDER PLACED (CONFIRMED)*\n' +
        '───────────────────────────────\n' +
        '*CUSTOMER DETAILS*\n' +
        '👤 Name      : ' + name + '\n' +
        '📱 Phone     : ' + phone + '\n' +
        '📍 Location  : ' + (loc || 'Counter Pickup') + '\n' +
        '───────────────────────────────\n' +
        '*ITEMIZED BILL*\n' +
        '───────────────────────────────\n' +
        itemLines + '\n' +
        '───────────────────────────────\n' +
        '• Subtotal        : ₹' + total + '\n' +
        '• Delivery & Pack : FREE (₹0)\n' +
        '• GST (5% Incl.)  : ₹0.00\n' +
        '*💰 GRAND TOTAL   : ₹' + total + '*\n' +
        '───────────────────────────────\n' +
        '• Instructions    : ' + (notes ? notes : 'None') + '\n' +
        '• Payment Mode    : Cash / UPI on Delivery\n' +
        '═══════════════════════════════\n' +
        '✨ _Thank you for choosing Gupshup Thikana!_\n' +
        '_Your food is being prepared steaming hot in our kitchen._';

      lastWhatsAppUrl = 'https://wa.me/919145993363?text=' + encodeURIComponent(waReceipt);

      // 2. Populate On-Screen Thermal Receipt Modal
      if (document.getElementById('rcptId')) document.getElementById('rcptId').textContent = receiptId;
      if (document.getElementById('rcptType')) document.getElementById('rcptType').textContent = orderType.toUpperCase();
      if (document.getElementById('rcptDate')) document.getElementById('rcptDate').textContent = dateStr;
      if (document.getElementById('rcptTime')) document.getElementById('rcptTime').textContent = timeStr;
      if (document.getElementById('rcptName')) document.getElementById('rcptName').textContent = name;
      if (document.getElementById('rcptPhone')) document.getElementById('rcptPhone').textContent = phone;
      if (document.getElementById('rcptLoc')) document.getElementById('rcptLoc').textContent = loc || 'Counter Pickup';
      if (document.getElementById('rcptSubtotal')) document.getElementById('rcptSubtotal').textContent = '₹' + total;
      if (document.getElementById('rcptTotal')) document.getElementById('rcptTotal').textContent = '₹' + total;
      if (document.getElementById('rcptNotes')) document.getElementById('rcptNotes').textContent = notes || 'None';

      var tbody = document.getElementById('rcptTableBody');
      if (tbody) {
        tbody.innerHTML = '';
        items.forEach(function (it) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td>' + it.qty + 'x</td><td>' + it.name + '</td><td class="num">₹' + it.total + '</td>';
          tbody.appendChild(tr);
        });
      }

      // Close order modal, open receipt modal & trigger WhatsApp
      closeModal(placeOrderBtn);
      openModal('#receiptModal');
      showToast('🎉 Order Placed! Generating receipt and opening WhatsApp...');

      setTimeout(function () {
        window.open(lastWhatsAppUrl, '_blank');
      }, 900);
    });
  }

  var rcptWhatsAppBtn = document.getElementById('rcptWhatsAppBtn');
  if (rcptWhatsAppBtn) {
    rcptWhatsAppBtn.addEventListener('click', function () {
      if (lastWhatsAppUrl) window.open(lastWhatsAppUrl, '_blank');
    });
  }

  /* Reservation Form -> Table Pass Receipt to WhatsApp */
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

      var passId = '#RES-' + Math.floor(1000 + Math.random() * 9000);

      var passText = 
        '╔═══════════════════════════════╗\n' +
        '   🍽️ *GUPSHUP THIKANA (24/7)*\n' +
        '   *TABLE RESERVATION PASS*\n' +
        '   📍 Kalwar Rd, Jhotwara, Jaipur\n' +
        '   📞 +91 91459 93363\n' +
        '╚═══════════════════════════════╝\n\n' +
        '*BOOKING RECEIPT*\n' +
        '───────────────────────────────\n' +
        '• Pass ID    : *' + passId + '*\n' +
        '• Guest Name : ' + name + '\n' +
        '• Contact    : ' + phone + '\n' +
        '• Party Size : *' + guests + ' Guests*\n' +
        '• Date       : ' + date + '\n' +
        '• Time Slot  : ' + time + '\n' +
        '• Occasion   : ' + (notes ? notes : 'Casual Dining') + '\n' +
        '───────────────────────────────\n' +
        '• Table Allotment : Priority Table (AC Lounge)\n' +
        '• Status          : *CONFIRMED VIA WHATSAPP*\n' +
        '───────────────────────────────\n' +
        '_Please present this pass upon arrival._\n' +
        '_We look forward to hosting your celebration beneath the warm Edison glow!_\n' +
        '═══════════════════════════════';

      var waUrl = 'https://wa.me/919145993363?text=' + encodeURIComponent(passText);
      closeModal(reserveForm);
      showToast('🎉 Table Reserved! Opening WhatsApp reservation pass...');
      setTimeout(function () { window.open(waUrl, '_blank'); }, 700);
    });
  }

  renderMenuGrid();
  updateCartAndBill();

})();
