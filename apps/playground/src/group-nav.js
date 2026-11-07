export function mountGroupNav(nav, sections) {
  const list = nav.querySelector('.nav-list');
  const range = nav.querySelector('.nav-range');
  const links = sections.map(({ section, title, count }) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.innerHTML = `
      <svg class="nav-marker" width="8" height="24" viewBox="0 0 8 24" aria-hidden="true" focusable="false">
        <path d="M7 1.5H2V22.5H7" fill="none" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 3"/>
      </svg>
      <span></span><span class="nav-count"></span>`;
    link.querySelector('span').textContent = title;
    const badge = link.querySelector('.nav-count');
    badge.textContent = count;
    badge.setAttribute('aria-hidden', 'true');
    item.append(link);
    list.append(item);
    return link;
  });

  let current;
  let listWidth;
  let frame;
  function update() {
    frame = undefined;
    let active = 0;
    for (const [index, { section }] of sections.entries()) {
      if (section.getBoundingClientRect().top > 80) break;
      active = index;
    }
    const link = links[active];
    const width = list.clientWidth;
    nav.style.setProperty('--dash-offset', String(-(window.scrollY * .22 % 5)));
    if (current === link && listWidth === width) return;
    listWidth = width;
    if (current !== link) {
      current?.removeAttribute('aria-current');
      link.setAttribute('aria-current', 'location');
      current = link;
    }
    const start = Math.max(0, Math.min(active - 1, links.length - 3));
    const first = links[start];
    const last = links[Math.min(start + 2, links.length - 1)];
    range.style.setProperty('--range-top', `${first.offsetTop + 3}px`);
    range.style.height = `${last.offsetTop + last.offsetHeight - first.offsetTop - 6}px`;
    if (list.scrollWidth > width) {
      const viewport = list.getBoundingClientRect();
      const item = link.getBoundingClientRect();
      if (item.left < viewport.left) list.scrollLeft += item.left - viewport.left;
      if (item.right > viewport.right) list.scrollLeft += item.right - viewport.right;
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
  schedule();

  return () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('hashchange', schedule);
    resize.disconnect();
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}
