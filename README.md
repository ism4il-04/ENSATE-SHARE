# ENSA-SHARE

Plateforme web de gestion et partage de ressources pédagogiques pour l'École Nationale des Sciences Appliquées.

## 📋 Description

ENSA-SHARE est une application web moderne permettant aux représentants des étudiants de partager efficacement les ressources pédagogiques (cours, TD, TP) avec l'ensemble de la communauté étudiante. La plateforme offre un système de filtrage avancé, une gestion sécurisée des fichiers et des interfaces différenciées selon les rôles.

## 🎯 Fonctionnalités Principales

### Pour les Étudiants (Accès Public)
- Consultation des ressources sans authentification
- Filtrage par année, filière et module
- Recherche textuelle
- Téléchargement de fichiers
- Interface responsive

### Pour les Responsables/Délégués
- Upload de fichiers (drag-and-drop)
- Gestion des ressources de leur périmètre (année/filière assignées)
- Modification et suppression de leurs fichiers
- Tableau de bord personnel

### Pour les Superadmins
- Vue d'ensemble globale avec statistiques
- Gestion des comptes responsables
- Modération de tous les contenus
- Gestion de la structure académique
- Consultation des logs d'activité

## 🛠️ Stack Technologique

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js (TypeScript)
- **Base de données**: MongoDB Atlas
- **Authentification**: JWT avec bcrypt
- **Stockage fichiers**: Cloudinary
- **Sécurité**: Helmet, CORS, express-validator

### Frontend
- **Framework**: Next.js 14+ (React, TypeScript)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📦 Installation

### Prérequis
- Node.js 18+ et npm
- MongoDB Atlas account
- Cloudinary account

### 1. Cloner le repository
```bash
git clone <repository-url>
cd ENSA-SHARE
```

### 2. Configuration Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` basé sur `.env.example`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=24h
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=pdf,docx,pptx,xls,xlsx,zip,jpg,jpeg,png,gif
FRONTEND_URL=http://localhost:3000
```

Initialiser la base de données:
```bash
npm run seed
```

Démarrer le serveur:
```bash
npm run dev
```

### 3. Configuration Frontend

```bash
cd frontend
npm install
```

Créer un fichier `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Démarrer l'application:
```bash
npm run dev
```

## 🚀 Utilisation

1. **Accès public**: Ouvrir http://localhost:3000
2. **Connexion admin**: http://localhost:3000/login
   - Email: admin@ensa.ac.ma
   - Mot de passe: Admin@123 (à changer en production!)

## 📁 Structure du Projet

```
ENSA-SHARE/
├── backend/
│   ├── src/
│   │   ├── models/          # Modèles Mongoose
│   │   ├── controllers/     # Logique métier
│   │   ├── routes/          # Routes API
│   │   ├── middleware/      # Middlewares (auth, upload, errors)
│   │   ├── config/          # Configuration (DB, Cloudinary)
│   │   ├── utils/           # Utilitaires
│   │   └── scripts/         # Scripts (seed)
│   └── package.json
├── frontend/
│   ├── app/                 # Pages Next.js
│   ├── components/          # Composants React
│   ├── lib/                 # API client
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   └── package.json
└── main.tex                 # Cahier des charges (CDC)
```

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (10 rounds)
- Authentification JWT avec expiration
- Validation stricte des inputs
- Protection CORS
- Headers sécurisés (Helmet)
- Validation des types de fichiers
- Isolation des données par rôle

## 📝 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

### Fichiers
- `GET /api/files` - Liste des fichiers (avec filtres)
- `POST /api/files` - Upload (protégé)
- `PUT /api/files/:id` - Modification (protégé)
- `DELETE /api/files/:id` - Suppression (protégé)
- `GET /api/files/:id/download` - Téléchargement

### Utilisateurs (Superadmin uniquement)
- `GET /api/users` - Liste des responsables
- `POST /api/users` - Créer un responsable
- `PUT /api/users/:id` - Modifier un responsable
- `DELETE /api/users/:id` - Supprimer un responsable

### Structure Académique
- `GET /api/structure` - Récupérer la structure
- `PUT /api/structure` - Mettre à jour (superadmin)

### Statistiques (Superadmin uniquement)
- `GET /api/stats/dashboard` - Statistiques globales
- `GET /api/stats/files-by-filiere` - Répartition par filière
- `GET /api/stats/logs` - Logs d'activité

## 🧪 Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🚢 Déploiement

### Backend (Vercel Serverless Functions)
1. Configurer les variables d'environnement sur Vercel
2. Déployer: `vercel --prod`

### Frontend (Vercel)
1. Configurer `NEXT_PUBLIC_API_URL`
2. Déployer: `vercel --prod`

## 📄 Licence

MIT

## 👥 Auteurs

École Nationale des Sciences Appliquées

## 📞 Support

Pour toute question ou problème, contacter l'équipe de développement.
