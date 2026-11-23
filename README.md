# FoodStore — Trabajo Práctico Integrador

**Programación IV · Pablo León**

Aplicación full stack para explorar un catálogo, administrar productos y categorías y gestionar compras con control transaccional de stock. El proyecto incluye las carpetas `backend/` y `frontend/`, junto con este README en la raíz.

## Requisitos

- Python 3.11, 3.12 o 3.13.
- PostgreSQL 15 o superior para el entorno de entrega; SQLite está disponible para desarrollo local.
- Node.js 22.12 o superior y pnpm 9.15.4.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.db.seed
uvicorn app.main:app --reload
```

Para usar PostgreSQL, creá una base vacía y configurá `DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/foodstore` en `backend/.env` antes de ejecutar el seed. El valor del ejemplo usa SQLite para desarrollo local.

La API queda en `http://localhost:8000` y su documentación interactiva en `http://localhost:8000/docs`. El seed crea las tablas, el usuario administrador, tres categorías y ocho productos. Credenciales iniciales: usuario `admin`, contraseña `Admin1234!` (configurables por variables de entorno).

## Frontend

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm build
pnpm dev
```

La interfaz queda en `http://localhost:5173`. `VITE_API_URL` define la URL base de FastAPI.

## Funcionalidad

- Registro e inicio de sesión con cookie JWT `HttpOnly` de 30 minutos.
- Catálogo con paginación, búsqueda y filtro por categoría.
- Carrito persistido en Zustand y checkout con TanStack Form.
- Alta transaccional de pedidos: valida productos repetidos, estado, disponibilidad y stock; guarda el pedido y las líneas con precio histórico y descuenta el inventario en la misma unidad de trabajo.
- Historial, detalle y cancelación de pedidos pendientes por parte de su titular.
- Administración protegida por rol: resumen de actividad, ABM de categorías y productos, actualización de stock, gestión de pedidos y activación de usuarios.
- Flujo de estados validado en backend. La cancelación repone el stock dentro de la misma transacción.

## Configuración

Las variables están documentadas en `backend/.env.example` y `frontend/.env.example`. En desarrollo se usa SQLite y `COOKIE_SECURE=false`. Para un despliegue HTTPS se debe configurar `COOKIE_SECURE=true`, una clave `SECRET_KEY` aleatoria y los orígenes reales en `FRONTEND_ORIGIN`.

## Enlaces públicos de la entrega

- [Repositorio FoodStore en GitHub](https://github.com/pablol314/foodstore-programacion-iv)
- [Video de demostración de FoodStore](https://youtu.be/QoBd924VmP0)
