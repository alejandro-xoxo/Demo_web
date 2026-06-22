// (C)
// JavaScript para el Showcase de la Fase 1 - Comportamiento de Alta Fidelidad

document.addEventListener('DOMContentLoaded', () => {
    // 1. Efecto Scroll en Header
    const header = document.querySelector('.main-header');
    
    const handleScroll = () => {
        if (window.scrollY > 30) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 2. Animaciones al hacer scroll (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target); // Dejar de observar una vez visible
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach(el => {
        observer.observe(el);
    });
});
