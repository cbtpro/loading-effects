const vertexSource = `#version 300 es
void main() {
  vec2 point = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(point * 2.0 - 1.0, 0.0, 1.0);
}`;

function createProgram(gl, fragmentSource) {
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    return;
  }
  for (const [shader, source] of [[vertex, vertexSource], [fragment, fragmentSource]]) {
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (linked) return program;
  gl.deleteProgram(program);
}

export function createWebGLRenderer(element, effect) {
  const document = element.ownerDocument;
  const canvas = document.createElement('canvas');
  canvas.width = 0;
  canvas.height = 0;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%', pointerEvents: 'none' });
  const fallback = document.createElement('div');
  fallback.setAttribute('aria-hidden', 'true');
  Object.assign(fallback.style, {
    width: '100%', height: '100%', background: effect.fallback, pointerEvents: 'none',
  });
  element.append(canvas, fallback);

  const gl = canvas.getContext('webgl2', { antialias: false, depth: false, premultipliedAlpha: false });
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = 1;
  const colorContext = gl && colorCanvas.getContext('2d', { willReadFrequently: true });
  let program;
  let locations;
  let options;
  let size = { width: 0, height: 0 };
  let rgba = [0, 0, 0, 1];
  let uniforms = {};
  let refresh;
  let reported;

  function updateSurface() {
    canvas.style.display = program ? 'block' : 'none';
    fallback.hidden = Boolean(program);
    const name = program ? 'webgl' : 'static';
    if (reported !== name) {
      reported = name;
      const Event = document.defaultView.CustomEvent;
      element.dispatchEvent(new Event('loading-renderer-change', { detail: name }));
    }
  }

  function initialize() {
    if (!gl || gl.isContextLost()) return;
    program = createProgram(gl, `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uBufferSize;
uniform vec4 uColor;
uniform float uPhase;
out vec4 fragment;
${effect.fragment}
void main() {
  vec2 uv = gl_FragCoord.xy / uBufferSize;
  fragment = effectColor(vec2(uv.x, 1.0 - uv.y) * uSize);
}`);
    if (program) {
      locations = Object.fromEntries(
        ['uSize', 'uBufferSize', 'uColor', 'uPhase', ...Object.keys(uniforms)]
          .map(name => [name, gl.getUniformLocation(program, name)]),
      );
      gl.useProgram(program);
    }
    updateSurface();
  }

  function onLost(event) {
    event.preventDefault();
    program = undefined;
    updateSurface();
    refresh?.();
  }

  function onRestored() {
    initialize();
    refresh?.();
  }

  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  return {
    get name() { return program ? 'webgl' : 'static'; },
    get animated() { return Boolean(program); },
    setRefresh(callback) { refresh = callback; },
    update(next) {
      if (colorContext && options?.color !== next.color) {
        colorContext.clearRect(0, 0, 1, 1);
        colorContext.fillStyle = next.color;
        colorContext.fillRect(0, 0, 1, 1);
        rgba = Array.from(colorContext.getImageData(0, 0, 1, 1).data, component => component / 255);
      }
      const first = !options;
      options = next;
      uniforms = effect.uniforms(next);
      canvas.style.backgroundColor = next.background;
      fallback.style.backgroundColor = next.background;
      fallback.style.color = next.color;
      fallback.style.opacity = next.opacity;
      if (first) initialize();
      updateSurface();
    },
    resize(next, dpr) {
      size = next;
      const { width, height } = next;
      const ratio = width && height
        ? Math.min(dpr, 2, 2048 / width, 2048 / height, Math.sqrt(1_000_000 / (width * height)))
        : 0;
      canvas.width = ratio ? Math.max(1, Math.floor(width * ratio)) : 0;
      canvas.height = ratio ? Math.max(1, Math.floor(height * ratio)) : 0;
    },
    render(elapsed) {
      if (!program || !canvas.width || !canvas.height || gl.isContextLost()) return;
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(locations.uSize, size.width, size.height);
      gl.uniform2f(locations.uBufferSize, width, height);
      gl.uniform4f(locations.uColor, rgba[0], rgba[1], rgba[2], rgba[3] * options.opacity);
      const phase = elapsed / options.duration;
      gl.uniform1f(locations.uPhase, options.loop ? phase % 1 : Math.min(1, phase));
      for (const [name, value] of Object.entries(uniforms)) {
        if (Array.isArray(value)) gl.uniform2fv(locations[name], value);
        else gl.uniform1f(locations[name], value);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      refresh = undefined;
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (program) gl.deleteProgram(program);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
      fallback.remove();
    },
  };
}
