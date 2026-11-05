// First-load screen: shown once per page in a browser tab session, on full page loads only.
// Runs from <head> so the page is covered before anything is painted.
(() => {
  const MIN_MS = 900; // long enough to read the logo instead of flashing past
  const MAX_MS = 5000; // a stalled file must never keep the page covered
  const BAR_FINISH_MS = 250;
  const FADE_MS = 500;
  const KEY = `djcarlos-loaded:${location.pathname}`;

  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch {}
  if (seen) return;

  const root = document.documentElement;
  const startedAt = performance.now();
  let finished = false;
  root.classList.add('is-loading');

  function finish() {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem(KEY, '1'); } catch {}

    const loader = document.getElementById('page-loader');
    if (!loader) {
      root.classList.remove('is-loading');
      document.dispatchEvent(new Event('djcarlos:loader-fade'));
      return;
    }
    // Takes over from the CSS animation at its current position and completes the bar
    const bar = loader.querySelector('.page-loader-bar i');
    bar.style.transform = getComputedStyle(bar).transform;
    bar.style.animation = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transform = 'scaleX(1)'; }));

    setTimeout(() => {
      loader.classList.add('is-done');
      document.dispatchEvent(new Event('djcarlos:loader-fade')); // reveal.js starts as the cover lifts
      setTimeout(() => {
        root.classList.remove('is-loading');
        loader.remove();
      }, FADE_MS);
    }, BAR_FINISH_MS);
  }

  const pageLoaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  const fontsLoaded = document.fonts ? document.fonts.ready : Promise.resolve();

  Promise.all([pageLoaded, fontsLoaded]).then(() => {
    setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - startedAt)));
  });
  setTimeout(finish, MAX_MS);
})();
