/* Grimoire de Vitrail — effets : éclats de verre, étincelles, poussières, transition en rosace
 * Pensé pour rester fluide sur téléphone : les éclats sont découpés une seule fois
 * (petits canevas pré-rendus), le canevas d'effets ne travaille que s'il y a quelque chose
 * à montrer, et les poussières sont dessinées en basse résolution. */
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
  let dirty = false;
  const shards = [];
  const sparks = [];
  const dust = [];

  FX.init = function () {
    fx = document.getElementById('fx');
    fctx = fx.getContext('2d');
    motes = document.getElementById('motes');
    mctx = motes.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 22; i++) dust.push(newMote(true));
    requestAnimationFrame(loop);
  };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    fx.width = Math.round(W * dpr);
    fx.height = Math.round(H * dpr);
    fx.style.width = W + 'px';
    fx.style.height = H + 'px';
    // poussières : résolution réduite, invisible à l'œil
    motes.width = Math.round(W / 2);
    motes.height = Math.round(H / 2);
    motes.style.width = W + 'px';
    motes.style.height = H + 'px';
  }

  function newMote(anyY) {
    return { x: Math.random() * W, y: anyY ? Math.random() * H : H + 5, vy: -(4 + Math.random() * 9), ph: Math.random() * 6, s: Math.random() < 0.2 ? 2 : 1, a: 0.15 + Math.random() * 0.3 };
  }

  // ------------------------------------------------------------ éclats de verre
  /**
   * Brise un rectangle d'écran en éclats qui retombent.
   * src : image ou canevas ; rect : {left, top, width, height} ; o : {power, count}
   */
  FX.shatter = function (src, rect, o) {
    o = o || {};
    const n = o.count || 9;
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.45;
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
    const angles = [];
    for (let i = 0; i < n; i++) angles.push(((i + Math.random() * 0.7) / n) * Math.PI * 2);
    const ringR = Math.min(rect.width, rect.height) * (0.24 + Math.random() * 0.08);
    const ring = angles.map((a) => [cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR]);
    const outer = angles.map(toEdge);
    const polys = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      polys.push([[cx, cy], ring[i], ring[j]]);
      polys.push([ring[i], ring[j], outer[j], outer[i]]);
    }
    const power = o.power || 1;
    for (const p of polys) {
      const xs = p.map((q) => q[0]);
      const ys = p.map((q) => q[1]);
      const x0 = Math.floor(Math.min(...xs));
      const y0 = Math.floor(Math.min(...ys));
      const w = Math.ceil(Math.max(...xs)) - x0 + 2;
      const h = Math.ceil(Math.max(...ys)) - y0 + 2;
      if (w < 3 || h < 3) continue;
      // découpe unique de l'éclat dans un petit canevas
      const c = document.createElement('canvas');
      c.width = Math.ceil(w * dpr);
      c.height = Math.ceil(h * dpr);
      const x = c.getContext('2d');
      x.scale(dpr, dpr);
      x.beginPath();
      p.forEach((q, k) => (k ? x.lineTo(q[0] - x0, q[1] - y0) : x.moveTo(q[0] - x0, q[1] - y0)));
      x.closePath();
      x.save();
      x.clip();
      try {
        x.drawImage(src, rect.left - x0, rect.top - y0, rect.width, rect.height);
      } catch (e) {
        x.fillStyle = '#334';
        x.fill();
      }
      x.fillStyle = 'rgba(255,255,255,0.12)';
      x.fill();
      x.restore();
      x.strokeStyle = 'rgba(12,10,9,0.95)';
      x.lineWidth = 2;
      x.stroke();
      const pcx = x0 + w / 2;
      const pcy = y0 + h / 2;
      const dx = pcx - cx;
      const dy = pcy - cy;
      const d = Math.hypot(dx, dy) || 1;
      const sp = (110 + Math.random() * 220) * power;
      shards.push({
        c, w, h,
        x: pcx, y: pcy,
        vx: (dx / d) * sp + (Math.random() - 0.5) * 50,
        vy: (dy / d) * sp - 110 * power - Math.random() * 70,
        r: 0,
        vr: (Math.random() - 0.5) * 8,
        life: 1.1 + Math.random() * 0.4,
        t: 0,
      });
    }
    for (let i = 0; i < 18 * power; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 240 * power;
      sparks.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.5 + Math.random() * 0.5, t: 0, c: Math.random() < 0.5 ? '255,236,180' : '180,210,255' });
    }
    dirty = true;
  };

  /** Petite gerbe de lumière (impact, carte jouée). */
  FX.burst = function (x, y, color, n) {
    for (let i = 0; i < (n || 12); i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 200;
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.3 + Math.random() * 0.4, t: 0, c: color || '255,220,170' });
    }
    if (sparks.length > 160) sparks.splice(0, sparks.length - 160);
    dirty = true;
  };

  // ------------------------------------------------------------ transition en rosace
  FX.iris = function (midway) {
    const fast = G.UI && G.UI.settings && G.UI.settings.fast;
    const dur = fast ? 700 : 1100;
    return new Promise((resolve) => {
      const el = document.getElementById('iris');
      el.style.setProperty('--iris', dur + 'ms');
      el.classList.toggle('run', false);
      void el.offsetWidth;
      el.classList.add('run');
      setTimeout(() => {
        if (midway) midway();
      }, dur * 0.51);
      setTimeout(() => {
        el.classList.toggle('run', false);
        resolve();
      }, dur + 20);
    });
  };

  // ------------------------------------------------------------ boucle
  let last = 0;
  let frame = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    const t = ts / 1000;
    const dt = Math.min(0.05, last ? t - last : 0.016);
    last = t;
    frame++;

    // poussières : une image sur deux suffit
    if (frame % 2 === 0) {
      mctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
      mctx.clearRect(0, 0, W, H);
      for (const m of dust) {
        m.ph += dt * 2;
        m.y += m.vy * dt * 2;
        m.x += Math.sin(m.ph * 0.7) * 10 * dt;
        if (m.y < -5) Object.assign(m, newMote(false));
        mctx.fillStyle = `rgba(255,236,200,${m.a})`;
        mctx.fillRect(m.x, m.y, m.s * 2, m.s * 2);
      }
    }

    if (!dirty) return;
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
      fctx.globalAlpha = Math.min(1, (s.life - s.t) / 0.35);
      fctx.translate(s.x, s.y);
      fctx.rotate(s.r);
      fctx.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fctx.globalAlpha = 1;
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
      fctx.fillStyle = `rgba(${p.c},${1 - p.t / p.life})`;
      fctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    // plus rien à animer : on efface une dernière fois puis on se repose
    if (!shards.length && !sparks.length) {
      fctx.clearRect(0, 0, W, H);
      dirty = false;
    }
  }
})(window.G = window.G || {});
