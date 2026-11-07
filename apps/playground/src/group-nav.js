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
  const range = nav.querySelector('.nav-range');
  const mobileEffects = nav.querySelector('.nav-mobile-effects');
  const mobile = matchMedia('(max-width: 800px)');
  const groups = sections.map(({ section, title, cards }) => {
    const link = addLink(list, section.id, title);
    link.className = 'nav-group-link';
    const children = document.createElement('ul');
    children.className = 'nav-effects';
    children.setAttribute('aria-label', title);
    children.hidden = true;
    link.parentElement.append(children);
    const effects = cards.map(({ card, title }) => ({ card, link: addLink(children, card.id, title) }));
    return { section, link, children, effects };
  });

  let currentGroup;
  let currentEffect;
  let wasMobile;
  let frame;
  function update() {
    frame = undefined;
    const narrow = mobile.matches;
    const readingLine = narrow ? 116 : 80;
    let active = 0;
    for (const [index, { section }] of groups.entries()) {
      if (section.getBoundingClientRect().top > readingLine) break;
      active = index;
    }
    const group = groups[active];
    let effect = group.effects[0];
    for (const entry of group.effects) {
      if (entry.card.getBoundingClientRect().top > readingLine) break;
      effect = entry;
    }
    const groupChanged = currentGroup !== group || wasMobile !== narrow;
    const effectChanged = currentEffect !== effect;
    nav.style.setProperty('--dash-offset', String(-(window.scrollY * .22 % 5)));

    if (groupChanged) {
      if (currentGroup) {
        currentGroup.link.removeAttribute('data-active');
        currentGroup.children.hidden = true;
        currentGroup.link.parentElement.append(currentGroup.children);
      }
      group.link.setAttribute('data-active', '');
      if (narrow) mobileEffects.append(group.children);
      group.children.hidden = false;
      currentGroup = group;
      wasMobile = narrow;
      if (narrow) revealLink(list, group.link, 'x');
    }
    if (effectChanged) {
      currentEffect?.link.removeAttribute('aria-current');
      effect.link.setAttribute('aria-current', 'location');
      currentEffect = effect;
    }

    if (!narrow) {
      const start = Math.max(0, Math.min(active - 1, groups.length - 3));
      const first = groups[start].link;
      const last = groups[Math.min(start + 2, groups.length - 1)].link;
      range.style.setProperty('--range-top', `${first.offsetTop + 3}px`);
      range.style.height = `${last.offsetTop + last.offsetHeight - first.offsetTop - 6}px`;
    }
    if (effectChanged || groupChanged) {
      if (narrow) revealLink(group.children, effect.link, 'x');
      else revealLink(nav, effect.link, 'y');
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
  mobile.addEventListener('change', schedule);
  schedule();

  return () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('hashchange', schedule);
    mobile.removeEventListener('change', schedule);
    resize.disconnect();
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}
