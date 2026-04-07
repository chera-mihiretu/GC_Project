# Feature Template

This `.example` folder demonstrates the Clean Architecture structure for a feature.

When creating a new feature (e.g., `auth`, `posts`), copy this folder and rename it:

```
src/features/<feature-name>/
├── domain/          # Entities, value objects, TypeScript interfaces
├── use-cases/       # Application business logic (services, interactors)
├── infrastructure/  # Mongoose models, repository implementations, external APIs
└── presentation/    # Express controllers, routes, feature-specific middlewares
```

**Dependency Rule:** Inner layers (`domain`, `use-cases`) must NEVER import from outer layers (`infrastructure`, `presentation`).
