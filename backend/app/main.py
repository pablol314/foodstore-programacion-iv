from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.core.seed import seed
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    create_db_and_tables()
    seed()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title='FoodStore API',
        description='Catálogo, autenticación y pedidos transaccionales de FoodStore.',
        version='1.0.0',
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allow_headers=['*'],
    )
    for router in (auth_router, usuarios_router, categorias_router, productos_router, pedidos_router):
        app.include_router(router, prefix='/api/v1')

    @app.get('/health', tags=['Sistema'])
    def health() -> dict[str, str]:
        return {'status': 'ok'}

    return app


app = create_app()
