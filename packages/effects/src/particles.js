const tau = Math.PI * 2;
const unit = value => value - Math.floor(value);
const reflect = value => 1 - Math.abs(2 * unit(value / 2) - 1);
const number = (label, value, min, max, step = 1) => ({ label, default: value, min, max, step });
const count = value => ({ ...number('粒子数', value, 8, 240), integer: true });
const duration = value => number('周期（ms）', value, 500, 8000, 100);
const origin = { type: 'origin', default: [.5, .5] };

function sample(index, salt) {
  let seed = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(salt, 0x85ebca6b);
  seed = Math.imul(seed ^ (seed >>> 16), 0x7feb352d);
  return ((seed ^ (seed >>> 15)) >>> 0) / 2 ** 32;
}

function dot(ctx, x, y, radius, alpha) {
  if (alpha <= 0 || radius <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, tau);
  ctx.fill();
}

function particleEffect(id, title, description, schema, draw) {
  return {
    id, title, description, renderer: 'canvas', particle: true, layoutFields: ['count'],
    schema: { color: { type: 'color', default: '#2359BE', label: '粒子颜色' }, ...schema },
    prepare({ width, height }, options) {
      const points = Array.from({ length: options.count }, (_, index) => ({
        x: sample(index, 1), y: sample(index, 2), phase: sample(index, 3), speed: .75 + .5 * sample(index, 4),
        radius: 1 + sample(index, 5) * 1.5,
      }));
      return { width, height, points };
    },
    draw(ctx, layout, elapsed, options) {
      ctx.fillStyle = options.color;
      draw(ctx, layout, elapsed, options);
      ctx.globalAlpha = 1;
    },
  };
}

export const particleFlow = /* @__PURE__ */ particleEffect(
  'particle-flow', '粒子流', '粒子沿弯曲路径流入流出，各自以略有差异的速度前进。',
  {
    count: /* @__PURE__ */ count(120),
    direction: /* @__PURE__ */ number('方向（°）', 0, 0, 359),
    velocity: /* @__PURE__ */ number('流速（px/s）', 42, 5, 180),
    curvature: /* @__PURE__ */ number('弯曲度', .2, 0, 1, .05),
    lifetime: /* @__PURE__ */ number('寿命（ms）', 3000, 500, 8000, 100),
  },
  (ctx, { width, height, points }, elapsed, options) => {
    const angle = options.direction / 360 * tau;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const span = Math.abs(width * cos) + Math.abs(height * sin) + 12;
    const breadth = Math.abs(width * sin) + Math.abs(height * cos);
    for (const p of points) {
      const path = Math.min(span, options.velocity * options.lifetime * p.speed / 1000);
      const t = elapsed * options.velocity * p.speed / (1000 * path);
      const u = (p.x + t - Math.floor(p.phase + t)) * path + (p.phase - .5) * (span - path);
      const v = (p.y - .5) * breadth + Math.sin((u / span + p.y) * tau) * breadth * options.curvature * .35;
      const opacity = Math.sin(Math.PI * unit(p.phase + t)) * options.opacity;
      dot(ctx, width / 2 + u * cos - v * sin, height / 2 + u * sin + v * cos, p.radius, opacity);
    }
  },
);

export const particleConvergence = /* @__PURE__ */ particleEffect(
  'particle-convergence', '粒子汇聚', '粒子从边缘加速靠拢，接近目标点时缩小淡出。',
  {
    count: /* @__PURE__ */ count(96), origin,
    attraction: /* @__PURE__ */ number('加速度（px/s²）', 90, 20, 300),
    fadeRadius: /* @__PURE__ */ number('淡出半径（px）', 18, 4, 100),
  },
  (ctx, { width, height, points }, elapsed, options) => {
    const ox = options.origin[0] * width;
    const oy = options.origin[1] * height;
    for (const p of points) {
      const angle = p.x * tau;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const edgeX = dx > 0 ? width - ox : ox;
      const edgeY = dy > 0 ? height - oy : oy;
      const edge = Math.min(edgeX / Math.max(Math.abs(dx), .0001), edgeY / Math.max(Math.abs(dy), .0001));
      if (edge <= 0) continue;
      const lifetime = Math.sqrt(2 * edge / options.attraction);
      const t = unit(elapsed / 1000 / lifetime + p.phase);
      const distance = edge * (1 - t * t);
      const fade = Math.min(1, distance / options.fadeRadius, t * 8);
      dot(ctx, ox + dx * distance, oy + dy * distance, p.radius * fade, fade * options.opacity);
    }
  },
);

export const particleExplosion = /* @__PURE__ */ particleEffect(
  'particle-explosion', '粒子爆发', '粒子从中心散开，亮度随扩散衰减，再向中心回聚。',
  {
    count: /* @__PURE__ */ count(80),
    spreadRadius: /* @__PURE__ */ number('扩散半径（px）', 64, 12, 220),
    decay: /* @__PURE__ */ number('衰减', .65, 0, 1, .05),
    duration: /* @__PURE__ */ duration(2200),
  },
  (ctx, { width, height, points }, elapsed, options) => {
    const radius = Math.min(options.spreadRadius, Math.min(width, height) * .48);
    for (const p of points) {
      const t = unit(elapsed / options.duration + p.phase * .15 + .12);
      const spread = Math.sin(t * Math.PI);
      const distance = radius * spread * p.speed / 1.25;
      dot(ctx, width / 2 + Math.cos(p.x * tau) * distance, height / 2 + Math.sin(p.x * tau) * distance,
        p.radius, options.opacity * (1 - spread * options.decay) * Math.min(1, spread * 8));
    }
  },
);

export const particleOrbit = /* @__PURE__ */ particleEffect(
  'particle-orbit', '粒子轨道', '多层同心轨道按不同速度转动。',
  {
    count: /* @__PURE__ */ count(72),
    rings: { .../* @__PURE__ */ number('轨道数', 3, 1, 8), integer: true },
    ringGap: /* @__PURE__ */ number('轨道间距（px）', 12, 4, 36),
    speedSpread: /* @__PURE__ */ number('轨道速度差', .3, 0, 1, .05),
    duration: /* @__PURE__ */ duration(2600),
  },
  (ctx, { width, height, points }, elapsed, options) => {
    const step = Math.min(options.ringGap, Math.min(width, height) * .42 / options.rings);
    points.forEach((p, index) => {
      const ring = index % options.rings;
      const angle = (p.phase + elapsed / options.duration * (1 + ring * options.speedSpread)) * tau;
      const radius = step * (ring + 1);
      dot(ctx, width / 2 + Math.cos(angle) * radius, height / 2 + Math.sin(angle) * radius,
        p.radius, (.5 + .5 * p.y) * options.opacity);
    });
  },
);

export const particleMorph = /* @__PURE__ */ particleEffect(
  'particle-morph', '粒子变形', '同一批粒子在圆形与方形之间重组，停留后开始下一次变形。',
  {
    count: /* @__PURE__ */ count(180),
    targets: { default: ['circle', 'square'], itemChoices: ['circle', 'square'] },
    hold: /* @__PURE__ */ number('停留（ms）', 400, 0, 1000, 50),
    duration: /* @__PURE__ */ duration(2600),
  },
  (ctx, { width, height, points }, elapsed, options) => {
    const radius = Math.min(width, height) * .36;
    const segment = options.duration / options.targets.length;
    const phase = elapsed % options.duration / segment;
    const index = Math.floor(phase);
    const hold = Math.min(.8, options.hold / segment);
    const t = Math.max(0, (phase - index - hold) / (1 - hold));
    const mix = t * t * (3 - 2 * t);
    const next = (index + 1) % options.targets.length;
    for (const p of points) {
      const dx = Math.cos(p.x * tau);
      const dy = Math.sin(p.x * tau);
      const square = 1 / Math.max(Math.abs(dx), Math.abs(dy));
      const from = options.targets[index] === 'square' ? square : 1;
      const to = options.targets[next] === 'square' ? square : 1;
      const distance = radius * Math.sqrt(p.y) * (from + (to - from) * mix);
      dot(ctx, width / 2 + dx * distance, height / 2 + dy * distance, p.radius * .8, .75 * options.opacity);
    }
  },
);

export const particleNetwork = /* @__PURE__ */ particleEffect(
  'particle-network', '粒子网络', '漂移粒子在距离足够近时连线，离开后逐渐淡出。',
  {
    count: /* @__PURE__ */ count(64),
    linkDistance: /* @__PURE__ */ number('连线距离（px）', 36, 12, 120),
    maxLinks: { .../* @__PURE__ */ number('每点连线上限', 4, 1, 8), integer: true },
    velocity: /* @__PURE__ */ number('漂移速度（px/s）', 16, 0, 80),
  },
  (ctx, { width, height, points }, elapsed, options) => {
    const cell = options.linkDistance;
    const buckets = new Map();
    const travel = elapsed * options.velocity / 1000;
    points.forEach((p, index) => {
      const angle = p.phase * tau;
      p.px = reflect(p.x + Math.cos(angle) * travel / width) * width;
      p.py = reflect(p.y + Math.sin(angle) * travel / height) * height;
      p.column = Math.floor(p.px / cell);
      p.row = Math.floor(p.py / cell);
      p.links = 0;
      const key = `${p.column},${p.row}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(index);
    });
    ctx.strokeStyle = options.color;
    ctx.lineWidth = 1;
    points.forEach((p, index) => {
      for (let x = p.column - 1; x <= p.column + 1 && p.links < options.maxLinks; x++) {
        for (let y = p.row - 1; y <= p.row + 1 && p.links < options.maxLinks; y++) {
          for (const other of buckets.get(`${x},${y}`) ?? []) {
            if (p.links >= options.maxLinks) break;
            const q = points[other];
            if (other <= index || q.links >= options.maxLinks) continue;
            const distance = Math.hypot(p.px - q.px, p.py - q.py);
            if (distance >= cell) continue;
            ctx.globalAlpha = .7 * options.opacity * (1 - distance / cell);
            ctx.beginPath();
            ctx.moveTo(p.px, p.py);
            ctx.lineTo(q.px, q.py);
            ctx.stroke();
            p.links++;
            q.links++;
          }
        }
      }
      dot(ctx, p.px, p.py, p.radius, .85 * options.opacity);
    });
  },
);
