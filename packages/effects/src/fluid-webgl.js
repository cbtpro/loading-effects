const base = {
  color: { type: 'color', default: '#2359BE', label: '流体颜色' },
};
const fragmentHelpers = `
const float TAU = 6.28318530718;
vec4 tint(float coverage, float light) {
  return vec4(mix(uColor.rgb, vec3(1.0), light), uColor.a * coverage);
}`;

export const metaball = {
  id: 'metaball',
  title: '融合液滴',
  description: '液滴靠近时轮廓融合，拉开时细颈断开。',
  renderer: 'webgl',
  layoutFields: [],
  fallback: 'radial-gradient(circle at calc(50% - 11px) 50%, currentColor 11px, transparent 12px), radial-gradient(circle at calc(50% + 11px) 50%, currentColor 11px, transparent 12px)',
  schema: {
    ...base,
    count: { default: 3, min: 2, max: 6, integer: true, step: 1, label: '液滴数' },
    radius: { default: 12, min: 5, max: 38, step: 1, label: '半径（px）' },
    threshold: { default: .65, min: .3, max: 1.4, step: .05, label: '融合阈值' },
    travel: { default: 16, min: 0, max: 60, step: 1, label: '往返距离（px）' },
    duration: { default: 2400, min: 500, max: 7000, step: 100, label: '周期（ms）' },
  },
  uniforms: ({ count, radius, threshold, travel }) => ({ uCount: count, uRadius: radius, uThreshold: threshold, uTravel: travel }),
  fragment: `${fragmentHelpers}
uniform float uCount;
uniform float uRadius;
uniform float uThreshold;
uniform float uTravel;
vec4 effectColor(vec2 point) {
  vec2 p = point - uSize * .5;
  float fit = min(1.0, min(uSize.x, uSize.y) * .43 / (uRadius * 3.2 + uTravel));
  float radius = uRadius * fit;
  float distanceToCenter = (radius * .72 + uTravel * fit * (.5 - .5 * cos(uPhase * TAU))) * sqrt(uCount / 3.0);
  float field = 0.0;
  for (int i = 0; i < 6; i++) {
    if (float(i) >= uCount) break;
    float angle = float(i) / uCount * TAU + uPhase * TAU;
    vec2 d = p - vec2(cos(angle), sin(angle)) * distanceToCenter;
    field += exp(-dot(d, d) / max(radius * radius, .001));
  }
  return tint(smoothstep(uThreshold - .055, uThreshold + .055, field), .15 + .12 * sin(p.y / max(radius, .1)));
}`,
};

export const fluidRibbon = {
  id: 'fluid-ribbon',
  title: '流体丝带',
  description: '丝带横向漂浮，沿长度方向扭转并露出不同的明暗面。',
  renderer: 'webgl',
  layoutFields: [],
  fallback: 'linear-gradient(155deg, transparent 34%, currentColor 35% 65%, transparent 66%) center / 90px 24px no-repeat',
  schema: {
    ...base,
    width: { default: 12, min: 4, max: 32, step: 1, label: '宽度（px）' },
    length: { default: 96, min: 30, max: 280, step: 1, label: '长度（px）' },
    twist: { default: 180, min: 0, max: 720, step: 15, label: '扭转角（°）' },
    amplitude: { default: 10, min: 0, max: 42, step: 1, label: '起伏幅度（px）' },
    duration: { default: 3000, min: 500, max: 7000, step: 100, label: '周期（ms）' },
  },
  uniforms: ({ width, length, twist, amplitude }) => ({ uWidth: width, uLength: length, uTwist: twist, uAmplitude: amplitude }),
  fragment: `${fragmentHelpers}
uniform float uWidth;
uniform float uLength;
uniform float uTwist;
uniform float uAmplitude;
vec4 effectColor(vec2 point) {
  vec2 p = point - uSize * .5;
  float lengthPx = min(uLength, uSize.x * .84);
  float t = p.x / lengthPx + .5;
  float turn = radians(uTwist) * t + uPhase * TAU;
  float amplitude = min(uAmplitude, uSize.y * .32);
  float center = amplitude * sin(t * TAU - uPhase * TAU);
  float halfWidth = max(.65, uWidth * .5 * abs(cos(turn))) * smoothstep(0.0, .13, min(t, 1.0 - t));
  float y = p.y - center;
  float outline = min(halfWidth - abs(y), lengthPx * min(t, 1.0 - t));
  float light = clamp(.3 + .2 * sin(turn) - .12 * y / max(1.0, halfWidth), .03, .68);
  return tint(smoothstep(-.65, .65, outline), light);
}`,
};

export const inkDiffusion = {
  id: 'ink-diffusion',
  title: '墨水扩散',
  description: '颜色从指定位置扩散，边缘逐渐柔化并淡回初态。',
  renderer: 'webgl',
  layoutFields: [],
  fallback: 'radial-gradient(ellipse 44px 32px at var(--ink-origin, center), currentColor, transparent)',
  schema: {
    ...base,
    origin: { type: 'origin', default: [.5, .5] },
    radius: { default: 60, min: 12, max: 190, step: 1, label: '扩散半径（px）' },
    softness: { default: .6, min: .05, max: 1, step: .05, label: '边缘柔和度' },
    seed: { default: 1, min: 0, max: 999, integer: true, step: 1, label: '纹理种子' },
    duration: { default: 3200, min: 500, max: 8000, step: 100, label: '周期（ms）' },
  },
  uniforms: ({ origin, radius, softness, seed }) => ({ uOrigin: origin, uRadius: radius, uSoftness: softness, uSeed: seed }),
  fragment: `${fragmentHelpers}
uniform vec2 uOrigin;
uniform float uRadius;
uniform float uSoftness;
uniform float uSeed;
vec4 effectColor(vec2 point) {
  vec2 p = point - uSize * uOrigin;
  float angle = atan(p.y, p.x + .001);
  float growth = smoothstep(0.0, .58, uPhase) * (1.0 - smoothstep(.68, 1.0, uPhase));
  float radius = min(uRadius, min(uSize.x, uSize.y) * .44) * (.24 + .76 * growth);
  float edge = radius * (.9 + .1 * sin(angle * 5.0 + uSeed) + .07 * sin(angle * 9.0 - uSeed * .7));
  float softness = max(1.0, radius * (.1 + .5 * uSoftness));
  float grain = .84 + .16 * sin(dot(p, vec2(.16, .27)) + sin(p.x * .22 + uSeed));
  float coverage = (1.0 - smoothstep(edge - softness, edge, length(p))) * grain;
  float fade = mix(.68, 1.0, growth);
  return tint(coverage * fade, .15);
}`,
};
