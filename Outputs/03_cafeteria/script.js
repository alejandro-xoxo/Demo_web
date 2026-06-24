/**
 * Origen Café — script.js
 * ============================================================
 * 1. Header scroll → blur/shadow
 * 2. Mobile nav toggle
 * 3. Hero word-split animation
 * 4. IntersectionObserver for .reveal-on-scroll
 * 5. SVG Radar Chart (animated, IntersectionObserver triggered)
 * 6. Current year in footer
 * 7. Smooth anchor scroll
 * ============================================================
 */

'use strict';

/* ============================================================
   UTILITIES
   ============================================================ */

/**
 * Easing function — easeOutCubic
 * @param {number} t  Progress [0..1]
 * @returns {number}  Eased progress [0..1]
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Linearly interpolate between a and b by factor t
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Convert polar coordinates (angle in radians, radius) to Cartesian
 * relative to a center point (cx, cy).
 */
function polarToCartesian(cx, cy, radius, angleRad) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

/**
 * Build an SVG path string (polygon) for a set of axis values.
 * @param {number} cx
 * @param {number} cy
 * @param {number} maxRadius
 * @param {number[]} values  Array of values [0..1] for each axis
 * @param {number[]} angles  Array of angles (radians) for each axis
 * @returns {string}  SVG 'd' attribute value
 */
function buildPolygonPath(cx, cy, maxRadius, values, angles) {
  const points = values.map((v, i) => {
    const r = v * maxRadius;
    return polarToCartesian(cx, cy, r, angles[i]);
  });
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
  return d + ' Z';
}

/**
 * Create SVG element with namespace
 */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

/* ============================================================
   1. RADAR CHART
   ============================================================ */

/**
 * Build and animate the SVG radar chart inside `container`.
 *
 * @param {HTMLElement} container  The .radar-chart-container div
 */
function buildRadarChart(container) {
  /* — Constants — */
  const VIEWBOX_SIZE  = 280;
  const CX            = 140;
  const CY            = 140;
  const RADIUS        = 100;
  const RING_COUNT    = 5;
  const ANIM_DURATION = 1200; /* ms */

  const FOREST_GREEN  = '#1f2d24';
  const ACCENT_COLOR  = '#c29a83';
  const DATA_FILL     = 'rgba(31,45,36,0.18)';
  const DATA_STROKE   = '#1f2d24';
  const DOT_COLOR     = '#c29a83';
  const RING_STROKE   = 'rgba(31,45,36,0.12)';
  const AXIS_STROKE   = 'rgba(31,45,36,0.10)';
  const LABEL_COLOR   = FOREST_GREEN;
  const LABEL_FONT    = "'Amatic SC', cursive";

  /* — Axes data — */
  const AXES = [
    { label: 'Acidez',   value: 0.72 },
    { label: 'Dulzor',   value: 0.85 },
    { label: 'Cuerpo',   value: 0.60 },
    { label: 'Aroma',    value: 0.90 },
    { label: 'Amargor',  value: 0.45 },
  ];

  const N = AXES.length;

  /**
   * Compute axis angles. We start from the top (-90°) and go clockwise.
   */
  const angles = AXES.map((_, i) => {
    return (Math.PI * 2 * i) / N - Math.PI / 2;
  });

  /* — Build SVG — */
  const svg = svgEl('svg', {
    viewBox: `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`,
    'aria-hidden': 'true',
    role: 'presentation',
    style: 'width:100%; height:auto; display:block;',
  });

  /* --- Group: rings --- */
  const ringGroup = svgEl('g', { class: 'radar-rings' });

  for (let r = 1; r <= RING_COUNT; r++) {
    const fraction = r / RING_COUNT;
    const ringValues = AXES.map(() => fraction);
    const d = buildPolygonPath(CX, CY, RADIUS, ringValues, angles);
    const poly = svgEl('path', {
      d,
      fill: 'none',
      stroke: RING_STROKE,
      'stroke-width': '1',
    });
    ringGroup.appendChild(poly);
  }

  svg.appendChild(ringGroup);

  /* --- Group: axis lines --- */
  const axisGroup = svgEl('g', { class: 'radar-axes' });

  for (let i = 0; i < N; i++) {
    const outer = polarToCartesian(CX, CY, RADIUS, angles[i]);
    const line = svgEl('line', {
      x1: CX,
      y1: CY,
      x2: outer.x.toFixed(3),
      y2: outer.y.toFixed(3),
      stroke: AXIS_STROKE,
      'stroke-width': '1',
      'stroke-dasharray': '3 3',
    });
    axisGroup.appendChild(line);
  }

  svg.appendChild(axisGroup);

  /* --- Data polygon path (animated) --- */
  const finalValues = AXES.map(a => a.value);

  const dataPath = svgEl('path', {
    d: buildPolygonPath(CX, CY, RADIUS, AXES.map(() => 0), angles),
    fill: DATA_FILL,
    stroke: DATA_STROKE,
    'stroke-width': '1.75',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
    style: 'transition: none;',
  });

  svg.appendChild(dataPath);

  /* --- Dots at each axis endpoint (animated) --- */
  const dotEls = AXES.map((axis, i) => {
    const dot = svgEl('circle', {
      cx: CX,
      cy: CY,
      r: '4',
      fill: DOT_COLOR,
      stroke: FOREST_GREEN,
      'stroke-width': '1.5',
    });
    svg.appendChild(dot);
    return dot;
  });

  /* --- Labels --- */
  const LABEL_OFFSET = 18; /* extra px beyond RADIUS */

  AXES.forEach((axis, i) => {
    const pos = polarToCartesian(CX, CY, RADIUS + LABEL_OFFSET, angles[i]);

    const text = svgEl('text', {
      x: pos.x.toFixed(3),
      y: pos.y.toFixed(3),
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      'font-family': LABEL_FONT,
      'font-weight': '700',
      'font-size': '13',
      fill: LABEL_COLOR,
      'letter-spacing': '0.04em',
    });

    text.textContent = axis.label;
    svg.appendChild(text);
  });

  /* --- Append SVG to container --- */
  container.appendChild(svg);

  /* --- Check reduced motion preference --- */
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Draw final state immediately if reduced motion ---- */
  if (prefersReducedMotion) {
    /* Set data polygon to final state */
    dataPath.setAttribute('d', buildPolygonPath(CX, CY, RADIUS, finalValues, angles));

    /* Position dots at final positions */
    AXES.forEach((axis, i) => {
      const pos = polarToCartesian(CX, CY, axis.value * RADIUS, angles[i]);
      dotEls[i].setAttribute('cx', pos.x.toFixed(3));
      dotEls[i].setAttribute('cy', pos.y.toFixed(3));
    });

    return; /* Skip animation */
  }

  /* ---- Animation ---- */
  let startTime = null;
  let animationFrame = null;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;

    const elapsed  = timestamp - startTime;
    const rawProgress = Math.min(elapsed / ANIM_DURATION, 1);
    const progress = easeOutCubic(rawProgress);

    /* Interpolate axis values from 0 → final */
    const currentValues = finalValues.map(v => lerp(0, v, progress));

    /* Update data polygon */
    dataPath.setAttribute(
      'd',
      buildPolygonPath(CX, CY, RADIUS, currentValues, angles)
    );

    /* Update dot positions */
    AXES.forEach((axis, i) => {
      const r = currentValues[i] * RADIUS;
      const pos = polarToCartesian(CX, CY, r, angles[i]);
      dotEls[i].setAttribute('cx', pos.x.toFixed(3));
      dotEls[i].setAttribute('cy', pos.y.toFixed(3));
    });

    if (rawProgress < 1) {
      animationFrame = requestAnimationFrame(animate);
    }
  }

  /* Start animation */
  animationFrame = requestAnimationFrame(animate);

  /* Store cancel ref on container in case of cleanup */
  container._cancelRadarAnim = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  };
}

/* ============================================================
   2. RADAR CHART — IntersectionObserver trigger
   ============================================================ */

function initRadarChart() {
  const container = document.getElementById('radar-chart');
  if (!container) return;

  let triggered = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !triggered) {
          triggered = true;
          buildRadarChart(container);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(container);
}

/* ============================================================
   3. HEADER — Scroll behavior
   ============================================================ */

function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const SCROLL_THRESHOLD = 40;

  function onScroll() {
    const scrolled = window.scrollY > SCROLL_THRESHOLD;
    header.classList.toggle('is-scrolled', scrolled);
  }

  /* Use passive listener for performance */
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Run once on init */
  onScroll();
}

/* ============================================================
   4. MOBILE NAV TOGGLE
   ============================================================ */

function initMobileNav() {
  const toggle  = document.getElementById('nav-toggle');
  const nav     = document.getElementById('primary-nav');
  if (!toggle || !nav) return;

  /* Create overlay */
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);

  let isOpen = false;

  function openNav() {
    isOpen = true;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    nav.classList.add('is-open');
    overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';

    /* Trap focus — focus first link */
    const firstLink = nav.querySelector('.nav-link');
    if (firstLink) firstLink.focus();
  }

  function closeNav() {
    isOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    nav.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.style.overflow = '';
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    isOpen ? closeNav() : openNav();
  });

  overlay.addEventListener('click', closeNav);

  /* Close on nav link click */
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen) closeNav();
    });
  });

  /* Close on Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeNav();
  });
}

/* ============================================================
   5. HERO WORD-SPLIT ANIMATION
   ============================================================ */

function initWordSplit() {
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const titleEl = document.querySelector('.js-split-words');
  if (!titleEl) return;

  if (prefersReducedMotion) {
    /* Skip animation — just show text normally */
    return;
  }

  /* Grab the full text */
  const rawText = titleEl.textContent.trim();
  const words   = rawText.split(/\s+/);

  /* Clear & re-build with word wrappers */
  titleEl.textContent = '';

  words.forEach((word, i) => {
    const wrapper = document.createElement('span');
    wrapper.className = 'word-wrapper';

    const inner = document.createElement('span');
    inner.className = 'word-item';
    inner.textContent = word;
    inner.style.setProperty('--wi', i);

    wrapper.appendChild(inner);
    titleEl.appendChild(wrapper);

    /* Add space after each word (except last) */
    if (i < words.length - 1) {
      titleEl.appendChild(document.createTextNode(' '));
    }
  });

  /* Trigger CSS transitions on next frame */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      titleEl.classList.add('words-revealed');
    });
  });
}

/* ============================================================
   6. HERO ENTRANCE — trigger reveal-word & reveal-fade
   ============================================================ */

function initHeroEntrance() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  /* Short delay to ensure fonts are loaded and layout is stable */
  setTimeout(() => {
    hero.classList.add('hero-loaded');
  }, 80);
}

/* ============================================================
   7. INTERSECTION OBSERVER — .reveal-on-scroll
   ============================================================ */

function initRevealOnScroll() {
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  if (prefersReducedMotion) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
   8. SMOOTH ANCHOR SCROLL
   ============================================================ */

function initSmoothScroll() {
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) return;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '72',
        10
      );

      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    });
  });
}

/* ============================================================
   9. FOOTER — Current year
   ============================================================ */

function initCurrentYear() {
  const el = document.getElementById('current-year');
  if (el) {
    el.textContent = new Date().getFullYear();
  }
}

/* ============================================================
   10. HERO PARALLAX — subtle on scroll
   ============================================================ */

function initHeroParallax() {
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) return;

  const heroImg = document.querySelector('.hero-image');
  if (!heroImg) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const viewportH = window.innerHeight;

        /* Only apply within hero viewport */
        if (scrollY < viewportH * 1.2) {
          const offset = scrollY * 0.12;
          heroImg.style.transform = `scale(1.04) translateY(${offset}px)`;
        }

        ticking = false;
      });

      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ============================================================
   11. WHATSAPP FAB — entrance animation
   ============================================================ */

function initWhatsAppFab() {
  const fab = document.getElementById('whatsapp-fab');
  if (!fab) return;

  /* Delay entrance slightly so it doesn't compete with hero */
  fab.style.opacity = '0';
  fab.style.transform = 'scale(0.7) translateY(20px)';
  fab.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';

  setTimeout(() => {
    fab.style.opacity = '1';
    fab.style.transform = '';
  }, 1400);
}

/* ============================================================
   12. MENU ITEM HOVER — subtle price highlight
   ============================================================ */

function initMenuItemInteraction() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      const price = item.querySelector('.menu-item-price');
      if (price) {
        price.style.transition = 'transform 0.2s ease';
        price.style.transform = 'scale(1.08)';
      }
    });

    item.addEventListener('mouseleave', () => {
      const price = item.querySelector('.menu-item-price');
      if (price) {
        price.style.transform = '';
      }
    });
  });
}

/* ============================================================
   13. ACTIVE NAV LINK — highlight based on scroll position
   ============================================================ */

function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const headerHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '72',
    10
  );

  function updateActiveLink() {
    const scrollY = window.scrollY + headerHeight + 80;

    let activeSectionId = null;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollY >= sectionTop && scrollY < sectionBottom) {
        activeSectionId = section.id;
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href === `#${activeSectionId}`;
      link.classList.toggle('nav-link--active', isActive);
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
}

/* ============================================================
   14. KEYBOARD NAVIGATION — skip to main content
   ============================================================ */

function initSkipLink() {
  /* Add skip-to-main link dynamically */
  const skip = document.createElement('a');
  skip.href = '#main-content';
  skip.className = 'skip-link';
  skip.textContent = 'Ir al contenido principal';

  const skipStyle = document.createElement('style');
  skipStyle.textContent = `
    .skip-link {
      position: fixed;
      top: -100%;
      left: 1rem;
      z-index: 9999;
      background: var(--color-primary);
      color: var(--color-bg);
      padding: 0.5rem 1rem;
      border-radius: 0 0 8px 8px;
      font-family: var(--font-body);
      font-size: 0.875rem;
      font-weight: 600;
      transition: top 0.2s;
      text-decoration: none;
    }
    .skip-link:focus {
      top: 0;
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(skipStyle);
  document.body.insertBefore(skip, document.body.firstChild);
}

/* ============================================================
   15. STAT CHIP — count-up animation
   ============================================================ */

function initStatChipAnimation() {
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) return;

  const chips = document.querySelectorAll('.stat-chip');
  if (!chips.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  chips.forEach((chip, i) => {
    chip.style.opacity = '0';
    chip.style.transform = 'translateY(20px)';
    chip.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;

    /* Use a small observer to trigger entrance */
    const chipObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            chip.style.opacity = '1';
            chip.style.transform = 'translateY(0)';
            chipObserver.unobserve(chip);
          }
        });
      },
      { threshold: 0.3 }
    );

    chipObserver.observe(chip);
  });
}

/* ============================================================
   16. PROMO CARD — tilt effect on mouse move
   ============================================================ */

function initPromoCardTilt() {
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) return;

  const card = document.querySelector('.promo-card');
  if (!card) return;

  const MAX_TILT = 4; /* degrees */

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateY = (mouseX / (rect.width / 2)) * MAX_TILT;
    const rotateX = -(mouseY / (rect.height / 2)) * MAX_TILT;

    card.style.transition = 'transform 0.1s ease';
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  });
}

/* ============================================================
   INIT — DOM Content Loaded
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initSkipLink();
  initCurrentYear();
  initHeader();
  initMobileNav();
  initHeroEntrance();
  initWordSplit();
  initRevealOnScroll();
  initSmoothScroll();
  initRadarChart();
  initHeroParallax();
  initWhatsAppFab();
  initMenuItemInteraction();
  initActiveNavLinks();
  initStatChipAnimation();
  initPromoCardTilt();
});

/* ============================================================
   PERFORMANCE: Log readiness (dev only)
   ============================================================ */
if (typeof window !== 'undefined' && window.performance) {
  window.addEventListener('load', () => {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;

    /* Only in development environments */
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.protocol === 'file:'
    ) {
      console.info(
        `%cOrigen Café ☕ %cPage loaded in ${loadTime}ms`,
        'color:#1f2d24;font-weight:700;font-size:14px;',
        'color:#5c5650;font-size:12px;'
      );
    }
  });
}
