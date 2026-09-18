/* ==========================================================================
   Myan Home — site behaviour
   Mirrors docs/research/BEHAVIORS.md.
   ========================================================================== */
(function () {
  'use strict';

  var on = function (el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); };
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- header */
  /* "sticky-jump": the wrapper detaches and shrinks the moment the page
     leaves the top. #header keeps its 90px box so content never jumps. */
  function initStickyHeader() {
    var header = qs('#header');
    var wrapper = qs('.header-wrapper');
    if (!header || !wrapper) return;

    var transparent = header.classList.contains('has-transparent');
    var ticking = false;

    function apply() {
      var stuck = window.pageYOffset > 0;
      wrapper.classList.toggle('stuck', stuck);
      if (transparent) header.classList.toggle('transparent', !stuck);
      ticking = false;
    }

    on(window, 'scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(apply); }
    }, { passive: true });

    apply();
  }

  /* ------------------------------------------------------------- dropdowns */
  /* Desktop: hover opens, with a small close delay so diagonal mouse travel
     into the panel does not dismiss it (the live site uses hoverIntent). */
  function initDropdowns() {
    var CLOSE_DELAY = 180;

    qsa('.header-nav > li.has-dropdown, .header-nav > li.has-icon.has-dropdown').forEach(function (li) {
      var timer = null;
      var link = qs('a', li);

      function open() {
        clearTimeout(timer);
        li.classList.add('current-dropdown');
        if (link) link.setAttribute('aria-expanded', 'true');
      }
      function close() {
        timer = setTimeout(function () {
          li.classList.remove('current-dropdown');
          if (link) link.setAttribute('aria-expanded', 'false');
        }, CLOSE_DELAY);
      }

      on(li, 'mouseenter', open);
      on(li, 'mouseleave', close);
      on(li, 'focusin', open);
      on(li, 'focusout', function (e) {
        if (!li.contains(e.relatedTarget)) close();
      });

      // Search toggle is a button-like link: click should not navigate.
      if (li.classList.contains('header-search')) {
        on(link, 'click', function (e) {
          e.preventDefault();
          if (li.classList.contains('current-dropdown')) {
            li.classList.remove('current-dropdown');
          } else {
            open();
            var input = qs('input[type="search"], input[type="text"]', li);
            if (input) input.focus();
          }
        });
      }
    });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape') {
        qsa('.current-dropdown').forEach(function (li) { li.classList.remove('current-dropdown'); });
      }
    });
  }

  /* ----------------------------------------------------------- mobile menu */
  function initMobileMenu() {
    var sidebar = qs('#main-menu');
    if (!sidebar) return;

    var overlay = qs('.main-menu-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'main-menu-overlay';
      document.body.appendChild(overlay);
    }

    function setOpen(open) {
      sidebar.classList.toggle('is-open', open);
      overlay.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      qsa('[data-open="#main-menu"]').forEach(function (b) {
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    qsa('[data-open="#main-menu"]').forEach(function (btn) {
      on(btn, 'click', function (e) { e.preventDefault(); setOpen(true); });
    });
    on(overlay, 'click', function () { setOpen(false); });
    qsa('.mobile-sidebar .close-menu').forEach(function (b) {
      on(b, 'click', function (e) { e.preventDefault(); setOpen(false); });
    });
    on(document, 'keydown', function (e) { if (e.key === 'Escape') setOpen(false); });

    // Collapsible sub-menus inside the drawer.
    qsa('#main-menu li').forEach(function (li) {
      var sub = li.querySelector(':scope > .sub-menu');
      if (!sub) return;
      li.classList.add('has-child');
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'toggle';
      t.setAttribute('aria-label', 'Mở rộng');
      t.innerHTML = '<i class="icon-angle-down" aria-hidden="true"></i>';
      li.insertBefore(t, sub);
      on(t, 'click', function () { li.classList.toggle('is-open'); });
    });
  }

  /* --------------------------------------------------------------- sliders */
  /* Lightweight replacement for Flickity: one slide visible at a time,
     drag + dots + optional autoplay. Used by the hero and testimonials. */
  function initSliders() {
    qsa('[data-slider]').forEach(function (root) {
      var track = qs('.slides', root);
      if (!track) return;
      var slides = qsa(':scope > *', track);
      if (slides.length < 2) return;

      var index = 0;
      var autoplay = parseInt(root.dataset.autoplay || '0', 10);
      var timer = null;

      var dotsWrap = document.createElement('div');
      dotsWrap.className = 'slider-dots';
      slides.forEach(function (_, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'slider-dot';
        d.setAttribute('aria-label', 'Slide ' + (i + 1));
        on(d, 'click', function () { go(i); restart(); });
        dotsWrap.appendChild(d);
      });
      root.appendChild(dotsWrap);

      var prev = qs('.slider-prev', root);
      var next = qs('.slider-next', root);
      on(prev, 'click', function () { go(index - 1); restart(); });
      on(next, 'click', function () { go(index + 1); restart(); });

      /* Slides sit off-canvas horizontally, so native lazy-loading would never
         fire for them. Promote the target slide and its neighbours to eager
         just before they scroll in, which keeps the initial payload small
         without the images popping in mid-transition. */
      function preload(i) {
        [i - 1, i, i + 1].forEach(function (n) {
          var slide = slides[(n + slides.length) % slides.length];
          qsa('img[loading="lazy"]', slide).forEach(function (img) {
            img.removeAttribute('loading');
          });
        });
      }

      function go(i) {
        index = (i + slides.length) % slides.length;
        preload(index);
        track.style.transform = 'translateX(' + (-index * 100) + '%)';
        qsa('.slider-dot', dotsWrap).forEach(function (d, n) {
          d.classList.toggle('is-active', n === index);
        });
      }
      function restart() {
        if (!autoplay) return;
        clearInterval(timer);
        timer = setInterval(function () { go(index + 1); }, autoplay);
      }

      // pointer drag
      var startX = null;
      on(track, 'pointerdown', function (e) { startX = e.clientX; track.style.transition = 'none'; });
      on(window, 'pointerup', function (e) {
        if (startX === null) return;
        var dx = e.clientX - startX;
        track.style.transition = '';
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        else go(index);
        startX = null;
        restart();
      });

      on(root, 'mouseenter', function () { clearInterval(timer); });
      on(root, 'mouseleave', restart);

      go(0);
      restart();
    });
  }

  /* -------------------------------------------------------- carousel rails */
  /* Multi-item rails (partner logos, news cards) scroll by one page. */
  function initCarousels() {
    qsa('[data-carousel]').forEach(function (root) {
      var track = qs('.carousel-track', root);
      if (!track) return;
      var prev = qs('.carousel-prev', root);
      var next = qs('.carousel-next', root);
      function page(dir) {
        track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
      }
      on(prev, 'click', function () { page(-1); });
      on(next, 'click', function () { page(1); });
    });
  }

  /* --------------------------------------------------------- reveal on scroll */
  function initReveal() {
    var els = qsa('[data-reveal]');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ------------------------------------------------------------ chat widget */
  function initChatWidget() {
    var root = qs('.chat-widget');
    if (!root) return;
    var toggle = qs('.chat-widget-toggle', root);
    on(toggle, 'click', function () { root.classList.toggle('is-open'); });
  }

  function init() {
    initStickyHeader();
    initDropdowns();
    initMobileMenu();
    initSliders();
    initCarousels();
    initReveal();
    initChatWidget();
  }

  if (document.readyState === 'loading') {
    on(document, 'DOMContentLoaded', init);
  } else {
    init();
  }
})();
