/* Grimoire de Vitrail — comptes en ligne et synchronisation entre appareils.
 * Client minimal pour Supabase (authentification par e-mail et mot de passe, une ligne par joueur
 * dans la table `saves`). Aucune bibliothèque : de simples requêtes fetch.
 * Fonctionnement :
 *  - à la connexion et au lancement, on récupère la sauvegarde en ligne et on la fusionne
 *    (les acquis se cumulent, la partie en cours la plus récente l'emporte) ;
 *  - ensuite, chaque sauvegarde locale est envoyée quelques secondes plus tard ;
 *  - sans réseau, on continue en local et on rattrape à la prochaine occasion. */
(function (G) {
  'use strict';

  const KEY = 'grimoire-vitrail.cloud';
  const conf = () => window.GRIMOIRE_CLOUD || {};
  const Cloud = {
    session: null, // { access_token, refresh_token, expires_at, user: { id, email }, pseudo }
    status: 'off', // off | idle | syncing | ok | offline | error
    lastSync: 0,
    message: '',
    onChange: null,
  };
  G.Cloud = Cloud;

  Cloud.enabled = () => !!(conf().url && conf().anonKey);
  Cloud.loggedIn = () => !!(Cloud.session && Cloud.session.access_token);

  function setStatus(s, msg) {
    Cloud.status = s;
    if (msg !== undefined) Cloud.message = msg;
    if (Cloud.onChange) Cloud.onChange();
  }
  function store() {
    try {
      if (Cloud.session) localStorage.setItem(KEY, JSON.stringify(Cloud.session));
      else localStorage.removeItem(KEY);
    } catch (e) {
      /* ignoré */
    }
  }

  async function call(path, opts) {
    const c = conf();
    const headers = Object.assign({ apikey: c.anonKey, 'Content-Type': 'application/json' }, opts.headers || {});
    const res = await fetch(c.url.replace(/\/$/, '') + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    let data = null;
    const txt = await res.text();
    try {
      data = txt ? JSON.parse(txt) : null;
    } catch (e) {
      data = txt;
    }
    if (!res.ok) {
      const err = new Error((data && (data.msg || data.error_description || data.message || data.error)) || 'HTTP ' + res.status);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // messages d'erreur compréhensibles
  function explain(e) {
    const m = (e && e.message) || '';
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.';
    if (/already registered|already been registered|User already/i.test(m)) return 'Un compte existe déjà avec cet e-mail : connecte-toi.';
    if (/Password should be|weak/i.test(m)) return 'Mot de passe trop court (6 caractères au moins).';
    if (/Email not confirmed/i.test(m)) return 'Confirme d’abord ton e-mail (lien reçu par courriel).';
    if (/valid email|invalid format|Unable to validate email/i.test(m)) return 'Cette adresse e-mail n’est pas valide.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Pas de connexion au serveur. Réessaie plus tard.';
    return 'Le serveur a refusé : ' + m;
  }

  function keepSession(data, pseudo) {
    if (!data || !data.access_token) return false;
    Cloud.session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
      user: { id: data.user.id, email: data.user.email },
      pseudo: pseudo || (data.user.user_metadata && data.user.user_metadata.pseudo) || data.user.email.split('@')[0],
    };
    store();
    return true;
  }

  async function freshToken() {
    const s = Cloud.session;
    if (!s) return null;
    if (Date.now() < s.expires_at - 60000) return s.access_token;
    try {
      const data = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } });
      keepSession(data, s.pseudo);
      return Cloud.session.access_token;
    } catch (e) {
      if (e.status === 400 || e.status === 401) {
        // session expirée pour de bon : il faudra se reconnecter
        Cloud.session = null;
        store();
        setStatus('error', 'Session expirée : reconnecte-toi.');
      }
      throw e;
    }
  }

  /** Crée un compte. Renvoie null si tout va bien, sinon un message. */
  Cloud.signUp = async function (email, password, pseudo) {
    try {
      const data = await call('/auth/v1/signup', { method: 'POST', body: { email, password, data: { pseudo } } });
      if (keepSession(data, pseudo)) {
        await Cloud.sync(true);
        return null;
      }
      return 'Compte créé. Ouvre le lien reçu par e-mail, puis connecte-toi ici.';
    } catch (e) {
      return explain(e);
    }
  };

  /** Connexion. Renvoie null si tout va bien, sinon un message. */
  Cloud.signIn = async function (email, password) {
    try {
      const data = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
      keepSession(data);
      await Cloud.sync(true);
      return null;
    } catch (e) {
      return explain(e);
    }
  };

  Cloud.signOut = async function () {
    const s = Cloud.session;
    Cloud.session = null;
    store();
    setStatus('off', '');
    if (s) {
      try {
        await call('/auth/v1/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + s.access_token } });
      } catch (e) {
        /* déjà déconnecté */
      }
    }
  };

  async function pull(token) {
    const uid = Cloud.session.user.id;
    const rows = await call(`/rest/v1/saves?select=data,updated_at&user_id=eq.${encodeURIComponent(uid)}`, { headers: { Authorization: 'Bearer ' + token } });
    return rows && rows[0] ? rows[0].data : null;
  }
  async function push(token) {
    const uid = Cloud.session.user.id;
    await call('/rest/v1/saves?on_conflict=user_id', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: { user_id: uid, data: G.Run.snapshotAll(), updated_at: new Date().toISOString() },
    });
  }

  let syncing = null;
  /** Synchronise ; full = récupérer d'abord la version en ligne (connexion, lancement). */
  Cloud.sync = function (full) {
    if (!Cloud.enabled() || !Cloud.loggedIn()) return Promise.resolve();
    if (syncing) return syncing;
    setStatus('syncing');
    syncing = (async () => {
      try {
        const token = await freshToken();
        if (full) {
          const remote = await pull(token);
          // en pleine partie, on ne remplace jamais la partie affichée : seuls les acquis sont fusionnés
          const inGame = G.UI && G.UI.inGame && G.UI.inGame();
          if (remote) G.Run.applyRemote(remote.meta, inGame ? null : remote.run);
        }
        await push(token);
        Cloud.lastSync = Date.now();
        setStatus('ok', '');
        if (full && G.UI && G.UI.onCloudPulled) G.UI.onCloudPulled();
      } catch (e) {
        setStatus(/fetch|network|load failed/i.test(e.message || '') ? 'offline' : 'error', explain(e));
      } finally {
        syncing = null;
      }
    })();
    return syncing;
  };

  // envoi automatique quelques secondes après chaque sauvegarde locale
  let timer = null;
  function schedule() {
    if (!Cloud.enabled() || !Cloud.loggedIn()) return;
    clearTimeout(timer);
    timer = setTimeout(() => Cloud.sync(false), 4000);
  }

  Cloud.init = function () {
    try {
      Cloud.session = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
      Cloud.session = null;
    }
    G.Run.listeners.push(schedule);
    if (Cloud.enabled() && Cloud.loggedIn()) Cloud.sync(true);
    // l'app revient au premier plan : on rattrape
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Cloud.loggedIn()) Cloud.sync(true);
      if (document.hidden && Cloud.loggedIn()) Cloud.sync(false);
    });
    window.addEventListener('online', () => Cloud.loggedIn() && Cloud.sync(true));
  };
})(window.G = window.G || {});
