export function pointerWeight(pointer, x, y, radius) {
  if (!pointer) return 0;
  const dx = (pointer.x - x) / radius;
  const dy = (pointer.y - y) / radius;
  const influence = Math.max(0, 1 - dx * dx - dy * dy);
  return pointer.strength * influence * influence;
}

export function bendSurface(pointer, x, y, limit) {
  return pointerWeight(pointer, x, y, 84) * Math.max(-limit, Math.min(limit, (pointer?.y ?? y) - y));
}

// Map a surface-relative pointer to a centered track or label.
export function pointerAlong(pointer, surface, element) {
  const width = element.offsetWidth;
  if (!width) return .5;
  return Math.max(0, Math.min(1, .5 + (pointer.x - .5) * surface.clientWidth / width));
}
