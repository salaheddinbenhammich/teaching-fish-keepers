# Club Poisson — Mise en production

Projet réalisé dans le cadre du cours devops.

**Membres du groupe :**
- Salaheddin BEN HAMMICH
- Youssef FATHANI
- Kaouthar ASRAR
- Meriem AIT EL ACHKAR

**Application en production :** https://clubpoisson.duckdns.org

---

## Présentation du projet

Club Poisson est une application web permettant à l'association éponyme de gérer et publier ses événements aquariophiles. L'application se compose d'un backend TypeScript tournant sous Bun, d'un frontend React buildé avec Vite, et d'une base de données PostgreSQL.

Notre mission consistait à reprendre ce projet existant et à mettre en place l'ensemble de l'outillage nécessaire à une mise en production professionnelle : tests, linting, formatage, intégration continue, conteneurisation et déploiement automatisé.

---

## Architecture du projet

```
club-poisson/
├── backend/               # API REST (Bun + TypeScript)
│   ├── src/
│   │   ├── auth/          # Sessions, garde d'authentification, routes
│   │   ├── events/        # Routes et repository des événements
│   │   ├── db/            # Connexion et migrations PostgreSQL
│   │   └── index.ts       # Point d'entrée
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── frontend/              # Application React (Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── api/           # Fonctions d'appel à l'API
│   │   ├── components/    # Composants réutilisables
│   │   ├── contexts/      # Contexte d'authentification
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── pages/         # Pages de l'application
│   │   └── App.tsx
│   ├── tests/
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── .github/
│   ├── workflows/
│   │   ├── backend-ci.yml    # CI + build image backend
│   │   ├── frontend-ci.yml   # CI + build image frontend
│   │   └── deploy.yml        # Déploiement en production
│   └── dependabot.yml
├── docker-compose.prod.yml
├── Caddyfile
├── biome.json             # Configuration Biome (lint + format)
├── lefthook.yml           # Pre-commit hooks
├── .lintstagedrc.json
└── README.md
```

---

## Lancer le projet en local

### Prérequis

- [Bun](https://bun.sh/) >= 1.3
- [Docker](https://www.docker.com/) et Docker Compose

### Mode développement

**1. Démarrer la base de données**

```bash
docker run -d --name clubpoisson-db \
  -e POSTGRES_USER=clubpoisson \
  -e POSTGRES_PASSWORD=clubpoisson \
  -e POSTGRES_DB=clubpoisson \
  -p 5432:5432 \
  postgres:17
```

**2. Démarrer le backend**

Créer un fichier `.env` dans le dossier `backend/` :

```env
PGHOST=localhost
PGDATABASE=clubpoisson
PGUSER=clubpoisson
PGPASSWORD=clubpoisson
ADMIN_PASSWORD=votre_mot_de_passe_admin
```

Puis démarrer le serveur :

```bash
cd backend
bun install
bun dev
```

Le serveur écoute sur le port `3000`. Les migrations sont exécutées automatiquement au démarrage.

**3. Démarrer le frontend**

```bash
cd frontend
bun install
bun dev
```

Le frontend est accessible sur `http://localhost:5173`. En mode développement, les appels vers `/api/*` sont automatiquement proxifiés vers `http://localhost:3000` via la configuration Vite.

### Variables d'environnement — Backend

| Variable         | Description                                  | Exemple       |
|------------------|----------------------------------------------|---------------|
| `PGHOST`         | Hôte PostgreSQL                              | `localhost`   |
| `PGPORT`         | Port PostgreSQL (optionnel, défaut 5432)     | `5432`        |
| `PGDATABASE`     | Nom de la base de données                    | `clubpoisson` |
| `PGUSER`         | Utilisateur PostgreSQL                       | `clubpoisson` |
| `PGPASSWORD`     | Mot de passe PostgreSQL                      | `clubpoisson` |
| `ADMIN_PASSWORD` | Mot de passe administrateur de l'application | `secret`      |

---

## Lancer avec Docker

### Option 1 — Utiliser les images pré-buildées (recommandé)

Les images Docker sont publiées automatiquement sur le GitHub Container Registry à chaque push sur `main`. Elles sont accessibles publiquement sans authentification.

**Récupérer les images :**

```bash
docker pull ghcr.io/salaheddinbenhammich/teaching-fish-keepers/backend:latest
docker pull ghcr.io/salaheddinbenhammich/teaching-fish-keepers/frontend:latest
```

**Lancer la stack complète avec Docker Compose :**

Créer un fichier `.env` à la racine :

```env
PGUSER=clubpoisson
PGPASSWORD=clubpoisson
PGDATABASE=clubpoisson
ADMIN_PASSWORD=votre_mot_de_passe_admin
SERVER_HOST=localhost
GITHUB_REPOSITORY=salaheddinbenhammich/teaching-fish-keepers
```

Puis :

```bash
docker compose -f docker-compose.prod.yml up
```

L'application sera accessible sur `http://localhost`.

### Option 2 — Builder les images localement

```bash
# Backend
docker build -t club-poisson-backend ./backend

# Frontend
docker build -t club-poisson-frontend ./frontend
```

---

## Tests

### Backend

Le backend utilise le test runner natif de Bun, sans dépendance externe.

```bash
cd backend
bun test
```

**Couverture des tests :**

| Fichier de test      | Ce qui est testé                                                     |
|----------------------|----------------------------------------------------------------------|
| `sessions.test.ts`   | Création de session, validation de token, suppression de session     |
| `guard.test.ts`      | Vérification des tokens Bearer, rejet des requêtes non authentifiées |
| `repository.test.ts` | Validation des types d'entrée pour les événements (`EventInput`)     |

**Exemples de cas testés :**
- Une session valide autorise l'accès (résultat `null` du garde)
- Un token inexistant est rejeté avec un statut HTTP 401
- Un header `Authorization: Basic ...` est rejeté même s'il est présent
- La suppression d'un token inconnu ne lève pas d'exception
- Deux sessions créées successivement ont des tokens différents

### Frontend

Le frontend utilise [Vitest](https://vitest.dev/) avec `@testing-library/react`.

```bash
cd frontend

# Exécuter les tests une fois
bun run test

# Mode watch (relance les tests à chaque modification)
bun run test --watch

# Avec rapport de couverture
bun run test --coverage
```

**Couverture des tests :**

| Fichier de test            | Ce qui est testé                                                        |
|----------------------------|-------------------------------------------------------------------------|
| `EventCard.test.tsx`       | Rendu du titre, lieu, date, image, nombre de participants               |
| `HomePage.test.tsx`        | Affichage du loader, rendu des événements, état vide                    |
| `AdminEventsPage.test.tsx` | Tableau des événements, suppression avec confirmation                   |
| `EventFormPage.test.tsx`   | Création d'un événement, chargement et édition d'un événement existant  |
| `RequireAuth.test.tsx`     | Spinner de chargement, redirection si non authentifié, accès autorisé   |
| `AuthContext.test.tsx`     | Restauration du token au chargement, login, logout, gestion localStorage|
| `AuthApi.test.ts`          | Appels fetch de login et logout avec les bons paramètres HTTP           |
| `EventsApi.test.ts`        | Récupération, création avec header d'auth, gestion des erreurs HTTP     |
| `App.test.tsx`             | Lien admin selon l'état d'authentification, déconnexion et redirection  |

Le fichier `setup.ts` configure `@testing-library/jest-dom` pour les matchers DOM supplémentaires (`toBeInTheDocument`, etc.) et nettoie le DOM, le localStorage et le sessionStorage après chaque test.

---

## Qualité du code : linting et formatage

Nous avons choisi [Biome](https://biomejs.dev/) comme outil unifié de linting et de formatage, couvrant à la fois le backend et le frontend depuis un fichier de configuration unique à la racine (`biome.json`).

Ce choix remplace ESLint et Prettier par un seul outil plus rapide (écrit en Rust), avec une configuration centralisée évitant toute divergence entre les deux parties du projet.

### Commandes disponibles

Ces commandes fonctionnent depuis la racine, le dossier `backend/` ou le dossier `frontend/` :

```bash
bun run check        # Vérifie le formatage et le linting (lecture seule)
bun run check:fix    # Corrige automatiquement les problèmes détectés
bun run lint         # Linting seul
bun run lint:fix     # Linting avec correction automatique
bun run format       # Vérification du formatage seul
bun run format:fix   # Formatage automatique
```

### Pre-commit hooks

[Lefthook](https://github.com/evilmartians/lefthook) est configuré pour exécuter automatiquement Biome sur les fichiers stagés avant chaque commit, afin d'empêcher l'introduction de code mal formaté ou non conforme aux règles du projet.

```bash
# Les hooks sont installés automatiquement via le script "prepare"
bun install
```

La configuration se trouve dans `lefthook.yml`. En cas de violation, le commit est bloqué et les problèmes sont affichés dans le terminal.

---

## Pipeline CI/CD

### Vue d'ensemble

Trois workflows GitHub Actions sont en place :

| Workflow           | Déclencheur                                            | Rôle                                                  |
|--------------------|--------------------------------------------------------|-------------------------------------------------------|
| `backend-ci.yml`   | Push ou PR sur `main` (changements dans `backend/`)   | Lint, format, tests, build et push de l'image Docker  |
| `frontend-ci.yml`  | Push ou PR sur `main` (changements dans `frontend/`)  | Lint, format, tests, build et push de l'image Docker  |
| `deploy.yml`       | Push sur `main`                                        | Déploiement automatique sur le serveur de production  |

Les trois workflows sont également déclenchables manuellement via `workflow_dispatch`.

### Étapes des pipelines CI (backend et frontend)

**Job `quality` — Vérification de la qualité du code :**

1. Checkout du dépôt
2. Installation de Bun
3. Installation des dépendances (racine et backend ou frontend)
4. Vérification du formatage avec Biome
5. Vérification du linting avec Biome
6. Exécution des tests

Le pipeline échoue immédiatement si l'une de ces étapes ne passe pas, bloquant le job `docker` en aval.

**Job `docker` — Build et publication de l'image :**

Ce job ne s'exécute que sur les pushs vers `main` (pas sur les pull requests) et uniquement si le job `quality` a réussi (`needs: quality`).

1. Connexion au GitHub Container Registry (`ghcr.io`) via `GITHUB_TOKEN`
2. Extraction des métadonnées Docker (tags `sha-<hash_du_commit>` et `latest`)
3. Configuration de Docker Buildx
4. Build et push de l'image avec cache BuildKit activé

### Optimisation du cache Docker

Le cache des couches Docker est géré via `cache-from: type=gha` et `cache-to: type=gha,mode=max`. Cela permet de réutiliser les couches inchangées entre les builds successifs (notamment l'installation des dépendances), réduisant significativement les temps de build en CI.

### Pipeline de déploiement (`deploy.yml`)

Le workflow se connecte au serveur de production via SSH et effectue les opérations suivantes :

1. Copie de `docker-compose.prod.yml` et du `Caddyfile` sur le serveur via SCP
2. Connexion SSH et génération du fichier `.env` à partir des secrets GitHub
3. Authentification au registre `ghcr.io` depuis le serveur
4. Initialisation de Docker Swarm si ce n'est pas déjà fait
5. Déploiement via `docker stack deploy --with-registry-auth`
6. Nettoyage des images inutilisées avec `docker image prune -f`

---

## Conteneurisation

### Dockerfile — Backend

L'image `oven/bun:1.3.9-slim` est utilisée pour réduire la taille finale tout en conservant `curl`, nécessaire pour le healthcheck.

```dockerfile
FROM oven/bun:1.3.9-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .

EXPOSE 3000
CMD ["bun", "run", "start"]
```

### Dockerfile — Frontend (multi-stage)

Le build multi-stage garantit que l'image finale ne contient que les fichiers statiques et nginx, sans aucune dépendance de développement ni le runtime Bun.

```dockerfile
# Étape 1 : build avec Bun
FROM oven/bun:1.3.9-alpine AS builder
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Étape 2 : production avec nginx
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx — Configuration frontend

Nginx sert les fichiers statiques et gère le routing côté client (SPA) via `try_files`. En production, les appels `/api/*` sont proxifiés vers le service `backend` via le réseau Docker interne.

### Reverse proxy — Caddy

[Caddy](https://caddyserver.com/) est le point d'entrée unique de la stack : il reçoit tout le trafic sur les ports 80 et 443, gère le TLS automatiquement, et route les requêtes vers les bons services internes.

```
{$SERVER_HOST} {
    handle /api/* {
        reverse_proxy backend:3000
    }
    handle {
        reverse_proxy frontend:80
    }
}
```

### Services Docker Compose (production)

| Service    | Image                                                                 | Rôle                                      |
|------------|-----------------------------------------------------------------------|-------------------------------------------|
| `db`       | `postgres:17`                                                         | Base de données PostgreSQL                |
| `backend`  | `ghcr.io/salaheddinbenhammich/teaching-fish-keepers/backend:latest`  | API REST                                  |
| `frontend` | `ghcr.io/salaheddinbenhammich/teaching-fish-keepers/frontend:latest` | Application React servie par nginx        |
| `caddy`    | `caddy:2-alpine`                                                      | Reverse proxy + TLS Let's Encrypt         |
| `dozzle`   | `amir20/dozzle:latest`                                                | Interface web de consultation des logs    |

Des healthchecks sont configurés sur `db` (via `pg_isready`), `backend` (via `/api/health`) et `frontend` (requête HTTP sur le port 80).

---

## Déploiement sur un serveur distant

### Prérequis sur le serveur

- Docker Engine installé avec le plugin Compose
- Accès SSH configuré avec une clé RSA
- Ports 80 et 443 ouverts dans le pare-feu

### Configuration des secrets GitHub

Les secrets sont définis dans le dépôt GitHub (Settings > Secrets and variables > Actions). Ils sont injectés dans le pipeline sans jamais apparaître en clair dans les logs ni dans le code source.

| Secret           | Description                                              | Exemple                              |
|------------------|----------------------------------------------------------|--------------------------------------|
| `ADMIN_PASSWORD` | Mot de passe du compte administrateur de l'application  | `motdepasse_fort`                    |
| `PGDATABASE`     | Nom de la base de données PostgreSQL                     | `clubpoisson`                        |
| `PGUSER`         | Utilisateur PostgreSQL                                   | `clubpoisson`                        |
| `PGPASSWORD`     | Mot de passe PostgreSQL                                  | `motdepasse_bdd`                     |
| `SERVER_HOST`    | Adresse IP du serveur de production                      | `51.x.x.x`                           |
| `SERVER_DOMAIN`  | Nom de domaine complet utilisé par Caddy pour le TLS    | `clubpoisson.duckdns.org`            |
| `SERVER_USER`    | Nom d'utilisateur pour la connexion SSH                  | `ubuntu`                             |
| `SERVER_SSH_KEY` | Contenu complet de la clé privée SSH (format PEM)       | `-----BEGIN RSA PRIVATE KEY-----...` |

### Déploiement manuel (première installation)

Pour la première mise en place sur un serveur vierge :

```bash
# Sur le serveur distant
mkdir -p /opt/club-poisson
cd /opt/club-poisson

# Copier docker-compose.prod.yml et Caddyfile dans ce répertoire
# Puis créer le fichier .env
cat > .env << EOF
PGUSER=clubpoisson
PGPASSWORD=motdepasse_bdd
PGDATABASE=clubpoisson
ADMIN_PASSWORD=motdepasse_fort
SERVER_HOST=clubpoisson.duckdns.org
GITHUB_REPOSITORY=salaheddinbenhammich/teaching-fish-keepers
EOF

# Authentification au registre
echo "GITHUB_TOKEN" | docker login ghcr.io -u salaheddinbenhammich --password-stdin

# Initialiser Swarm et déployer
docker swarm init
export $(cat .env | xargs)
docker stack deploy --with-registry-auth -c docker-compose.prod.yml club-poisson
```

Les déploiements suivants sont entièrement automatisés via le pipeline GitHub Actions à chaque push sur `main`.

### Vérifier l'état du déploiement

```bash
# Lister les services Swarm et leur état
docker service ls

# Voir les logs d'un service
docker service logs club-poisson_backend --follow

# Inspecter les tâches d'un service
docker service ps club-poisson_backend
```

L'interface Dozzle est accessible sur `http://<ip-serveur>:8080` pour consulter les logs en temps réel sans accès SSH.

---

## Registre de conteneurs

Les images sont publiées automatiquement sur le GitHub Container Registry à chaque merge sur `main`.

**Images disponibles :**

```
ghcr.io/salaheddinbenhammich/teaching-fish-keepers/backend:latest
ghcr.io/salaheddinbenhammich/teaching-fish-keepers/backend:sha-<hash_du_commit>

ghcr.io/salaheddinbenhammich/teaching-fish-keepers/frontend:latest
ghcr.io/salaheddinbenhammich/teaching-fish-keepers/frontend:sha-<hash_du_commit>
```

**Récupérer les images :**

```bash
docker pull ghcr.io/salaheddinbenhammich/teaching-fish-keepers/backend:latest
docker pull ghcr.io/salaheddinbenhammich/teaching-fish-keepers/frontend:latest
```

Le tag `latest` correspond toujours au dernier build validé de la branche `main`. Les tags `sha-<hash>` permettent de tracer précisément quelle version du code correspond à quelle image, et de revenir à une version antérieure si nécessaire en modifiant le tag dans `docker-compose.prod.yml`.

---

## Bonus implémentés

### Certificat SSL automatique (Caddy auto-TLS)

Caddy génère et renouvelle automatiquement un certificat SSL Let's Encrypt pour le domaine `clubpoisson.duckdns.org`. Aucune configuration manuelle, aucun crontab, aucun outil externe n'est nécessaire.

### Domaine DuckDNS

Un domaine gratuit via [DuckDNS](https://www.duckdns.org/) pointe vers le serveur AWS EC2, permettant à Caddy de provisionner le certificat TLS via le challenge HTTP-01 de Let's Encrypt.

### Monitoring des logs avec Dozzle

[Dozzle](https://dozzle.dev/) est déployé sur le serveur et expose une interface web permettant de consulter en temps réel les logs de tous les conteneurs Docker, sans nécessiter d'accès SSH ni de commandes `docker logs`.

### Healthchecks Docker

Des healthchecks sont configurés sur l'ensemble des services critiques, permettant à Docker Swarm de détecter automatiquement un service défaillant et de le redémarrer :
- `db` : commande `pg_isready` toutes les 10 secondes
- `backend` : requête HTTP vers `/api/health` toutes les 30 secondes, avec 5 tentatives et une période de grâce de 60 secondes au démarrage
- `frontend` : requête HTTP sur le port 80 toutes les 30 secondes

### Stratégie de déploiement avec Docker Swarm

Docker Swarm est utilisé en mode single-node pour bénéficier de la configuration `update_config` par service : `order: start-first` démarre le nouveau conteneur avant d'arrêter l'ancien (zero downtime), et `failure_action: rollback` revient automatiquement à la version précédente en cas d'échec du healthcheck après mise à jour.

### Optimisation du cache Docker en CI

Le cache BuildKit (`type=gha`) est activé sur les jobs de build Docker, réduisant les temps de build lors des mises à jour partielles du code en réutilisant les couches inchangées depuis le build précédent (notamment l'installation des dépendances).

### Pre-commit hooks avec Lefthook

Lefthook exécute Biome automatiquement sur les fichiers stagés avant chaque commit. En cas de violation des règles de linting ou de formatage, le commit est bloqué et les problèmes sont affichés. L'installation est automatique via le script `prepare` de npm/bun.

### Dependabot

Un fichier `.github/dependabot.yml` surveille automatiquement les mises à jour de six sources distinctes : dépendances npm de la racine, du backend et du frontend, images Docker de base du backend et du frontend, et versions des actions GitHub utilisées dans les workflows. Des pull requests sont créées automatiquement chaque lundi avec le préfixe `chore(deps)`.

---

## Choix techniques et justifications

**Biome plutôt que ESLint + Prettier**
Biome unifie linting et formatage en un seul outil avec une configuration partagée entre backend et frontend. Il est significativement plus rapide (écrit en Rust) et évite la gestion de deux outils distincts avec des configurations à synchroniser manuellement entre les deux parties du projet.

**Lefthook plutôt que Husky**
Lefthook est plus rapide, ne nécessite pas de scripts shell séparés dans un dossier `.husky/` et fonctionne nativement avec Bun. L'installation se fait via le script `prepare` sans étape supplémentaire de configuration.

**Caddy plutôt que Nginx comme reverse proxy externe**
Caddy gère automatiquement le TLS via Let's Encrypt sans configuration supplémentaire. Avec Nginx, il aurait fallu configurer Certbot, un cron de renouvellement et gérer les rechargements de configuration. Caddy élimine entièrement cette complexité.

**Docker Swarm plutôt que Docker Compose seul**
Docker Swarm, même en mode single-node, permet de configurer des stratégies de mise à jour et de rollback par service, ce qui n'est pas disponible avec Docker Compose classique. Cela assure une continuité de service lors des déploiements et une capacité de récupération automatique en cas d'échec.

**GitHub Container Registry (ghcr.io)**
L'utilisation de `ghcr.io` évite de gérer un compte Docker Hub séparé. Le registre est intégré directement à GitHub et l'authentification se fait via `GITHUB_TOKEN`, sans secret supplémentaire à configurer pour les jobs de build.

**Tagging des images par hash de commit**
En plus du tag `latest`, chaque image est taguée avec le hash court du commit (`sha-<hash>`). Cela permet de tracer précisément quelle version du code est déployée en production, et de revenir à une version antérieure en modifiant simplement le tag dans la configuration Compose.
