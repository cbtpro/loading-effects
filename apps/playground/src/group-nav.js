function addEntry(list, target, title, heading, depth) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = `#${target.id}`;
  link.textContent = title;
  item.append(link);
  list.append(item);
  return { target, link, heading, depth };
}

export function mountGroupNav(nav, sections) {
  const list = nav.querySelector('.nav-list');
  const panel = nav.querySelector('.nav-panel');
  const track = nav.querySelector('.nav-track');
  const rail = nav.querySelector('.nav-rail');
  const path = rail.querySelector('path');
  const highlight = nav.querySelector('.nav-highlight');
  const toggle = nav.querySelector('.nav-toggle');
  const summary = nav.querySelector('.nav-current');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = sections.flatMap(({ section, title, cards }) => {
    const group = addEntry(list, section, title, section.querySelector('h2'), 0);
    const children = document.createElement('ol');
    children.className = 'nav-effects';
    children.setAttribute('aria-label', title);
    group.link.parentElement.append(children);
    return [group, ...cards.map(({ card, title }) => (
      addEntry(children, card, title, card.querySelector('h3'), 1)
    ))];
  });
  const entriesByHash = new Map(entries.map(entry => [entry.link.hash, entry]));
  const visible = new Set();
  let active = [];
  let current;
  let frame;
  let needsMeasure = true;

  // Measure the complete rail once per layout change. Both the muted rail
  // and its animated highlight render the same path.
  function measureRail() {
    const railHeight = track.clientHeight;
    if (!railHeight) return;
    const commands = entries.map((entry, index) => {
      const x = entry.depth ? 11 : 1;
      const top = entry.link.offsetTop;
      const bottom = top + entry.link.offsetHeight;
      const style = getComputedStyle(entry.link);
      entry.railTop = top + parseFloat(style.paddingTop);
      entry.railBottom = bottom - parseFloat(style.paddingBottom);
      return `${index ? 'L' : 'M'}${x} ${entry.railTop}L${x} ${entry.railBottom}`;
    });
    rail.setAttribute('height', railHeight);
    const geometry = commands.join(' ');
    path.setAttribute('d', geometry);
    const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 ${railHeight}"><path d="${geometry}" fill="none" stroke="black"/></svg>`;
    highlight.style.height = `${railHeight}px`;
    highlight.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(mask)}")`;
  }

  function alignedAnchor() {
    const anchor = entriesByHash.get(location.hash);
    if (anchor) {
      const top = anchor.target.getBoundingClientRect().top;
      const margin = parseFloat(getComputedStyle(anchor.target).scrollMarginTop);
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
    frame ??= requestAnimationFrame(update);
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
    if (!nav.contains(event.target) || event.target.closest('.nav-list a')) setOpen(false);
  }

  function onKeydown(event) {
    if (event.key !== 'Escape' || !nav.hasAttribute('data-open')) return;
    setOpen(false);
    toggle.focus();
  }

  const observer = new IntersectionObserver(changes => {
    for (const { target, isIntersecting } of changes) {
      if (isIntersecting) visible.add(target);
      else visible.delete(target);
    }
    schedule();
  }, { rootMargin: '-20px 0px -40% 0px', threshold: 1 });
  for (const entry of entries) observer.observe(entry.heading);

  const resize = new ResizeObserver(requestMeasure);
  resize.observe(track);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('resize', requestMeasure);
  document.addEventListener('click', onClick);
  nav.addEventListener('keydown', onKeydown);
  toggle.addEventListener('click', onToggle);
  schedule();

  return () => {
    observer.disconnect();
    resize.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('hashchange', schedule);
    window.removeEventListener('resize', requestMeasure);
    document.removeEventListener('click', onClick);
    nav.removeEventListener('keydown', onKeydown);
    toggle.removeEventListener('click', onToggle);
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}
