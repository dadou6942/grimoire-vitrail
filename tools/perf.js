#!/usr/bin/env node
/* Mesure de fluidité (Playwright) : node tools/perf.js, avec deux serveurs locaux à comparer (ports 8768 et 8767). */
// Mesure de fluidité : processeur ralenti ×4, on joue des cartes et on compte les images lentes.
const { chromium, devices } = require('playwright');
async function measure(port, label) {
  const b = await chromium.launch();
  const d = devices['iPhone 14'];
  const ctx = await b.newContext({ viewport: d.viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: d.userAgent });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    try {
      localStorage.setItem('grimoire-vitrail.settings', JSON.stringify({ tuto: { doors: true, combat: true } }));
    } catch (e) {}
  });
  await p.goto(`http://localhost:${port}/index.html`);
  await p.waitForTimeout(800);
  await p.click('#b-new');
  await p.waitForTimeout(1000);
  await p.click('#b-start');
  await p.waitForTimeout(1300);
  // entrer dans un combat (ancienne version : nœud de carte ; nouvelle : porte)
  if (await p.$('.door')) {
    await p.click('.door', { force: true });
    await p.waitForTimeout(200);
    await p.click('#b-door', { force: true });
  } else await p.click('.map-node.avail', { force: true });
  await p.waitForTimeout(1600);
  await p.evaluate(() => { G.Run.run.hp = 999; G.UI.C.combat.p.hp = 999; G.UI.C.combat.p.maxHp = 999; });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.evaluate(() => {
    window.__frames = [];
    let last = performance.now();
    const f = (t) => {
      window.__frames.push(t - last);
      last = t;
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  for (let turn = 0; turn < 3; turn++) {
    for (let k = 0; k < 4; k++) {
      const c = await p.$('.hand .card:not(.unplayable)');
      if (!c) break;
      const r = await c.boundingBox();
      await p.mouse.move(r.x + r.width / 2, r.y + 20);
      await p.mouse.down();
      for (let i = 1; i <= 6; i++) await p.mouse.move(r.x + r.width / 2, r.y + 20 - i * 35);
      await p.mouse.up();
      await p.waitForTimeout(900);
    }
    if (await p.evaluate(() => G.UI.C.combat.over)) break;
    await p.click('.end-turn', { force: true });
    await p.waitForTimeout(2200);
  }
  const fr = await p.evaluate(() => window.__frames.slice(2));
  const avg = fr.reduce((a, b) => a + b, 0) / fr.length;
  const slow = fr.filter((x) => x > 34).length;
  const worst = Math.max(...fr);
  console.log(`${label.padEnd(10)} images ${fr.length}  moyenne ${avg.toFixed(1)} ms (${(1000 / avg).toFixed(0)} i/s)  lentes >34ms : ${slow} (${((slow / fr.length) * 100).toFixed(1)} %)  pire ${worst.toFixed(0)} ms`);
  await b.close();
}
(async () => {
  await measure(8768, 'avant');
  await measure(8767, 'après');
})();
