# Shelfie

Une app web qui regroupe ta bibliothèque **Steam**, **GOG** et
**PlayStation** au même endroit : tous tes jeux, sur quel launcher, les
doublons entre plateformes, le temps de jeu et les trophées/succès.

## Pourquoi pas Epic, EA, Battle.net ?

Steam a une vraie API publique. PlayStation n'a pas d'API officielle mais
la lib communautaire `psn-api` est stable et largement utilisée. GOG n'a
pas de programme développeur public, mais son client officiel (GOG
Galaxy) utilise un vrai système de connexion (OAuth) que des outils
open-source réputés (Heroic Games Launcher, gogdl) réutilisent depuis des
années de façon stable — Shelfie fait pareil.

Epic, EA et Battle.net n'ont **aucune** de ces options : ni API publique,
ni méthode communautaire stable. Les intégrer demanderait de simuler en
douce le comportement interne de leur launcher (ce qu'a fait un projet
comme "Legendary" pour Epic), au prix d'une fragilité réelle — ça peut
casser à tout moment si l'éditeur change son API, avec un petit risque
sur le compte utilisé. Le code est structuré (`src/lib/`, type
`Platform`) pour qu'ajouter un launcher plus tard = un nouveau fichier
`src/lib/<launcher>.ts` + une entrée dans `Platform`, sans toucher au reste
— donc faisable si tu changes d'avis, en connaissance de cause.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Stockage des identifiants : `data/settings.json` en local (zéro config),
  ou une base **Upstash Redis** gratuite quand elle est configurée (requis
  sur un hébergeur serverless comme Vercel — voir la section Héberger).
  Les données de bibliothèque sont récupérées à la demande auprès des API
  et mises en cache en mémoire quelques minutes.
- Connexion via **Google** (NextAuth) : chaque visiteur se connecte avec
  son propre compte Google et a sa bibliothèque privée, isolée des autres
  utilisateurs — personne ne voit les jeux ou les identifiants Steam/PSN
  de quelqu'un d'autre. Sans identifiants Google configurés, l'app reste
  ouverte en mode mono-utilisateur (pratique pour `npm run dev`).

## Démarrer

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000, puis va dans **Réglages** pour connecter tes
comptes.

## Connecter Steam

Dans **Réglages**, clique sur **Se connecter avec Steam** — ça ouvre la
page de connexion Steam officielle (OpenID), pas de clé API à saisir.
Ton profil doit être **public** : Steam → Modifier le profil →
Confidentialité → mets **Mon profil** ET **Détails du jeu** sur Public.
« Détails du jeu » seul suffit pour la bibliothèque et le temps de jeu,
mais les succès Steam exigent que le profil entier soit public — sinon
l'API renvoie `Profile is not public` sur chaque tentative de chargement
des succès.

C'est l'app elle-même qui a besoin d'**une seule** clé API Steam
(variable `STEAM_API_KEY`, voir la section Héberger) — les visiteurs n'ont
jamais besoin d'en créer une.

## Connecter GOG

GOG ne peut pas rediriger automatiquement vers Shelfie (son client OAuth
partagé n'a qu'une seule redirection possible, une page GOG). Dans
**Réglages** :

1. Clique sur **Ouvrir la connexion GOG** (nouvel onglet), connecte-toi.
2. Tu atterris sur une page GOG à priori vide — copie la valeur après
   `code=` dans l'adresse de cette page.
3. Colle-la dans Shelfie et valide.

⚠️ GOG n'expose ni temps de jeu ni trophées via son API (Galaxy les suit
uniquement en local sur ta machine) — seuls le titre et la jaquette sont
disponibles pour ces jeux.

## Connecter PlayStation

1. Connecte-toi sur https://my.playstation.com dans le même navigateur.
2. Va sur https://ca.account.sony.com/api/v1/ssocookie et copie la valeur
   du champ `npsso` (un token de 64 caractères).
3. Colle-le dans Réglages → PlayStation.

⚠️ Ce token expire après ~2 mois : il faudra le renouveler en refaisant
l'étape ci-dessus.

## Fonctionnalités

- Liste unifiée de tous les jeux, avec badge du/des launcher(s)
- Détection des doublons (même jeu possédé sur plusieurs launchers), avec
  regroupement par titre normalisé (ignore la ponctuation, les éditions
  « Deluxe/GOTY/Remastered », et les chiffres romains à 2+ lettres —
  « Dark Souls III » ≡ « Dark Souls 3 »)
- Temps de jeu par jeu et cumulé par plateforme
- Trophées PlayStation (platine/or/argent/bronze + % de complétion)
- Succès Steam (chargés à la demande en dépliant un jeu, pour éviter de
  spammer l'API sur une grosse bibliothèque)
- Recherche, filtre par launcher, filtre « doublons uniquement », filtre
  « masquer les jeux jamais joués »
- Tri par temps de jeu, nom, ou dernière session
- Bouton « Actualiser » pour forcer une resynchronisation immédiate
  (bypass du cache de 5 min), avec horodatage de la dernière synchro
- Multi-utilisateur : connexion Google, bibliothèque et identifiants
  Steam/PSN isolés par compte
- Statut perso par jeu (à jouer / en cours / terminé / abandonné), note en
  étoiles, note personnelle en texte libre
- Profil public façon Letterboxd (optionnel) : `Réglages → Profil public`,
  choisis un nom et rends ta bibliothèque visible à `/u/ton-nom` sans que
  les visiteurs aient besoin de se connecter. Seuls les jaquettes, statuts
  et notes en étoiles sont montrés — les notes personnelles en texte libre
  restent toujours privées, même sur le profil public.

## Héberger le site pour que tout le monde puisse l'utiliser

Recommandé : **Vercel**, l'hébergeur officiel de Next.js — gratuit, HTTPS
automatique, aucun serveur à gérer/patcher, aucune carte bancaire requise.

### 1. Pousser le code sur GitHub

Le code est déjà sur GitHub si tu es parti de ce dépôt. Sinon : crée un
dépôt sur https://github.com/new et pousse ce projet dedans.

### 2. Créer une clé API Steam (une seule, pour toute l'app)

Va sur https://steamcommunity.com/dev/apikey (n'importe quel nom de
domaine convient, ex. ton domaine Vercel ou `localhost`), copie la clé.
C'est la seule clé Steam nécessaire — tous les visiteurs qui se
connectent avec leur compte Steam l'utiliseront pour lire leur propre
bibliothèque publique, sans jamais en créer une eux-mêmes.

### 3. Créer une base Upstash Redis gratuite (pour que les identifiants de chaque utilisateur persistent)

Sur Vercel, le disque des fonctions serverless n'est pas persistant. Il
faut donc une petite base gratuite pour stocker les identifiants Steam/PSN
de chaque compte.

1. Va sur https://console.upstash.com (compte gratuit, pas de carte
   bancaire), crée une base **Redis** (région au choix, plan gratuit).
2. Dans l'onglet **Details** de la base, section **REST API**, copie
   `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.

### 4. Créer des identifiants Google OAuth (pour que chacun se connecte avec son compte)

1. Va sur https://console.cloud.google.com/apis/credentials (crée un
   projet si on te le demande — nom libre, ex. "Game Library Hub").
2. Dans **OAuth consent screen** :
   - Type d'utilisateur : **External**
   - Renseigne un nom d'appli, un email de support, un email développeur
   - Une fois créé, mets le statut de publication sur **In production**
     (bouton "Publish App") pour que n'importe qui puisse se connecter, pas
     seulement des comptes de test que tu ajoutes toi-même
3. Dans **Credentials** → **Create Credentials** → **OAuth client ID** :
   - Type d'application : **Web application**
   - **Authorized redirect URIs**, ajoute :
     `https://TON-DOMAINE.vercel.app/api/auth/callback/google`
     (tu connaîtras l'URL exacte après le premier déploiement à l'étape 4 —
     tu pourras revenir modifier cette valeur ensuite)
   - Clique sur **Create**, copie le **Client ID** et le **Client Secret**

⚠️ Tant que l'appli reste en statut "Testing", seuls les comptes Google que
tu ajoutes explicitement comme testeurs peuvent se connecter. Passe bien en
"In production" pour un accès public. Avec seulement les scopes de base
(email/profil), Google n'exige généralement pas de vérification manuelle
poussée, mais peut afficher un avertissement "app non vérifiée" tant que
l'app n'est pas soumise à vérification (l'utilisateur peut cliquer sur
"Advanced → Continuer" pour passer outre).

### 5. Déployer sur Vercel

1. Va sur https://vercel.com/new, connecte ton compte GitHub, importe le
   dépôt. Vercel détecte Next.js automatiquement — aucune configuration
   de build à changer.
2. Avant de cliquer sur *Deploy*, ouvre **Environment Variables** et
   ajoute :
   - `STEAM_API_KEY` (étape 2)
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (étape 3)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (étape 4)
   - `NEXTAUTH_SECRET` : une chaîne aléatoire quelconque (sert à signer les
     cookies de session — génère-en une avec `openssl rand -hex 32`)
   - `NEXTAUTH_URL` : laisse vide pour l'instant si tu ne connais pas
     encore ton domaine final, sinon `https://TON-DOMAINE.vercel.app`
3. Clique sur **Deploy**. Après ~1 minute, l'app est en ligne sur une URL
   `https://....vercel.app`.
4. Retourne dans Google Cloud Console → Credentials → ton client OAuth, et
   mets à jour l'**Authorized redirect URI** avec l'URL réelle obtenue :
   `https://TON-DOMAINE-REEL.vercel.app/api/auth/callback/google`.
   Si tu avais laissé `NEXTAUTH_URL` vide, ajoute-le maintenant dans Vercel
   avec cette même URL puis redéploie (Vercel → Deployments → ⋯ → Redeploy).
   (Steam n'a pas besoin de cette étape — son OpenID n'a pas d'URI à
   déclarer à l'avance.)
5. Ouvre le site, clique sur **Continuer avec Google**, puis va dans
   **Réglages** : Steam se connecte en un clic, PlayStation demande de
   coller le jeton NPSSO (voir plus haut) — chaque visiteur configure les
   siens.

Tout redéploiement futur (nouveau `git push`) réutilise la même base
Upstash : les identifiants de chaque utilisateur ne sont jamais perdus.

### Alternative sans base de données : Render.com

Si tu préfères ne pas créer de compte Upstash, **Render.com** (gratuit,
sans carte bancaire) fait tourner un vrai serveur avec un disque qui
persiste tant que le service ne redémarre pas — le stockage par fichier
fonctionne alors sans aucun changement de code. La connexion Google
(étapes 3-4 ci-dessus, avec l'URL Render à la place de l'URL Vercel)
fonctionne pareil.

Limites du plan gratuit Render : le service se met en veille après 15 min
d'inactivité (le premier accès prend 30-60s pour le réveiller), et un
redéploiement remet le disque à zéro — les utilisateurs devront alors
ressaisir leurs identifiants Steam/PSN dans Réglages.

## Limites connues

- Epic Games, EA (Origin/EA App) et Battle.net ne sont pas supportés (pas
  d'API publique officielle ni de méthode communautaire stable — voir plus
  haut).
- `psn-api` est une librairie communautaire non-officielle qui dépend de
  l'API interne de PlayStation ; elle peut casser si Sony change son API.
- L'intégration GOG utilise les identifiants OAuth partagés de GOG Galaxy
  (comme les outils open-source équivalents) — même logique de risque que
  `psn-api` : peut casser si GOG change son API interne. GOG n'expose ni
  temps de jeu ni trophées.
- Un `npm audit` signale des vulnérabilités connues de Next.js/PostCSS qui
  ne sont corrigées que dans Next 16 (changement majeur non appliqué ici).
  Sans exposition publique multi-utilisateurs ni usage de l'Image
  Optimizer/Server Actions, le risque réel est faible pour un usage
  personnel auto-hébergé ; envisager la migration si l'app est un jour
  exposée publiquement.
- La clé `STEAM_API_KEY` est partagée par tous les visiteurs (c'est ce qui
  permet à chacun de se connecter sans créer la sienne). Le quota Steam
  (~100 000 requêtes/jour) est donc mutualisé entre tous les utilisateurs
  de l'app — largement suffisant pour un usage personnel ou entre amis,
  mais à garder en tête si l'app devient très fréquentée. PSN n'a pas ce
  problème : chaque utilisateur fournit son propre jeton NPSSO.
