
# Frontend – Application de Gestion d'Achats

Interface web pour gérer les demandes d'achats et les abonnements des bibliothèques.

Ce dépôt contient uniquement le **frontend** (Angular).  
Le backend (API Node.js / Express) se trouve dans un dépôt séparé.

## Fonctionnalités

- Créer et modifier des demandes d'achat
- Voir toutes les demandes dans une liste
- Filtrer par type, statut, date
- Visualiser des rapports (données exposées par l'API)
- Accès sécurisé avec login

## Prérequis

- **Node.js** (version 18 ou plus)
- **npm** (fourni avec Node.js)
- Une instance de l’API « Gestion d’Achats » fonctionnelle (backend)

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/bibudem/chaine-achat-frontend.git
cd chaine-achat-frontend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l’URL de l’API

Selon ta structure actuelle, tu peux par exemple utiliser un fichier `environment.ts` :

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

Adapte l’URL si ton backend tourne ailleurs (domaine, port, HTTPS, etc.).

### 4. Démarrer l’application

```bash
npm run start
# ou
ng serve
```

Le frontend démarre sur : `http://localhost:4200`

### 5. Accéder à l'application

Ouvre ton navigateur et va à :

```
http://localhost:4200
```

Connecte-toi avec tes identifiants.

## Structure du projet

```text
app-gestion-achats-frontend/
├── src/
│   ├── app/           # Composants, pages, services
│   ├── assets/        # Images, traductions, styles globaux
│   └── index.html     # Page principale
├── angular.json       # Configuration Angular
├── package.json       # Dépendances frontend
└── README.md
```

## Aide et dépannage

### Le frontend ne démarre pas

- Vérifie que Node.js est bien installé : `node --version`
- Supprime le dossier `node_modules` et réinstalle : `npm install`
- Vérifie que le port 4200 n’est pas déjà utilisé

### Les données ne s’affichent pas

- Vérifie que le backend est démarré
- Vérifie l’URL de l’API dans `environment.ts`
- Contrôle les erreurs dans la console du navigateur et celle du terminal

## À propos

**Application de Gestion d'Achats – Frontend** – Version 1.0  
Développée par Natalia Jabinschi  

© 2026 Bibudem – Tous droits réservés