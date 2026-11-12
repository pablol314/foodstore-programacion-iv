from collections.abc import Callable

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import active_admin, current_user, get_uow_factory, optional_current_user
from app.core.security import create_access_token
from app.core.unit_of_work import UnitOfWork
from app.tpi.models import Usuario
from app.tpi.schemas import (
    AdminSummary,
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    Message,
    OrderCreate,
    OrderRead,
    OrderStateUpdate,
    ProductCreate,
    ProductPage,
    ProductRead,
    ProductUpdate,
    StockUpdate,
    UserCreate,
    UserRead,
)
from app.tpi.services import BusinessError, FoodStoreService

router = APIRouter(prefix='/api/v1')


def get_service(uow_factory: Callable[[], UnitOfWork] = Depends(get_uow_factory)) -> FoodStoreService:
    return FoodStoreService(uow_factory)


def _http_error(error: BusinessError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=str(error))


@router.post('/auth/register', response_model=UserRead, status_code=status.HTTP_201_CREATED, tags=['Autenticación'])
def register(data: UserCreate, service: FoodStoreService = Depends(get_service)) -> UserRead:
    try:
        return service.register(data)
    except BusinessError as error:
        raise _http_error(error) from error


@router.post('/auth/token', response_model=Message, tags=['Autenticación'])
def login(response: Response, form: OAuth2PasswordRequestForm = Depends(), service: FoodStoreService = Depends(get_service)) -> Message:
    user = service.authenticate(form.username, form.password)
    if user is None or user.id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Usuario o contraseña incorrectos.', headers={'WWW-Authenticate': 'Bearer'})
    response.set_cookie(
        key='access_token', value=create_access_token(str(user.id)), httponly=True,
        secure=settings.cookie_secure, samesite='lax',
        max_age=settings.access_token_expire_minutes * 60, path='/',
    )
    return Message(message='Inicio de sesión exitoso.')


@router.post('/auth/logout', response_model=Message, tags=['Autenticación'])
def logout(response: Response) -> Message:
    response.delete_cookie(key='access_token', httponly=True, secure=settings.cookie_secure, samesite='lax', path='/')
    return Message(message='Sesión cerrada.')


@router.get('/auth/me', response_model=UserRead, tags=['Autenticación'])
def me(user: Usuario = Depends(current_user)) -> UserRead:
    return UserRead.model_validate(user)


@router.get('/categories', response_model=list[CategoryRead], tags=['Categorías'])
def categories(
    user: Usuario | None = Depends(optional_current_user),
    service: FoodStoreService = Depends(get_service),
) -> list[CategoryRead]:
    return service.categories(include_inactive=user is not None and user.role == 'admin')


@router.post('/categories', response_model=CategoryRead, status_code=status.HTTP_201_CREATED, tags=['Categorías'])
def create_category(data: CategoryCreate, _: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> CategoryRead:
    try:
        return service.create_category(data)
    except BusinessError as error:
        raise _http_error(error) from error


@router.patch('/categories/{category_id}', response_model=CategoryRead, tags=['Categorías'])
def update_category(category_id: int, data: CategoryUpdate, _: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> CategoryRead:
    try:
        return service.update_category(category_id, data)
    except BusinessError as error:
        raise _http_error(error) from error


@router.delete('/categories/{category_id}', response_model=CategoryRead, tags=['Categorías'])
def deactivate_category(category_id: int, _: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> CategoryRead:
    try:
        return service.deactivate_category(category_id)
    except BusinessError as error:
        raise _http_error(error) from error


@router.get('/products', response_model=ProductPage, tags=['Productos'])
def products(
    page: int = Query(default=1, ge=1), page_size: int = Query(default=12, ge=1, le=100),
    search: str | None = None, category_id: int | None = None,
    user: Usuario | None = Depends(optional_current_user), service: FoodStoreService = Depends(get_service),
) -> ProductPage:
    # El catálogo público solo expone activos; la vista administrativa usa el mismo endpoint con sesión.
    try:
        admin = user is not None and user.role == 'admin'
        return service.list_products(page=page, page_size=page_size, search=search, category_id=category_id, admin=admin)
    except BusinessError as error:
        raise _http_error(error) from error


@router.post('/products', response_model=ProductRead, status_code=status.HTTP_201_CREATED, tags=['Productos'])
def create_product(data: ProductCreate, _: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> ProductRead:
    try:
        return service.create_product(data)
    except BusinessError as error:
        raise _http_error(error) from error


@router.patch('/products/{product_id}', response_model=ProductRead, tags=['Productos'])
def update_product(product_id: int, data: ProductUpdate, _: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> ProductRead:
    try:
        return service.update_product(product_id, data)
    except BusinessError as error:
        raise _http_error(error) from error


@router.patch('/products/{product_id}/stock', response_model=ProductRead, tags=['Productos'])
def update_stock(product_id: int, data: StockUpdate, _: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> ProductRead:
    try:
        return service.update_stock(product_id, data)
    except BusinessError as error:
        raise _http_error(error) from error


@router.delete('/products/{product_id}', status_code=status.HTTP_204_NO_CONTENT, tags=['Productos'])
def deactivate_product(product_id: int, _: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> Response:
    try:
        service.deactivate_product(product_id)
    except BusinessError as error:
        raise _http_error(error) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get('/orders', response_model=list[OrderRead], tags=['Pedidos'])
def orders(user: Usuario = Depends(current_user), service: FoodStoreService = Depends(get_service)) -> list[OrderRead]:
    return service.list_orders(user, admin=user.role == 'admin')


@router.post('/orders', response_model=OrderRead, status_code=status.HTTP_201_CREATED, tags=['Pedidos'])
def create_order(data: OrderCreate, user: Usuario = Depends(current_user), service: FoodStoreService = Depends(get_service)) -> OrderRead:
    try:
        return service.create_order(data, user)
    except BusinessError as error:
        raise _http_error(error) from error


@router.get('/orders/{order_id}', response_model=OrderRead, tags=['Pedidos'])
def order_detail(order_id: int, user: Usuario = Depends(current_user), service: FoodStoreService = Depends(get_service)) -> OrderRead:
    try:
        return service.get_order(order_id, user, admin=user.role == 'admin')
    except BusinessError as error:
        raise _http_error(error) from error


@router.post('/orders/{order_id}/cancel', response_model=OrderRead, tags=['Pedidos'])
def cancel_order(order_id: int, user: Usuario = Depends(current_user), service: FoodStoreService = Depends(get_service)) -> OrderRead:
    try:
        return service.cancel_order(order_id, user, admin=user.role == 'admin')
    except BusinessError as error:
        raise _http_error(error) from error


@router.get('/admin/summary', response_model=AdminSummary, tags=['Administración'])
def admin_summary(_: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> AdminSummary:
    return service.admin_summary()


@router.get('/admin/orders', response_model=list[OrderRead], tags=['Administración'])
def admin_orders(user: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> list[OrderRead]:
    return service.list_orders(user, admin=True)


@router.patch('/admin/orders/{order_id}/state', response_model=OrderRead, tags=['Administración'])
def admin_order_state(order_id: int, data: OrderStateUpdate, _: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> OrderRead:
    try:
        return service.change_order_state(order_id, data.estado)
    except BusinessError as error:
        raise _http_error(error) from error


@router.get('/admin/users', response_model=list[UserRead], tags=['Administración'])
def admin_users(_: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> list[UserRead]:
    return service.list_users()


@router.patch('/admin/users/{user_id}/disabled', response_model=UserRead, tags=['Administración'])
def set_user_disabled(user_id: int, disabled: bool, user: Usuario = Depends(active_admin), service: FoodStoreService = Depends(get_service)) -> UserRead:
    try:
        return service.set_user_disabled(user_id, disabled, user)
    except BusinessError as error:
        raise _http_error(error) from error
