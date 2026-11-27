#!/usr/bin/env node
/* Génère les icônes de l'application (rosace de vitrail) avec le générateur du jeu.
 * Nécessite Playwright et un serveur local : python3 -m http.server 8766
 * Usage : node tools/make-icons.js [url-du-jeu] */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:8766/index.html';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForFunction(() => window.G && G.Art);
  const out = path.join(__dirname, '..', 'icons');
  fs.mkdirSync(out, { recursive: true });
  for (const size of [180, 192, 512]) {
    const data = await page.evaluate((size) => {
      const art = G.Art.render({
        w: size, h: size, seed: 1789, motif: 'rose', pal: 'nuit', a: 'rubis', b: 'or', c: 'braise',
        cell: 26, layout: 'radial', shape: 'circle', light: [0.5, 0.5], scale: 0.95, halo: true, leadScale: 1.2,
      });
      // fond plein (les icônes iOS ne gèrent pas la transparence)
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const x = c.getContext('2d');
      x.fillStyle = '#07060b';
      x.fillRect(0, 0, size, size);
      const m = size * 0.06;
      x.drawImage(art, m, m, size - 2 * m, size - 2 * m);
      return c.toDataURL('image/png').split(',')[1];
    }, size);
    fs.writeFileSync(path.join(out, `icon-${size}.png`), Buffer.from(data, 'base64'));
  }
  console.log('Icônes écrites dans', out);
  await browser.close();
})();
