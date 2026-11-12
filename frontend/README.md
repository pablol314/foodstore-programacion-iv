# FoodStore — Frontend

Interfaz responsive para catálogo, carrito, checkout, historial de pedidos y administración. Está construida con React, TypeScript estricto, React Router, TanStack Query, TanStack Form, TanStack Table, Axios y Zustand.

## Requisitos e inicio

- Node.js 22 o superior.
- pnpm 9 o superior.
- Backend disponible en `http://localhost:8000`.

```bash
pnpm install
cp .env.example .env
pnpm build
pnpm dev
```

La aplicación queda en `http://localhost:5173`. `VITE_API_URL` define la URL base del backend y por defecto apunta a `http://localhost:8000/api/v1`.

## Organización

- `src/features/auth/`: acceso, registro y store de sesión.
- `src/features/catalog/`, `cart/`, `orders/` y `admin/`: páginas y operaciones de cada módulo.
- `src/shared/api/foodstore.ts`: servicios Axios con credenciales y normalización de importes.
- `src/features/auth/sessionStore.ts` y `src/features/cart/cartStore.ts`: sesión y carrito persistidos con Zustand. El store de sesión solo conserva el perfil público; el JWT queda en la cookie `HttpOnly` del servidor.
- `src/shared/`: tablas y componentes compartidos, cliente Axios, notificaciones e interceptores de sesión.
- `src/routes/`: rutas públicas, protegidas y exclusivas de administración.

El catálogo pagina los resultados del servidor, filtra por texto y categoría y muestra estados vacíos y de carga. El checkout usa TanStack Form; las tablas administrativas usan TanStack Table; el caché y las mutaciones usan TanStack Query.
