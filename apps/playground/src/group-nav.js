function addLink(list, id, title) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = `#${id}`;
  link.textContent = title;
  item.append(link);
  list.append(item);
  return link;
}

function revealLink(scroller, link, axis) {
  const viewport = scroller.getBoundingClientRect();
  const item = link.getBoundingClientRect();
  const delta = axis === 'x'
    ? Math.min(0, item.left - viewport.left) + Math.max(0, item.right - viewport.right)
    : Math.min(0, item.top - viewport.top) + Math.max(0, item.bottom - viewport.bottom);
  if (axis === 'x') scroller.scrollLeft += delta;
  else scroller.scrollTop += delta;
}

export function mountGroupNav(nav, sections) {
  const list = nav.querySelector('.nav-list');
  const indicator = nav.querySelector('.nav-indicator');
  const mobileEffects = nav.querySelector('.nav-mobile-effects');
  const mobile = matchMedia('(max-width: 800px)');
  const groups = sections.map(({ section, title, cards }) => {
    const link = addLink(list, section.id, title);
    link.className = 'nav-group-link';
    const children = document.createElement('ol');
    children.className = 'nav-effects';
    children.setAttribute('aria-label', title);
    link.parentElement.append(children);
    const group = { target: section, link, children };
    group.effects = cards.map(({ card, title }) => ({
      target: card,
      link: addLink(children, card.id, title),
      group,
    }));
    return group;
  });
  const entries = groups.flatMap(group => [group, ...group.effects]);
  const entriesByHash = new Map(entries.map(entry => [entry.link.hash, entry]));

  let current;
  let currentGroup;
  let wasMobile;
  let frame;

  function readCurrent() {
    const height = window.innerHeight;
    if (window.scrollY + height >= document.documentElement.scrollHeight - 8) {
      return entries.at(-1);
    }
    // A native jump positions its target at the scroll margin. Keep that link
    // selected until the reader moves away, even if another row is already visible.
    const anchor = entriesByHash.get(location.hash);
    if (anchor) {
      const top = anchor.target.getBoundingClientRect().top;
      const margin = parseFloat(getComputedStyle(anchor.target).scrollMarginTop);
      if (Math.abs(top - margin) <= 2) return anchor;
    }
    let visible = entries[0];
    for (const entry of entries) {
      if (entry.target.getBoundingClientRect().top > height / 2) break;
      visible = entry;
    }
    return visible;
  }

  function update() {
    frame = undefined;
    const narrow = mobile.matches;
    const entry = readCurrent();
    const group = entry.group ?? entry;
    const groupChanged = currentGroup !== group || wasMobile !== narrow;
    const entryChanged = current !== entry;

    if (groupChanged) {
      if (currentGroup) {
        currentGroup.link.removeAttribute('data-active');
        currentGroup.link.parentElement.append(currentGroup.children);
      }
      group.link.setAttribute('data-active', '');
      if (narrow) {
        mobileEffects.append(group.children);
        revealLink(list, group.link, 'x');
      }
      currentGroup = group;
      wasMobile = narrow;
    }
    if (entryChanged) {
      current?.link.removeAttribute('aria-current');
      entry.link.setAttribute('aria-current', 'location');
      current = entry;
    }

    if (!narrow) {
      indicator.style.setProperty('--indicator-top', `${entry.link.offsetTop}px`);
      indicator.style.height = `${entry.link.offsetHeight}px`;
      if (entryChanged || groupChanged) revealLink(nav, entry.link, 'y');
    } else if (entry.group && (entryChanged || groupChanged)) {
      revealLink(group.children, entry.link, 'x');
    }
  }

  function schedule() {
    frame ??= requestAnimationFrame(update);
  }

  const resize = new ResizeObserver(schedule);
  resize.observe(nav);
  for (const { section } of sections) resize.observe(section);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('resize', schedule);
  mobile.addEventListener('change', schedule);
  schedule();

  return () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('hashchange', schedule);
    window.removeEventListener('resize', schedule);
    mobile.removeEventListener('change', schedule);
    resize.disconnect();
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}
