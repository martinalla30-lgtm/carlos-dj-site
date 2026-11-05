// Scroll reveal with IntersectionObserver.
//   data-reveal           fades in and moves up when it reaches the viewport
//   data-reveal="fade"    fades in without moving
//   data-reveal-stagger   on a parent: its data-reveal children appear one after another
// Runs from <head>, so elements are hidden before anything is painted.
(() => {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const STAGGER_MS = 120;
  const root = document.documentElement;
  root.classList.add('reveal-on');
  let observers = [];

  function show(element, delay = 0) {
    if (element.classList.contains('is-revealed')) return;
    element.style.setProperty('--reveal-delay', `${delay}ms`);
    element.classList.add('is-revealed');
  }

  function showGroup(group) {
    [...group.children]
      .filter((child) => child.hasAttribute('data-reveal'))
      .forEach((child, position) => show(child, position * STAGGER_MS));
  }

  function watch() {
    observers.forEach((observer) => observer.disconnect());

    const single = new IntersectionObserver((entries, observer) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        observer.unobserve(entry.target);
        show(entry.target);
      });
    }, { rootMargin: '0px 0px -60px 0px' }); // keeps elements from starting behind the player bar

    // A whole group starts together, including cards still off-screen in a carousel,
    // so a quick swipe never lands on empty space.
    const groups = new IntersectionObserver((entries, observer) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        observer.unobserve(entry.target);
        showGroup(entry.target);
      });
    }, { threshold: 0.2 });

    observers = [single, groups];
    document.querySelectorAll('[data-reveal-stagger]').forEach((group) => groups.observe(group));
    document.querySelectorAll('[data-reveal]').forEach((element) => {
      if (!element.parentElement.hasAttribute('data-reveal-stagger')) single.observe(element);
    });
  }

  // Finished elements leave the system, so nothing can restart their animation
  document.addEventListener('animationend', (event) => {
    if (event.animationName === 'reveal-up' || event.animationName === 'reveal-fade') {
      event.target.removeAttribute('data-reveal');
    }
  });

  // Keyboard users must never land on something invisible
  document.addEventListener('focusin', (event) => {
    if (!(event.target instanceof Element)) return;
    const element = event.target.closest('[data-reveal]');
    if (!element) return;
    if (element.parentElement.hasAttribute('data-reveal-stagger')) showGroup(element.parentElement);
    else show(element);
  });

  // Sent by player.js after internal links swap the page content
  document.addEventListener('djcarlos:page-swapped', watch);

  function start() {
    // Under the first-load screen the animations would finish unseen, so they wait for its fade
    if (root.classList.contains('is-loading')) {
      document.addEventListener('djcarlos:loader-fade', watch, { once: true });
    } else {
      watch();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
