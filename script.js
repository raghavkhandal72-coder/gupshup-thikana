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
        "id": "bg_at",
        "name": "Aloo Tikki Burger",
        "cat": "burger",
        "price": 49,
        "desc": "Crispy spiced golden potato patty with onions, tomatoes & cafe burger sauce."
    },
    {
        "id": "bg_mb",
        "name": "Masala Burger",
        "cat": "burger",
        "price": 59,
        "desc": "Zesty spiced patty seasoned with secret chaat masala & mint spread."
    },
    {
        "id": "bg_sat",
        "name": "Supreme Aloo Tikki Burger",
        "cat": "burger",
        "price": 65,
        "desc": "Loaded double layer patty with fresh lettuce, onions & tangy relish."
    },
    {
        "id": "bg_cb",
        "name": "Cheese Burger",
        "cat": "burger",
        "price": 70,
        "desc": "Crisp golden veggie patty topped with a thick slice of melted cheddar."
    },
    {
        "id": "bg_gsb",
        "name": "Special Gupshup Burger",
        "cat": "burger",
        "price": 79,
        "desc": "Signature chef burger loaded with double veggies, cheese, and house secret sauce."
    },
    {
        "id": "bg_pb",
        "name": "Paneer Burger",
        "cat": "burger",
        "price": 89,
        "desc": "Fresh cottage cheese steak seasoned in mild spices and grilled golden."
    },
    {
        "id": "bg_spb",
        "name": "Spicy Paneer Burger",
        "cat": "burger",
        "price": 99,
        "desc": "Fiery marinated paneer patty infused with spicy peri-peri marinade & jalapenos."
    },
    {
        "id": "bg_ecs",
        "name": "Extra Cheese Slice (Add-on)",
        "cat": "burger",
        "price": 20,
        "desc": "Add extra creamy melted cheddar cheese slice."
    },
    {
        "id": "vp_mumbai",
        "name": "Mumbai Vada Pav",
        "cat": "burger",
        "price": 39,
        "desc": "Authentic Mumbai street batata vada with spicy red garlic dry chutney & fried chilli."
    },
    {
        "id": "vp_schez",
        "name": "Schezwan Vada Pav",
        "cat": "burger",
        "price": 49,
        "desc": "Crispy batata vada layered with fiery wok-tossed Schezwan sauce."
    },
    {
        "id": "vp_cheese",
        "name": "Cheese Vada Pav",
        "cat": "burger",
        "price": 59,
        "desc": "Hot crispy batata vada topped with gooey melted cheese inside a soft buttered pav."
    },
    {
        "id": "sw_veg_cold",
        "name": "Vegetable Cold Sandwich",
        "cat": "sandwiches",
        "price": 39,
        "desc": "Chilled refreshing cucumber, tomato & onion slices with mint chutney."
    },
    {
        "id": "sw_bm_cold",
        "name": "Bombay Masala Cold Sandwich",
        "cat": "sandwiches",
        "price": 49,
        "desc": "Classic Bombay spiced potato masala layered with beetroot & coriander."
    },
    {
        "id": "sw_mg_cold",
        "name": "Mayo Green Cold Sandwich",
        "cat": "sandwiches",
        "price": 59,
        "desc": "Creamy mayonnaise whipped with fresh herbs, capsicum & crisp greens."
    },
    {
        "id": "sw_vc_cold",
        "name": "Veg Cheese Cold Sandwich",
        "cat": "sandwiches",
        "price": 69,
        "desc": "Crunchy seasoned garden vegetables topped with a thick layer of grated cheese."
    },
    {
        "id": "sw_bv_grill",
        "name": "Bombay Veggie Grill Sandwich",
        "cat": "sandwiches",
        "price": 59,
        "desc": "Crisp toasted sandwich loaded with sliced vegetables and Bombay herb chutney."
    },
    {
        "id": "sw_vg_grill",
        "name": "Veg. Grilled Sandwich",
        "cat": "sandwiches",
        "price": 69,
        "desc": "Golden grill-pressed bread stuffed with spiced potatoes, onions & capsicum."
    },
    {
        "id": "sw_vm_grill",
        "name": "Veggie Mayonese Grill Sandwich",
        "cat": "sandwiches",
        "price": 79,
        "desc": "Toasted with luscious eggless mayonnaise, mixed veggies and black pepper."
    },
    {
        "id": "sw_sc_grill",
        "name": "Sweet Corn Grilled Sandwich",
        "cat": "sandwiches",
        "price": 89,
        "desc": "Juicy golden American sweet corn kernels tossed with butter, herbs and spices."
    },
    {
        "id": "sw_gs_grill",
        "name": "Gupshup Special Grill Sandwich",
        "cat": "sandwiches",
        "price": 99,
        "desc": "Signature triple-decker sandwich loaded with assorted veggies, paneer & sauces."
    },
    {
        "id": "sw_df_grill",
        "name": "Double Flav Grilled Sandwich",
        "cat": "sandwiches",
        "price": 109,
        "desc": "Fusion delight with two complementary distinct sauce fillings on twin layers."
    },
    {
        "id": "sw_cb_grill",
        "name": "Cheese Burst Spicy Grill Sandwich",
        "cat": "sandwiches",
        "price": 119,
        "desc": "Overflowing melted mozzarella & cheddar blended with spicy red chilli flakes."
    },
    {
        "id": "sw_pm_grill",
        "name": "Paneer Makhani Sandwich",
        "cat": "sandwiches",
        "price": 120,
        "desc": "Diced fresh paneer tossed in rich buttery tomato makhani gravy."
    },
    {
        "id": "sw_kp_grill",
        "name": "Kadhai Paneer Sandwich",
        "cat": "sandwiches",
        "price": 120,
        "desc": "Paneer cubes roasted with bell peppers in aromatic freshly ground kadhai masala."
    },
    {
        "id": "sw_tp_grill",
        "name": "Tandoori Paneer Sandwich",
        "cat": "sandwiches",
        "price": 129,
        "desc": "Smoky char-grilled tandoori spiced paneer cubes pressed in buttered crust."
    },
    {
        "id": "sw_pk_grill",
        "name": "Paneer Korma Sandwich",
        "cat": "sandwiches",
        "price": 130,
        "desc": "Royal slow-cooked mild korma sauce infused with paneer and herbs."
    },
    {
        "id": "sw_sm_grill",
        "name": "Smokey Veg. Grilled Sandwich",
        "cat": "sandwiches",
        "price": 130,
        "desc": "Woodsmoke flavoured charcoal grilled assorted garden veggies."
    },
    {
        "id": "sw_pt_grill",
        "name": "Paneer Tikka Sandwich",
        "cat": "sandwiches",
        "price": 139,
        "desc": "Marinated roasted paneer tikka chunks with capsicum, onion and mint mayo."
    },
    {
        "id": "sw_ccb_grill",
        "name": "Cheese Corn Bite Sandwich",
        "cat": "sandwiches",
        "price": 140,
        "desc": "Sweet corn bites smothered in bubbling hot cheese and melted butter."
    },
    {
        "id": "sw_pl_grill",
        "name": "Paneer Lababdar Sandwich",
        "cat": "sandwiches",
        "price": 140,
        "desc": "Creamy lababdar gravy with grated cottage cheese and chopped onions."
    },
    {
        "id": "sw_vb_baked",
        "name": "Veggie Baked Sandwich",
        "cat": "sandwiches",
        "price": 119,
        "desc": "Oven-baked sandwich crusted with golden cheese and herb-infused veggies."
    },
    {
        "id": "sw_mb_baked",
        "name": "Mexican Baked Sandwich",
        "cat": "sandwiches",
        "price": 129,
        "desc": "Baked with salsa sauce, jalapeños, sweet corn and Mexican fiesta spices."
    },
    {
        "id": "sw_cc_baked",
        "name": "Corn and Cheese Baked Sandwich",
        "cat": "sandwiches",
        "price": 139,
        "desc": "Rich sweet corn kernels baked beneath a bubbling blanket of golden mozzarella."
    },
    {
        "id": "sw_cb_baked",
        "name": "Cheese Baked Sandwich",
        "cat": "sandwiches",
        "price": 149,
        "desc": "Decadent triple cheese blend baked till golden brown and stretchable."
    },
    {
        "id": "sw_pj_baked",
        "name": "Punjabi Veg. Baked Sandwich",
        "cat": "sandwiches",
        "price": 140,
        "desc": "Robust rustic North Indian spiced veggies baked with farmhouse cheese."
    },
    {
        "id": "sw_mk_baked",
        "name": "Makhani Veg. Baked Sandwich",
        "cat": "sandwiches",
        "price": 140,
        "desc": "Silky makhani sauce and fresh veggies baked in hot stone oven."
    },
    {
        "id": "sw_kd_baked",
        "name": "Kadhai Veg. Baked Sandwich",
        "cat": "sandwiches",
        "price": 150,
        "desc": "Oven-baked with crunchy bell peppers and robust kadhai masala."
    },
    {
        "id": "sw_cv_baked",
        "name": "Cheese Veg. Baked Sandwich",
        "cat": "sandwiches",
        "price": 160,
        "desc": "Ultimate baked indulgence loaded with vegetables and double cheese crust."
    },
    {
        "id": "pz_margh_7",
        "name": "Margherita Pizza (7 inch)",
        "cat": "pizza",
        "price": 129,
        "desc": "Classic hand-tossed crust with Italian san marzano tomato sauce, fresh basil & 100% mozzarella."
    },
    {
        "id": "pz_margh_9",
        "name": "Margherita Pizza (9 inch Medium)",
        "cat": "pizza",
        "price": 199,
        "desc": "Medium 9 inch classic Italian cheese pizza loaded with rich bubbling golden mozzarella."
    },
    {
        "id": "pz_onion_7",
        "name": "Onion Pizza (7 inch)",
        "cat": "pizza",
        "price": 139,
        "desc": "Crisp red onions and herbs spread generously over seasoned tomato puree & mozzarella."
    },
    {
        "id": "pz_onion_9",
        "name": "Onion Pizza (9 inch Medium)",
        "cat": "pizza",
        "price": 219,
        "desc": "Medium 9 inch pizza with caramelised & crisp onions baked under aromatic herbs & cheese."
    },
    {
        "id": "pz_corn_7",
        "name": "Corn & Cheese Pizza (7 inch)",
        "cat": "pizza",
        "price": 149,
        "desc": "Juicy golden sweet corn paired with gooey melted mozzarella cheese."
    },
    {
        "id": "pz_corn_9",
        "name": "Corn & Cheese Pizza (9 inch Medium)",
        "cat": "pizza",
        "price": 239,
        "desc": "Medium 9 inch pizza loaded with abundant sweet corn kernels and extra mozzarella."
    },
    {
        "id": "pz_farm_7",
        "name": "Farm Fresh Pizza (7 inch)",
        "cat": "pizza",
        "price": 159,
        "desc": "Crunchy capsicum, red onions, ripe tomatoes and sweet corn over herb tomato base."
    },
    {
        "id": "pz_farm_9",
        "name": "Farm Fresh Pizza (9 inch Medium)",
        "cat": "pizza",
        "price": 249,
        "desc": "Medium 9 inch garden fresh pizza with colourful crisp vegetables and mozzarella."
    },
    {
        "id": "pz_gupshup_7",
        "name": "Gupshup Special Pizza (7 inch)",
        "cat": "pizza",
        "price": 179,
        "desc": "Signature cafe creation with marinated paneer, olives, jalapenos, corn and house special spice."
    },
    {
        "id": "pz_gupshup_9",
        "name": "Gupshup Special Pizza (9 inch Medium)",
        "cat": "pizza",
        "price": 279,
        "desc": "Medium 9 inch signature pizza topped with generous chef toppings and triple cheese."
    },
    {
        "id": "pz_ptikka_7",
        "name": "Paneer Tikka Pizza (7 inch)",
        "cat": "pizza",
        "price": 179,
        "desc": "Tandoori roasted spicy paneer cubes, crisp capsicum & onions with Indian herb dust."
    },
    {
        "id": "pz_ptikka_9",
        "name": "Paneer Tikka Pizza (9 inch Medium)",
        "cat": "pizza",
        "price": 279,
        "desc": "Medium 9 inch paneer tikka pizza loaded with smoky roasted cottage cheese & cheese."
    },
    {
        "id": "pz_spicy_p_7",
        "name": "Spicy Paneer Pizza (7 inch)",
        "cat": "pizza",
        "price": 189,
        "desc": "Fiery marinated paneer cubes, red paprika, jalapenos & spicy schezwan-tomato swirl."
    },
    {
        "id": "pz_spicy_p_9",
        "name": "Spicy Paneer Pizza (9 inch Medium)",
        "cat": "pizza",
        "price": 289,
        "desc": "Medium 9 inch spicy paneer pizza designed for spice lovers with hot pepper toppings."
    },
    {
        "id": "pz_tand_p_7",
        "name": "Tandoori Paneer Pizza (7 inch)",
        "cat": "pizza",
        "price": 189,
        "desc": "Charcoal infused clay-oven spiced paneer chunks, coriander drizzle & golden cheese."
    },
    {
        "id": "pz_tand_p_9",
        "name": "Tandoori Paneer Pizza (9 inch Medium)",
        "cat": "pizza",
        "price": 289,
        "desc": "Medium 9 inch tandoori style pizza with rich roasted paneer, onion rings and mozzarella."
    },
    {
        "id": "pz_overload_7",
        "name": "Overloaded Pizza (7 inch)",
        "cat": "pizza",
        "price": 199,
        "desc": "Extravaganza of all available toppings: paneer, corn, capsicum, olives, onions & double cheese."
    },
    {
        "id": "pz_overload_9",
        "name": "Overloaded Pizza (9 inch Medium)",
        "cat": "pizza",
        "price": 299,
        "desc": "Medium 9 inch fully loaded pizza overflowing with supreme toppings and cheese."
    },
    {
        "id": "mg_masala",
        "name": "Masala Maggi",
        "cat": "maggi",
        "price": 49,
        "desc": "All-time favourite 2-minute classic Maggi cooked with authentic tastemaker & mild herbs."
    },
    {
        "id": "mg_veggie",
        "name": "Veggie Maggi",
        "cat": "maggi",
        "price": 59,
        "desc": "Hot steaming Maggi noodles tossed with chopped carrots, green peas, onions and capsicum."
    },
    {
        "id": "mg_butter",
        "name": "Butter Maggi",
        "cat": "maggi",
        "price": 69,
        "desc": "Rich creamy Maggi prepared with generous melting golden Amul butter dollop."
    },
    {
        "id": "mg_cheese",
        "name": "Cheese Maggi",
        "cat": "maggi",
        "price": 79,
        "desc": "Topped with a generous mound of finely shredded gooey melted cheddar cheese."
    },
    {
        "id": "mg_tandoori",
        "name": "Tandoori Maggi",
        "cat": "maggi",
        "price": 89,
        "desc": "Smoky clay-oven tandoori tadka infused into piping hot spicy Maggi noodles."
    },
    {
        "id": "ch_veg_ndl",
        "name": "Veg Noodles",
        "cat": "chinese",
        "price": 69,
        "desc": "Wok-tossed noodles with shredded cabbage, carrots, spring onions and light soy sauce."
    },
    {
        "id": "ch_hakka_ndl",
        "name": "Hakka Noodles",
        "cat": "chinese",
        "price": 79,
        "desc": "Classic Indo-Chinese street style Hakka noodles tossed on high flame with bell peppers."
    },
    {
        "id": "ch_schez_ndl",
        "name": "Schezwan Noodles",
        "cat": "chinese",
        "price": 89,
        "desc": "Fiery noodles stir-fried with house special garlic-chilli Schezwan sauce."
    },
    {
        "id": "ch_cg_ndl",
        "name": "Chilli Garlic Noodles",
        "cat": "chinese",
        "price": 99,
        "desc": "Spicy noodles bursting with charred garlic cloves, red chillies and scallions."
    },
    {
        "id": "ch_gs_ndl",
        "name": "Gupshup Special Noodles",
        "cat": "chinese",
        "price": 119,
        "desc": "Signature chef noodles tossed with exotic vegetables, paneer strips and secret sauce."
    },
    {
        "id": "ch_fried_rice",
        "name": "Fried Rice",
        "cat": "chinese",
        "price": 79,
        "desc": "Fluffy basmati rice wok-fried with crisp diced vegetables and aromatic seasoning."
    },
    {
        "id": "ch_schez_rice",
        "name": "Schezwan Fried Rice",
        "cat": "chinese",
        "price": 89,
        "desc": "Spicy stir-fried basmati rice laced with fiery red Schezwan pepper paste."
    },
    {
        "id": "ch_cg_rice",
        "name": "Chilli Garlic Fried Rice",
        "cat": "chinese",
        "price": 99,
        "desc": "Fragrant basmati rice tossed with crispy roasted garlic and dried red chillies."
    },
    {
        "id": "ch_vm_dry",
        "name": "Veg Manchurian Dry",
        "cat": "chinese",
        "price": 99,
        "desc": "Crisp golden vegetable dumplings tossed with ginger, garlic, green chillies & dark soy."
    },
    {
        "id": "ch_vm_gravy",
        "name": "Veg Manchurian Gravy",
        "cat": "chinese",
        "price": 119,
        "desc": "Juicy veg dumplings simmered in rich, glossy and tangy Indo-Chinese brown gravy."
    },
    {
        "id": "ch_cp_dry",
        "name": "Chilli Paneer Dry",
        "cat": "chinese",
        "price": 129,
        "desc": "Battered succulent paneer cubes stir-fried with diced onions, capsicum & green chillies."
    },
    {
        "id": "ch_cp_gravy",
        "name": "Chilli Paneer Gravy",
        "cat": "chinese",
        "price": 139,
        "desc": "Fresh cottage cheese cubes drenched in sweet, spicy and savoury dark garlic gravy."
    },
    {
        "id": "ch_gsm",
        "name": "Gupshup Special Manchurian",
        "cat": "chinese",
        "price": 149,
        "desc": "House specialty manchurian prepared with premium paneer-veggie balls in rich gravy."
    },
    {
        "id": "gb_bt",
        "name": "Butter Toast",
        "cat": "rolls",
        "price": 29,
        "desc": "Crispy golden toasted bread slices slathered with pure rich salted butter."
    },
    {
        "id": "gb_mbt",
        "name": "Masala Butter Toast",
        "cat": "rolls",
        "price": 39,
        "desc": "Toasted bread topped with aromatic chaat masala, pepper and melting butter."
    },
    {
        "id": "gb_cgt",
        "name": "Cheese Garlic Toast",
        "cat": "rolls",
        "price": 59,
        "desc": "Crisp bread toasts brushed with roasted garlic butter and smothered in melted cheese."
    },
    {
        "id": "gb_ccgt",
        "name": "Cheese Chilli Garlic Toast",
        "cat": "rolls",
        "price": 69,
        "desc": "Golden toast topped with garlic, green chillies and bubbling melted mozzarella."
    },
    {
        "id": "gb_cpt",
        "name": "Cheese Paneer Toast",
        "cat": "rolls",
        "price": 79,
        "desc": "Spiced crushed paneer and melted cheese layered on crispy herb toast."
    },
    {
        "id": "gb_plain",
        "name": "Plain Garlic Bread",
        "cat": "pasta",
        "price": 60,
        "desc": "Warm oven-baked baguette slices infused with fragrant garlic herb butter."
    },
    {
        "id": "gb_cheese",
        "name": "Cheese Garlic Bread",
        "cat": "pasta",
        "price": 90,
        "desc": "Classic garlic bread topped with a thick layer of melted mozzarella cheese."
    },
    {
        "id": "gb_double",
        "name": "Double Cheese Garlic Bread",
        "cat": "pasta",
        "price": 110,
        "desc": "Loaded with double portions of mozzarella and cheddar cheese."
    },
    {
        "id": "gb_veggie",
        "name": "Veggie Cheese Garlic Bread",
        "cat": "pasta",
        "price": 130,
        "desc": "Topped with diced bell peppers, sweet corn, jalapeños and cheese."
    },
    {
        "id": "rl_veg",
        "name": "Veg Roll",
        "cat": "rolls",
        "price": 49,
        "desc": "Crisp flaky paratha wrapped with spiced potato-veggie filling and mint chutney."
    },
    {
        "id": "rl_kathi",
        "name": "Kathi Roll",
        "cat": "rolls",
        "price": 59,
        "desc": "Kolkata street style kathi roll filled with crunchy veggies, onions and tangy sauces."
    },
    {
        "id": "rl_paneer",
        "name": "Paneer Roll",
        "cat": "rolls",
        "price": 79,
        "desc": "Succulent spiced cottage cheese chunks wrapped in warm buttered flatbread."
    },
    {
        "id": "rl_special",
        "name": "Gupshup Special Roll",
        "cat": "rolls",
        "price": 99,
        "desc": "Signature stuffed roll bursting with grilled paneer, sweet corn, cheese and secret dip."
    },
    {
        "id": "pa_red",
        "name": "Red Pasta (Arrabbiata)",
        "cat": "pasta",
        "price": 110,
        "desc": "Penne pasta tossed in spicy Italian plum tomato sauce, garlic & fresh basil."
    },
    {
        "id": "pa_white",
        "name": "White Pasta (Alfredo)",
        "cat": "pasta",
        "price": 150,
        "desc": "Velvety rich cream cheese sauce with garlic, butter and aromatic Italian herbs."
    },
    {
        "id": "pa_pink",
        "name": "Pink Pasta (Mix Sauce)",
        "cat": "pasta",
        "price": 160,
        "desc": "Harmonious blend of creamy white Alfredo and tangy red Arrabbiata sauces."
    },
    {
        "id": "pa_tandoori",
        "name": "Tandoori Creamy Pasta",
        "cat": "pasta",
        "price": 180,
        "desc": "Fusion pasta tossed in rich smoky tandoori sauce with Indian herbs."
    },
    {
        "id": "pa_makhani",
        "name": "Makhani Creamy Pasta",
        "cat": "pasta",
        "price": 180,
        "desc": "Penne smothered in royal buttery tomato makhani cream sauce."
    },
    {
        "id": "pa_kadhai",
        "name": "Kadhai Pasta",
        "cat": "pasta",
        "price": 190,
        "desc": "Bold rustic flavours with sautéed capsicum, onions and freshly ground kadhai masala."
    },
    {
        "id": "pa_mac_cheese",
        "name": "Mac & Cheese Pasta",
        "cat": "pasta",
        "price": 190,
        "desc": "Elbow macaroni blanketed in thick, bubbling cheddar and mozzarella sauce."
    },
    {
        "id": "pa_mac_baked",
        "name": "Mac Tomato Baked Pasta",
        "cat": "pasta",
        "price": 199,
        "desc": "Oven-baked macaroni in seasoned tomato herb sauce with golden crusted cheese."
    },
    {
        "id": "fr_masala",
        "name": "Masala Fries",
        "cat": "fries_nachos",
        "price": 80,
        "desc": "Crispy potato fries dusted with zesty chaat masala and lemon mist."
    },
    {
        "id": "fr_mexican",
        "name": "Mexican Fries",
        "cat": "fries_nachos",
        "price": 90,
        "desc": "Fries seasoned with Mexican herbs, salsa drizzle and tangy mayo."
    },
    {
        "id": "fr_periperi",
        "name": "Peri Peri Fries",
        "cat": "fries_nachos",
        "price": 90,
        "desc": "Fiery African bird’s eye chilli spice dusted over piping hot crunchy fries."
    },
    {
        "id": "fr_cheesy",
        "name": "Cheesy Loaded Fries",
        "cat": "fries_nachos",
        "price": 110,
        "desc": "Smothered in creamy warm cheese sauce and jalapeño bits."
    },
    {
        "id": "fr_tandoori",
        "name": "Tandoori Loaded Fries",
        "cat": "fries_nachos",
        "price": 120,
        "desc": "Loaded with smoky tandoori mayo, onions and melted cheese."
    },
    {
        "id": "fr_extra_dip",
        "name": "Extra Dip (Mayo / Mint / Cheese)",
        "cat": "fries_nachos",
        "price": 20,
        "desc": "Chef crafted dipping sauce for extra indulgence."
    },
    {
        "id": "nc_dip",
        "name": "Nachos With Dip",
        "cat": "fries_nachos",
        "price": 90,
        "desc": "Crunchy corn tortilla chips served with zesty tomato salsa and cheese dip."
    },
    {
        "id": "nc_cheese",
        "name": "Cheese Nachos",
        "cat": "fries_nachos",
        "price": 120,
        "desc": "Golden tortilla chips drizzled generously with hot liquid cheese."
    },
    {
        "id": "nc_masala",
        "name": "Masala Cheese Nachos",
        "cat": "fries_nachos",
        "price": 140,
        "desc": "Loaded with diced onions, tomatoes, green chillies and spiced cheese."
    },
    {
        "id": "nc_baked",
        "name": "Baked Cheese Nachos",
        "cat": "fries_nachos",
        "price": 160,
        "desc": "Tortilla chips baked in stone oven with refried beans, salsa, olives & mozzarella."
    },
    {
        "id": "ct_kurkure",
        "name": "Crunchy Chaat (Kurkure)",
        "cat": "chaat",
        "price": 70,
        "desc": "Tangy mix of crunchy Kurkure with chopped onions, tomatoes, lemon & mint."
    },
    {
        "id": "ct_bingo",
        "name": "Tangy Bhel (Bingo)",
        "cat": "chaat",
        "price": 70,
        "desc": "Bingo triangles tossed with sweet-sour tamarind chutney, sev and fresh coriander."
    },
    {
        "id": "ct_bhel",
        "name": "Bhel Puri / Bhel",
        "cat": "chaat",
        "price": 80,
        "desc": "Traditional street bhel with puffed rice, crispy puris, tangy chutneys and sev."
    },
    {
        "id": "ct_corn",
        "name": "Crispy Corn",
        "cat": "chaat",
        "price": 100,
        "desc": "Golden batter-fried sweet corn tossed with capsicum, pepper and spices."
    },
    {
        "id": "ct_spring_roll",
        "name": "Veg. Spring Roll (6 pcs)",
        "cat": "chaat",
        "price": 120,
        "desc": "Crispy golden rolls filled with shredded seasonal vegetables & sweet chilli dip."
    },
    {
        "id": "tea_apni",
        "name": "Apni Chai",
        "cat": "tea",
        "price": 25,
        "desc": "Homestyle strong milk tea brewed with crushed ginger and aromatic tea leaves."
    },
    {
        "id": "tea_ginger_el",
        "name": "Ginger Elaichi Tea",
        "cat": "tea",
        "price": 30,
        "desc": "Fragrant cardamom and fresh crushed ginger slow simmered in rich milk."
    },
    {
        "id": "tea_masala",
        "name": "Masala Tea",
        "cat": "tea",
        "price": 30,
        "desc": "Traditional chai infused with whole spices: clove, cinnamon, black pepper & star anise."
    },
    {
        "id": "tea_lemon_ging",
        "name": "Lemon Ginger Tea",
        "cat": "tea",
        "price": 50,
        "desc": "Soothing black tea infused with fresh lemon juice, crushed ginger and honey."
    },
    {
        "id": "tea_green",
        "name": "Green Tea",
        "cat": "tea",
        "price": 50,
        "desc": "Antioxidant rich pure whole-leaf green tea for light, healthy rejuvenation."
    },
    {
        "id": "tea_kesar_el",
        "name": "Kesar Elaichi Tea",
        "cat": "tea",
        "price": 70,
        "desc": "Royal saffron strands and fragrant green cardamom steeped in velvety milk chai."
    },
    {
        "id": "it_peach",
        "name": "Peach Ice Tea",
        "cat": "tea",
        "price": 60,
        "desc": "Refreshing brewed black tea infused with sweet fragrant peach nectar and ice."
    },
    {
        "id": "it_lemon",
        "name": "Lemon Ice Tea",
        "cat": "tea",
        "price": 70,
        "desc": "Classic chilled iced tea spiked with tangy lemon extract and fresh mint."
    },
    {
        "id": "it_green_apple",
        "name": "Green Apple Ice Tea",
        "cat": "tea",
        "price": 90,
        "desc": "Crisp tart green apple syrup shaken with iced tea and chilled lime."
    },
    {
        "id": "it_redbull",
        "name": "Red Bull Ice Tea",
        "cat": "tea",
        "price": 100,
        "desc": "High-energy iced tea topped with Red Bull energy splash."
    },
    {
        "id": "it_raspberry",
        "name": "Raspberry Ice Tea",
        "cat": "tea",
        "price": 110,
        "desc": "Sweet-tart wild raspberry crush blended with chilled brewed Ceylon tea."
    },
    {
        "id": "cf_reg_s",
        "name": "Regular Coffee (Small)",
        "cat": "coffee",
        "price": 40,
        "desc": "Creamy frothy Indian filter style hot coffee."
    },
    {
        "id": "cf_reg_l",
        "name": "Regular Coffee (Large)",
        "cat": "coffee",
        "price": 70,
        "desc": "Large mug of frothy, aromatic hot coffee brewed fresh."
    },
    {
        "id": "cf_car_s",
        "name": "Classic Caramel Coffee (Small)",
        "cat": "coffee",
        "price": 60,
        "desc": "Steamed milk and espresso swirled with rich golden caramel syrup."
    },
    {
        "id": "cf_car_l",
        "name": "Classic Caramel Coffee (Large)",
        "cat": "coffee",
        "price": 80,
        "desc": "Large cup of sweet buttery caramel hot coffee with velvety foam."
    },
    {
        "id": "cf_irish_s",
        "name": "Irish Coffee (Small)",
        "cat": "coffee",
        "price": 60,
        "desc": "Non-alcoholic Irish cream flavour notes infused with dark roasted coffee."
    },
    {
        "id": "cf_irish_l",
        "name": "Irish Coffee (Large)",
        "cat": "coffee",
        "price": 80,
        "desc": "Large rich cup of aromatic Irish cream flavoured coffee."
    },
    {
        "id": "cf_hazel_s",
        "name": "Hazelnut Coffee (Small)",
        "cat": "coffee",
        "price": 70,
        "desc": "Earthy roasted hazelnut essence folded into steaming espresso and milk."
    },
    {
        "id": "cf_hazel_l",
        "name": "Hazelnut Coffee (Large)",
        "cat": "coffee",
        "price": 90,
        "desc": "Large mug of rich hazelnut infused hot coffee."
    },
    {
        "id": "cc_reg_s",
        "name": "Cold Coffee (Small)",
        "cat": "coffee",
        "price": 50,
        "desc": "Thick blended cold coffee made with rich milk, sugar and fine espresso."
    },
    {
        "id": "cc_reg_l",
        "name": "Cold Coffee (Large)",
        "cat": "coffee",
        "price": 70,
        "desc": "Tall glass of refreshing creamy cold coffee whipped to perfection."
    },
    {
        "id": "cc_car_s",
        "name": "Caramel Cold Coffee (Small)",
        "cat": "coffee",
        "price": 70,
        "desc": "Chilled coffee swirled with decadent salted caramel drizzle."
    },
    {
        "id": "cc_car_l",
        "name": "Caramel Cold Coffee (Large)",
        "cat": "coffee",
        "price": 90,
        "desc": "Tall glass of creamy cold coffee layered with golden caramel ribbons."
    },
    {
        "id": "cc_choc_s",
        "name": "Chocolate Coffee (Small)",
        "cat": "coffee",
        "price": 70,
        "desc": "Rich cocoa blend and espresso blended cold with velvety milk."
    },
    {
        "id": "cc_choc_l",
        "name": "Chocolate Coffee (Large)",
        "cat": "coffee",
        "price": 90,
        "desc": "Tall glass of chocolate iced mocha coffee."
    },
    {
        "id": "cc_icecream_s",
        "name": "Cold Coffee with Ice Cream (Small)",
        "cat": "coffee",
        "price": 80,
        "desc": "Thick cold coffee topped with a creamy scoop of vanilla ice cream."
    },
    {
        "id": "cc_icecream_l",
        "name": "Cold Coffee with Ice Cream (Large)",
        "cat": "coffee",
        "price": 100,
        "desc": "Tall cold coffee float topped with generous vanilla ice cream."
    },
    {
        "id": "cc_irish_s",
        "name": "Irish Cold Coffee (Small)",
        "cat": "coffee",
        "price": 80,
        "desc": "Blended cold coffee infused with non-alcoholic Irish cream syrup."
    },
    {
        "id": "cc_irish_l",
        "name": "Irish Cold Coffee (Large)",
        "cat": "coffee",
        "price": 110,
        "desc": "Tall glass of velvety Irish cream cold coffee."
    },
    {
        "id": "cc_hazel_s",
        "name": "Hazelnut Cold Coffee (Small)",
        "cat": "coffee",
        "price": 80,
        "desc": "Rich nutty hazelnut puree blended with chilled espresso and milk."
    },
    {
        "id": "cc_hazel_l",
        "name": "Hazelnut Cold Coffee (Large)",
        "cat": "coffee",
        "price": 110,
        "desc": "Tall glass of roasted hazelnut frappe."
    },
    {
        "id": "cc_chips_s",
        "name": "Coffee with Ice Cream & Choco Chips (Small)",
        "cat": "coffee",
        "price": 90,
        "desc": "Cold coffee with vanilla scoop and crunchy dark chocolate chips."
    },
    {
        "id": "cc_chips_l",
        "name": "Coffee with Ice Cream & Choco Chips (Large)",
        "cat": "coffee",
        "price": 120,
        "desc": "Deluxe tall cold coffee loaded with ice cream, chocolate syrup and choco chips."
    },
    {
        "id": "sk_chocolate",
        "name": "Chocolate Shake",
        "cat": "shakes",
        "price": 90,
        "desc": "Creamy milkshake blended with rich Hershey chocolate fudge."
    },
    {
        "id": "sk_butterscotch",
        "name": "Butter Scotch Shake",
        "cat": "shakes",
        "price": 100,
        "desc": "Velvety shake with crunchy butterscotch praline morsels."
    },
    {
        "id": "sk_strawberry",
        "name": "Strawberry Shake",
        "cat": "shakes",
        "price": 100,
        "desc": "Sweet strawberry puree whipped with fresh chilled milk."
    },
    {
        "id": "sk_paan",
        "name": "Paan Shake",
        "cat": "shakes",
        "price": 100,
        "desc": "Authentic Banarasi meetha paan infused shake with gulkand and fennel."
    },
    {
        "id": "sk_banana_car",
        "name": "Banana Caramel Shake",
        "cat": "shakes",
        "price": 110,
        "desc": "Ripe banana puree blended with sweet butterscotch caramel."
    },
    {
        "id": "sk_oreo",
        "name": "Oreo Shake",
        "cat": "shakes",
        "price": 120,
        "desc": "Crushed Oreo cookies whipped with vanilla cream and milk."
    },
    {
        "id": "sk_kitkat",
        "name": "Kit Kat Shake",
        "cat": "shakes",
        "price": 130,
        "desc": "Crunchy Kit Kat wafer fingers blended into chocolate shake."
    },
    {
        "id": "sk_blueberry",
        "name": "Blueberry Shake",
        "cat": "shakes",
        "price": 130,
        "desc": "Exotic wild blueberry crush blended thick and frosty."
    },
    {
        "id": "sk_dbc",
        "name": "DBC Shake (Death By Chocolate)",
        "cat": "shakes",
        "price": 140,
        "desc": "Ultimate chocolate overload with brownie, chocolate sauce and choco chips."
    },
    {
        "id": "sk_bs_oreo",
        "name": "Butterscotch Oreo Shake",
        "cat": "shakes",
        "price": 150,
        "desc": "Crunchy Oreo meets butterscotch praline in an ultra-thick shake."
    },
    {
        "id": "sk_pb",
        "name": "Peanut Butter Shake",
        "cat": "shakes",
        "price": 150,
        "desc": "Roasted American peanut butter whipped with milk and honey."
    },
    {
        "id": "sk_pb_oreo",
        "name": "Peanut Butter Oreo Shake",
        "cat": "shakes",
        "price": 160,
        "desc": "Gourmet combination of creamy peanut butter and crunchy Oreos."
    },
    {
        "id": "sk_hazel_brownie",
        "name": "Hazelnut Brownie Shake",
        "cat": "shakes",
        "price": 180,
        "desc": "Decadent fudgy chocolate brownie blended with hazelnut spread."
    },
    {
        "id": "mk_spicy_mango",
        "name": "Spicy Mango Mocktail",
        "cat": "mocktails",
        "price": 90,
        "desc": "Sweet Alphonso mango pulp with fiery green chilli and chaat masala."
    },
    {
        "id": "mk_malt_beer",
        "name": "Malt Beer (Non-Alcoholic)",
        "cat": "mocktails",
        "price": 90,
        "desc": "Refreshing fizzy barley brewed malt beverage served ice cold."
    },
    {
        "id": "mk_blue_lagoon",
        "name": "Blue Lagoon",
        "cat": "mocktails",
        "price": 100,
        "desc": "Curacao citrus cordial muddled with lemon juice and sparkling Sprite."
    },
    {
        "id": "mk_pina_colada",
        "name": "Pina Colada",
        "cat": "mocktails",
        "price": 100,
        "desc": "Creamy coconut milk and fresh pineapple juice shaken over ice."
    },
    {
        "id": "mk_lychee",
        "name": "Lychee Booster",
        "cat": "mocktails",
        "price": 100,
        "desc": "Sweet tropical lychee nectar mixed with crushed mint and soda."
    },
    {
        "id": "mk_virgin_mojito",
        "name": "Virgin Mojito",
        "cat": "mocktails",
        "price": 100,
        "desc": "Fresh garden mint sprigs and lime wedges muddled with sparkling soda."
    },
    {
        "id": "mk_tropical_moj",
        "name": "Tropical Mojito",
        "cat": "mocktails",
        "price": 120,
        "desc": "Passion fruit, pineapple and lime muddled with fresh mint and fizz."
    },
    {
        "id": "mk_raspberry_moj",
        "name": "Raspberry Mojito",
        "cat": "mocktails",
        "price": 120,
        "desc": "Wild raspberry coulis shaken with fresh lime and sparkling water."
    },
    {
        "id": "mk_mix_berry",
        "name": "Mix Berry Mojito",
        "cat": "mocktails",
        "price": 120,
        "desc": "Blackberry, raspberry and blueberry crush with sparkling soda."
    },
    {
        "id": "mk_green_apple",
        "name": "Green Apple Mojito",
        "cat": "mocktails",
        "price": 130,
        "desc": "Tangy green apple syrup with fresh lime and mint fizz."
    },
    {
        "id": "mk_bull_mojito",
        "name": "Bull Mojito",
        "cat": "mocktails",
        "price": 130,
        "desc": "Red Bull energy boost muddled with fresh mint, lime and ice."
    },
    {
        "id": "lm_fresh_water",
        "name": "Fresh Lime Water",
        "cat": "mocktails",
        "price": 40,
        "desc": "Freshly squeezed lemon with rock salt and sweet cane sugar."
    },
    {
        "id": "lm_fresh_soda",
        "name": "Fresh Lime Soda",
        "cat": "mocktails",
        "price": 60,
        "desc": "Crisp sparkling soda with freshly squeezed lime and cumin."
    },
    {
        "id": "lm_masala",
        "name": "Masala Lemonade",
        "cat": "mocktails",
        "price": 80,
        "desc": "Spiced lemonade with roasted cumin, black salt and fresh mint."
    },
    {
        "id": "lm_watermelon",
        "name": "Watermelon Lemonade",
        "cat": "mocktails",
        "price": 100,
        "desc": "Fresh watermelon juice shaken with lime and chilled soda."
    },
    {
        "id": "sp_butter_handi",
        "name": "Delhi Butter Handi Momos",
        "cat": "momos",
        "price": 250,
        "desc": "Tender veg dimsums slow-simmered in rich tandoori butter gravy in clay handi."
    },
    {
        "id": "sp_tandoori_fried",
        "name": "Tandoori Fried Momos",
        "cat": "momos",
        "price": 180,
        "desc": "Crispy fried momos tossed with chaat masala, spicy red dip & mint chutney."
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

  
  /* Render On-Page Menu Grid */
  var onPageCat = 'all';
  function renderOnPageMenu() {
    var grid = document.getElementById('onPageMenuGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var filtered = onPageCat === 'all' ? menuItems : menuItems.filter(function (x) { return x.cat === onPageCat; });
    filtered.forEach(function (item) {
      var qty = cart[item.id] || 0;
      var card = document.createElement('div');
      card.className = 'onpage-menu-item';
      
      var catBadgeName = item.cat.toUpperCase().replace('_', ' & ');
      
      card.innerHTML = 
        '<div class="onpage-item-head">' +
          '<div class="onpage-item-name">' + item.name + '</div>' +
          '<div class="onpage-item-dots"></div>' +
          '<div class="onpage-item-price">₹' + item.price + '</div>' +
        '</div>' +
        '<p class="onpage-item-desc">' + item.desc + '</p>' +
        '<div class="onpage-item-foot">' +
          '<span class="onpage-cat-badge">' + catBadgeName + '</span>' +
          (qty === 0 
            ? '<button type="button" class="btn btn-gold btn-sm add-btn" data-id="' + item.id + '" style="padding:4px 14px;font-size:0.75rem;">+ Add</button>'
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
        updateCartAndBill();
        var it = menuItems.find(function(m) { return m.id === id; });
        showToast('Added ' + (it ? it.name : 'dish') + ' to order!');
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
        updateCartAndBill();
      });
    });
  }

  /* Listen for on-page tab switches */
  document.querySelectorAll('.onpage-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.onpage-tab').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      onPageCat = btn.getAttribute('data-cat') || 'all';
      renderOnPageMenu();
    });
  });

  renderMenuGrid();
  renderOnPageMenu();
  updateCartAndBill();

})();
