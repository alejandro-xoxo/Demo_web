/**
 * El Ilustre Barbershop — script.js
 * Handles: header glassmorphism, hero video portal, word-split animation,
 *          gallery mouse parallax, IntersectionObserver reveal, mobile nav,
 *          footer year, FAB visibility, and reduced-motion guard.
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   UTILITY — Reduced Motion Check
   ═══════════════════════════════════════════════════════════════ */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════════════════════════
   HEADER — Glassmorphism on Scroll
   ═══════════════════════════════════════════════════════════════ */
(function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const SCROLL_THRESHOLD = 40;

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  // Run once on load
  onScroll();

  // Throttle with requestAnimationFrame
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════════
   MOBILE NAV — Toggle
   ═══════════════════════════════════════════════════════════════ */
(function initMobileNav() {
  const toggle   = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!toggle || !mobileMenu) return;

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) { closeMenu(); } else { openMenu(); }
  });

  // Close when any mobile link is clicked
  mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });

  // Close if window resizes above mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════════
   HERO — Video Portal Clip-Path Reveal
   ═══════════════════════════════════════════════════════════════ */
(function initVideoPortal() {
  const portal = document.getElementById('video-portal');
  if (!portal) return;

  if (prefersReducedMotion()) {
    portal.classList.add('open');
    return;
  }

  // Trigger after a brief paint delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        portal.classList.add('open');
      }, 80);
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   HERO — Word-Split Title Animation
   ═══════════════════════════════════════════════════════════════ */
(function initWordSplit() {
  const title = document.querySelector('.hero-title');
  if (!title) return;

  if (prefersReducedMotion()) {
    title.classList.add('animated');
    return;
  }

  // Parse the HTML preserving <br> tags
  // We split text nodes into words, wrap each, keep <br> as-is
  function wrapWordsInNode(node, indexRef) {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach(part => {
        if (/^\s+$/.test(part) || part === '') {
          // whitespace / empty — keep as text
          frag.appendChild(document.createTextNode(part));
        } else {
          const wrapper = document.createElement('span');
          wrapper.className = 'word-wrapper';
          const inner = document.createElement('span');
          inner.className = 'word-item';
          inner.style.setProperty('--wi', String(indexRef.val));
          inner.textContent = part;
          indexRef.val++;
          wrapper.appendChild(inner);
          frag.appendChild(wrapper);
        }
      });
      return frag;
    }
    return null;
  }

  const indexRef = { val: 0 };
  const children = Array.from(title.childNodes);

  // Clear and rebuild
  title.innerHTML = '';
  children.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      const frag = wrapWordsInNode(child, indexRef);
      if (frag) title.appendChild(frag);
    } else if (child.nodeName === 'BR') {
      title.appendChild(document.createElement('br'));
    } else {
      title.appendChild(child.cloneNode(true));
    }
  });

  // Trigger animation after short delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        title.classList.add('animated');
      }, 100);
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   INTERSECTION OBSERVER — Reveal on Scroll
   ═══════════════════════════════════════════════════════════════ */
(function initRevealOnScroll() {
  const targets = document.querySelectorAll('.reveal-on-scroll');
  if (!targets.length) return;

  if (prefersReducedMotion()) {
    targets.forEach(el => el.classList.add('is-visible'));
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

  targets.forEach(el => observer.observe(el));
})();

/* ═══════════════════════════════════════════════════════════════
   GALLERY — Mouse Parallax
   ═══════════════════════════════════════════════════════════════ */
(function initGalleryParallax() {
  const gallerySection = document.querySelector('.gallery');
  if (!gallerySection || prefersReducedMotion()) return;

  const parallaxItems = gallerySection.querySelectorAll('[data-parallax]');
  if (!parallaxItems.length) return;

  const STRENGTH = 14; // px max translation

  let rafId = null;
  let mouseX = 0;
  let mouseY = 0;
  let sectionRect = null;

  function updateRect() {
    sectionRect = gallerySection.getBoundingClientRect();
  }

  // Debounce rect updates on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateRect, 200);
  }, { passive: true });

  gallerySection.addEventListener('mousemove', e => {
    if (!sectionRect) return;

    // Normalize cursor position relative to section center (-1 to 1)
    const relX = ((e.clientX - sectionRect.left) / sectionRect.width  - 0.5) * 2;
    const relY = ((e.clientY - sectionRect.top)  / sectionRect.height - 0.5) * 2;

    mouseX = relX * STRENGTH;
    mouseY = relY * STRENGTH;

    if (!rafId) {
      rafId = requestAnimationFrame(applyParallax);
    }
  }, { passive: true });

  gallerySection.addEventListener('mouseleave', () => {
    mouseX = 0;
    mouseY = 0;
    if (!rafId) {
      rafId = requestAnimationFrame(applyParallax);
    }
  }, { passive: true });

  function applyParallax() {
    rafId = null;
    parallaxItems.forEach((wrap, i) => {
      // Alternate direction per image for depth effect
      const dir = i % 2 === 0 ? 1 : -1;
      const tx = -mouseX * dir;
      const ty = -mouseY * dir;
      wrap.style.transform = `translate(${tx * 0.6}px, ${ty * 0.6}px)`;
      const img = wrap.querySelector('.gallery-img');
      if (img) {
        img.style.transform = `scale(1.04) translate(${tx * 0.3}px, ${ty * 0.3}px)`;
      }
    });
  }

  // Set initial rect
  updateRect();
  // Update rect on scroll too (section moves)
  window.addEventListener('scroll', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateRect, 100);
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════════
   SMOOTH SCROLL — Nav Links
   (browsers without CSS scroll-behavior support)
   ═══════════════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

      // Update URL without jump
      if (history.pushState) {
        history.pushState(null, '', href);
      }

      // Restore focus to target for accessibility
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   FOOTER YEAR
   ═══════════════════════════════════════════════════════════════ */
(function initFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();

/* ═══════════════════════════════════════════════════════════════
   FAB — Entrance Animation & Scroll Reveal
   ═══════════════════════════════════════════════════════════════ */
(function initFab() {
  const fab = document.getElementById('fab-whatsapp');
  if (!fab) return;

  // Start hidden, reveal after 2s
  fab.style.opacity = '0';
  fab.style.transform = 'scale(0.7) translateY(10px)';
  fab.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';

  setTimeout(() => {
    fab.style.opacity = '1';
    fab.style.transform = '';
  }, 2000);
})();

/* ═══════════════════════════════════════════════════════════════
   HEADER ACTIVE NAV — Highlight current section
   ═══════════════════════════════════════════════════════════════ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.style.color = 'var(--color-cream)';
            } else {
              link.style.color = '';
            }
          });
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: '-80px 0px -30% 0px',
    }
  );

  sections.forEach(s => observer.observe(s));
})();

/* ═══════════════════════════════════════════════════════════════
   VIDEO — Autoplay Fallback (in case autoplay is blocked)
   ═══════════════════════════════════════════════════════════════ */
(function initVideoFallback() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  const promise = video.play();
  if (promise !== undefined) {
    promise.catch(() => {
      // Autoplay blocked — show poster or static overlay
      const portal = document.getElementById('video-portal');
      if (portal) {
        portal.style.background = 'var(--color-surface)';
      }
    });
  }
})();

/* ═══════════════════════════════════════════════════════════════
   LEDGER ITEMS — Keyboard-Accessible Focus Effect
   ═══════════════════════════════════════════════════════════════ */
(function initLedgerA11y() {
  const ledgerItems = document.querySelectorAll('.ledger-item');
  ledgerItems.forEach(item => {
    // Make items focusable for keyboard users
    item.setAttribute('tabindex', '0');

    item.addEventListener('focus', () => {
      // Dim siblings
      const siblings = item.parentElement.querySelectorAll('.ledger-item');
      siblings.forEach(sib => {
        if (sib !== item) sib.style.opacity = '0.4';
      });
    });

    item.addEventListener('blur', () => {
      const siblings = item.parentElement.querySelectorAll('.ledger-item');
      siblings.forEach(sib => {
        sib.style.opacity = '';
      });
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   SCROLL PROGRESS — Subtle page progress indicator
   ═══════════════════════════════════════════════════════════════ */
(function initScrollProgress() {
  if (prefersReducedMotion()) return;

  // Create a thin gold progress bar at top of header
  const bar = document.createElement('div');
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'height:2px',
    'width:0%',
    'background:linear-gradient(to right,var(--color-gold),var(--color-cream))',
    'z-index:1001',
    'transition:width 0.1s linear',
    'pointer-events:none',
  ].join(';');

  document.body.appendChild(bar);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollTop  = window.scrollY;
        const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
        const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width  = pct.toFixed(2) + '%';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
