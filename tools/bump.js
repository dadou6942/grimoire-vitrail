#!/usr/bin/env node
/* Change le numéro de version partout (adresses des fichiers, service worker, écran titre).
 * À lancer avant chaque publication : node tools/bump.js 1.4.0
 * Les téléphones voient ainsi de nouvelles adresses et téléchargent la mise à jour. */
'use strict';
const fs = require('fs');
const path = require('path');

const v = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(v || '')) {
  console.error('Usage : node tools/bump.js X.Y.Z');
  process.exit(1);
}
const root = path.join(__dirname, '..');
const edit = (file, fn) => {
  const p = path.join(root, file);
  fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
};
edit('index.html', (s) => s.replace(/\?v=\d+\.\d+\.\d+/g, '?v=' + v).replace(/GRIMOIRE_VERSION = '[^']*'/, `GRIMOIRE_VERSION = '${v}'`));
edit('sw.js', (s) => s.replace(/const VERSION = '[^']*'/, `const VERSION = '${v}'`));
console.log('Version', v);
