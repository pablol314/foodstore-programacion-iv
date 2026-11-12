# FoodStore API

Backend del Trabajo Práctico Integrador de Programación IV. Implementado con FastAPI, SQLModel, PostgreSQL o SQLite, repositorios genéricos y una unidad de trabajo que confirma o revierte cada transacción.

## Requisitos e instalación

Se recomienda Python 3.13.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Ajustá en `.env` `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_ORIGINS`, `COOKIE_SECURE`, `ADMIN_USERNAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. La configuración de ejemplo usa SQLite, `http://localhost:5173` y la cuenta `admin` / `Admin1234!`.

## Inicialización y ejecución

```bash
python -m app.db.seed
uvicorn app.main:app --reload
```

La API queda en `http://localhost:8000`; la documentación Swagger se encuentra en `/docs` y la comprobación de servicio en `/health`. El seed es idempotente y crea el usuario administrador, al menos tres categorías y ocho productos.

## API

| Recurso | Funciones |
| --- | --- |
| `/api/v1/auth` | Registro, login OAuth2 en cookie `HttpOnly`, logout y perfil |
| `/api/v1/categories` | Listado y ABM administrativo con baja lógica |
| `/api/v1/products` | Catálogo paginado y filtrado, ABM, disponibilidad y stock |
| `/api/v1/orders` | Compra transaccional, historial por titular, detalle y cancelación |
| `/api/v1/admin/summary` | Métricas de pedidos, ventas, catálogo y usuarios |
| `/api/v1/admin/orders` | Consulta y transición controlada de pedidos |
| `/api/v1/admin/users` | Listado y activación o desactivación de cuentas |

Las cuentas cliente solo acceden a sus pedidos. Los administradores pueden administrar el catálogo y todas las órdenes. Los detalles de pedido guardan nombre y precio unitario al momento de la compra; no se modifican después. Las categorías y productos se desactivan sin borrar el historial.
