# Gestion de pharmacie

Application web de gestion d'une pharmacie. Elle réunit une interface de travail pour les opérations quotidiennes et une API REST connectée à une base de données MySQL.

## Fonctionnalités

- Tableau de bord et suivi des ventes.
- Gestion des produits, catégories et unités de mesure.
- Enregistrement des ventes au comptant et à crédit, avec suivi des ventes à crédit et rapports.
- Gestion des approvisionnements et des fournisseurs.
- Suivi des inventaires, des sorties de stock et des produits expirés.
- Gestion des utilisateurs, des abonnés et des entreprises.
- Authentification par jeton JWT et accès aux fonctions selon le rôle de l'utilisateur.
- Contrôle de validité de la licence côté serveur.

## Technologies

- **Frontend :** React 19, Vite, React Router, Tailwind CSS et Axios.
- **Backend :** Node.js, Express 5 et Sequelize.
- **Base de données :** MySQL.

## Structure du projet

```text
.
├── backend/       # API Express, routes, contrôleurs, modèles et configuration
├── frontend/      # Interface React et appels à l'API
└── pharmacie_db (1).sql  # Script SQL fourni pour la base de données
```

## Prérequis

- Node.js et npm.
- Un serveur MySQL.
- Une base de données créée pour l'application.

## Installation et démarrage

### 1. Préparer la base de données

Créez une base de données MySQL, puis importez le script `pharmacie_db (1).sql` avec votre outil MySQL habituel. Le nom de base configuré dans le backend doit correspondre à la base utilisée.

### 2. Configurer et lancer le backend

Dans `backend/`, créez un fichier `.env` avec les paramètres de connexion MySQL :

```env
PORT=5000
DB_HOST=localhost
DB_NAME=nom_de_votre_base
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_DIALECT=mysql
CLIENT_URL=http://localhost:5173
```

Installez les dépendances et lancez le serveur :

```bash
cd backend
npm install
npm run dev
```

L'API démarre par défaut sur `http://localhost:5000`. La route `http://localhost:5000/health` permet de vérifier son état.

### 3. Installer et lancer le frontend

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev
```

Vite affiche l'adresse locale de l'interface, généralement `http://localhost:5173`. Le frontend utilise actuellement `http://localhost:5000/api` comme adresse de l'API.

## Scripts disponibles

Dans `frontend/` :

- `npm run dev` : démarrer le serveur de développement.
- `npm run build` : générer la version de production.
- `npm run preview` : prévisualiser la version construite.
- `npm run lint` : lancer ESLint.

Dans `backend/` :

- `npm run dev` : démarrer l'API avec Nodemon.

## Licence applicative

La date d'expiration de la licence est actuellement définie dans `backend/config/license.js` au **27 octobre 2026 à 11:59:59**. Une fois cette date dépassée, les requêtes API protégées sont refusées et l'interface redirige vers la page d'expiration.
