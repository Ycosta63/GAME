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
- Aucune base de données : les identifiants sont stockés dans
  `data/settings.json` (ignoré par git), les données de bibliothèque sont
  récupérées à la demande auprès des API et mises en cache en mémoire
  quelques minutes.

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
  éditions « Deluxe/GOTY/Remastered », etc.)
- Temps de jeu par jeu et cumulé par plateforme
- Trophées PlayStation (platine/or/argent/bronze + % de complétion)
- Succès Steam (chargés à la demande en dépliant un jeu, pour éviter de
  spammer l'API sur une grosse bibliothèque)
- Recherche, filtre par launcher, filtre « doublons uniquement »

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
