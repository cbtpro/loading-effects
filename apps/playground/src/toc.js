import './toc.css';

let nextPanelId = 0;

/**
 * @typedef {{ id: string, title: string, heading?: Element, children?: TocItem[] }} TocItem
 * @typedef {{
 *   items?: TocItem[],
 *   label?: string,
 *   compactLabel?: string,
 *   accentColor?: string,
 *   trackColor?: string,
 *   duration?: number,
 *   rootMargin?: string,
 * }} TocProps
 */

const template = `
<nav class="toc">
  <p class="toc-heading" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      stroke-width="1.25" stroke-linecap="round" focusable="false">
      <path d="M2.5 4.5h10m-10 3.5h7m-7 3.5h9"/>
    </svg>
    <span class="toc-label"></span>
  </p>
  <button class="toc-toggle" type="button" aria-expanded="false">
    <span class="toc-toggle-label"></span>
    <svg class="toc-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="m6 4 4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
    <span class="toc-current"></span>
  </button>
  <div class="toc-panel">
    <div class="toc-track">
      <svg class="toc-rail" width="0" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor"/>
      </svg>
      <div class="toc-highlight" aria-hidden="true"><div class="toc-indicator"></div></div>
      <ol class="toc-list"></ol>
    </div>
  </div>
</nav>
`;

const defaults = {
  items: [],
  label: '目录',
  compactLabel: '本页目录',
  accentColor: '#2359be',
  trackColor: '#ccd7e7',
  duration: 150,
  rootMargin: '-20px 0px -40% 0px',
};

function buildEntries(list, items, depth = 0) {
  const document = list.ownerDocument;
  return items.flatMap(({ id, title, heading, children }) => {
    const target = document.getElementById(id);
    if (!target) return [];
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${encodeURIComponent(id)}`;
    link.textContent = title;
    link.style.setProperty('--toc-depth', depth);
    item.append(link);
    list.append(item);
    const entry = { target, link, heading: heading ?? target, depth };
    if (!children?.length) return [entry];

    const nested = document.createElement('ol');
    nested.className = 'toc-effects';
    nested.setAttribute('aria-label', title);
    item.append(nested);
    return [entry, ...buildEntries(nested, children, depth + 1)];
  });
}

/** @param {HTMLElement} host @param {TocProps} [props] */
export function mountToc(host, props) {
  const document = host.ownerDocument;
  const window = document.defaultView;
  const fragment = document.createElement('template');
  fragment.innerHTML = template;
  const nav = fragment.content.firstElementChild;
  host.append(nav);
  const list = nav.querySelector('.toc-list');
  const panel = nav.querySelector('.toc-panel');
  const track = nav.querySelector('.toc-track');
  const rail = nav.querySelector('.toc-rail');
  const path = rail.querySelector('path');
  const highlight = nav.querySelector('.toc-highlight');
  const toggle = nav.querySelector('.toc-toggle');
  const summary = nav.querySelector('.toc-current');
  const label = nav.querySelector('.toc-label');
  const toggleLabel = nav.querySelector('.toc-toggle-label');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  panel.id = `toc-panel-${++nextPanelId}`;
  toggle.setAttribute('aria-controls', panel.id);

  let options = defaults;
  let entries = [];
  let entriesByHash = new Map();
  let observer;
  const visible = new Set();
  let active = [];
  let current;
  let frame;
  let needsMeasure = true;
  let destroyed = false;

  // Measure the complete rail once per layout change. Both the muted rail
  // and its animated highlight render the same path.
  function measureRail() {
    const railHeight = track.clientHeight;
    if (!railHeight) return;
    let railWidth = 2;
    const commands = entries.map((entry, index) => {
      const x = 1 + 10 * entry.depth;
      railWidth = Math.max(railWidth, x + 1);
      const top = entry.link.offsetTop;
      const bottom = top + entry.link.offsetHeight;
      const style = window.getComputedStyle(entry.link);
      entry.railTop = top + parseFloat(style.paddingTop);
      entry.railBottom = bottom - parseFloat(style.paddingBottom);
      return `${index ? 'L' : 'M'}${x} ${entry.railTop}L${x} ${entry.railBottom}`;
    });
    rail.setAttribute('height', railHeight);
    rail.setAttribute('width', railWidth);
    highlight.style.width = `${railWidth}px`;
    const geometry = commands.join(' ');
    path.setAttribute('d', geometry);
    const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${railWidth} ${railHeight}"><path d="${geometry}" fill="none" stroke="black"/></svg>`;
    highlight.style.height = `${railHeight}px`;
    highlight.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(mask)}")`;
  }

  function alignedAnchor() {
    const anchor = entriesByHash.get(window.location.hash);
    if (anchor) {
      const top = anchor.target.getBoundingClientRect().top;
      const margin = parseFloat(window.getComputedStyle(anchor.target).scrollMarginTop);
      if (Math.abs(top - margin) <= 2) return anchor;
    }
  }

  function readActive(anchor, atBottom) {
    if (atBottom) {
      const first = entries.findIndex(entry => visible.has(entry.heading));
      return entries.slice(first < 0 ? entries.indexOf(active[0] ?? entries.at(-1)) : first);
    }
    const observed = entries.filter(entry => visible.has(entry.heading));
    return observed.length ? observed : anchor ? [anchor] : active;
  }

  function update() {
    frame = undefined;
    if (!entries.length) return;
    const measured = needsMeasure;
    if (measured) {
      needsMeasure = false;
      measureRail();
    }
    const viewport = document.scrollingElement;
    const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 6;
    const anchor = atBottom ? undefined : alignedAnchor();
    const next = readActive(anchor, atBottom);
    for (const entry of active) {
      if (!next.includes(entry)) entry.link.removeAttribute('data-active');
    }
    const entering = next.filter(entry => !active.includes(entry));
    for (const entry of entering) entry.link.setAttribute('data-active', '');
    active = next;
    const last = active.at(-1);
    const primary = anchor ?? last;
    const changed = current !== primary;
    if (changed) {
      current?.link.removeAttribute('aria-current');
      primary?.link.setAttribute('aria-current', 'location');
      summary.textContent = primary?.link.textContent ?? '';
      current = primary;
    }
    const reveal = entering.at(-1) ?? ((changed || measured) ? primary : undefined);
    if (reveal && panel.clientHeight) {
      const panelBounds = panel.getBoundingClientRect();
      const link = reveal.link.getBoundingClientRect();
      panel.scrollTo({
        top: panel.scrollTop + (link.top + link.bottom - panelBounds.top - panelBounds.bottom) / 2,
        behavior: measured || reducedMotion.matches ? 'instant' : 'smooth',
      });
    }
    if (last?.railBottom !== undefined) {
      const top = active[0].railTop;
      highlight.style.setProperty('--thumb-top', `${top}px`);
      highlight.style.setProperty('--thumb-height', `${last.railBottom - top}px`);
    }
  }

  function schedule() {
    if (!destroyed) frame ??= window.requestAnimationFrame(update);
  }

  function requestMeasure() {
    needsMeasure = true;
    schedule();
  }

  function setOpen(open) {
    nav.toggleAttribute('data-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) requestMeasure();
  }

  function onToggle() {
    setOpen(!nav.hasAttribute('data-open'));
  }

  function onClick(event) {
    if (!nav.contains(event.target) || event.target.closest?.('.toc-list a')) setOpen(false);
  }

  function onKeydown(event) {
    if (event.key !== 'Escape' || !nav.hasAttribute('data-open')) return;
    setOpen(false);
    toggle.focus();
  }

  function onIntersect(changes, source) {
    if (source !== observer) return;
    for (const { target, isIntersecting } of changes) {
      if (isIntersecting) visible.add(target);
      else visible.delete(target);
    }
    schedule();
  }

  /** @param {TocProps} [nextProps] */
  function updateProps(nextProps = {}) {
    if (destroyed) return;
    const next = { ...options, ...nextProps };
    if (!observer || next.rootMargin !== options.rootMargin || 'items' in nextProps) {
      const nextObserver = new window.IntersectionObserver(onIntersect, {
        rootMargin: next.rootMargin,
        threshold: 1,
      });
      observer?.disconnect();
      observer = nextObserver;
      visible.clear();
      if ('items' in nextProps) {
        list.replaceChildren();
        entries = buildEntries(list, next.items);
        entries.at(-1)?.link.setAttribute('data-last', '');
        entriesByHash = new Map(entries.map(entry => [entry.link.hash, entry]));
        active = [];
        current = undefined;
        summary.textContent = '';
        highlight.style.removeProperty('--thumb-top');
        highlight.style.removeProperty('--thumb-height');
      }
      for (const entry of entries) observer.observe(entry.heading);
    }

    options = next;
    nav.hidden = entries.length === 0;
    nav.setAttribute('aria-label', options.label);
    label.textContent = options.label;
    toggleLabel.textContent = options.compactLabel;
    nav.style.setProperty('--toc-accent', options.accentColor);
    nav.style.setProperty('--toc-track-color', options.trackColor);
    nav.style.setProperty('--toc-duration', `${options.duration}ms`);
    requestMeasure();
  }

  const resize = new window.ResizeObserver(requestMeasure);
  resize.observe(track);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('resize', requestMeasure);
  document.addEventListener('click', onClick);
  nav.addEventListener('keydown', onKeydown);
  toggle.addEventListener('click', onToggle);
  updateProps(props);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    observer.disconnect();
    resize.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('hashchange', schedule);
    window.removeEventListener('resize', requestMeasure);
    document.removeEventListener('click', onClick);
    nav.removeEventListener('keydown', onKeydown);
    toggle.removeEventListener('click', onToggle);
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    nav.remove();
  }

  return { update: updateProps, destroy };
}
