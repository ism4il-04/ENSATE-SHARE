# ENSATE-SHARE

Plateforme de partage des documents pédagogiques (cours, TD, TP, examens) entre étudiants de l'ENSA Tétouan,
classés par filière, année, semestre et module. Projet de l'Association Des Etudiants (ADE).

## Fonctionnalités

- **Étudiants** : connexion avec leur compte Google universitaire `@etu.uae.ac.ma` (compte créé à la première
  connexion), consultation, aperçu et téléchargement des documents, jusqu'à 6 parcours enregistrés.
- **Responsables (délégués)** : connexion Google, dépôt de documents pour leur année (envoi direct vers Google
  Drive, jusqu'à 50 Mo), modification et suppression de leurs fichiers.
- **Superadmin** : responsables, structure académique, liste des étudiants autorisés, statistiques, journal
  d'activité.

## Stack

- **Next.js 15** (App Router) : pages et API (`app/api/**/route.ts`), déployé sur **Vercel** (région Francfort)
- **Neon Postgres** avec **Drizzle ORM** (migrations SQL versionnées dans `drizzle/`)
- **Google Drive** pour le stockage des documents, **Google Identity Services** pour la connexion
- Tailwind CSS, TanStack Query, Zustand

## Développement local

Prérequis : Node.js 22+.

1. `npm install`
2. Créer `.env.development.local` à partir de `.env.example`. `DATABASE_URL` doit pointer vers la branche
   **dev** de Neon (chaîne *pooled*), jamais vers la production.
3. `npm run db:migrate` pour créer ou mettre à jour les tables.
4. `npm run dev`, puis ouvrir http://localhost:3000

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` / `npm run build` | Serveur de développement / build de production |
| `npm run db:generate` | Génère une migration SQL après une modification de `lib/db/schema.ts` |
| `npm run db:migrate` | Applique les migrations (branche dev ; production : `TARGET_DATABASE_URL=… npm run db:migrate -- --production`) |
| `npm run test:api` | Tests de bout en bout de l'API (serveur de dev lancé, branche dev) |
| `npm run db:import-mongo` / `db:verify-import` | Migration ponctuelle depuis l'ancienne base MongoDB, puis vérification |

## Organisation

```
app/            Pages et routes API (app/api/**/route.ts)
components/     Composants React
lib/db/         Schéma Drizzle et clients Neon
lib/server/     Code serveur : sessions, accès étudiants, Drive, uploads, limitation des connexions
drizzle/        Migrations SQL
scripts/        Migrations, import MongoDB, tests d'API
docs/           Plan de migration Neon
```

## Sécurité (résumé)

- Session dans un cookie httpOnly signé ; comptes staff revérifiés à chaque requête, étudiants via une liste
  en cache vidée à chaque changement (retrait immédiat).
- Connexion par mot de passe (secours staff) limitée : 5 échecs par email, 20 par IP, sur 15 minutes.
- Chaque dépôt est autorisé puis vérifié côté serveur (dossier, taille, identifiant d'upload).
- Sauvegarde quotidienne de la base en JSON dans un dossier privé `_backups` du Drive (30 dernières).

## Déploiement

Vercel déploie la branche `main`. Variables à définir sur Vercel : voir `.env.example`
(`DATABASE_URL` de la branche **main** de Neon, `SESSION_SECRET` et `CRON_SECRET` propres à la production).
