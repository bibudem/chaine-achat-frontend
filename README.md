
# Frontend – Chaîne d'acquisitions · Bibliothèques UdeM

Interface web Angular pour gérer les demandes d'acquisition et les abonnements des bibliothèques de l'Université de Montréal.

Ce dépôt contient uniquement le **frontend** (Angular 15).  
Le backend (API Node.js / Express) et l'orchestrateur de notifications (n8n) se trouvent dans des dépôts séparés.

---

## Fonctionnalités

### Espace usager (communauté UdeM)
- Soumettre une demande via l'un des **6 formulaires** :
  - Nouvel achat unique
  - Nouvel abonnement
  - Modification et CCOL
  - PEB Tipasa numérique
  - Requête ACQ Accessibilité
  - Suggestion d'achat
- Consulter ses demandes et leur statut depuis le profil usager

### Espace administrateur (bibliothèques)
- **Gestion des items** : liste, filtres avancés, tri, pagination
- **Statut Bibliothèque** : mise à jour du statut de traitement par demande
- **Formulaire d'item** : création et modification avec 3 onglets (Informations de base · Champs spécifiques · Décision ACQ)
- **Réponses formulaires** : consultation et traitement des soumissions usager
- **Rapports** : génération et export Excel de données filtrées
- **Import en lot** : insertion de demandes depuis un fichier Excel
- **Tableau de bord** : statistiques, répartition par type/bibliothèque/priorité
- Notifications automatiques par courriel via **n8n** à la soumission et à la mise à jour du statut

### Général
- Interface **bilingue** FR / EN (sélecteur masqué en production)
- Authentification par profil (admin, staff, usager)
- Design responsive (desktop, tablette, mobile)

---

## Prérequis

| Outil | Version minimale |
|---|---|
| Node.js | 18+ |
| npm | fourni avec Node.js |
| Angular CLI | 15+ (`npm install -g @angular/cli`) |
| Backend API | dépôt `chaine-achat-backend` |
| n8n *(optionnel)* | pour les notifications courriel |

---

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

### 3. Configurer l'environnement

Éditer `src/environments/environment.ts` (développement) :

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  n8nWebhookUrl: 'http://localhost:5678/webhook'
};
```

Éditer `src/environments/environment.prod.ts` (production) :

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.acq.bib.umontreal.ca',
  n8nWebhookUrl: 'https://n8n.acq.bib.umontreal.ca/webhook'
};
```

### 4. Démarrer en développement

```bash
ng serve
# ou
npm start
```

L'application est accessible sur : `http://localhost:4200`

---

## Build production

```bash
ng build --configuration production
```

Les fichiers compilés sont générés dans `dist/`. Les variables d'environnement de production sont appliquées automatiquement.

---

## Structure du projet

```text
chaine-achat-frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── admin/              # Composants réservés aux administrateurs
│   │   │   │   ├── items-list/     # Liste et filtres des demandes
│   │   │   │   ├── item-detail/    # Vue détaillée d'un item
│   │   │   │   ├── item-formulaire/# Création / modification d'un item
│   │   │   │   ├── rapports/       # Rapports et exports
│   │   │   │   ├── reponses/       # Gestion des réponses formulaires
│   │   │   │   └── import/         # Import en lot (Excel)
│   │   │   ├── usager/             # Composants portail usager
│   │   │   │   ├── pages/          # Les 6 formulaires de soumission
│   │   │   │   └── usager-profil/  # Suivi des demandes de l'usager
│   │   │   ├── statut-decision/    # Formulaire de statut bibliothèque (admin)
│   │   │   └── accueil/            # Tableau de bord
│   │   ├── services/               # HttpClient, auth, items, réponses…
│   │   ├── lib/                    # Listes d'options partagées
│   │   ├── header/                 # Navigation principale
│   │   └── app-routing.module.ts   # Routes de l'application
│   ├── assets/
│   │   ├── i18n/                   # Traductions FR / EN (fr.json, en.json)
│   │   └── css/                    # Styles globaux UdeM
│   └── environments/               # Variables d'environnement
├── angular.json
├── package.json
└── README.md
```

---

## Rôles et accès

| Rôle | Description | Accès |
|---|---|---|
| `admin` | Administrateur bibliothèque | Toutes les pages |
| `staff` | Personnel bibliothèque | Items, rapports, réponses |
| `usager` | Communauté UdeM | Portail usager uniquement |

---

## Aide et dépannage

### Le frontend ne démarre pas
- Vérifier que Node.js est installé : `node --version`
- Supprimer `node_modules` et réinstaller : `npm install`
- Vérifier que le port 4200 est libre

### Les données ne s'affichent pas
- Vérifier que le backend est démarré
- Vérifier `apiUrl` dans `environment.ts`
- Consulter la console du navigateur et celle du terminal

### Les notifications courriel ne partent pas
- Vérifier que n8n est démarré et les webhooks activés
- Vérifier `n8nWebhookUrl` dans `environment.ts`
- Consulter les logs d'exécution dans l'interface n8n

---

## À propos

**Chaîne d'acquisitions – Frontend** · Bibliothèques de l'Université de Montréal  
Développée par Natalia Jabinschi

© 2026 Bibudem – Tous droits réservés
