# Wird — Suivi de Lecture du Coran & Wirds

Application PWA (Progressive Web App) pour suivre vos lectures du Coran (Juzz), Khassidas et Wirds.

## Fonctionnalités

- **Kamil Personnel** — 30 Juzz sur une période définie, cochez chaque Juzz lu (plusieurs par jour possibles), alerte si délai dépassé
- **Kamil Collectif** — Juzz assignés dans un Kamil partagé, avec deadline
- **Wirds & Khassidas** — Suivi libre de n'importe quelle récitation, avec objectif, récurrence, deadline
- **Dashboard** — Vue d'ensemble avec alertes de retard et tâches urgentes
- **Notifications locales** — Rappels programmés sur l'appareil
- **Export/Import JSON** — Sauvegardez et restaurez vos données
- **Mode hors-ligne** — Fonctionne sans internet une fois installé
- **PWA installable** — Ajoutez à l'écran d'accueil comme une app native

## Installation

```bash
npm install
npm run dev
```

## Déploiement (Vercel ou Netlify)

1. Créez un compte sur [vercel.com](https://vercel.com) ou [netlify.com](https://netlify.com)
2. Connectez votre dépôt GitHub (ou glissez le dossier sur Netlify)
3. Build command: `npm run build`
4. Output directory: `dist`
5. C'est tout — votre app est en ligne !

## Installer l'app sur mobile

### Android (Chrome)
1. Ouvrez l'app dans Chrome
2. Menu ⋮ → "Ajouter à l'écran d'accueil"

### iPhone (Safari)
1. Ouvrez l'app dans Safari
2. Icône partage → "Sur l'écran d'accueil"

## Ajouter les icônes

Remplacez ces fichiers dans le dossier `public/` :
- `icon-192.png` — 192×192 pixels
- `icon-512.png` — 512×512 pixels

Utilisez un fond vert foncé (#1A3828) avec l'étoile dorée.

## Données

Toutes les données sont stockées **localement** sur votre appareil (IndexedDB).  
Aucune donnée n'est envoyée sur un serveur.  
Faites des exports réguliers depuis Réglages → Exporter.

## Notifications

Les notifications locales fonctionnent quand l'app est ouverte ou en premier plan.  
Sur Android, elles fonctionnent mieux si l'app est installée (écran d'accueil).  
Sur iPhone, les notifications PWA nécessitent iOS 16.4+ et l'installation sur l'écran d'accueil.

## Stack technique

- React 18 + Vite
- Tailwind CSS
- Dexie.js (IndexedDB)
- Phosphor Icons
- vite-plugin-pwa (Workbox)
- Google Fonts (Amiri + Lato)
