/**
 * Lit paper for the Unfold sheet, drawn by a small WebGL2 shader.
 *
 * Each panel of the opened accordion still leans a few degrees, alternately
 * towards and away from the light, so neighbouring panels differ in tone.
 * A crease is where one lean turns into the other over a few pixels: a
 * quick change of light, a little shadow in a valley, crushed fibres along
 * the line. The edges wander a little and the sheet shows its age: grime
 * where it's handled, a few spots, a coffee ring, some ink. Paper fibre and a faint unevenness come from CC0 scans
 * (ambientCG Paper001 and Paper003).
 *
 * One hidden WebGL canvas renders every panel, and each result is copied
 * into that panel's own 2D canvas, so the CSS folding still works.
 */

const BASE = '/field-notes/things-that-make-me-feel-human';

const VERT = `#version 300 es
in vec2 p;
out vec2 v;
void main() { v = p * 0.5 + 0.5; v.y = 1.0 - v.y; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v;
out vec4 o;
uniform sampler2D uNormal, uColor, uCrumple;
uniform vec2 uSize;      // panel size, CSS px
uniform float uOffset;   // panel's top within the whole sheet, CSS px
uniform float uIndex;    // 0 is the cover
uniform float uLean;     // +1 or -1: which way this panel leans
uniform float uTopCrease;    // 1 if there is a crease along the top
uniform float uBottomCrease; // 1 if there is a crease along the bottom
uniform vec3 uTint;
uniform float uBack;   // 1 for the back of a panel (seen upside down)

float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 q) {
  vec2 i = floor(q), f = fract(q);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 q) {
  float s = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++) { s += a * noise(q); q *= 2.03; a *= 0.5; }
  return s;
}
float wob(float x, float seed) { return noise(vec2(x, seed)) * 2.0 - 1.0; }

const vec3 INK = vec3(0.13, 0.16, 0.24);

// A drop of ink: a dense core and a little bleed into the fibres.
float inkDot(vec2 q, vec2 c, float r) {
  float d = length(q - c) + (noise(q * 1.7) - 0.5) * 0.7 * r;
  return smoothstep(r, r * 0.6, d) * 0.85 + smoothstep(r * 2.4, r, d) * 0.12;
}

void main() {
  vec2 px = v * uSize;
  if (uBack > 0.5) px.y = uSize.y - px.y;
  vec2 sheet = vec2(px.x, px.y + uOffset);
  float W = uSize.x, H = uSize.y;
  float s = clamp(W / 600.0, 0.55, 1.0);

  // ---- The cut edge: not quite straight, panels not quite aligned. ----
  float dTop = uTopCrease > 0.5 ? px.y : 1e3;
  float dBot = uBottomCrease > 0.5 ? H - px.y : 1e3;
  float dC = min(dTop, dBot);                 // distance to the nearest crease
  float jog = uIndex < 0.5 ? 0.0 : (hash(vec2(uIndex, 0.37)) - 0.5) * 2.2;
  float pinch = 1.2 * exp(-dC * dC / 10.0);   // fold ends get rubbed in
  const float M = 3.0;
  float left = px.x - (M + jog + pinch + wob(sheet.y / 80.0, 1.7) * 0.8 + wob(sheet.y / 14.0, 5.3) * 0.22);
  float right = (W - M + jog - pinch + wob(sheet.y / 80.0, 9.1) * 0.8 + wob(sheet.y / 14.0, 2.9) * 0.22) - px.x;
  float top = uTopCrease > 0.5 ? 1e3 : px.y - (M + wob(px.x / 90.0, 4.4) * 0.6);
  float bot = uBottomCrease > 0.5 ? 1e3 : (H - M + wob(px.x / 90.0, 7.7) * 0.6) - px.y;
  vec2 c = vec2(min(left, right), min(top, bot));
  float d = min(c.x, c.y);
  const float RC = 2.0;                       // worn corners
  if (c.x < RC && c.y < RC) d = RC - length(RC - c);
  d += (noise(sheet * 1.3) - 0.5) * 0.4;      // loose fibres
  float alpha = clamp(d / 0.9 + 0.5, 0.0, 1.0);
  if (alpha <= 0.0) { o = vec4(0.0); return; }

  // ---- Light. ----
  // Slope of the paper down the panel (dz/dy). A small lean with a slight
  // bow, turning through zero inside a narrow band at each crease.
  const float A = 0.05;   // ~3 degrees
  const float BW = 5.0;   // half-width of the bend, px
  float slope = uLean * A * (1.0 + 0.25 * (0.5 - v.y));
  float tTop = clamp(px.y / BW, 0.0, 1.0);
  float tBot = clamp((H - px.y) / BW, 0.0, 1.0);
  slope *= mix(1.0, smoothstep(0.0, 1.0, tTop), uTopCrease);
  slope *= mix(1.0, smoothstep(0.0, 1.0, tBot), uBottomCrease);

  // Surface detail from the scans; GL normals have y up, ours goes down.
  vec3 nf = texture(uNormal, sheet / vec2(700.0, 410.0)).xyz * 2.0 - 1.0;
  vec3 nc = texture(uCrumple, sheet / 900.0).xyz * 2.0 - 1.0;
  vec2 detail = vec2(nf.x, -nf.y) * 0.9 + vec2(nc.x, -nc.y) * 0.45;

  // Crushed fibres right on the fold.
  float onTop = (1.0 - tTop) * uTopCrease;
  float onBot = (1.0 - tBot) * uBottomCrease;
  float fold = max(onTop, onBot);
  float grit = hash(floor(sheet * vec2(1.0, 2.0))) - 0.5;
  detail += vec2(grit * 0.3, grit) * 0.35 * fold * fold * fold;

  vec3 n = normalize(vec3(-detail.x, -slope - detail.y, 1.0));
  vec3 L = normalize(vec3(-0.35, -0.75, 0.9));
  float flat_ = L.z;
  float diff = max(dot(n, L), 0.0);
  float shade = (0.5 + 0.55 * diff) / (0.5 + 0.55 * flat_);

  // A valley crease sits a touch in its own shadow; a ridge does not.
  float valleyTop = uTopCrease * step(0.0, uLean);
  float valleyBot = uBottomCrease * step(uLean, 0.0);
  float ao = 1.0 - 0.07 * onTop * onTop * valleyTop - 0.07 * onBot * onBot * valleyBot;

  float lum = dot(texture(uColor, sheet / vec2(700.0, 410.0)).rgb, vec3(0.333));
  vec3 col = uTint * (1.0 + (lum - 0.953) * 2.5);

  // ---- Time. ----
  // Uneven yellowing, more towards the edges.
  float edge = exp(-max(d, 0.0) / 9.0);
  col *= mix(vec3(1.0), vec3(0.985, 0.95, 0.86), clamp(0.3 * fbm(sheet / 260.0 + 11.0) + 0.6 * edge, 0.0, 1.0));

  // Handling: grime along the creases, mostly where fingers open it.
  float side = exp(-min(px.x, W - px.x) / 55.0);
  float grime = exp(-dC / 6.0) * (0.02 + 0.12 * side) * (0.5 + fbm(sheet / 8.0));
  col *= 1.0 - grime * vec3(0.85, 1.0, 1.25);

  // Foxing: a few small age spots.
  vec2 cell = floor(sheet / 64.0);
  if (hash(cell + 3.1) > 0.95) {
    vec2 ctr = (cell + vec2(hash(cell + 7.7), hash(cell + 1.9))) * 64.0;
    float r = 0.5 + 1.6 * hash(cell + 5.5);
    float dist = length(sheet - ctr) + (noise(sheet * 0.8) - 0.5) * r;
    float spot = smoothstep(r, r * 0.3, dist) * 0.25 + exp(-dist / (r * 2.5)) * 0.06;
    col *= 1.0 - spot * vec3(0.35, 0.6, 0.95);
  }

  if (uBack < 0.5) {
  // A coffee cup, put down twice.
  vec2 cup = vec2(0.72 * W, 3.42 * H);
  for (int k = 0; k < 2; k++) {
    vec2 dv = sheet - cup - (k == 1 ? vec2(10.0, -7.0) * s : vec2(0.0));
    vec2 dir = normalize(dv + 1e-4);
    float R = 44.0 * s + (noise(dir * 1.6 + 5.0 + float(k)) - 0.5) * 4.0 * s;
    float rd = length(dv) - R;
    // Coffee dries to a dark rim (it wicks outwards) over a faint wash.
    float rim = exp(-rd * rd / (0.9 * s * s)) * smoothstep(-5.0 * s, 0.0, rd);
    float tide = exp(-(rd + 6.0 * s) * (rd + 6.0 * s) / (1.5 * s * s)) * 0.3;
    float wash = smoothstep(1.0, -2.0 * s, rd) * 0.08 * (0.4 + fbm(sheet / 14.0));
    float there = smoothstep(0.32, 0.58, noise(dir * 1.3 + 2.0 + float(k) * 4.0)) * (k == 0 ? 1.0 : 0.6);
    col *= 1.0 - (rim * 0.42 + tide * there * 0.4 + wash) * there * vec3(0.38, 0.66, 1.05);
  }

  // Fingerprints where it gets held: a corner of the cover, the foot of the sheet.
  for (int k = 0; k < 2; k++) {
    vec2 at = k == 0 ? vec2(0.9 * W, 0.82 * H) : vec2(0.07 * W, 4.86 * H);
    float a = k == 0 ? 0.35 : -0.5;
    vec2 q = mat2(cos(a), sin(a), -sin(a), cos(a)) * (sheet - at);
    float e = length(q / (vec2(9.0, 12.0) * s));
    float ridges = 0.5 + 0.5 * sin(length(q * vec2(1.0, 0.8)) * 3.6 + noise(q * 0.15) * 3.0);
    col *= 1.0 - smoothstep(1.0, 0.55, e) * ridges * 0.05;
  }

  }

  col *= shade * ao;

  // Ink: a couple of drops by the first note, a smear, a pen being tested.
  float ink = 0.0;
  vec2 drop = vec2(0.76 * W, 1.83 * H);
  ink = max(ink, inkDot(sheet, drop, 1.7 * s));
  ink = max(ink, inkDot(sheet, drop + vec2(5.0, 3.0) * s, 0.8 * s));
  ink = max(ink, inkDot(sheet, vec2(0.21 * W, 2.3 * H), 1.1 * s));
  {
    vec2 q = sheet - vec2(0.9 * W, 2.62 * H);
    float a = -0.25;
    q = mat2(cos(a), sin(a), -sin(a), cos(a)) * q;
    float e = length(q / (vec2(24.0, 5.0) * s));
    float streak = 0.5 + 0.5 * noise(vec2(q.x * 0.04, q.y * 0.9));
    ink = max(ink, exp(-e * e * 2.0) * 0.12 * streak);
  }
  {
    // Loops of a pen being tried out in the corner of the last panel.
    vec2 q = sheet - vec2(0.07 * W, 4.72 * H);
    float len = 70.0 * s, r = 5.5 * s;
    if (q.x > -r - 2.0 && q.x < len + r + 2.0 && abs(q.y) < r * 2.0) {
      float best = 1e3, at = 0.0;
      vec2 prev = vec2(0.0, r);
      for (int k = 1; k <= 72; k++) {
        float t = float(k) / 72.0;
        float th = t * 6.283 * 6.5;
        float rk = r * (0.75 + 0.25 * sin(t * 9.0));
        vec2 p = vec2(t * len - rk * sin(th), rk * cos(th) - t * 3.0 * s);
        vec2 ab = p - prev, ap = q - prev;
        float h = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
        float dd = length(ap - ab * h);
        if (dd < best) { best = dd; at = t; }
        prev = p;
      }
      float pressure = smoothstep(0.0, 0.08, at) * smoothstep(1.0, 0.8, at);
      float dry = 0.35 + 0.65 * smoothstep(0.25, 0.5, noise(vec2(at * 14.0, 3.0)));
      ink = max(ink, smoothstep(0.8, 0.3, best) * 0.8 * pressure * dry);
    }
  }
  col = mix(col, INK * shade, ink * (1.0 - uBack));

  o = vec4(col * alpha, alpha);
}`;

export type PanelSpec = {
  canvas: HTMLCanvasElement;
  index: number;
  offset: number;
  lean: 1 | -1;
  topCrease: boolean;
  bottomCrease: boolean;
  back?: boolean;
};

type Renderer = {
  render: (panels: PanelSpec[], w: number, h: number, tint: [number, number, number]) => void;
};

let pending: Promise<Renderer | null> | null = null;

function load(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** The shared renderer, or null where WebGL2 isn't available. */
export function paperRenderer() {
  pending ??= (async () => {
    const gl = document
      .createElement('canvas')
      .getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    if (!gl) return null;
    let imgs: HTMLImageElement[];
    try {
      imgs = await Promise.all(
        ['paper-normal.jpg', 'paper-color.jpg', 'paper-crumple.jpg'].map((f) =>
          load(`${BASE}/${f}`),
        ),
      );
    } catch {
      return null;
    }

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    ['uNormal', 'uColor', 'uCrumple'].forEach((name, i) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[i]);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.uniform1i(gl.getUniformLocation(prog, name), i);
    });
    const u = (n: string) => gl.getUniformLocation(prog, n);

    return {
      render(panels, w, h, tint) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = Math.round(w * dpr);
        const ch = Math.round(h * dpr);
        gl.canvas.width = cw;
        gl.canvas.height = ch;
        gl.viewport(0, 0, cw, ch);
        gl.uniform2f(u('uSize'), w, h);
        gl.uniform3f(u('uTint'), ...tint);
        for (const p of panels) {
          gl.uniform1f(u('uOffset'), p.offset);
          gl.uniform1f(u('uIndex'), p.index);
          gl.uniform1f(u('uLean'), p.lean);
          gl.uniform1f(u('uTopCrease'), p.topCrease ? 1 : 0);
          gl.uniform1f(u('uBottomCrease'), p.bottomCrease ? 1 : 0);
          gl.uniform1f(u('uBack'), p.back ? 1 : 0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          p.canvas.width = cw;
          p.canvas.height = ch;
          p.canvas.getContext('2d')!.drawImage(gl.canvas as HTMLCanvasElement, 0, 0);
          p.canvas.dataset.ready = '';
        }
      },
    } satisfies Renderer;
  })().catch(() => null);
  return pending;
}
