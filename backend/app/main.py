from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.core.seed import seed
from app.tpi.routers import router


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
    app.include_router(router)

    @app.get('/health', tags=['Sistema'])
    def health() -> dict[str, str]:
        return {'status': 'ok'}

    return app


app = create_app()
