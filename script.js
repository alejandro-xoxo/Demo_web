/*!
 * Alejandro Acevedo — Dev Showcase · Fase 1
 * script.js — Motion-Driven Dark Portfolio
 *
 * Features:
 *   1. Canvas Cursor Orb (RAF-based, lerp smoothing)
 *   2. Hero Title Word-Split animation
 *   3. 3D Card Tilt with spotlight glow
 *   4. Scroll Reveal with stagger delays
 *   5. Marquee pause on hover
 *   6. prefers-reduced-motion guard on all animations
 */

'use strict';

/* ── Utility: Reduced Motion Check ──────────────────────── */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1. CANVAS CURSOR ORB
   ============================================================ */
(function initCursorOrb() {
  if (prefersReducedMotion()) return;

  const canvas = document.getElementById('cursor-orb');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  let width  = window.innerWidth;
  let height = window.innerHeight;
  let mouseX = width / 2;
  let mouseY = height / 2;
  let orbX   = width / 2;
  let orbY   = height / 2;
  let rafId  = null;

  /* Resize handler — keep canvas full-viewport */
  function resize() {
    width  = window.innerWidth;
    height = window.innerHeight;
    canvas.width  = width;
    canvas.height = height;
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* Track mouse position */
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  /* Touch support — use first touch point */
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  /* Linear interpolation helper */
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /* RAF render loop */
  function draw() {
    rafId = requestAnimationFrame(draw);

    /* Lerp orb position toward cursor with factor 0.06 */
    orbX = lerp(orbX, mouseX, 0.06);
    orbY = lerp(orbY, mouseY, 0.06);

    /* Clear previous frame */
    ctx.clearRect(0, 0, width, height);

    /* Radial gradient centered at orb position */
    const gradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 380);
    gradient.addColorStop(0, 'hsla(220,70%,60%,0.07)');
    gradient.addColorStop(1, 'hsla(220,70%,60%,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  draw();

  /* Pause when tab is hidden, resume when visible */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      if (!rafId) draw();
    }
  });
})();

/* ============================================================
   2. HERO TITLE WORD-SPLIT
   ============================================================ */
(function initWordSplit() {
  const titleEl = document.querySelector('.hero-title');
  if (!titleEl) return;

  /* If reduced-motion, just show the title immediately */
  if (prefersReducedMotion()) {
    titleEl.classList.add('animated');
    return;
  }

  /* Get raw text and split into words */
  const rawText = titleEl.textContent.trim();
  const words   = rawText.split(/\s+/);

  /* Build word-wrapped HTML */
  const fragment = document.createDocumentFragment();

  words.forEach((word, index) => {
    /* Word wrapper (clips the translateY animation) */
    const wrapper = document.createElement('span');
    wrapper.className = 'word-wrapper';

    /* Actual animated word */
    const inner = document.createElement('span');
    inner.className = 'word-item';
    inner.style.setProperty('--word-index', index);
    inner.textContent = word;

    wrapper.appendChild(inner);
    fragment.appendChild(wrapper);

    /* Add a space span between words (except after the last) */
    if (index < words.length - 1) {
      const space = document.createTextNode(' ');
      fragment.appendChild(space);
    }
  });

  /* Replace title content */
  titleEl.textContent = '';
  titleEl.appendChild(fragment);

  /* Trigger animation via double rAF (ensures layout is painted) */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      titleEl.classList.add('animated');
    });
  });
})();

/* ============================================================
   3. 3D CARD TILT + SPOTLIGHT GLOW
   ============================================================ */
(function initCardTilt() {
  const cards = document.querySelectorAll('.showcase-card');
  if (!cards.length) return;

  /* Skip tilt on reduced motion OR touch-primary devices */
  const isTouch  = window.matchMedia('(hover: none)').matches;
  const noMotion = prefersReducedMotion();

  cards.forEach((card) => {
    /* ── Mouse Move Handler ── */
    card.addEventListener('mousemove', (e) => {
      if (noMotion || isTouch) return;

      const rect    = card.getBoundingClientRect();
      const localX  = e.clientX - rect.left;
      const localY  = e.clientY - rect.top;

      /* Normalize to -0.5 … 0.5 */
      const normX = localX / rect.width  - 0.5;
      const normY = localY / rect.height - 0.5;

      /* Apply 3D tilt transform */
      card.style.transform = [
        `rotateX(${-normY * 10}deg)`,
        `rotateY(${normX  * 10}deg)`,
        `translateY(-6px)`,
        `scale(1.01)`,
      ].join(' ');

      /* Update CSS vars for spotlight ::before pseudo-element */
      card.style.setProperty('--mouse-x', `${localX}px`);
      card.style.setProperty('--mouse-y', `${localY}px`);
    }, { passive: true });

    /* ── Mouse Leave Handler ── */
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });

    /* ── Keyboard / Focus: reset tilt ── */
    card.addEventListener('focusin', () => {
      card.style.transform = '';
    });
  });
})();

/* ============================================================
   4. SCROLL REVEAL WITH STAGGER
   ============================================================ */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  /* If reduced-motion, mark all visible immediately */
  if (prefersReducedMotion()) {
    elements.forEach((el) => el.classList.add('show'));
    return;
  }

  /* Apply stagger delays from data-stagger attribute */
  elements.forEach((el) => {
    const staggerIndex = parseInt(el.getAttribute('data-stagger') || '0', 10);
    const delay        = staggerIndex * 80;
    /* We set the delay directly so it overrides any CSS fallback */
    el.style.transitionDelay = `${delay}ms`;
  });

  /* IntersectionObserver — trigger reveal when element enters viewport */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          /* Unobserve after revealing (one-shot animation) */
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root:       null,
      rootMargin: '0px 0px -60px 0px', /* trigger slightly before bottom edge */
      threshold:  0.1,
    }
  );

  elements.forEach((el) => observer.observe(el));
})();

/* ============================================================
   5. MARQUEE PAUSE ON HOVER
   ============================================================ */
(function initMarquee() {
  const band  = document.querySelector('.marquee-band');
  const track = document.querySelector('.marquee-track');
  if (!band || !track) return;

  if (prefersReducedMotion()) {
    track.style.animation = 'none';
    return;
  }

  band.addEventListener('mouseenter', () => {
    track.style.animationPlayState = 'paused';
  }, { passive: true });

  band.addEventListener('mouseleave', () => {
    track.style.animationPlayState = 'running';
  }, { passive: true });
})();

/* ============================================================
   6. HEADER — Subtle background opacity on scroll
   ============================================================ */
(function initHeaderScroll() {
  const header = document.querySelector('.main-header');
  if (!header) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY > 20;
        header.style.borderBottomColor = scrolled
          ? 'rgba(30, 35, 45, 0.9)'
          : 'var(--color-border)';
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ============================================================
   7. SMOOTH DEMO LINK FEEDBACK
   ============================================================ */
(function initDemoLinks() {
  const links = document.querySelectorAll('.btn-showcase');
  links.forEach((link) => {
    link.addEventListener('click', function (e) {
      /* Add a brief ripple/scale feedback */
      if (!prefersReducedMotion()) {
        link.style.transform = 'scale(0.96)';
        setTimeout(() => {
          link.style.transform = '';
        }, 200);
      }
    });
  });
})();

/* ============================================================
   8. RESPONSIVE MOTION MEDIA QUERY LISTENER
   Dynamically respond if user toggles the OS preference
   ============================================================ */
(function initMotionMediaListener() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  mq.addEventListener('change', () => {
    /* Reload page so all animations re-initialize correctly */
    window.location.reload();
  });
})();
