# Anime RNG — Beyond Fate

Anime RNG 2D premium construit avec React, TypeScript, Vite et Tailwind CSS.

## Gameplay

- Moteur RNG central utilisant directement le denominator 1/X de chaque résultat.
- 100 résultats originaux : 20 Common, 20 Uncommon, 15 Rare, 15 Epic, 10 Legendary, 8 Mythic, 5 Divine, 4 Celestial, 2 Transcendent, 1 Secret.
- 1/X affiché sur le roll, la collection, l'inventaire, l'historique, le profil, les succès et les classements.
- Collection, inventaire avec sélection multiple, vente, favoris et équipement.
- Shop Coins/Gems, boosts, cosmétiques, compétences et améliorations permanentes.
- Quêtes quotidiennes/hebdomadaires, calendrier 7 jours, codes, événements et titres.
- Pity Epic / Legendary / Mythic.
- Auto Roll.
- Profil, statistiques avancées et Top 100 de démonstration.
- Sauvegarde locale robuste via localStorage.
- Architecture audio Web Audio sans dépendance externe.
- Responsive desktop/tablette/mobile avec navigation compacte.
- Mode réduction des animations et contrôles de qualité.

## Lancer

npm install
npm run dev

Build de production :

npm run build

Le workflow .github/workflows/build.yml est prévu pour vérifier le build sur GitHub Actions.

## Architecture

- src/data.ts : contenus, raretés, 100 drops, skills, upgrades, shop, quêtes, événements.
- src/logic/rng.ts : moteur RNG, progression XP et comparaison des drops.
- src/store.ts : état joueur et sauvegarde locale.
- src/audio.ts : feedback audio.
- src/App.tsx : pages et composants du jeu.
- src/styles.css : direction artistique anime/neon et responsive.


Build CI: TypeScript + Vite vérifiés à chaque push.

## Connexion et sauvegarde

- Écran de démarrage avec **Jouer en local** ou **Se connecter**.
- Les comptes utilisent Supabase Auth.
- La sauvegarde du jeu du compte est synchronisée dans les métadonnées de l'utilisateur Supabase.
- Les variables d'environnement utilisées par Vite sont exactement `URL` et `KEY`.
- En local, copie `.env.example` vers `.env` et renseigne ces deux valeurs.
- Sur Vercel, ajoute `URL` et `KEY` dans les Environment Variables.
- Le jeu ne contient pas la clé secrète/service-role : utilise uniquement la clé client publishable/anon.

## Animations RNG adaptatives

- Le résultat RNG est calculé avant l'animation.
- Les résultats EPIC et plus peuvent déclencher l'animation ultra-rare si leur dénominateur atteint le seuil du joueur.
- Le seuil commence à **1/100** et augmente progressivement avec le niveau.
- Toutes les animations ultra-rares utilisent la même durée : **2350 ms**.
- Les résultats devenus trop fréquents pour le niveau du joueur sont donc révélés plus rapidement sans modifier le résultat RNG.


## Admin Panel

Le panneau **Admin Panel** permet au compte administrateur de donner une récompense à un joueur précis sans passer par le navigateur du joueur.

Variables Vercel nécessaires :
- `URL` : URL Supabase déjà utilisée par le jeu.
- `KEY` : clé client Supabase déjà utilisée par le jeu.
- `SUPABASE_SERVICE_ROLE_KEY` : clé **service role secrète**, uniquement côté serveur Vercel. Ne la mets jamais dans `VITE_` ou dans le code du navigateur.
- `ADMIN_USER_ID` : UUID Supabase du compte qui doit avoir accès au panneau admin.

Dans le jeu, le panneau apparaît dans **MENU → Admin Panel** uniquement après la vérification serveur du compte administrateur.

Le panneau permet notamment d'ajouter des **coins, gems, tickets, XP, auras**, de définir la **pity Epic / Legendary / Mythic** et de débloquer toutes les zones pour le joueur ciblé.
