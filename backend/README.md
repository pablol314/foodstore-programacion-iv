# FoodStore API

Backend del Trabajo Práctico Integrador de Programación IV, desarrollado con FastAPI y SQLModel. Organiza autenticación, usuarios, categorías, productos y pedidos por dominio, con repositorios y unidades de trabajo para confirmar o revertir las operaciones de forma transaccional.

## Requisitos

- Python 3.11, 3.12 o 3.13.
- PostgreSQL 15 o superior para el entorno de entrega. SQLite está disponible para desarrollo local.

Las dependencias están fijadas en `requirements.txt`.

## Instalación y ejecución

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.db.seed
uvicorn app.main:app --reload
```

La API queda en `http://localhost:8000`, Swagger en `/docs` y la comprobación de servicio en `/health`. El seed idempotente crea el usuario administrador, tres categorías y ocho productos. La cuenta inicial es `admin` / `Admin1234!`; se puede cambiar mediante `ADMIN_USERNAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

## Configuración

`DATABASE_URL` define la base de datos. Para PostgreSQL, usá una URL con el formato `postgresql://usuario:contraseña@localhost:5432/foodstore`. `SECRET_KEY` debe reemplazarse por una clave aleatoria de al menos 32 caracteres. `FRONTEND_ORIGIN` admite uno o varios orígenes separados por comas. En HTTPS configurá `COOKIE_SECURE=true`.

## API principal

Todas las rutas de negocio están bajo `/api/v1`:

- `/auth`: registro, login OAuth2 con cookie `HttpOnly`, logout y perfil.
- `/admin/usuarios`: listado y activación o desactivación de cuentas.
- `/categorias`: listado público y ABM administrativo con baja lógica.
- `/productos`: catálogo paginado y filtrado, ABM, actualización de stock y baja lógica.
- `/pedidos`: compra, historial, detalle, cancelación del cliente, transición administrativa de estado y resumen.

Las cuentas cliente solo acceden a sus pedidos. Los administradores pueden administrar el catálogo y consultar pedidos de todas las cuentas. Los detalles conservan el nombre y el precio de cada producto al momento de la compra. La creación y cancelación de pedidos ajustan el stock dentro de la misma transacción.
