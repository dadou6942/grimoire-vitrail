/* Grimoire de Vitrail — générateur de vitraux
 * Chaque image est un pavage de cellules de verre (Voronoï) cerclées de plomb.
 * Un motif vectoriel découpe les cellules en régions (fond, sujet, détail, éclat),
 * puis la grisaille peint les traits (visages, plis) par-dessus. */
(function (G) {
  'use strict';

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const PAL = {
    rubis: ['#6e0a16', '#951222', '#bd1d30', '#e0384b'],
    saphir: ['#0b2563', '#143a92', '#1f53bd', '#3b78de'],
    or: ['#8f620c', '#bb8719', '#dcae34', '#f5d77a'],
    emeraude: ['#0a442c', '#116540', '#1c8655', '#36ad74'],
    amethyste: ['#371462', '#511f88', '#6c31ad', '#9459d3'],
    ambre: ['#8d3d0d', '#b85715', '#d97724', '#f0a145'],
    os: ['#9d947d', '#bdb59c', '#d8d1b7', '#efe9d4'],
    nuit: ['#0b1024', '#121a36', '#1a2449', '#25305d'],
    braise: ['#ffcf6b', '#ffe39a', '#fff2c8', '#ffb347'],
    sang: ['#ff4a4a', '#ff7a5a', '#ffb08a', '#ff3030'],
    ciel: ['#9fd8ff', '#c9ecff', '#e9f8ff', '#7cc4ff'],
  };
  const PALRGB = {};
  for (const k in PAL) PALRGB[k] = PAL[k].map(hex);

  const hash = (a, b, c) => {
    let h = (a * 374761393 + b * 668265263 + (c || 0) * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  // ------------------------------------------------------------------ motifs
  // Chaque motif dessine dans une boîte 100 x 100 avec trois « encres » :
  // A = sujet, B = détail, C = éclat lumineux. paint() = grisaille.
  const M = {};
  const A = '#ff0000';
  const B = '#00ff00';
  const C = '#0000ff';

  function poly(x, pts, col) {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]);
    x.closePath();
    x.fill();
  }
  function circ(x, cx, cy, r, col) {
    x.fillStyle = col;
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.fill();
  }
  function ell(x, cx, cy, rx, ry, col, rot) {
    x.fillStyle = col;
    x.beginPath();
    x.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2);
    x.fill();
  }
  function rect(x, a, b, w, h, col) {
    x.fillStyle = col;
    x.fillRect(a, b, w, h);
  }
  function ring(x, cx, cy, r1, r2, col) {
    x.fillStyle = col;
    x.beginPath();
    x.arc(cx, cy, r2, 0, Math.PI * 2);
    x.arc(cx, cy, r1, 0, Math.PI * 2, true);
    x.fill();
  }
  function line(x, pts) {
    x.beginPath();
    x.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]);
    x.stroke();
  }
  function rot(x, cx, cy, a, fn) {
    x.save();
    x.translate(cx, cy);
    x.rotate(a);
    x.translate(-cx, -cy);
    fn();
    x.restore();
  }

  function sword(x, cx, cy, s, a) {
    rot(x, cx, cy, a || 0, () => {
      x.save();
      x.translate(cx, cy);
      x.scale(s, s);
      x.translate(-50, -50);
      poly(x, [50, 6, 56, 16, 56, 63, 44, 63, 44, 16], A);
      rect(x, 30, 63, 40, 7, B);
      rect(x, 46.5, 70, 7, 16, B);
      circ(x, 50, 90, 5.5, C);
      circ(x, 50, 66.5, 3, C);
      x.restore();
    });
  }
  function shieldShape(x, inset, col) {
    const i = inset;
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(22 + i, 14 + i);
    x.lineTo(78 - i, 14 + i);
    x.lineTo(78 - i, 48);
    x.quadraticCurveTo(76 - i, 76 - i * 0.5, 50, 92 - i * 1.4);
    x.quadraticCurveTo(24 + i, 76 - i * 0.5, 22 + i, 48);
    x.closePath();
    x.fill();
  }
  function flameShape(x, cx, by, w, h, col) {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(cx, by - h);
    x.bezierCurveTo(cx + w * 0.2, by - h * 0.6, cx + w, by - h * 0.55, cx + w * 0.55, by);
    x.quadraticCurveTo(cx, by + w * 0.35, cx - w * 0.55, by);
    x.bezierCurveTo(cx - w, by - h * 0.5, cx - w * 0.1, by - h * 0.5, cx, by - h);
    x.fill();
  }

  M.sword = { draw: (x) => sword(x, 50, 50, 1, 0.0), paint: (x) => line(x, [50, 14, 50, 60]) };
  M.swords = {
    draw: (x) => {
      sword(x, 50, 50, 0.95, -0.62);
      sword(x, 50, 50, 0.95, 0.62);
    },
  };
  M.shield = {
    draw: (x) => {
      shieldShape(x, 0, B);
      shieldShape(x, 6, A);
      poly(x, [50, 30, 55, 45, 70, 50, 55, 55, 50, 72, 45, 55, 30, 50, 45, 45], C);
    },
  };
  M.shieldSword = {
    draw: (x) => {
      sword(x, 50, 50, 1.05, 0.78);
      x.save();
      x.translate(50, 54);
      x.scale(0.72, 0.72);
      x.translate(-50, -50);
      shieldShape(x, 0, B);
      shieldShape(x, 6, A);
      circ(x, 50, 47, 9, C);
      x.restore();
    },
  };
  M.shieldFlame = {
    draw: (x) => {
      flameShape(x, 50, 96, 44, 92, C);
      x.save();
      x.translate(50, 56);
      x.scale(0.7, 0.7);
      x.translate(-50, -50);
      shieldShape(x, 0, B);
      shieldShape(x, 6, A);
      x.restore();
    },
  };
  M.flame = {
    draw: (x) => {
      flameShape(x, 50, 90, 36, 82, A);
      flameShape(x, 52, 90, 22, 54, B);
      flameShape(x, 51, 90, 11, 28, C);
    },
  };
  M.shard = {
    draw: (x) => {
      poly(x, [50, 4, 64, 40, 54, 96, 38, 46], A);
      poly(x, [50, 4, 38, 46, 30, 30], B);
      poly(x, [64, 40, 82, 58, 54, 96], B);
      poly(x, [38, 46, 18, 70, 54, 96], A);
      poly(x, [50, 22, 56, 42, 48, 60, 44, 42], C);
    },
  };
  M.tower = {
    draw: (x) => {
      rect(x, 30, 32, 40, 62, A);
      for (let i = 0; i < 4; i++) rect(x, 28 + i * 12, 22, 8, 12, A);
      poly(x, [26, 34, 74, 34, 70, 40, 30, 40], B);
      x.fillStyle = C;
      x.beginPath();
      x.moveTo(43, 94);
      x.lineTo(43, 72);
      x.quadraticCurveTo(50, 60, 57, 72);
      x.lineTo(57, 94);
      x.fill();
      rect(x, 46, 48, 8, 12, C);
    },
  };
  M.fist = {
    draw: (x) => {
      rect(x, 30, 62, 40, 30, B);
      x.fillStyle = A;
      x.beginPath();
      x.roundRect(24, 22, 52, 44, 12);
      x.fill();
      for (let i = 0; i < 4; i++) {
        x.fillStyle = B;
        x.beginPath();
        x.roundRect(27 + i * 12, 18, 11, 20, 5);
        x.fill();
      }
      ell(x, 70, 48, 9, 14, A, 0.4);
      circ(x, 50, 78, 5, C);
    },
  };
  M.lance = {
    draw: (x) => {
      rot(x, 50, 50, 0.55, () => {
        rect(x, 47.5, 20, 5, 76, B);
        poly(x, [50, 2, 58, 24, 50, 30, 42, 24], A);
        poly(x, [52, 32, 82, 38, 72, 46, 82, 54, 52, 52], C);
      });
    },
  };
  M.candle = {
    draw: (x) => {
      rect(x, 38, 42, 24, 46, A);
      ell(x, 50, 42, 12, 4, A);
      poly(x, [26, 88, 74, 88, 66, 96, 34, 96], B);
      flameShape(x, 50, 36, 9, 28, C);
    },
    paint: (x) => line(x, [44, 50, 44, 80]),
  };
  M.crown = {
    draw: (x) => {
      poly(x, [16, 74, 18, 30, 34, 52, 50, 22, 66, 52, 82, 30, 84, 74], A);
      rect(x, 16, 72, 68, 14, B);
      circ(x, 50, 79, 5, C);
      circ(x, 30, 79, 3.5, C);
      circ(x, 70, 79, 3.5, C);
      circ(x, 50, 24, 4, C);
      circ(x, 18, 30, 3.5, C);
      circ(x, 82, 30, 3.5, C);
    },
  };
  M.hand = {
    draw: (x) => {
      ring(x, 50, 46, 30, 40, B);
      x.fillStyle = A;
      x.beginPath();
      x.roundRect(32, 44, 36, 40, 10);
      x.fill();
      for (let i = 0; i < 4; i++) {
        x.beginPath();
        x.roundRect(32 + i * 9.2, 14 + Math.abs(1.5 - i) * 5, 8.5, 36, 4);
        x.fill();
      }
      ell(x, 30, 58, 6, 14, A, -0.6);
      circ(x, 50, 64, 5, C);
    },
  };
  M.sun = {
    draw: (x) => {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r1 = 26;
        const r2 = i % 2 ? 40 : 47;
        poly(x, [50 + Math.cos(a - 0.12) * r1, 50 + Math.sin(a - 0.12) * r1, 50 + Math.cos(a) * r2, 50 + Math.sin(a) * r2, 50 + Math.cos(a + 0.12) * r1, 50 + Math.sin(a + 0.12) * r1], i % 2 ? B : A);
      }
      circ(x, 50, 50, 24, C);
    },
    paint: (x) => {
      x.beginPath();
      x.arc(42, 46, 2, 0, Math.PI * 2);
      x.arc(58, 46, 2, 0, Math.PI * 2);
      x.stroke();
      line(x, [43, 58, 50, 61, 57, 58]);
    },
  };
  M.axe = {
    draw: (x) => {
      rot(x, 50, 50, -0.5, () => {
        rect(x, 47, 10, 6, 86, B);
        x.fillStyle = A;
        x.beginPath();
        x.moveTo(52, 14);
        x.quadraticCurveTo(92, 18, 86, 52);
        x.quadraticCurveTo(70, 40, 52, 44);
        x.fill();
        circ(x, 50, 92, 4, C);
      });
    },
  };
  M.chalice = {
    draw: (x) => {
      x.fillStyle = B;
      x.beginPath();
      x.moveTo(24, 18);
      x.lineTo(76, 18);
      x.quadraticCurveTo(74, 56, 54, 60);
      x.lineTo(54, 78);
      x.lineTo(68, 90);
      x.lineTo(32, 90);
      x.lineTo(46, 78);
      x.lineTo(46, 60);
      x.quadraticCurveTo(26, 56, 24, 18);
      x.fill();
      x.fillStyle = A;
      x.beginPath();
      x.moveTo(30, 24);
      x.lineTo(70, 24);
      x.quadraticCurveTo(68, 50, 50, 52);
      x.quadraticCurveTo(32, 50, 30, 24);
      x.fill();
      circ(x, 50, 70, 4, C);
      circ(x, 50, 10, 6, C);
    },
  };
  M.heart = {
    draw: (x) => {
      x.fillStyle = A;
      x.beginPath();
      x.moveTo(50, 90);
      x.bezierCurveTo(10, 62, 8, 30, 30, 22);
      x.bezierCurveTo(42, 18, 50, 28, 50, 34);
      x.bezierCurveTo(50, 28, 58, 18, 70, 22);
      x.bezierCurveTo(92, 30, 90, 62, 50, 90);
      x.fill();
      flameShape(x, 50, 30, 8, 26, C);
      ring(x, 50, 54, 22, 26, B);
    },
  };
  M.bell = {
    draw: (x) => {
      x.fillStyle = A;
      x.beginPath();
      x.moveTo(50, 12);
      x.bezierCurveTo(26, 14, 30, 40, 24, 70);
      x.lineTo(16, 80);
      x.lineTo(84, 80);
      x.lineTo(76, 70);
      x.bezierCurveTo(70, 40, 74, 14, 50, 12);
      x.fill();
      rect(x, 16, 76, 68, 6, B);
      circ(x, 50, 88, 7, C);
      rect(x, 44, 4, 12, 10, B);
    },
    paint: (x) => line(x, [32, 56, 68, 56]),
  };
  M.eye = {
    draw: (x) => {
      x.fillStyle = A;
      x.beginPath();
      x.moveTo(8, 50);
      x.quadraticCurveTo(50, 8, 92, 50);
      x.quadraticCurveTo(50, 92, 8, 50);
      x.fill();
      circ(x, 50, 50, 18, B);
      circ(x, 50, 50, 8, C);
    },
    paint: (x) => {
      x.beginPath();
      x.arc(50, 50, 4, 0, Math.PI * 2);
      x.fill();
    },
  };
  M.rose = {
    draw: (x) => {
      circ(x, 50, 50, 44, B);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ell(x, 50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26, 13, 8, A, a);
      }
      circ(x, 50, 50, 13, C);
    },
  };
  M.drop = {
    draw: (x) => {
      x.fillStyle = A;
      x.beginPath();
      x.moveTo(50, 6);
      x.bezierCurveTo(60, 30, 80, 50, 78, 66);
      x.bezierCurveTo(76, 90, 24, 90, 22, 66);
      x.bezierCurveTo(20, 50, 40, 30, 50, 6);
      x.fill();
      ell(x, 40, 64, 6, 10, C, 0.4);
    },
  };
  M.skull = {
    draw: (x) => {
      circ(x, 50, 42, 30, A);
      x.fillStyle = A;
      x.beginPath();
      x.roundRect(32, 56, 36, 28, 6);
      x.fill();
      ell(x, 38, 46, 8, 10, C);
      ell(x, 62, 46, 8, 10, C);
      poly(x, [50, 58, 55, 68, 45, 68], B);
    },
    paint: (x) => {
      for (let i = 0; i < 5; i++) line(x, [38 + i * 6, 74, 38 + i * 6, 84]);
    },
  };
  M.feather = {
    draw: (x) => {
      rot(x, 50, 50, 0.5, () => {
        x.fillStyle = A;
        x.beginPath();
        x.moveTo(50, 4);
        x.bezierCurveTo(78, 24, 70, 64, 52, 82);
        x.bezierCurveTo(34, 64, 24, 26, 50, 4);
        x.fill();
        rect(x, 48.5, 12, 3, 86, B);
        circ(x, 50, 96, 3, C);
      });
    },
  };
  M.coin = {
    draw: (x) => {
      circ(x, 50, 50, 40, B);
      circ(x, 50, 50, 31, A);
      poly(x, [50, 28, 56, 44, 72, 50, 56, 56, 50, 72, 44, 56, 28, 50, 44, 44], C);
    },
  };
  M.hourglass = {
    draw: (x) => {
      rect(x, 22, 8, 56, 8, B);
      rect(x, 22, 84, 56, 8, B);
      poly(x, [28, 16, 72, 16, 54, 50, 72, 84, 28, 84, 46, 50], A);
      poly(x, [36, 84, 64, 84, 50, 64], C);
      poly(x, [40, 26, 60, 26, 50, 42], C);
    },
  };
  M.book = {
    draw: (x) => {
      poly(x, [6, 30, 50, 24, 94, 30, 94, 82, 50, 76, 6, 82], B);
      poly(x, [12, 30, 48, 26, 48, 72, 12, 76], A);
      poly(x, [52, 26, 88, 30, 88, 76, 52, 72], A);
      circ(x, 50, 18, 8, C);
    },
    paint: (x) => {
      for (let i = 0; i < 5; i++) {
        line(x, [18, 38 + i * 7, 42, 35 + i * 7]);
        line(x, [58, 35 + i * 7, 82, 38 + i * 7]);
      }
    },
  };
  M.key = {
    draw: (x) => {
      rot(x, 50, 50, -0.7, () => {
        ring(x, 50, 22, 9, 17, B);
        rect(x, 46, 36, 8, 56, B);
        rect(x, 54, 72, 14, 7, B);
        rect(x, 54, 84, 10, 7, B);
        circ(x, 50, 22, 9, C);
      });
    },
  };
  M.moon = {
    draw: (x) => {
      circ(x, 50, 50, 38, A);
      circ(x, 64, 42, 32, '#000000');
      circ(x, 30, 30, 4, C);
    },
  };

  // ------------------------------------------------------------------ figures (ennemis, héros)
  // boîte 100 x 120, sujet centré, pieds en bas
  function robe(x, cx, top, bottom, wTop, wBot, col) {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(cx - wTop, top);
    x.lineTo(cx + wTop, top);
    x.quadraticCurveTo(cx + wBot * 0.8, (top + bottom) / 2, cx + wBot, bottom);
    for (let i = 4; i >= -4; i--) x.lineTo(cx + (wBot * i) / 4, bottom - (i % 2 ? 5 : 0));
    x.quadraticCurveTo(cx - wBot * 0.8, (top + bottom) / 2, cx - wTop, top);
    x.fill();
  }
  function hood(x, cx, cy, r, col) {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(cx, cy - r * 1.6);
    x.quadraticCurveTo(cx + r * 1.2, cy - r * 0.8, cx + r * 1.1, cy + r);
    x.lineTo(cx - r * 1.1, cy + r);
    x.quadraticCurveTo(cx - r * 1.2, cy - r * 0.8, cx, cy - r * 1.6);
    x.fill();
  }
  function wings(x, cx, cy, span, n, col, col2, up) {
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + side * (0.35 + (i / n) * 1.25) * (up ? 0.9 : 1.1);
        const len = span * (1 - i * 0.08);
        const ex = cx + Math.cos(a) * len;
        const ey = cy + Math.sin(a) * len * 0.9 + i * 2;
        const nx = Math.cos(a + Math.PI / 2) * 4.5;
        const ny = Math.sin(a + Math.PI / 2) * 4.5;
        poly(x, [cx + nx, cy + ny, ex + nx * 0.4, ey + ny * 0.4, ex + Math.cos(a) * 5, ey + Math.sin(a) * 5, ex - nx * 0.4, ey - ny * 0.4, cx - nx, cy - ny], i % 2 ? col2 : col);
      }
    }
  }
  function eyes(x, cx, cy, gap, r, col) {
    ell(x, cx - gap, cy, r, r * 0.7, col);
    ell(x, cx + gap, cy, r, r * 0.7, col);
  }

  const F = {};
  F.ghoul = {
    draw: (x) => {
      robe(x, 50, 52, 112, 18, 26, A);
      ell(x, 50, 48, 22, 14, A);
      circ(x, 56, 34, 15, B);
      eyes(x, 56, 32, 6, 3.4, C);
      poly(x, [26, 56, 12, 92, 18, 94, 32, 64], B);
      poly(x, [74, 56, 92, 88, 86, 92, 70, 66], B);
      for (let i = 0; i < 3; i++) {
        poly(x, [12 + i * 3, 92, 8 + i * 4, 104, 16 + i * 3, 94], C);
        poly(x, [86 + i * 2, 90, 90 + i * 3, 102, 84 + i * 2, 92], C);
      }
    },
    paint: (x) => {
      line(x, [50, 42, 54, 44, 58, 42, 62, 44]);
      line(x, [44, 64, 46, 80]);
      line(x, [56, 64, 54, 84]);
    },
  };
  F.hooded = {
    draw: (x) => {
      robe(x, 50, 44, 116, 16, 34, A);
      hood(x, 50, 36, 17, B);
      ell(x, 50, 38, 10, 12, '#000000');
      eyes(x, 50, 37, 4.5, 2.3, C);
      x.fillStyle = B;
      x.beginPath();
      x.roundRect(36, 66, 28, 9, 4);
      x.fill();
      circ(x, 50, 86, 6, C);
    },
    paint: (x) => {
      line(x, [42, 80, 38, 112]);
      line(x, [58, 80, 62, 112]);
    },
  };
  F.swarm = {
    draw: (x) => {
      const r = G.rng(42);
      for (let i = 0; i < 26; i++) {
        const a = r() * Math.PI * 2;
        const d = 8 + r() * 40;
        const cx = 50 + Math.cos(a) * d;
        const cy = 60 + Math.sin(a) * d * 1.05;
        const s = 3 + r() * 5;
        poly(x, [cx, cy - s, cx + s * 0.7, cy, cx, cy + s, cx - s * 0.7, cy], i % 3 ? A : B);
      }
      circ(x, 50, 58, 15, A);
      eyes(x, 50, 56, 6, 3, C);
      circ(x, 50, 66, 3, C);
    },
  };
  F.gargoyle = {
    draw: (x) => {
      wings(x, 50, 52, 44, 5, B, A, true);
      ell(x, 50, 78, 22, 26, A);
      circ(x, 50, 44, 15, A);
      poly(x, [38, 36, 30, 16, 42, 32], B);
      poly(x, [62, 36, 70, 16, 58, 32], B);
      eyes(x, 50, 44, 6, 3, C);
      poly(x, [42, 52, 58, 52, 50, 60], B);
      rect(x, 26, 102, 48, 12, B);
    },
  };
  F.knightFoe = {
    draw: (x) => {
      robe(x, 50, 52, 116, 22, 26, A);
      x.fillStyle = B;
      x.beginPath();
      x.roundRect(36, 20, 28, 34, 10);
      x.fill();
      rect(x, 40, 34, 20, 4, '#000000');
      rect(x, 48, 30, 4, 18, '#000000');
      eyes(x, 50, 36, 5, 1.8, C);
      x.save();
      x.translate(30, 76);
      x.scale(0.45, 0.45);
      x.translate(-50, -50);
      shieldShape(x, 0, B);
      shieldShape(x, 7, A);
      x.restore();
      rect(x, 72, 8, 4, 108, B);
      poly(x, [74, 0, 80, 12, 74, 16, 68, 12], C);
    },
  };
  F.boneMother = {
    draw: (x) => {
      ring(x, 50, 34, 26, 32, C);
      robe(x, 50, 50, 118, 20, 40, A);
      circ(x, 50, 32, 14, B);
      ell(x, 45, 32, 4, 5, '#000000');
      ell(x, 55, 32, 4, 5, '#000000');
      for (let i = 0; i < 5; i++) rect(x, 38, 56 + i * 8, 24, 4, B);
      rect(x, 48, 54, 4, 42, B);
      poly(x, [30, 54, 8, 40, 10, 46, 28, 62], B);
      poly(x, [70, 54, 92, 40, 90, 46, 72, 62], B);
      circ(x, 45, 32, 1.8, C);
      circ(x, 55, 32, 1.8, C);
    },
  };
  F.penitent = {
    draw: (x) => {
      robe(x, 50, 42, 116, 14, 30, A);
      hood(x, 50, 26, 14, A);
      poly(x, [50, 2, 60, 26, 40, 26], B);
      eyes(x, 50, 30, 4, 2, C);
      rect(x, 68, 40, 4, 30, B);
      for (let i = 0; i < 4; i++) poly(x, [70, 70, 78 + i * 4, 98, 74 + i * 4, 100], C);
    },
    paint: (x) => line(x, [40, 60, 60, 70, 42, 84, 58, 94]),
  };
  F.mask = {
    draw: (x) => {
      x.fillStyle = A;
      x.beginPath();
      x.moveTo(50, 12);
      x.bezierCurveTo(84, 14, 86, 60, 74, 84);
      x.quadraticCurveTo(62, 110, 50, 112);
      x.quadraticCurveTo(38, 110, 26, 84);
      x.bezierCurveTo(14, 60, 16, 14, 50, 12);
      x.fill();
      ell(x, 38, 52, 9, 6, C);
      ell(x, 62, 52, 9, 6, C);
      poly(x, [50, 58, 54, 76, 46, 76], B);
      ell(x, 50, 90, 10, 4, B);
      poly(x, [22, 26, 4, 12, 18, 40], B);
      poly(x, [78, 26, 96, 12, 82, 40], B);
    },
    paint: (x) => {
      line(x, [50, 14, 46, 30, 54, 40, 48, 52]);
      line(x, [70, 30, 62, 40]);
    },
  };
  F.nun = {
    draw: (x) => {
      robe(x, 50, 40, 118, 26, 34, A);
      hood(x, 50, 34, 20, A);
      ell(x, 50, 40, 12, 15, B);
      rect(x, 38, 54, 24, 8, B);
      x.fillStyle = C;
      x.beginPath();
      x.roundRect(46, 64, 8, 30, 2);
      x.fill();
    },
    paint: (x) => {
      line(x, [42, 40, 58, 40]);
      line(x, [44, 46, 56, 46]);
    },
  };
  F.hound = {
    draw: (x) => {
      ell(x, 50, 84, 30, 24, A);
      poly(x, [30, 40, 50, 26, 70, 40, 76, 70, 24, 70], A);
      poly(x, [32, 40, 26, 14, 42, 32], B);
      poly(x, [68, 40, 74, 14, 58, 32], B);
      poly(x, [36, 60, 64, 60, 58, 80, 42, 80], B);
      eyes(x, 50, 48, 10, 3.6, C);
      for (let i = 0; i < 4; i++) poly(x, [41 + i * 5, 72, 43 + i * 5, 80, 45 + i * 5, 72], C);
    },
  };
  F.inquisitor = {
    draw: (x) => {
      robe(x, 50, 46, 118, 18, 32, A);
      poly(x, [38, 30, 50, -4, 62, 30], A);
      rect(x, 34, 28, 32, 6, B);
      circ(x, 50, 40, 9, B);
      eyes(x, 50, 40, 3.5, 1.6, C);
      rect(x, 18, 60, 3, 30, B);
      x.fillStyle = B;
      x.beginPath();
      x.roundRect(12, 88, 16, 20, 3);
      x.fill();
      flameShape(x, 20, 106, 4, 14, C);
    },
  };
  F.choir = {
    draw: (x) => {
      for (let i = -1; i <= 1; i++) {
        const cx = 50 + i * 26;
        const cy = 56 - (i === 0 ? 12 : 0);
        robe(x, cx, cy + 10, 118, 9, 16, i === 0 ? A : B);
        ell(x, cx, cy, 11, 14, i === 0 ? B : A);
        ell(x, cx, cy + 6, 4, 6, '#000000');
        eyes(x, cx, cy - 3, 4, 1.7, C);
        ring(x, cx, cy - 4, 14, 17, C);
      }
    },
  };
  F.angel = {
    draw: (x) => {
      wings(x, 50, 54, 48, 6, B, A, false);
      ring(x, 50, 24, 12, 16, C);
      robe(x, 50, 44, 118, 12, 26, A);
      circ(x, 50, 34, 10, B);
      eyes(x, 50, 34, 4, 1.8, '#000000');
    },
    paint: (x) => line(x, [46, 40, 50, 42, 54, 40]),
  };
  F.bellFoe = {
    draw: (x) => {
      x.save();
      x.translate(0, 8);
      M.bell.draw(x);
      x.restore();
      ell(x, 50, 50, 14, 8, '#000000');
      ell(x, 50, 50, 8, 7, C);
    },
  };
  F.scribe = {
    draw: (x) => {
      robe(x, 50, 44, 118, 18, 32, A);
      hood(x, 50, 34, 16, A);
      ell(x, 50, 38, 10, 12, B);
      eyes(x, 50, 36, 4, 1.8, C);
      poly(x, [20, 70, 50, 64, 80, 70, 80, 96, 50, 90, 20, 96], B);
      rot(x, 78, 50, 0.5, () => poly(x, [78, 26, 86, 40, 80, 70, 74, 40], C));
    },
    paint: (x) => {
      for (let i = 0; i < 3; i++) {
        line(x, [26, 76 + i * 6, 46, 73 + i * 6]);
        line(x, [54, 73 + i * 6, 74, 76 + i * 6]);
      }
    },
  };
  F.effigy = {
    draw: (x) => {
      rect(x, 6, 86, 88, 28, B);
      x.fillStyle = A;
      x.beginPath();
      x.roundRect(14, 64, 72, 24, 12);
      x.fill();
      circ(x, 20, 64, 12, A);
      poly(x, [40, 56, 52, 44, 56, 48, 46, 62], C);
      sword(x, 60, 72, 0.42, Math.PI / 2);
      eyes(x, 20, 62, 4, 1.6, C);
    },
  };
  F.seraph = {
    draw: (x) => {
      wings(x, 50, 60, 48, 7, A, B, true);
      wings(x, 50, 66, 40, 5, B, A, false);
      circ(x, 50, 60, 22, A);
      ell(x, 50, 60, 16, 10, B);
      circ(x, 50, 60, 8, C);
      ring(x, 50, 60, 26, 29, C);
    },
    paint: (x) => {
      x.beginPath();
      x.arc(50, 60, 3.5, 0, Math.PI * 2);
      x.fill();
    },
  };
  F.bishop = {
    draw: (x) => {
      ring(x, 50, 36, 30, 36, C);
      robe(x, 50, 46, 118, 20, 38, A);
      poly(x, [36, 30, 40, 2, 50, 12, 60, 2, 64, 30], B);
      rect(x, 48, 4, 4, 24, C);
      circ(x, 50, 38, 11, B);
      eyes(x, 50, 37, 4, 2, C);
      rect(x, 46, 50, 8, 66, B);
      rect(x, 80, 20, 4, 96, B);
      ring(x, 78, 18, 5, 9, B);
    },
    paint: (x) => line(x, [45, 44, 50, 46, 55, 44]),
  };
  // héros
  F.knight = {
    draw: (x) => {
      robe(x, 50, 48, 118, 20, 30, B);
      x.fillStyle = A;
      x.beginPath();
      x.roundRect(36, 14, 28, 34, 11);
      x.fill();
      poly(x, [50, 0, 56, 14, 44, 14], C);
      rect(x, 40, 28, 20, 3, '#000000');
      rect(x, 48, 24, 4, 16, '#000000');
      x.save();
      x.translate(50, 82);
      x.scale(0.55, 0.55);
      x.translate(-50, -50);
      shieldShape(x, 0, B);
      shieldShape(x, 6, A);
      poly(x, [50, 30, 55, 45, 70, 50, 55, 55, 50, 72, 45, 55, 30, 50, 45, 45], C);
      x.restore();
      sword(x, 82, 70, 0.55, 0.15);
    },
  };
  F.witch = {
    draw: (x) => {
      robe(x, 50, 46, 118, 16, 34, A);
      poly(x, [24, 34, 54, -2, 62, 18, 76, 34], B);
      circ(x, 50, 40, 9, B);
      eyes(x, 50, 40, 4, 1.8, C);
      circ(x, 22, 76, 8, C);
      rect(x, 76, 30, 3, 88, B);
    },
  };
  F.bleeder = {};
  F.bleeder.draw = (x) => {
    robe(x, 50, 46, 118, 20, 32, A);
    hood(x, 50, 34, 16, A);
    ell(x, 50, 38, 9, 11, B);
    eyes(x, 50, 37, 4, 2, C);
    x.save();
    x.translate(50, 80);
    x.scale(0.3, 0.3);
    x.translate(-50, -50);
    M.drop.draw(x);
    x.restore();
    poly(x, [74, 44, 92, 20, 86, 50], B);
  };

  // ------------------------------------------------------------------ rendu
  const cache = {};

  /**
   * opts : w, h, seed, motif (nom), figure (bool), pal (fond), a, b, c (palettes des encres),
   *        cell (taille des cellules), layout ('grid' | 'radial'), shape ('rect' | 'arch' | 'circle'),
   *        light ([x, y] relatif), scale, offsetY
   */
  function render(o) {
    const W = o.w;
    const H = o.h;
    const S = W / 240; // facteur d'échelle de référence
    // ---- carte des régions
    const mc = document.createElement('canvas');
    mc.width = W;
    mc.height = H;
    const mx = mc.getContext('2d');
    mx.fillStyle = '#000';
    mx.fillRect(0, 0, W, H);
    const lib = o.figure ? F : M;
    const motif = lib[o.motif] || M.rose;
    const box = o.figure ? 120 : 100;
    const scale = ((o.figure ? H * 0.92 : Math.min(W, H) * 0.86) / box) * (o.scale || 1);
    const tx = W / 2 - 50 * scale;
    const ty = o.figure ? H - box * scale - H * 0.02 + (o.offsetY || 0) * H : H / 2 - 50 * scale + (o.offsetY || 0) * H;
    mx.save();
    mx.translate(tx, ty);
    mx.scale(scale, scale);
    motif.draw(mx);
    mx.restore();
    const md = mx.getImageData(0, 0, W, H).data;

    // forme extérieure (ogive, cercle)
    const inside = (px, py) => {
      if (o.shape === 'circle') {
        const r = Math.min(W, H) / 2 - 1;
        return (px - W / 2) ** 2 + (py - H / 2) ** 2 <= r * r;
      }
      if (o.shape === 'arch') {
        const archH = W * 0.62;
        if (py >= archH) return true;
        // ogive : deux arcs de rayon W centrés sur les bords opposés
        const R = W * 0.92;
        const dy = archH - py;
        const okL = (px - (W - R)) ** 2 + dy ** 2 <= R * R;
        const okR = (px - R) ** 2 + dy ** 2 <= R * R;
        return px >= 0 && okL && okR;
      }
      return true;
    };

    // ---- germes
    const cell = (o.cell || 26) * S;
    const seeds = [];
    const r = G.rng(o.seed || 1);
    if (o.layout === 'radial') {
      const cx = W * (o.center ? o.center[0] : 0.5);
      const cy = H * (o.center ? o.center[1] : 0.45);
      seeds.push([cx, cy]);
      const maxR = Math.hypot(W, H);
      for (let k = 1; k * cell * 0.9 < maxR; k++) {
        const rr = k * cell * 0.9;
        const n = Math.max(6, Math.round((2 * Math.PI * rr) / cell));
        const off = r() * Math.PI;
        for (let i = 0; i < n; i++) {
          const a = off + (i / n) * Math.PI * 2;
          seeds.push([cx + Math.cos(a) * rr + (r() - 0.5) * cell * 0.25, cy + Math.sin(a) * rr + (r() - 0.5) * cell * 0.25]);
        }
      }
    } else {
      for (let gy = -1; gy * cell < H + cell; gy++) {
        for (let gx = -1; gx * cell < W + cell; gx++) {
          seeds.push([(gx + 0.5 + (r() - 0.5) * 0.85) * cell, (gy + 0.5 + (r() - 0.5) * 0.85) * cell]);
        }
      }
    }
    // grille d'accélération
    const gs = cell;
    const gw = Math.ceil(W / gs) + 3;
    const gh = Math.ceil(H / gs) + 3;
    const grid = Array.from({ length: gw * gh }, () => []);
    seeds.forEach((s, i) => {
      const gx = Math.floor(s[0] / gs) + 1;
      const gy = Math.floor(s[1] / gs) + 1;
      if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) grid[gy * gw + gx].push(i);
    });
    const N = W * H;
    const cellOf = new Int32Array(N);
    const dist = new Float32Array(N);
    const region = new Uint8Array(N);
    for (let py = 0; py < H; py++) {
      const gy0 = Math.floor(py / gs) + 1;
      for (let px = 0; px < W; px++) {
        const gx0 = Math.floor(px / gs) + 1;
        let best = -1;
        let bd = Infinity;
        for (let dy = -2; dy <= 2; dy++) {
          const gy = gy0 + dy;
          if (gy < 0 || gy >= gh) continue;
          for (let dx = -2; dx <= 2; dx++) {
            const gx = gx0 + dx;
            if (gx < 0 || gx >= gw) continue;
            const lst = grid[gy * gw + gx];
            for (let k = 0; k < lst.length; k++) {
              const s = seeds[lst[k]];
              const d = (s[0] - px) ** 2 + (s[1] - py) ** 2;
              if (d < bd) {
                bd = d;
                best = lst[k];
              }
            }
          }
        }
        const i = py * W + px;
        cellOf[i] = best;
        dist[i] = Math.sqrt(bd);
        if (!inside(px, py)) {
          region[i] = 9;
          continue;
        }
        const rr = md[i * 4];
        const gg = md[i * 4 + 1];
        const bb = md[i * 4 + 2];
        region[i] = rr > 128 ? 1 : gg > 128 ? 2 : bb > 128 ? 3 : 0;
      }
    }

    // ---- couleurs par (cellule, région)
    const pals = [PALRGB[o.pal || 'nuit'], PALRGB[o.a || 'os'], PALRGB[o.b || 'or'], PALRGB[o.c || 'braise']];
    const light = o.light || [0.5, 0.15];
    const lx = light[0] * W;
    const ly = light[1] * H;
    const colorCache = new Map();
    const colorFor = (ci, rg) => {
      const key = ci * 8 + rg;
      let c = colorCache.get(key);
      if (c) return c;
      const s = seeds[ci];
      const h1 = hash(ci, rg, o.seed);
      const p = pals[rg];
      const base = p[Math.floor(h1 * p.length)];
      let k = 0.85 + hash(ci, rg + 7, o.seed) * 0.3;
      if (rg === 0) {
        // la lumière traverse le vitrail depuis un point
        const d = Math.hypot(s[0] - lx, s[1] - ly) / Math.hypot(W, H);
        k *= 0.55 + 0.75 * Math.exp(-d * d * 7);
        if (o.halo) {
          const dh = Math.hypot(s[0] - W / 2, s[1] - H * 0.45) / Math.min(W, H);
          k *= 0.75 + 0.6 * Math.exp(-dh * dh * 9);
        }
      }
      if (rg === 3) k *= 1.08;
      c = [base[0] * k, base[1] * k, base[2] * k, hash(ci, rg + 3, o.seed)];
      colorCache.set(key, c);
      return c;
    };

    // ---- plomb : pixels où la clé (cellule, région) change
    const lead = new Uint8Array(N);
    const lw = Math.max(1, Math.round(1.6 * S * (o.leadScale || 1)));
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const i = py * W + px;
        const k = cellOf[i] * 16 + region[i];
        let edge = false;
        if (px + 1 < W && cellOf[i + 1] * 16 + region[i + 1] !== k) edge = true;
        if (py + 1 < H && cellOf[i + W] * 16 + region[i + W] !== k) edge = true;
        if (edge) {
          for (let dy = -lw + 1; dy <= lw - 1 + 1; dy++) {
            for (let dx = -lw + 1; dx <= lw - 1 + 1; dx++) {
              const x2 = px + dx;
              const y2 = py + dy;
              if (x2 >= 0 && y2 >= 0 && x2 < W && y2 < H) lead[y2 * W + x2] = 1;
            }
          }
        }
      }
    }

    // ---- composition
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const ox = out.getContext('2d');
    const img = ox.createImageData(W, H);
    const d = img.data;
    for (let i = 0; i < N; i++) {
      const rg = region[i];
      const j = i * 4;
      if (rg === 9) {
        if (lead[i] && hasInsideNeighbor(i)) {
          d[j] = 12;
          d[j + 1] = 10;
          d[j + 2] = 9;
          d[j + 3] = 255;
        } else d[j + 3] = 0;
        continue;
      }
      if (lead[i]) {
        // plomb, avec un léger reflet
        const px = i % W;
        const py = (i / W) | 0;
        const hl = hash(px >> 1, py >> 1, 5) < 0.08 ? 28 : 0;
        d[j] = 14 + hl;
        d[j + 1] = 12 + hl;
        d[j + 2] = 11 + hl;
        d[j + 3] = 255;
        continue;
      }
      const c = colorFor(cellOf[i], rg);
      const px = i % W;
      const py = (i / W) | 0;
      // bombé du verre, grain, stries du soufflage
      const bulge = 1.14 - 0.42 * Math.min(1, dist[i] / cell);
      const grain = 1 + (hash(px, py, 11) - 0.5) * 0.09;
      const streak = 1 + Math.sin((px * 0.7 + py * 0.32) * 0.35 / S + c[3] * 20) * 0.05;
      const k = bulge * grain * streak;
      d[j] = Math.min(255, c[0] * k);
      d[j + 1] = Math.min(255, c[1] * k);
      d[j + 2] = Math.min(255, c[2] * k);
      d[j + 3] = 255;
    }
    function hasInsideNeighbor(i) {
      const px = i % W;
      for (const off of [1, -1, W, -W, 2, -2, 2 * W, -2 * W]) {
        const k = i + off;
        if (k < 0 || k >= N) continue;
        if (Math.abs((k % W) - px) > 3) continue;
        if (region[k] !== 9) return true;
      }
      return false;
    }
    ox.putImageData(img, 0, 0);

    // ---- grisaille (traits peints)
    if (motif.paint) {
      ox.save();
      ox.translate(tx, ty);
      ox.scale(scale, scale);
      ox.strokeStyle = 'rgba(18,10,6,0.7)';
      ox.fillStyle = 'rgba(18,10,6,0.75)';
      ox.lineWidth = 1.6;
      ox.lineCap = 'round';
      ox.lineJoin = 'round';
      motif.paint(ox);
      ox.restore();
    }
    // ---- patine : vignettage et reflet
    if (o.shape !== 'circle') {
      const vg = ox.createRadialGradient(W / 2, H * 0.4, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.38)');
      ox.globalCompositeOperation = 'source-atop';
      ox.fillStyle = vg;
      ox.fillRect(0, 0, W, H);
      ox.globalCompositeOperation = 'source-over';
    }
    return out;
  }

  /** Renvoie une URL d'image mise en cache. */
  function url(key, opts) {
    if (cache[key]) return cache[key];
    const c = render(opts);
    cache[key] = c.toDataURL('image/png');
    return cache[key];
  }

  // ------------------------------------------------------------------ préréglages
  const TYPE_STYLE = {
    atk: { pal: 'rubis', a: 'os', b: 'or', c: 'braise' },
    skl: { pal: 'saphir', a: 'os', b: 'or', c: 'braise' },
    pow: { pal: 'amethyste', a: 'or', b: 'os', c: 'braise' },
    curse: { pal: 'nuit', a: 'amethyste', b: 'rubis', c: 'sang' },
  };
  const seedOf = (s) => {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const DPR = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);

  const Art = {
    PAL,
    render,
    cardArt(id) {
      const def = G.CARDS[id];
      const st = TYPE_STYLE[def.type];
      return url('card:' + id, {
        w: Math.round(150 * DPR), h: Math.round(104 * DPR), seed: seedOf(id), motif: def.art,
        pal: st.pal, a: st.a, b: st.b, c: st.c, cell: 34, layout: 'grid', light: [0.5, 0.0], scale: 1.04,
      });
    },
    enemy(id) {
      const def = G.ENEMIES[id];
      const actPal = { 1: 'emeraude', 2: 'rubis', 3: 'saphir' }[def.act];
      return url('enemy:' + id, {
        w: Math.round(200 * DPR), h: Math.round(250 * DPR), seed: seedOf(id), motif: def.art, figure: true,
        pal: 'nuit', a: def.pal, b: def.pal === 'os' ? 'or' : 'os', c: def.boss ? 'braise' : 'sang', cell: 30,
        layout: 'radial', center: [0.5, 0.42], shape: 'arch', light: [0.5, 0.35], halo: true, bgAlt: actPal,
      });
    },
    hero(id) {
      const h = G.HEROES[id];
      return url('hero:' + id, {
        w: Math.round(160 * DPR), h: Math.round(220 * DPR), seed: seedOf(id), motif: h.art, figure: true,
        pal: h.color, a: h.color === 'saphir' ? 'os' : 'or', b: h.color, c: 'braise', cell: 28,
        layout: 'radial', center: [0.5, 0.38], shape: 'arch', light: [0.5, 0.3], halo: true,
      });
    },
    relic(id) {
      const r = G.RELICS[id];
      return url('relic:' + id, {
        w: Math.round(72 * DPR), h: Math.round(72 * DPR), seed: seedOf(id), motif: r.art,
        pal: 'nuit', a: r.pal, b: 'or', c: 'braise', cell: 20, layout: 'radial', shape: 'circle', light: [0.4, 0.3], scale: 0.85, leadScale: 1.4,
      });
    },
    node(type, done) {
      const m = { combat: ['sword', 'rubis'], elite: ['skull', 'amethyste'], merchant: ['coin', 'or'], altar: ['candle', 'ambre'], event: ['eye', 'saphir'], boss: ['crown', 'rubis'] }[type];
      return url('node:' + type + (done ? ':d' : ''), {
        w: Math.round(64 * DPR), h: Math.round(64 * DPR), seed: seedOf(type), motif: m[0],
        pal: done ? 'nuit' : m[1], a: done ? 'nuit' : 'os', b: 'or', c: 'braise', cell: 18, layout: 'radial', shape: 'circle', light: [0.4, 0.3], scale: 0.7, leadScale: 1.5,
      });
    },
    event(ev) {
      return url('event:' + ev.id, {
        w: Math.round(300 * DPR), h: Math.round(150 * DPR), seed: seedOf(ev.id), motif: ev.art,
        pal: ev.pal, a: 'os', b: 'or', c: 'braise', cell: 30, layout: 'radial', center: [0.5, 0.5], light: [0.5, 0.2], scale: 0.9,
      });
    },
    rosace(key, pal, size) {
      return url('rosace:' + key, {
        w: Math.round(size * DPR), h: Math.round(size * DPR), seed: seedOf(key), motif: 'rose',
        pal: 'nuit', a: pal, b: 'or', c: 'braise', cell: 22, layout: 'radial', shape: 'circle', light: [0.5, 0.5], scale: 0.95, halo: true,
      });
    },
  };
  G.Art = Art;
})(window.G = window.G || {});
