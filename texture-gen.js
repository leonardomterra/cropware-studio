/* ============================================================================
 * texture-gen.js — gerador de texturas vetoriais procedurais (fonte única).
 * Usado pelo lab (/design) e pelo app (overlay de textura nos posts).
 * Expõe window.TextureGen.overlaySVG({ type, scale, thickness, seed, w, h }).
 *
 * Modo "overlay": fundo transparente, traço branco (#fff). A opacidade, o
 * mix-blend-mode, o grayscale e o invert ficam por conta do CSS de quem usa
 * (no app, o .signal-photo-texture já faz isso).
 * ==========================================================================*/
(function (root) {
  const TAU = Math.PI * 2;

  /* ---------- ruído de gradiente (Perlin) + fbm ---------- */
  function makeNoise(seed) {
    function grad(xi, yi) {
      let h = (xi * 374761393 + yi * 668265263 + seed * 1442695041) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      const a = ((h ^ (h >>> 16)) >>> 0) / 4294967295 * TAU;
      return [Math.cos(a), Math.sin(a)];
    }
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const g00 = grad(xi, yi), g10 = grad(xi + 1, yi), g01 = grad(xi, yi + 1), g11 = grad(xi + 1, yi + 1);
      const d00 = g00[0] * xf + g00[1] * yf, d10 = g10[0] * (xf - 1) + g10[1] * yf;
      const d01 = g01[0] * xf + g01[1] * (yf - 1), d11 = g11[0] * (xf - 1) + g11[1] * (yf - 1);
      const u = fade(xf), v = fade(yf);
      return ((d00 * (1 - u) + d10 * u) * (1 - v) + (d01 * (1 - u) + d11 * u) * v) * 0.7 + 0.5;
    };
  }
  function fbm(n, x, y, oct) {
    let s = 0, a = 0.5, f = 1, nm = 0;
    for (let i = 0; i < oct; i++) { s += a * n(x * f, y * f); nm += a; a *= 0.5; f *= 2; }
    return s / nm;
  }
  function rng(seed) {
    let a = (seed * 2654435761) >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  /* ---------- helpers de path ---------- */
  function chain(segs) {
    const key = p => `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;
    const map = new Map();
    segs.forEach((s, i) => { for (const e of [0, 1]) { const k = key(s[e]); let arr = map.get(k); if (!arr) { arr = []; map.set(k, arr); } arr.push(i); } });
    const used = new Array(segs.length).fill(false);
    const find = pt => { const arr = map.get(key(pt)); if (arr) for (const si of arr) if (!used[si]) return si; return -1; };
    const lines = [];
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      const line = [segs[i][0], segs[i][1]];
      for (let dir = 0; dir < 2; dir++) {
        while (true) {
          const pt = dir === 0 ? line[line.length - 1] : line[0];
          const si = find(pt); if (si < 0) break;
          used[si] = true;
          const a = segs[si][0], b = segs[si][1];
          const next = key(a) === key(pt) ? b : a;
          if (dir === 0) line.push(next); else line.unshift(next);
        }
      }
      lines.push(line);
    }
    return lines;
  }
  function smoothPath(pts, k) {
    let n = pts.length;
    if (n < 2) return '';
    const closed = n > 3 && Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]) < 0.6;
    if (closed) { pts = pts.slice(0, -1); n--; }
    const f = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    if (k <= 0 || n === 2) { let d = `M${f(pts[0])}`; for (let i = 1; i < n; i++) d += `L${f(pts[i])}`; return d + (closed ? 'Z' : ''); }
    const get = i => closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${f(pts[0])}`;
    const end = closed ? n : n - 1;
    for (let i = 0; i < end; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const c1x = p1[0] + (p2[0] - p0[0]) * k, c1y = p1[1] + (p2[1] - p0[1]) * k;
      const c2x = p2[0] - (p3[0] - p1[0]) * k, c2y = p2[1] - (p3[1] - p1[1]) * k;
      d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${f(p2)}`;
    }
    return d + (closed ? 'Z' : '');
  }
  function contourD(field, cols, rows, iso, tension, W, H) {
    const stride = cols + 1, cw = W / cols, ch = H / rows;
    const at = (i, j) => field[j * stride + i];
    const segs = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), e = at(i, j + 1);
      let idx = 0; if (a > iso) idx |= 8; if (b > iso) idx |= 4; if (c > iso) idx |= 2; if (e > iso) idx |= 1;
      if (idx === 0 || idx === 15) continue;
      const x0 = i * cw, y0 = j * ch, x1 = x0 + cw, y1 = y0 + ch;
      const lp = (p, q, va, vb) => p + (q - p) * ((iso - va) / (vb - va));
      const top = () => [lp(x0, x1, a, b), y0], right = () => [x1, lp(y0, y1, b, c)];
      const bot = () => [lp(x0, x1, e, c), y1], lft = () => [x0, lp(y0, y1, a, e)];
      switch (idx) {
        case 1: case 14: segs.push([lft(), bot()]); break;
        case 2: case 13: segs.push([bot(), right()]); break;
        case 3: case 12: segs.push([lft(), right()]); break;
        case 4: case 11: segs.push([top(), right()]); break;
        case 6: case 9: segs.push([top(), bot()]); break;
        case 7: case 8: segs.push([lft(), top()]); break;
        case 5: segs.push([lft(), top()]); segs.push([bot(), right()]); break;
        case 10: segs.push([top(), right()]); segs.push([lft(), bot()]); break;
      }
    }
    let d = '';
    for (const line of chain(segs)) d += smoothPath(line, tension);
    return d;
  }
  function roundedPolyD(cx, cy, R, sides, rotRad, r) {
    const V = [];
    for (let i = 0; i < sides; i++) { const a = rotRad - Math.PI / 2 + i * TAU / sides; V.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
    const nrm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    let d = '';
    for (let i = 0; i < sides; i++) {
      const a = V[i], b = V[(i + 1) % sides], c = V[(i + 2) % sides];
      const ba = nrm(a[0] - b[0], a[1] - b[1]), bc = nrm(c[0] - b[0], c[1] - b[1]);
      const p1 = [b[0] + ba[0] * r, b[1] + ba[1] * r], p2 = [b[0] + bc[0] * r, b[1] + bc[1] * r];
      d += (i === 0 ? 'M' : 'L') + `${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
      d += `Q${b[0].toFixed(1)} ${b[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }

  const lerp = (a, b, t) => a + (b - a) * t;

  /* ============================================================
   * Geradores de OVERLAY — recebem {s (0..1), t (0..1), seed, W, H}
   * s = escala (densidade/tamanho), t = espessura. Retornam innerSVG.
   * ==========================================================*/
  const GEN = {
    topografia(o) {
      const W = o.W, H = o.H, AR = H / W;
      const scale = lerp(3, 16, o.s), width = lerp(0.8, 6, o.t);
      const cols = Math.min(360, Math.max(140, Math.round(120 + scale * 12))), rows = Math.round(cols * AR), stride = cols + 1;
      const base = makeNoise(o.seed), wa = makeNoise(o.seed + 101), wb = makeNoise(o.seed + 211);
      const N = stride * (rows + 1), field = new Float32Array(N); let mn = Infinity, mx = -Infinity;
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * scale, y = (j / rows) * scale * AR;
        const qx = fbm(wa, x * 0.55, y * 0.55, 3) - 0.5, qy = fbm(wb, x * 0.55 + 5.2, y * 0.55 + 1.3, 3) - 0.5;
        const v = fbm(base, x + qx * 2.2, y + qy * 2.2, 4);
        field[j * stride + i] = v; if (v < mn) mn = v; if (v > mx) mx = v;
      }
      const inv = mx > mn ? 1 / (mx - mn) : 1; for (let k = 0; k < N; k++) field[k] = (field[k] - mn) * inv;
      const levels = 18; let d = '';
      for (let l = 1; l <= levels; l++) d += contourD(field, cols, rows, l / (levels + 1), 0.16, W, H);
      return `<path d="${d}" stroke-width="${width.toFixed(2)}"/>`;
    },
    ondas(o) {
      const W = o.W, H = o.H;
      const lines = Math.round(lerp(10, 60, o.s)), width = lerp(0.8, 6, o.t);
      const n = makeNoise(o.seed), dx = W / 200, freq = 7 / W, amp = (H / lines) * 0.85;
      let d = '';
      for (let li = 0; li < lines; li++) {
        const baseY = (li + 0.5) / lines * H, pts = [];
        for (let x = 0; x <= W; x += dx) pts.push([x, baseY + amp * (fbm(n, x * freq, li * 0.45, 2) - 0.5) * 2]);
        d += smoothPath(pts, 0.16);
      }
      return `<path d="${d}" stroke-width="${width.toFixed(2)}"/>`;
    },
    aneis(o) {
      const W = o.W, H = o.H;
      const N = Math.round(lerp(14, 50, o.s)), width = lerp(0.6, 5, o.t), lobes = 5, amp = 0.6 * 0.5;
      const cx = W / 2, cy = H / 2, Rmax = Math.min(W, H) * 0.62, Rmin = Rmax * 0.05;
      const r = rng(o.seed + 13), lob = [], pha = []; let sum = 0;
      for (let h = 1; h <= lobes; h++) { const a = (0.4 + 0.6 * r()) / Math.pow(h, 0.75); lob.push(a); pha.push(r() * TAU); sum += a; }
      for (let h = 0; h < lobes; h++) lob[h] /= sum;
      const rot = 12 * Math.PI / 180, M = 150; let d = '';
      for (let i = 0; i < N; i++) {
        const t = N > 1 ? i / (N - 1) : 0, R = Rmax + (Rmin - Rmax) * t, rp = i * rot, pts = [];
        for (let m = 0; m <= M; m++) {
          const th = (m / M) * TAU; let rr = 1;
          for (let h = 0; h < lobes; h++) rr += amp * lob[h] * Math.sin((h + 1) * th + pha[h] + rp);
          pts.push([cx + Math.cos(th) * R * rr, cy + Math.sin(th) * R * rr]);
        }
        d += smoothPath(pts, 0.16);
      }
      return `<path d="${d}" stroke-width="${width.toFixed(2)}"/>`;
    },
    caos(o) {
      const W = o.W, H = o.H;
      const N = Math.round(lerp(18, 60, o.s)), width = lerp(0.5, 4, o.t), lobes = 5, amp = 0.6 * 0.6;
      const cx = W / 2, cy = H / 2, Rmax = Math.min(W, H) * 0.62, Rmin = Rmax * 0.16;
      const r = rng(o.seed + 23), lob = [], pha = []; let sum = 0;
      for (let h = 1; h <= lobes; h++) { const a = (0.4 + 0.6 * r()) / Math.pow(h, 0.75); lob.push(a); pha.push(r() * TAU); sum += a; }
      for (let h = 0; h < lobes; h++) lob[h] /= sum;
      const rot = 4 * Math.PI / 180, M = 150; let paths = '';
      for (let i = 0; i < N; i++) {
        const t = N > 1 ? i / (N - 1) : 0, R = Rmax + (Rmin - Rmax) * t, rp = i * rot, pts = [];
        for (let m = 0; m <= M; m++) {
          const th = (m / M) * TAU; let rr = 1;
          for (let h = 0; h < lobes; h++) rr += amp * lob[h] * Math.sin((h + 1) * th + pha[h] + rp);
          pts.push([cx + Math.cos(th) * R * rr, cy + Math.sin(th) * R * rr]);
        }
        const op = (0.4 + 0.6 * r()).toFixed(2);
        const da = ` stroke-dasharray="${4 + Math.floor(r() * 12)} ${2 + Math.floor(r() * 6)}"`;
        paths += `<path d="${smoothPath(pts, 0.16)}" stroke-opacity="${op}"${da}/>`;
      }
      return `<g stroke-width="${width.toFixed(2)}">${paths}</g>`;
    },
    squiggle(o) {
      const W = o.W, H = o.H;
      const rows = Math.round(lerp(8, 46, o.s)), width = lerp(1, 8, o.t);
      const n = makeNoise(o.seed), dx = W / 200, freq = 7 / W, amp = (H / rows) * 1.1;
      let d = '';
      for (let i = 0; i < rows; i++) {
        const by = (i + 0.5) / rows * H, pts = [];
        for (let x = 0; x <= W; x += dx) pts.push([x, by + amp * (fbm(n, x * freq, 7.3, 2) - 0.5)]);
        d += smoothPath(pts, 0.16);
      }
      return `<path d="${d}" stroke-width="${width.toFixed(2)}"/>`;
    },
    giro(o) {
      const W = o.W, H = o.H;
      const N = Math.round(lerp(14, 44, o.s)), width = lerp(0.6, 5, o.t), sides = 6, round = 0.35;
      const cx = W / 2, cy = H / 2, Rmax = Math.min(W, H) * 0.62, Rmin = Rmax * 0.04, rot = 2 * Math.PI / 180;
      let paths = '';
      for (let i = 0; i < N; i++) {
        const t = N > 1 ? i / (N - 1) : 0, R = Rmin + (Rmax - Rmin) * t;
        const edge = 2 * R * Math.sin(Math.PI / sides), r = Math.min(edge * 0.5, round * R * 0.7);
        const op = (1 - t * 0.9).toFixed(2);
        paths += `<path d="${roundedPolyD(cx, cy, R, sides, i * rot, r)}" stroke-opacity="${op}"/>`;
      }
      return `<g stroke-width="${width.toFixed(2)}" stroke-linejoin="round">${paths}</g>`;
    },
  };

  const TYPES = ['topografia', 'ondas', 'aneis', 'caos', 'squiggle', 'giro'];
  const LABELS = { topografia: 'Topografia', ondas: 'Ondas', aneis: 'Anéis', caos: 'Caos', squiggle: 'Squiggle', giro: 'Giro' };

  // innerSVG do tipo (sem <svg> wrapper), traço branco.
  function inner(opts) {
    const type = TYPES.includes(opts.type) ? opts.type : 'topografia';
    const o = {
      s: Math.max(0, Math.min(1, (opts.scale != null ? opts.scale : 50) / 100)),
      t: Math.max(0, Math.min(1, (opts.thickness != null ? opts.thickness : 50) / 100)),
      seed: (opts.seed | 0) || 1,
      W: opts.w || 1000, H: opts.h || 1000,
    };
    return GEN[type](o);
  }

  // SVG completo (overlay: fundo transparente, traço branco).
  function overlaySVG(opts) {
    const W = opts.w || 1000, H = opts.h || 1000;
    const g = inner(Object.assign({}, opts, { w: W, h: H }));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
      `<g fill="none" stroke="#ffffff" stroke-linecap="round">${g}</g></svg>`;
  }

  // data: URI pronto pra background-image.
  function overlayDataUri(opts) {
    return 'data:image/svg+xml,' + encodeURIComponent(overlaySVG(opts));
  }

  root.TextureGen = { TYPES, LABELS, inner, overlaySVG, overlayDataUri };
})(typeof window !== 'undefined' ? window : globalThis);
