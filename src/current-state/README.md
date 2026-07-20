# Current-State Evidence Layer

This folder contains the module-scoped evidence extracted from the original Impilo legacy estate. It is loaded lazily by the frontend and displayed through the Current operating model components.

- `data/`: 36 JSON module/application specifications.
- `module-manifest.ts`: route/name aliases and summary inventory.
- `loader.ts`: lazy loaders with an in-memory cache.
- `types.ts`: current-state evidence contracts.

The evidence supports traceability and design validation. It is not a replacement for backend business-rule enforcement.
