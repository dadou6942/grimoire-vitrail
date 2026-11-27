# Activer les comptes en ligne

Avec les comptes, tes amis retrouvent leur progression sur tous leurs appareils : héros éveillés, paliers et partie en cours.
Le jeu s'appuie sur [Supabase](https://supabase.com), un service gratuit pour un petit groupe de joueurs.
Compte une dizaine de minutes, une seule fois. Sans cette étape, le jeu marche normalement : les sauvegardes restent alors
sur l'appareil, et le **code de transfert** (Compte et sauvegarde → Afficher mon code) permet de changer d'appareil.

## 1. Créer le projet

1. Crée un compte sur supabase.com, puis **New project**. Choisis un nom (par exemple `grimoire`), un mot de passe de base
   de données (garde-le pour toi, le jeu n'en a pas besoin) et la région **Europe**.
2. Attends une à deux minutes que le projet soit prêt.

## 2. Créer la table des sauvegardes

Ouvre **SQL Editor**, colle ce script et clique sur **Run** :

```sql
-- Une ligne par joueur : sa progression complète (format JSON).
create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Règles d'accès : chaque joueur ne peut lire et écrire que SA sauvegarde.
alter table public.saves enable row level security;

create policy "lire sa sauvegarde" on public.saves
  for select using (auth.uid() = user_id);
create policy "créer sa sauvegarde" on public.saves
  for insert with check (auth.uid() = user_id);
create policy "modifier sa sauvegarde" on public.saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## 3. Simplifier l'inscription

Dans **Authentication → Sign In / Providers → Email**, désactive **Confirm email**.
Tes amis pourront ainsi créer leur compte et jouer tout de suite, sans aller cliquer un lien dans leur boîte mail.
Si tu préfères garder la confirmation, le jeu le gère : il demande d'ouvrir le lien reçu, puis de se connecter.

## 4. Brancher le jeu

Dans **Project Settings → API** (ou **Data API**), copie :

- l'**URL du projet** (`https://xxxx.supabase.co`) ;
- la clé **anon public**.

Colle-les dans `js/config.js` :

```js
window.GRIMOIRE_CLOUD = {
  url: 'https://xxxx.supabase.co',
  anonKey: 'eyJhbGciOi…',
};
```

Puis publie : commit et push sur `main`. GitHub Pages met le jeu à jour en une minute.
Tu peux aussi m'envoyer ces deux valeurs, et je fais le changement.

La clé « anon » est faite pour être visible dans le code d'une application : elle ne donne aucun droit particulier.
Ce sont les règles d'accès de l'étape 2 qui protègent les sauvegardes. Ne mets jamais dans le jeu la clé `service_role`.

## Utilisation

- Dans le jeu : **Compte et sauvegarde** (écran titre ou menu ☰), puis **Créer un compte** avec un pseudo, un e-mail et un
  mot de passe.
- Sur un autre appareil, **Se connecter** avec le même e-mail : la progression arrive aussitôt.
- La synchronisation est automatique, quelques secondes après chaque étape. Sans réseau, le jeu continue en local
  et rattrape le retard au retour du réseau.
- En cas de progression différente sur deux appareils, les acquis se cumulent (on garde le meilleur des deux côtés),
  et la partie en cours la plus récente l'emporte. Une partie affichée à l'écran n'est jamais remplacée en plein jeu.

Les comptes ne fonctionnent que sur la version GitHub Pages du jeu. La page d'aperçu sur claude.ai ne peut pas joindre
de serveur extérieur.

## Tester sans projet réel

`node tools/mock-supabase.js` lance un faux serveur Supabase local (port 54321). Pointe `js/config.js` dessus
(`url: 'http://localhost:54321'`, n'importe quelle clé) pour essayer les comptes sur ton ordinateur.
