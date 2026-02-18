# Application de Gestion d'Achats

Application web pour gérer les demandes d'achats et les abonnements des bibliothèques.

## Ce qu'on peut faire

- Créer et modifier des demandes d'achat
- Voir toutes les demandes dans une liste
- Filtrer par type, statut, date
- Générer des rapports
- Gérer les informations de budget
- Accès sécurisé avec login

## Installation

### Avant de commencer

Vous devez avoir installé sur votre ordinateur :
- **Node.js** (version 18 ou plus) : https://nodejs.org/
- **npm** (vient avec Node.js)
- **PostgreSQL** (version 12 ou plus) : https://www.postgresql.org/

### Étape 1 : Télécharger le projet

```bash
git clone https://github.com/bibudem/app-gestion-achats.git
cd app-gestion-achats
```

### Étape 2 : Installer les dépendances

Installez les dépendances du frontend (Angular) :
```bash
npm install
```

Installez les dépendances du backend (Express) :
```bash
cd backend
npm install
cd ..
```

### Étape 3 : Configurer la base de données

Créez un fichier `.env` dans le dossier `backend/` :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=chaineAchat
```

Remplacez :
- `votre_mot_de_passe` par le mot de passe PostgreSQL
- `DB_HOST` si votre base n'est pas en local

### Étape 4 : Créer la base de données

Ouvrez PostgreSQL et créez une base de données :

```sql
CREATE DATABASE chaineAchat;
```

Ensuite, créez les tables en exécutant le fichier SQL fourni dans le projet.

### Étape 5 : Démarrer l'application

Ouvrez deux fenêtres de terminal.

**Terminal 1 - Démarrer le backend (serveur Node.js) :**
```bash
cd backend
node server.js
```

Le serveur démarre sur : `http://localhost:3000`

**Terminal 2 - Démarrer le frontend (Angular) :**
```bash
ng serve
```

Le frontend démarre sur : `http://localhost:4200`

### Étape 6 : Accéder à l'application

Ouvrez votre navigateur et allez à :
```
http://localhost:4200
```

Connectez-vous avec vos identifiants.

## Structure du projet

```
app-gestion-achats/
├── src/                    # Code Angular (frontend)
│   ├── app/               # Composants et services
│   ├── assets/            # Images, fichiers de traduction
│   └── index.html         # Page principale
├── backend/               # Code Node.js (serveur)
│   ├── server.js          # Démarrage du serveur
│   ├── routes/            # Définition des endpoints
│   ├── controllers/        # Logique des endpoints
│   ├── models/            # Requêtes à la base de données
│   └── config/            # Configuration (base de données)
├── angular.json           # Configuration Angular
├── package.json           # Dépendances du frontend
└── README.md              # Ce fichier
```

## Aide et dépannage

### Le backend ne démarre pas
- Vérifiez que PostgreSQL est lancé
- Vérifiez que le port n'est pas utilisé
- Vérifiez les identifiants dans le fichier `.env`

### Le frontend ne démarre pas
- Vérifiez que Node.js est bien installé : `node --version`
- Supprimez le dossier `node_modules` et réinstallez : `npm install`

### La base de données ne se connecte pas
- Lancez PostgreSQL
- Vérifiez les identifiants dans `.env`
- Vérifiez que la base `chaineAchat` existe

## Support

En cas de problème, vérifiez les logs dans la console où vous avez démarré le serveur.


## À propos

**Application de Gestion d'Achats** – Version 1.0  
Développée par Natalia Jabinschi  

© 2026 Bibudem – Tous droits réservés
