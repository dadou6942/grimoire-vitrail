/* Grimoire de Vitrail — effets : éclats de verre, lumière, poussières, transition en rosace */
(function (G) {
  'use strict';

  const FX = {};
  G.FX = FX;
  let fx;
  let fctx;
  let motes;
  let mctx;
  let W = 0;
  let H = 0;
  let dpr = 1;
  const shards = [];
  const sparks = [];
  const dust = [];
  const light = { x: 0, y: 0, tx: 0, ty: 0, touchT: 0 };

  FX.init = function () {
    fx = document.getElementById('fx');
    fctx = fx.getContext('2d');
    motes = document.getElementById('motes');
    mctx = motes.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    const follow = (e) => {
      light.tx = e.clientX;
      light.ty = e.clientY;
      light.touchT = 2.5;
    };
    window.addEventListener('pointermove', follow, { passive: true });
    window.addEventListener('pointerdown', follow, { passive: true });
    for (let i = 0; i < 38; i++) dust.push(newMote(true));
    requestAnimationFrame(loop);
  };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    for (const c of [fx, motes]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.style.width = W + 'px';
      c.style.height = H + 'px';
    }
  }

  function newMote(anyY) {
    return { x: Math.random() * W, y: anyY ? Math.random() * H : H + 5, vy: -(4 + Math.random() * 10), ph: Math.random() * 6, s: Math.random() < 0.2 ? 2 : 1.2, a: 0.15 + Math.random() * 0.35 };
  }

  // ------------------------------------------------------------ éclats de verre
  /**
   * Brise un rectangle d'écran en éclats qui retombent.
   * src : image ou canvas à découper ; rect : {left, top, width, height} ; o : {power, count, cx, cy}
   */
  FX.shatter = function (src, rect, o) {
    o = o || {};
    const n = o.count || 14;
    const cx = rect.left + rect.width * (o.cx !== undefined ? o.cx : 0.5);
    const cy = rect.top + rect.height * (o.cy !== undefined ? o.cy : 0.45);
    const R = Math.hypot(rect.width, rect.height);
    const angles = [];
    for (let i = 0; i < n; i++) angles.push(((i + Math.random() * 0.7) / n) * Math.PI * 2);
    const ringR = Math.min(rect.width, rect.height) * (0.22 + Math.random() * 0.1);
    const ring = angles.map((a) => [cx + Math.cos(a) * ringR * (0.7 + Math.random() * 0.6), cy + Math.sin(a) * ringR * (0.7 + Math.random() * 0.6)]);
    // points extérieurs : intersection du rayon avec le bord du rectangle
    const toEdge = (a) => {
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      let t = Infinity;
      if (dx > 1e-6) t = Math.min(t, (rect.left + rect.width - cx) / dx);
      if (dx < -1e-6) t = Math.min(t, (rect.left - cx) / dx);
      if (dy > 1e-6) t = Math.min(t, (rect.top + rect.height - cy) / dy);
      if (dy < -1e-6) t = Math.min(t, (rect.top - cy) / dy);
      return [cx + dx * t, cy + dy * t];
    };
    const outer = angles.map(toEdge);
    const polys = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      polys.push([[cx, cy], ring[i], ring[j]]);
      // fragment extérieur coupé en deux
      const mid = [(outer[i][0] + outer[j][0]) / 2, (outer[i][1] + outer[j][1]) / 2];
      const mr = [(ring[i][0] + ring[j][0]) / 2, (ring[i][1] + ring[j][1]) / 2];
      polys.push([ring[i], mr, mid, outer[i]]);
      polys.push([mr, ring[j], outer[j], mid]);
    }
    const power = o.power || 1;
    for (const p of polys) {
      const pc = p.reduce((s, q) => [s[0] + q[0] / p.length, s[1] + q[1] / p.length], [0, 0]);
      const dx = pc[0] - cx;
      const dy = pc[1] - cy;
      const d = Math.hypot(dx, dy) || 1;
      const sp = (120 + Math.random() * 260) * power;
      shards.push({
        poly: p.map((q) => [q[0] - pc[0], q[1] - pc[1]]),
        x: pc[0],
        y: pc[1],
        ox: pc[0],
        oy: pc[1],
        vx: (dx / d) * sp + (Math.random() - 0.5) * 60,
        vy: (dy / d) * sp - 120 * power - Math.random() * 80,
        r: 0,
        vr: (Math.random() - 0.5) * 9,
        life: 1.3 + Math.random() * 0.5,
        t: 0,
        src,
        rect,
      });
    }
    // étincelles de lumière
    for (let i = 0; i < 26 * power; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 280 * power;
      sparks.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.5 + Math.random() * 0.6, t: 0, c: Math.random() < 0.5 ? '255,236,180' : '180,210,255' });
    }
  };

  /** Petite gerbe de lumière (impact). */
  FX.burst = function (x, y, color, n) {
    for (let i = 0; i < (n || 14); i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 220;
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.35 + Math.random() * 0.45, t: 0, c: color || '255,220,170' });
    }
  };

  /** Instantané d'une carte (DOM) en canvas, pour la briser. */
  FX.cardSnapshot = function (el) {
    const r = el.getBoundingClientRect();
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(r.width));
    c.height = Math.max(1, Math.round(r.height));
    const x = c.getContext('2d');
    const cs = getComputedStyle(el);
    const g = x.createLinearGradient(0, 0, c.width * 0.4, c.height);
    g.addColorStop(0, cs.getPropertyValue('--tint1').trim() || '#4a0d18');
    g.addColorStop(1, cs.getPropertyValue('--tint2').trim() || '#1a0509');
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    const img = el.querySelector('.c-art img');
    if (img && img.complete) {
      try {
        x.drawImage(img, c.width * 0.07, c.height * 0.06, c.width * 0.86, c.height * 0.46);
      } catch (e) {
        /* ignoré */
      }
    }
    x.strokeStyle = '#d9ad52';
    x.lineWidth = 3;
    x.strokeRect(1.5, 1.5, c.width - 3, c.height - 3);
    x.fillStyle = 'rgba(245,220,150,0.8)';
    x.fillRect(c.width * 0.15, c.height * 0.58, c.width * 0.7, 2);
    return c;
  };

  // ------------------------------------------------------------ transition en rosace
  FX.iris = function (midway) {
    return new Promise((resolve) => {
      const el = document.getElementById('iris');
      el.classList.remove('run');
      void el.offsetWidth;
      el.classList.add('run');
      setTimeout(() => {
        if (midway) midway();
      }, 560);
      setTimeout(() => {
        el.classList.remove('run');
        resolve();
      }, 1120);
    });
  };

  // ------------------------------------------------------------ boucle
  let last = 0;
  let lightTick = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    const t = ts / 1000;
    const dt = Math.min(0.05, last ? t - last : 0.016);
    last = t;

    // lumière : suit le doigt, sinon dérive lentement
    light.touchT -= dt;
    if (light.touchT <= 0) {
      light.tx = W * (0.5 + Math.sin(t * 0.23) * 0.42);
      light.ty = H * (0.22 + Math.sin(t * 0.17 + 1) * 0.18);
    }
    const k = Math.min(1, dt * (light.touchT > 0 ? 8 : 1.5));
    light.x += (light.tx - light.x) * k;
    light.y += (light.ty - light.y) * k;
    lightTick += dt;
    if (lightTick > 1 / 30) {
      lightTick = 0;
      updateLit();
    }

    // poussières dans les rais
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.clearRect(0, 0, W, H);
    for (const m of dust) {
      m.ph += dt;
      m.y += m.vy * dt;
      m.x += Math.sin(m.ph * 0.7) * 6 * dt;
      if (m.y < -5) Object.assign(m, newMote(false));
      const near = Math.max(0, 1 - Math.hypot(m.x - light.x, m.y - light.y) / (W * 0.6));
      mctx.fillStyle = `rgba(255,236,200,${m.a * (0.35 + near)})`;
      mctx.fillRect(m.x, m.y, m.s, m.s);
    }

    // éclats
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.clearRect(0, 0, W, H);
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.t += dt;
      if (s.t > s.life) {
        shards.splice(i, 1);
        continue;
      }
      s.vy += 900 * dt;
      s.vx *= 1 - 0.6 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.r += s.vr * dt;
      const a = Math.min(1, (s.life - s.t) / 0.4);
      fctx.save();
      fctx.globalAlpha = a;
      fctx.translate(s.x, s.y);
      fctx.rotate(s.r);
      fctx.beginPath();
      s.poly.forEach((q, j) => (j ? fctx.lineTo(q[0], q[1]) : fctx.moveTo(q[0], q[1])));
      fctx.closePath();
      fctx.save();
      fctx.clip();
      try {
        fctx.drawImage(s.src, s.rect.left - s.ox, s.rect.top - s.oy, s.rect.width, s.rect.height);
      } catch (e) {
        fctx.fillStyle = '#334';
        fctx.fill();
      }
      // reflet sur la tranche
      fctx.fillStyle = `rgba(255,255,255,${0.12 + 0.18 * Math.abs(Math.sin(s.r * 2))})`;
      fctx.fill();
      fctx.restore();
      fctx.strokeStyle = 'rgba(10,8,8,0.9)';
      fctx.lineWidth = 2;
      fctx.stroke();
      fctx.strokeStyle = 'rgba(255,240,200,0.35)';
      fctx.lineWidth = 0.8;
      fctx.stroke();
      fctx.restore();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.t += dt;
      if (p.t > p.life) {
        sparks.splice(i, 1);
        continue;
      }
      p.vy += 300 * dt;
      p.vx *= 1 - 2 * dt;
      p.vy *= 1 - 2 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = 1 - p.t / p.life;
      fctx.fillStyle = `rgba(${p.c},${a})`;
      fctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
  }

  function updateLit() {
    const els = document.querySelectorAll('.screen.show .lit, .overlay.show .lit');
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const gx = ((light.x - r.left) / r.width) * 100;
      const gy = ((light.y - r.top) / r.height) * 100;
      el.style.setProperty('--gx', gx.toFixed(1) + '%');
      el.style.setProperty('--gy', gy.toFixed(1) + '%');
      el.style.setProperty('--sheen', (120 - G_clamp(gx, -50, 150) * 0.9).toFixed(1) + '%');
    }
  }
  const G_clamp = (v, a, b) => Math.max(a, Math.min(b, v));
})(window.G = window.G || {});
