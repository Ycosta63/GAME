# Game Library Hub

Une app web qui regroupe ta bibliothèque **Steam** et **PlayStation** au
même endroit : tous tes jeux, sur quel launcher, les doublons entre
plateformes, le temps de jeu et les trophées/succès.

## Pourquoi seulement Steam + PlayStation ?

Steam (Steam Web API) et PlayStation (via la lib communautaire `psn-api`)
sont les deux seuls launchers du lot (Steam, Epic, EA, Battle.net,
PlayStation) à exposer un moyen fiable de lire une bibliothèque de jeux et
des stats de progression. Epic, EA et Battle.net n'ont pas d'API publique
officielle pour ça — les intégrer demanderait des méthodes non-officielles
(lecture de fichiers locaux du launcher, API reverse-engineered) qui
peuvent casser à tout moment. Le code est structuré (`src/lib/`, type
`Platform`) pour qu'ajouter un launcher plus tard = un nouveau fichier
`src/lib/<launcher>.ts` + une entrée dans `Platform`, sans toucher au reste.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Stockage des identifiants : `data/settings.json` en local (zéro config),
  ou une base **Upstash Redis** gratuite quand elle est configurée (requis
  sur un hébergeur serverless comme Vercel — voir la section Héberger).
  Les données de bibliothèque sont récupérées à la demande auprès des API
  et mises en cache en mémoire quelques minutes.
- Le site entier peut être protégé par un mot de passe (variable
  `APP_PASSWORD`) — recommandé dès que l'app est accessible publiquement.

## Démarrer

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000, puis va dans **Réglages** pour connecter tes
comptes.

## Connecter Steam

1. Génère une clé API sur https://steamcommunity.com/dev/apikey (n'importe
   quel nom de domaine convient, ex. `localhost`).
2. Ton profil doit être **public** : Steam → Modifier le profil →
   Confidentialité → « Détails du jeu » sur Public (sinon l'API renvoie une
   bibliothèque vide).
3. Renseigne ta clé API et ton SteamID64 (ou ton nom de profil personnalisé,
   ex. `steamcommunity.com/id/TONPSEUDO` → `TONPSEUDO`).

## Connecter PlayStation

1. Connecte-toi sur https://my.playstation.com dans le même navigateur.
2. Va sur https://ca.account.sony.com/api/v1/ssocookie et copie la valeur
   du champ `npsso` (un token de 64 caractères).
3. Colle-le dans Réglages → PlayStation.

⚠️ Ce token expire après ~2 mois : il faudra le renouveler en refaisant
l'étape ci-dessus.

## Fonctionnalités

- Liste unifiée de tous les jeux, avec badge du/des launcher(s)
- Détection des doublons (même jeu possédé sur Steam **et** PlayStation),
  avec regroupement par titre normalisé (ignore la ponctuation, les
  éditions « Deluxe/GOTY/Remastered », et les chiffres romains à 2+
  lettres — « Dark Souls III » ≡ « Dark Souls 3 »)
- Temps de jeu par jeu et cumulé par plateforme
- Trophées PlayStation (platine/or/argent/bronze + % de complétion)
- Succès Steam (chargés à la demande en dépliant un jeu, pour éviter de
  spammer l'API sur une grosse bibliothèque)
- Recherche, filtre par launcher, filtre « doublons uniquement », filtre
  « masquer les jeux jamais joués »
- Tri par temps de jeu, nom, ou dernière session
- Bouton « Actualiser » pour forcer une resynchronisation immédiate
  (bypass du cache de 5 min), avec horodatage de la dernière synchro

## Héberger le site (gratuitement, en sécurisé)

Recommandé : **Vercel**, l'hébergeur officiel de Next.js — gratuit, HTTPS
automatique, aucun serveur à gérer/patcher, aucune carte bancaire requise.

### 1. Pousser le code sur GitHub

Le code est déjà sur GitHub si tu es parti de ce dépôt. Sinon : crée un
dépôt sur https://github.com/new et pousse ce projet dedans.

### 2. Créer une base Upstash Redis gratuite (pour que tes identifiants persistent)

Sur Vercel, le disque des fonctions serverless n'est pas persistant : le
fichier `data/settings.json` ne survivrait pas. Il faut donc une petite
base gratuite pour stocker tes identifiants Steam/PSN.

1. Va sur https://console.upstash.com (compte gratuit, pas de carte
   bancaire), crée une base **Redis** (région au choix, plan gratuit).
2. Dans l'onglet **REST API** de la base, copie `UPSTASH_REDIS_REST_URL`
   et `UPSTASH_REDIS_REST_TOKEN`.

### 3. Déployer sur Vercel

1. Va sur https://vercel.com/new, connecte ton compte GitHub, importe le
   dépôt. Vercel détecte Next.js automatiquement — aucune configuration
   de build à changer.
2. Avant de cliquer sur *Deploy*, ouvre **Environment Variables** et
   ajoute :
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (étape 2)
   - `APP_PASSWORD` : le mot de passe qui protégera tout le site (choisis-en
     un fort — c'est ce qui empêche n'importe qui avec l'URL de voir ta
     bibliothèque ou de reconfigurer tes comptes)
   - `AUTH_SECRET` : une deuxième chaîne aléatoire quelconque (sert à
     signer le cookie de session ; sans elle `APP_PASSWORD` est réutilisé,
     ce qui fonctionne mais est un peu moins robuste)
3. Clique sur **Deploy**. Après quelques dizaines de secondes, l'app est
   en ligne sur une URL `https://....vercel.app`.
4. Ouvre l'URL, entre ton `APP_PASSWORD`, puis va dans **Réglages** pour
   connecter Steam et PlayStation comme en local.

Tout redéploiement futur (nouveau `git push`) réutilise la même base
Upstash : tes identifiants ne sont pas perdus.

### Alternative sans base de données : Render.com

Si tu préfères ne pas créer de compte Upstash, **Render.com** (gratuit,
sans carte bancaire) fait tourner un vrai serveur avec un disque qui
persiste tant que le service ne redémarre pas — `data/settings.json`
fonctionne alors sans aucun changement de code. Pense quand même à définir
`APP_PASSWORD` (et `AUTH_SECRET`) dans les variables d'environnement du
service pour garder le site protégé.

Limites du plan gratuit Render : le service se met en veille après 15 min
d'inactivité (le premier accès prend 30-60s pour le réveiller), et un
redéploiement remet le disque à zéro — il faudra alors ressaisir tes
identifiants Steam/PSN dans Réglages.

## Limites connues

- Epic Games, EA (Origin/EA App) et Battle.net ne sont pas supportés (pas
  d'API publique officielle — voir plus haut).
- `psn-api` est une librairie communautaire non-officielle qui dépend de
  l'API interne de PlayStation ; elle peut casser si Sony change son API.
- Un `npm audit` signale des vulnérabilités connues de Next.js/PostCSS qui
  ne sont corrigées que dans Next 16 (changement majeur non appliqué ici).
  Sans exposition publique multi-utilisateurs ni usage de l'Image
  Optimizer/Server Actions, le risque réel est faible pour un usage
  personnel auto-hébergé ; envisager la migration si l'app est un jour
  exposée publiquement.
- La protection par mot de passe (`APP_PASSWORD`) n'a pas de limitation de
  tentatives (pas de rate limiting) : suffisant contre un visiteur au
  hasard, pas contre quelqu'un qui bruteforce activement. Choisis un mot
  de passe long plutôt qu'un mot du dictionnaire.
