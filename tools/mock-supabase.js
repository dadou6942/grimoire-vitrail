#!/usr/bin/env node
/* Faux serveur Supabase (en mémoire) pour tester les comptes sans projet réel.
 * Reproduit les routes utilisées par js/cloud.js : inscription, connexion, rafraîchissement,
 * déconnexion, lecture et écriture de la table `saves` (une ligne par joueur).
 * Usage : node tools/mock-supabase.js [port]  (défaut 54321) */
'use strict';
const http = require('http');
const crypto = require('crypto');

const port = Number(process.argv[2]) || 54321;
const users = {}; // email -> { id, email, password, pseudo }
const tokens = {}; // access/refresh token -> user id
const saves = {}; // user id -> { data, updated_at }

const send = (res, code, body) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
const session = (u) => {
  const access = crypto.randomBytes(12).toString('hex');
  const refresh = crypto.randomBytes(12).toString('hex');
  tokens[access] = u.id;
  tokens[refresh] = u.id;
  return { access_token: access, refresh_token: refresh, expires_in: 3600, user: { id: u.id, email: u.email, user_metadata: { pseudo: u.pseudo } } };
};

http
  .createServer((req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204);
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://x');
      const body = raw ? JSON.parse(raw) : {};
      if (!req.headers.apikey) return send(res, 401, { message: 'No API key' });
      const auth = (req.headers.authorization || '').replace('Bearer ', '');
      if (url.pathname === '/auth/v1/signup') {
        if (users[body.email]) return send(res, 422, { msg: 'User already registered' });
        if ((body.password || '').length < 6) return send(res, 422, { msg: 'Password should be at least 6 characters' });
        const u = { id: crypto.randomUUID(), email: body.email, password: body.password, pseudo: body.data && body.data.pseudo };
        users[body.email] = u;
        return send(res, 200, session(u));
      }
      if (url.pathname === '/auth/v1/token') {
        const g = url.searchParams.get('grant_type');
        if (g === 'password') {
          const u = users[body.email];
          if (!u || u.password !== body.password) return send(res, 400, { error_description: 'Invalid login credentials' });
          return send(res, 200, session(u));
        }
        if (g === 'refresh_token') {
          const id = tokens[body.refresh_token];
          const u = Object.values(users).find((x) => x.id === id);
          if (!u) return send(res, 400, { error_description: 'Invalid Refresh Token' });
          return send(res, 200, session(u));
        }
      }
      if (url.pathname === '/auth/v1/logout') return send(res, 204);
      if (url.pathname === '/rest/v1/saves') {
        const uid = tokens[auth];
        if (!uid) return send(res, 401, { message: 'JWT invalid' });
        if (req.method === 'GET') {
          const want = (url.searchParams.get('user_id') || '').replace('eq.', '');
          if (want !== uid) return send(res, 200, []); // règle d'accès : chacun ne voit que sa ligne
          return send(res, 200, saves[uid] ? [saves[uid]] : []);
        }
        if (req.method === 'POST') {
          if (body.user_id !== uid) return send(res, 403, { message: 'new row violates row-level security policy' });
          saves[uid] = { data: body.data, updated_at: body.updated_at };
          return send(res, 201);
        }
      }
      send(res, 404, { message: 'not found' });
    });
  })
  .listen(port, () => console.log('Faux Supabase sur http://localhost:' + port));
