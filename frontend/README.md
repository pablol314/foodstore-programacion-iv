# FoodStore — Frontend

Interfaz adaptable para catálogo, carrito, checkout, historial de pedidos y administración. Está construida con React, TypeScript estricto, React Router, TanStack Query, TanStack Form, TanStack Table, Axios y Zustand.

## Requisitos e inicio

- Node.js 22 o superior.
- pnpm 9.15.4 (fijado en `package.json`).
- Backend disponible en `http://localhost:8000`.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm build
pnpm dev
```

La aplicación queda en `http://localhost:5173`. `VITE_API_URL` define la URL base y por defecto apunta a `http://localhost:8000/api/v1`.

## Organización

- `src/features/auth/`: registro, acceso y sesión.
- `src/features/categorias/`, `productos/`, `pedidos/` y `usuarios/`: páginas y clientes API por dominio.
- `src/features/cart/`: carrito persistido y checkout.
- `src/shared/`: cliente HTTP, manejo de errores, tipos y componentes compartidos.
- `src/store/`: estado global de sesión y carrito. El JWT permanece en la cookie `HttpOnly`; Zustand conserva únicamente el perfil público.
- `src/routes/`: rutas públicas, protegidas y exclusivas de administración.

El catálogo pagina resultados del servidor y permite buscar y filtrar por categoría. Las operaciones privadas requieren sesión; las pantallas administrativas requieren rol administrador.
