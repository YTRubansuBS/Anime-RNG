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