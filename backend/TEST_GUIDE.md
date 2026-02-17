# Backend Tests

## Vue d'ensemble

Ce backend utilise **Bun Test Runner** pour les tests unitaires. Les tests sont situés à côté des fichiers source avec l'extension `.test.ts`.

## Lancer les tests

```bash
bun test
```

Pour lancer les tests en mode watch (recharge automatique) :

```bash
bun test --watch
```

Pour voir plus de détails sur les tests :

```bash
bun test --verbose
```

## Structure des tests

### Tests existants

- **[src/auth/sessions.test.ts](src/auth/sessions.test.ts)** - Tests de gestion des sessions
  - Création de sessions
  - Validation des sessions
  - Suppression des sessions
  - Expiration des tokens

- **[src/auth/guard.test.ts](src/auth/guard.test.ts)** - Tests de la garde d'authentification
  - Extraction du token Bearer
  - Validation de la présence du token
  - Formats de token invalides

- **[src/auth/routes.test.ts](src/auth/routes.test.ts)** - Tests des routes d'authentification
  - POST /api/auth/login
  - GET /api/auth/me
  - POST /api/auth/logout

- **[src/events/routes.test.ts](src/events/routes.test.ts)** - Tests des routes d'événements
  - GET /api/events (liste)
  - GET /api/events/:id (détail)
  - POST /api/events (création)
  - PUT /api/events/:id (mise à jour)
  - DELETE /api/events/:id (suppression)

- **[src/events/repository.test.ts](src/events/repository.test.ts)** - Tests du repository (structure de base)

## Utiliser les mocks dans les tests

Un fichier utilitaire de mock est disponible : [src/db/mock.ts](src/db/mock.ts)

### Exemple d'utilisation

```typescript
import { createMockSql, createMockEvent } from "../db/mock";

const { mockSql, storage } = createMockSql();

// Tester la création d'événement
const event = await mockSql`
  INSERT INTO events (title, description, date)
  VALUES (${input.title}, ${input.description}, ${input.date})
  RETURNING *
`;

// Vérifier les données en mémoire
console.log(storage.events); // Map des événements
```

## Bonnes pratiques

1. **Isolation** : Chaque test doit être indépendant
2. **Nameage** : Utilisez `describe()` pour grouper les tests liés
3. **Assertions claires** : Utilisez `expect()` avec des messages clairs
4. **Mocking** : Utilisez les utilitaires de mock pour éviter les dépendances à la BD réelle

## Exemple de test complet

```typescript
import { describe, it, expect } from "bun:test";
import { createMockEvent } from "../db/mock";

describe("Events", () => {
  it("should create event with required fields", () => {
    const event = createMockEvent({
      title: "Fish Feeding 101",
    });
    
    expect(event.title).toBe("Fish Feeding 101");
    expect(event.id).toBe(1);
  });
});
```

## Documentation Bun Test

Pour plus de détails : https://bun.sh/docs/test/overview
