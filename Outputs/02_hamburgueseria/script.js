/**
 * La Parrilla Urbana — script.js
 * ─────────────────────────────────────────────────────────────
 * Modules:
 *  1. Reduced-Motion detection
 *  2. Header scroll glassmorphism
 *  3. Mobile nav toggle
 *  4. Hero title word-split animation
 *  5. Hero image mouse parallax
 *  6. IntersectionObserver: reveal-on-scroll
 *  7. IntersectionObserver: bento cells stagger
 *  8. Ember Fire Glow (bento cell mousemove)
 *  9. Smooth scroll for anchor links
 * 10. Footer year
 * 11. WhatsApp float entrance animation
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ══════════════════════════════════════════
   1. REDUCED-MOTION DETECTION
══════════════════════════════════════════ */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ══════════════════════════════════════════
   2. HEADER SCROLL GLASSMORPHISM
══════════════════════════════════════════ */
(function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const SCROLL_THRESHOLD = 40;
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > SCROLL_THRESHOLD) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load in case page is pre-scrolled
})();

/* ══════════════════════════════════════════
   3. MOBILE NAV TOGGLE
══════════════════════════════════════════ */
(function initMobileNav() {
  const toggle  = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (!toggle || !mobileNav) return;

  // Close nav on mobile link click
  const mobileLinks = mobileNav.querySelectorAll('.mobile-nav-link, .mobile-nav-cta');

  function openNav() {
    mobileNav.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    mobileNav.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeNav();
      toggle.focus();
    }
  });

  // Close if viewport becomes wide
  const mq = window.matchMedia('(min-width: 901px)');
  mq.addEventListener('change', (e) => {
    if (e.matches) closeNav();
  });
})();

/* ══════════════════════════════════════════
   4. HERO TITLE WORD-SPLIT ANIMATION
══════════════════════════════════════════ */
(function initHeroTitle() {
  const titleEl = document.getElementById('hero-heading');
  if (!titleEl) return;

  const RAW_TEXT = 'Materia prima y fuego real.';
  const words    = RAW_TEXT.split(' ');

  // Build DOM
  words.forEach((word, i) => {
    const wrapper  = document.createElement('span');
    wrapper.className = 'word-wrapper';

    const inner    = document.createElement('span');
    inner.className  = 'word-item';
    inner.textContent = word;
    inner.style.setProperty('--wi', i);

    wrapper.appendChild(inner);
    titleEl.appendChild(wrapper);

    // Add space after each word except last
    if (i < words.length - 1) {
      titleEl.appendChild(document.createTextNode(' '));
    }
  });

  if (prefersReducedMotion) {
    // Skip animation — show immediately
    titleEl.classList.add('animated');
    return;
  }

  // Trigger after short delay to ensure paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      titleEl.classList.add('animated');
    }, 100);
  });
})();

/* ══════════════════════════════════════════
   5. HERO IMAGE MOUSE PARALLAX
══════════════════════════════════════════ */
(function initHeroParallax() {
  if (prefersReducedMotion) return;

  const wrap = document.getElementById('hero-image-wrap');
  const img  = document.getElementById('hero-img');
  if (!wrap || !img) return;

  const MAX_SHIFT = 6; // px
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let animFrameId = null;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animate() {
    currentX = lerp(currentX, targetX, 0.08);
    currentY = lerp(currentY, targetY, 0.08);
    img.style.transform = `translate(${currentX}px, ${currentY}px)`;
    animFrameId = requestAnimationFrame(animate);
  }

  function onMouseMove(e) {
    const rect   = wrap.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = (e.clientX - cx) / (rect.width  / 2);
    const dy     = (e.clientY - cy) / (rect.height / 2);
    targetX = dx * MAX_SHIFT;
    targetY = dy * MAX_SHIFT;
  }

  function onMouseLeave() {
    targetX = 0;
    targetY = 0;
  }

  // Only active on desktop
  const mq = window.matchMedia('(min-width: 901px)');
  if (mq.matches) {
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    animFrameId = requestAnimationFrame(animate);
  }

  mq.addEventListener('change', (e) => {
    if (e.matches) {
      document.addEventListener('mousemove', onMouseMove, { passive: true });
      document.addEventListener('mouseleave', onMouseLeave);
      animFrameId = requestAnimationFrame(animate);
    } else {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      img.style.transform = '';
    }
  });
})();

/* ══════════════════════════════════════════
   6. INTERSECTION OBSERVER: reveal-on-scroll
══════════════════════════════════════════ */
(function initRevealOnScroll() {
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
      threshold:  0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach(el => observer.observe(el));
})();

/* ══════════════════════════════════════════
   7. INTERSECTION OBSERVER: BENTO STAGGER
══════════════════════════════════════════ */
(function initBentoReveal() {
  const cells = document.querySelectorAll('.bento-cell');
  if (!cells.length) return;

  if (prefersReducedMotion) {
    cells.forEach(cell => {
      cell.style.opacity = '1';
      cell.style.transform = 'none';
    });
    return;
  }

  // Set initial hidden state
  cells.forEach((cell, i) => {
    cell.style.opacity = '0';
    cell.style.transform = 'translateY(32px)';
    cell.style.transition = `
      opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s,
      transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s,
      border-color 0.4s ease,
      box-shadow 0.4s ease
    `;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cell = entry.target;
          cell.style.opacity = '1';
          cell.style.transform = 'translateY(0)';
          observer.unobserve(cell);
        }
      });
    },
    {
      threshold:  0.1,
      rootMargin: '0px 0px -30px 0px',
    }
  );

  cells.forEach(cell => observer.observe(cell));
})();

/* ══════════════════════════════════════════
   8. EMBER FIRE GLOW (bento mousemove)
══════════════════════════════════════════ */
(function initEmberGlow() {
  const cells = document.querySelectorAll('.bento-cell');
  if (!cells.length) return;

  cells.forEach(cell => {
    cell.addEventListener('mousemove', (e) => {
      const r = cell.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      cell.style.setProperty('--ember-x', x + 'px');
      cell.style.setProperty('--ember-y', y + 'px');
    }, { passive: true });

    // Reset to center bottom on mouse leave
    cell.addEventListener('mouseleave', () => {
      cell.style.setProperty('--ember-x', '50%');
      cell.style.setProperty('--ember-y', '80%');
    });
  });
})();

/* ══════════════════════════════════════════
   9. SMOOTH SCROLL FOR ANCHOR LINKS
══════════════════════════════════════════ */
(function initSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerH  = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '72',
        10
      );
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerH;

      if (prefersReducedMotion) {
        window.scrollTo(0, targetTop);
      } else {
        window.scrollTo({
          top:      targetTop,
          behavior: 'smooth',
        });
      }
    });
  });
})();

/* ══════════════════════════════════════════
   10. FOOTER YEAR
══════════════════════════════════════════ */
(function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) {
    el.textContent = new Date().getFullYear();
  }
})();

/* ══════════════════════════════════════════
   11. WHATSAPP FLOAT ENTRANCE
══════════════════════════════════════════ */
(function initWaFloat() {
  const wa = document.getElementById('whatsapp-float');
  if (!wa || prefersReducedMotion) return;

  // Start hidden, slide in after delay
  wa.style.opacity  = '0';
  wa.style.transform = 'scale(0.6) translateY(20px)';
  wa.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)';

  setTimeout(() => {
    wa.style.opacity  = '1';
    wa.style.transform = 'scale(1) translateY(0)';
  }, 1200);
})();

/* ══════════════════════════════════════════
   12. ACTIVE NAV LINK HIGHLIGHT ON SCROLL
══════════════════════════════════════════ */
(function initActiveNavLink() {
  const sections  = document.querySelectorAll('section[id], footer[id]');
  const navLinks  = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.style.color = isActive
            ? 'var(--color-text-main)'
            : '';
          link.style.backgroundColor = isActive
            ? 'rgba(255,255,255,0.05)'
            : '';
        });
      });
    },
    {
      threshold:  0.3,
      rootMargin: '-70px 0px -50% 0px',
    }
  );

  sections.forEach(section => observer.observe(section));
})();
