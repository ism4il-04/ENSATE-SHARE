# 🔍 Guide de Diagnostic - Erreur d'Upload

## Causes Possibles

### 1. **Cloudinary Non Configuré** ⚠️
**Symptôme** : Erreur 500 lors de l'upload  
**Cause** : Les credentials Cloudinary sont invalides ou manquants

**Solution** :
1. Vérifiez votre fichier `.env` :
```bash
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

2. Testez vos credentials Cloudinary :
   - Allez sur https://cloudinary.com/console
   - Vérifiez que les credentials correspondent

3. **IMPORTANT** : Redémarrez le serveur backend après modification du `.env` :
```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

### 2. **Utilisateur Non Authentifié**
**Symptôme** : Erreur 401 Unauthorized  
**Cause** : Token JWT manquant ou expiré

**Solution** :
1. Déconnectez-vous
2. Reconnectez-vous
3. Réessayez l'upload

### 3. **Responsable Sans Année/Filière Assignée**
**Symptôme** : Erreur "assignedYear is undefined"  
**Cause** : Le compte responsable n'a pas d'année/filière assignée

**Solution** :
1. Connectez-vous en superadmin
2. Allez dans "Gestion des utilisateurs"
3. Modifiez le responsable
4. Assignez une année et une filière
5. Reconnectez-vous en responsable

### 4. **Structure Académique Vide**
**Symptôme** : Aucun module disponible dans la liste déroulante  
**Cause** : La structure académique n'est pas initialisée

**Solution** :
```bash
cd backend
npm run seed
```

### 5. **Fichier Trop Volumineux**
**Symptôme** : Erreur "File too large"  
**Cause** : Fichier > 50MB

**Solution** :
- Compressez le fichier
- Ou modifiez `MAX_FILE_SIZE` dans `.env`

### 6. **Type de Fichier Non Autorisé**
**Symptôme** : Erreur "Invalid file type"  
**Cause** : Extension non supportée

**Solution** :
Types autorisés : PDF, DOCX, PPTX, XLS, XLSX, ZIP, JPG, JPEG, PNG, GIF

### 7. **CORS Error**
**Symptôme** : Erreur CORS dans la console du navigateur  
**Cause** : Frontend et backend sur des ports différents

**Solution** :
Vérifiez que `FRONTEND_URL` dans backend `.env` = `http://localhost:3000`

### 8. **Port 5000 Occupé**
**Symptôme** : Backend ne démarre pas  
**Cause** : Un autre processus utilise le port 5000

**Solution** :
```powershell
# Tuer le processus sur le port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Redémarrer le backend
cd backend
npm run dev
```

---

## 🧪 Tests de Diagnostic

### Test 1 : Vérifier que le Backend Fonctionne

```bash
# Dans PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
```

**Résultat attendu** : `{"success":true,"message":"Server is running",...}`

### Test 2 : Vérifier l'Authentification

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet "Application" → "Local Storage"
3. Vérifiez qu'il y a une clé `token`
4. Si absente → Reconnectez-vous

### Test 3 : Vérifier la Structure Académique

```bash
# Dans PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/structure" -UseBasicParsing
```

**Résultat attendu** : JSON avec years, filieres, modules

### Test 4 : Tester l'Upload Directement (avec curl ou Postman)

```bash
# Remplacez <YOUR_TOKEN> par votre token JWT
curl -X POST http://localhost:5000/api/files \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "file=@chemin/vers/fichier.pdf" \
  -F "module=Mathématiques 1"
```

---

## 📋 Checklist de Vérification

Avant de tester l'upload, vérifiez :

- [ ] Backend tourne sur port 5000
- [ ] Frontend tourne sur port 3000
- [ ] MongoDB est démarré
- [ ] Credentials Cloudinary valides dans `.env`
- [ ] Structure académique initialisée (`npm run seed`)
- [ ] Utilisateur connecté (token présent)
- [ ] Responsable a année/filière assignées
- [ ] Modules disponibles dans la liste déroulante

---

## 🐛 Comment Obtenir Plus d'Informations

### Côté Frontend (Console Navigateur)

1. Ouvrez la console (F12)
2. Allez dans l'onglet "Console"
3. Essayez d'uploader un fichier
4. Copiez l'erreur complète

### Côté Backend (Terminal)

1. Regardez le terminal où tourne `npm run dev`
2. L'erreur détaillée s'affichera là
3. Cherchez le message d'erreur complet

---

## 💡 Solutions Rapides par Erreur

| Erreur | Solution Rapide |
|--------|----------------|
| `CLOUDINARY_CLOUD_NAME is not defined` | Ajoutez les credentials Cloudinary dans `.env` et redémarrez |
| `JWT malformed` | Déconnectez-vous et reconnectez-vous |
| `assignedYear is undefined` | Assignez année/filière au responsable via superadmin |
| `Module is required` | Sélectionnez un module dans la liste |
| `File too large` | Fichier > 50MB, compressez-le |
| `Invalid file type` | Utilisez PDF, DOCX, PPTX, etc. |
| `EADDRINUSE` | Port 5000 occupé, tuez le processus |
| `Cannot read properties of undefined` | Structure académique vide, lancez `npm run seed` |

---

## 🎯 Procédure de Test Complète

1. **Vérifier le backend** :
   ```bash
   curl http://localhost:5000/health
   ```

2. **Se connecter en responsable** :
   - Email : responsable@ensa.ac.ma
   - Password : Responsable@123

3. **Vérifier les modules disponibles** :
   - Si liste vide → Problème de structure ou d'assignation

4. **Uploader un petit fichier PDF** :
   - Glisser-déposer un PDF < 5MB
   - Sélectionner un module
   - Cliquer "Uploader"

5. **Observer** :
   - Console navigateur (F12)
   - Terminal backend
   - Message d'erreur affiché

6. **Copier l'erreur exacte** et me la communiquer

---

## 📞 Informations à Fournir

Si l'erreur persiste, fournissez-moi :

1. **Message d'erreur exact** (frontend ou backend)
2. **Rôle de l'utilisateur** (responsable ou superadmin)
3. **Taille et type du fichier** testé
4. **Année/Filière assignées** (pour responsable)
5. **Capture d'écran** de la console (si possible)

---

## ✅ Test de Validation

Une fois le problème résolu, testez :

1. Upload d'un PDF
2. Upload d'un DOCX
3. Upload d'une image
4. Vérification dans "Mes fichiers"
5. Téléchargement du fichier uploadé

Si tous ces tests passent → ✅ Upload fonctionne !
