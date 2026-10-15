// Full-screen WebGL "draped fabric": a height field of soft folds, lit with a
// warm key light and a champagne sheen. No dependencies.

const vert = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const frag = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

float height(vec2 p){
  float t = uTime * 0.12;
  vec2 q = p;
  q.x += 0.35 * sin(p.y * 1.3 + t * 1.7);
  float h = 0.0;
  h += 0.55 * sin(q.x * 2.1 + q.y * 0.6 + t * 2.0);
  h += 0.30 * sin(q.x * 3.7 - q.y * 1.1 - t * 1.4 + 1.3);
  h += 0.18 * sin(q.x * 6.3 + q.y * 2.2 + t * 2.6);
  h += 0.25 * noise(q * 1.6 + t);
  // a gentle swell under the cursor
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 3.0;
  float d = length(p - m);
  h += 0.35 * exp(-d * d * 1.4);
  return h;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 3.0;
  p.y += uScroll * 1.2;

  float e = 0.004;
  float h = height(p);
  vec3 n = normalize(vec3(
    height(p - vec2(e, 0.0)) - height(p + vec2(e, 0.0)),
    height(p - vec2(0.0, e)) - height(p + vec2(0.0, e)),
    e * 6.0));

  vec3 L = normalize(vec3(-0.5, 0.7, 0.6));
  vec3 V = vec3(0.0, 0.0, 1.0);
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), V), 0.0, 1.0), 18.0);
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0);

  vec3 deep = vec3(0.075, 0.018, 0.035);
  vec3 wine = vec3(0.30, 0.07, 0.12);
  vec3 gold = vec3(0.95, 0.80, 0.52);

  vec3 col = mix(deep, wine, diff * 0.9 + h * 0.08);
  col += gold * spec * 0.45;
  col += gold * rim * 0.12;

  // fine woven grain
  float grain = noise(gl_FragCoord.xy * 0.9) * 0.035;
  col += grain - 0.017;

  // vignette into the page colour
  float v = smoothstep(1.25, 0.2, length(uv - vec2(0.5, 0.55)));
  col = mix(deep * 0.6, col, v);
  gl_FragColor = vec4(col, 1.0);
}`;

export function initFabric(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.classList.add('no-webgl'); return null; }

  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.classList.add('no-webgl'); return null; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');
  const uScroll = gl.getUniformLocation(prog, 'uScroll');

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const state = { scroll: 0, visible: true };

  window.addEventListener('pointermove', (e) => {
    mouse.tx = e.clientX / innerWidth;
    mouse.ty = 1 - e.clientY / innerHeight;
  });

  // Render below device resolution: the image is soft by nature, and this
  // keeps the shader cheap on laptops and phones.
  const resize = () => {
    const scale = Math.min(devicePixelRatio, 1.5) * 0.6;
    canvas.width = Math.floor(canvas.clientWidth * scale);
    canvas.height = Math.floor(canvas.clientHeight * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const io = new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; });
  io.observe(canvas);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!state.visible) return;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduce ? 8 : (now - start) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uScroll, state.scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  requestAnimationFrame(frame);

  return state;
}
