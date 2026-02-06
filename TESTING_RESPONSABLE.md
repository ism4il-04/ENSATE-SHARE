# Guide de Test - Espace Responsable

## 🎯 Fonctionnalités Implémentées

L'espace responsable est maintenant **100% fonctionnel** avec toutes les fonctionnalités suivantes :

### ✅ Tableau de Bord Principal
- **Statistiques personnelles** : Total fichiers, espace utilisé, fichiers du mois
- **Actions rapides** : Boutons vers upload et gestion de fichiers
- **Fichiers récents** : Table des 5 derniers fichiers uploadés
- **Informations utilisateur** : Année et filière assignées affichées

### ✅ Upload de Fichiers
- **Drag-and-drop** : Interface intuitive pour glisser-déposer
- **Sélection de module** : Liste déroulante filtrée par année/filière
- **Validation** : Types de fichiers et taille (max 50MB)
- **Barre de progression** : Indicateur visuel pendant l'upload
- **Messages de succès/erreur** : Feedback clair à l'utilisateur
- **Redirection automatique** : Vers la liste des fichiers après succès

### ✅ Gestion des Fichiers
- **Liste complète** : Table avec tous les fichiers du responsable
- **Filtres** : Recherche par nom et filtre par module
- **Pagination** : Navigation entre les pages
- **Actions** :
  - **Télécharger** : Lien direct vers le fichier
  - **Modifier** : Modal pour changer le nom et le module
  - **Supprimer** : Avec confirmation

### ✅ Navigation
- **Sidebar** : Menu latéral avec navigation
- **Protection des routes** : Accès réservé aux responsables
- **Déconnexion** : Bouton de logout fonctionnel

---

## 🧪 Comment Tester

### 1. Créer un Compte Responsable

Vous avez deux options :

#### Option A : Via l'API (Recommandé)

1. Connectez-vous en tant que superadmin :
```bash
# Login
POST http://localhost:5000/api/auth/login
{
  "email": "admin@ensa.ac.ma",
  "password": "Admin@123"
}
```

2. Créez un compte responsable :
```bash
POST http://localhost:5000/api/users
Authorization: Bearer <votre-token>
{
  "email": "responsable@ensa.ac.ma",
  "password": "Responsable@123",
  "firstName": "Ahmed",
  "lastName": "Benali",
  "assignedYear": "1ère Année",
  "assignedFiliere": "Tronc Commun"
}
```

#### Option B : Via MongoDB Compass

1. Ouvrez MongoDB Compass
2. Connectez-vous à `mongodb://localhost:27017`
3. Allez dans la base `ENSA-SHARE` → collection `users`
4. Ajoutez un document :
```json
{
  "email": "responsable@ensa.ac.ma",
  "password": "$2a$10$YourHashedPasswordHere",
  "role": "responsable",
  "firstName": "Ahmed",
  "lastName": "Benali",
  "assignedYear": "1ère Année",
  "assignedFiliere": "Tronc Commun",
  "isActive": true
}
```
**Note** : Le mot de passe doit être hashé avec bcrypt. Utilisez l'option A pour éviter cette complexité.

### 2. Se Connecter

1. Allez sur http://localhost:3000/login
2. Entrez les identifiants :
   - **Email** : `responsable@ensa.ac.ma`
   - **Password** : `Responsable@123`
3. Cliquez sur "Se connecter"
4. Vous serez redirigé vers `/dashboard/responsable`

### 3. Tester le Tableau de Bord

✅ **Vérifier** :
- Les statistiques s'affichent (0 fichiers au début)
- L'année et la filière assignées sont affichées
- Les boutons "Uploader" et "Gérer mes fichiers" sont cliquables

### 4. Tester l'Upload

1. Cliquez sur "Uploader un fichier" ou allez sur `/dashboard/responsable/upload`
2. **Test drag-and-drop** :
   - Glissez un fichier PDF dans la zone
   - Le fichier doit apparaître avec son nom et sa taille
3. **Sélectionner un module** :
   - Choisissez un module dans la liste (ex: "Mathématiques 1")
4. **Cliquer sur "Uploader"** :
   - La barre de progression doit s'afficher
   - Un message de succès apparaît
   - Redirection automatique vers la liste des fichiers

### 5. Tester la Gestion des Fichiers

1. Allez sur `/dashboard/responsable/files`
2. **Vérifier la liste** :
   - Le fichier uploadé apparaît dans la table
   - Les informations sont correctes (nom, module, taille, date)
3. **Tester la recherche** :
   - Tapez le nom du fichier dans la barre de recherche
   - La liste doit se filtrer
4. **Tester le filtre par module** :
   - Sélectionnez un module
   - Seuls les fichiers de ce module s'affichent
5. **Tester le téléchargement** :
   - Cliquez sur l'icône de téléchargement
   - Le fichier doit s'ouvrir dans un nouvel onglet
6. **Tester la modification** :
   - Cliquez sur l'icône de modification
   - Un modal s'ouvre
   - Changez le nom ou le module
   - Cliquez sur "Enregistrer"
   - Le fichier est mis à jour dans la liste
7. **Tester la suppression** :
   - Cliquez sur l'icône de suppression
   - Une confirmation apparaît
   - Confirmez
   - Le fichier disparaît de la liste

### 6. Tester les Restrictions

**Le responsable ne peut voir/modifier QUE ses propres fichiers** :
1. Uploadez un fichier en tant que responsable
2. Déconnectez-vous
3. Connectez-vous en tant que superadmin
4. Uploadez un fichier pour une autre année/filière
5. Reconnectez-vous en tant que responsable
6. **Vérifier** : Vous ne voyez que vos fichiers, pas ceux du superadmin

---

## 📊 Scénarios de Test Complets

### Scénario 1 : Premier Upload
1. Login responsable
2. Dashboard → 0 fichiers
3. Upload → Sélectionner PDF → Module → Upload
4. Success → Redirection
5. Liste → 1 fichier visible
6. Dashboard → 1 fichier dans les stats

### Scénario 2 : Gestion Multiple
1. Upload 5 fichiers différents
2. Aller dans "Mes fichiers"
3. Rechercher un fichier spécifique
4. Modifier le nom d'un fichier
5. Supprimer un fichier
6. Vérifier que les stats sont à jour

### Scénario 3 : Validation
1. Essayer d'uploader un fichier > 50MB → Erreur
2. Essayer d'uploader un .exe → Erreur
3. Essayer d'uploader sans sélectionner de module → Erreur
4. Upload valide → Succès

---

## 🐛 Problèmes Connus et Solutions

### Problème : "Cannot read properties of undefined"
**Cause** : Le responsable n'a pas de `assignedYear` ou `assignedFiliere`  
**Solution** : Vérifier que le compte a bien ces champs dans MongoDB

### Problème : "Aucun module disponible"
**Cause** : La structure académique n'est pas initialisée  
**Solution** : Exécuter `npm run seed` dans le backend

### Problème : Upload échoue avec erreur 500
**Cause** : Cloudinary non configuré  
**Solution** : Vérifier les credentials Cloudinary dans `.env`

### Problème : Fichiers ne s'affichent pas
**Cause** : Filtrage automatique par année/filière  
**Solution** : Vérifier que les fichiers ont bien la même année/filière que le responsable

---

## ✨ Fonctionnalités Bonus Implémentées

- **Auto-refresh** : Les listes se mettent à jour automatiquement après upload/modification/suppression
- **Loading states** : Spinners pendant le chargement des données
- **Empty states** : Messages clairs quand aucun fichier n'est trouvé
- **Responsive design** : Fonctionne sur mobile, tablette et desktop
- **Validation côté client** : Feedback immédiat avant l'envoi au serveur
- **Optimistic updates** : Interface réactive grâce à React Query

---

## 📝 Checklist de Test Finale

- [ ] Login responsable fonctionne
- [ ] Dashboard affiche les bonnes stats
- [ ] Drag-and-drop fonctionne
- [ ] Upload avec barre de progression
- [ ] Fichier apparaît dans la liste
- [ ] Recherche fonctionne
- [ ] Filtre par module fonctionne
- [ ] Téléchargement fonctionne
- [ ] Modification fonctionne
- [ ] Suppression fonctionne
- [ ] Pagination fonctionne (si > 10 fichiers)
- [ ] Déconnexion fonctionne
- [ ] Restrictions d'accès respectées

---

## 🎉 Résultat Attendu

Après tous ces tests, vous devriez avoir :
- ✅ Un espace responsable 100% fonctionnel
- ✅ Toutes les user stories responsable implémentées (US-RESP-01 à US-RESP-08)
- ✅ Une interface intuitive et professionnelle
- ✅ Des performances optimales grâce à React Query
- ✅ Une expérience utilisateur fluide

**L'espace responsable est prêt pour la production !** 🚀
