from datetime import UTC, datetime
from decimal import Decimal
from typing import Callable

from sqlalchemy import func
from sqlmodel import Session, select

from app.core.security import hash_password, verify_password
from app.core.unit_of_work import UnitOfWork
from app.tpi.models import Categoria, DetallePedido, Pedido, Producto, Usuario
from app.tpi.schemas import (
    AdminSummary,
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    OrderCreate,
    OrderItemRead,
    OrderRead,
    ProductCreate,
    ProductPage,
    ProductRead,
    ProductUpdate,
    StockUpdate,
    UserCreate,
    UserRead,
)


class BusinessError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class FoodStoreService:
    TRANSITIONS = {
        'PENDIENTE': {'EN_PREPARACION', 'CANCELADO'},
        'EN_PREPARACION': {'ENTREGADO', 'CANCELADO'},
        'ENTREGADO': set(),
        'CANCELADO': set(),
    }

    def __init__(self, uow_factory: Callable[[], UnitOfWork]) -> None:
        self.uow_factory = uow_factory

    @staticmethod
    def _category_read(category: Categoria) -> CategoryRead:
        return CategoryRead.model_validate(category)

    @staticmethod
    def _product_read(product: Producto, category: Categoria) -> ProductRead:
        return ProductRead(
            id=product.id, categoria_id=product.categoria_id, categoria_nombre=category.nombre,
            nombre=product.nombre, descripcion=product.descripcion, precio=product.precio,
            imagen_url=product.imagen_url, stock=product.stock, disponible=product.disponible,
            activo=product.activo,
        )

    @staticmethod
    def _order_read(order: Pedido, user: Usuario, details: list[DetallePedido]) -> OrderRead:
        return OrderRead(
            id=order.id, usuario_id=order.usuario_id, usuario_nombre=user.full_name,
            estado=order.estado, forma_pago=order.forma_pago,
            direccion_entrega=order.direccion_entrega, notas=order.notas,
            total=order.total, created_at=order.created_at, updated_at=order.updated_at,
            items=[OrderItemRead(
                id=item.id, producto_id=item.producto_id, cantidad=item.cantidad,
                nombre_producto=item.nombre_producto, precio_unitario=item.precio_unitario,
                subtotal=item.subtotal,
            ) for item in details],
        )

    def register(self, data: UserCreate) -> UserRead:
        with self.uow_factory() as uow:
            existing = uow.session.exec(select(Usuario).where(
                (Usuario.username == data.username) | (Usuario.email == str(data.email).lower())
            )).first()
            if existing:
                raise BusinessError('El usuario o correo ya está registrado.', 409)
            user = uow.usuarios.add(Usuario(
                username=data.username, full_name=data.full_name.strip(), email=str(data.email).lower(),
                hashed_password=hash_password(data.password), role='user', disabled=False,
            ))
            return UserRead.model_validate(user)

    def authenticate(self, username: str, password: str) -> Usuario | None:
        with self.uow_factory() as uow:
            user = uow.session.exec(select(Usuario).where(
                (Usuario.username == username.strip().lower()) | (Usuario.email == username.strip().lower())
            )).first()
            if user is None or user.disabled or not verify_password(password, user.hashed_password):
                return None
            return user

    def categories(self, *, include_inactive: bool = False) -> list[CategoryRead]:
        with self.uow_factory() as uow:
            query = select(Categoria).order_by(Categoria.nombre)
            if not include_inactive:
                query = query.where(Categoria.activo.is_(True))
            return [self._category_read(row) for row in uow.session.exec(query).all()]

    def create_category(self, data: CategoryCreate) -> CategoryRead:
        with self.uow_factory() as uow:
            name = data.nombre.strip()
            if uow.session.exec(select(Categoria).where(func.lower(Categoria.nombre) == name.lower())).first():
                raise BusinessError('Ya existe una categoría con ese nombre.', 409)
            return self._category_read(uow.categorias.add(Categoria(nombre=name, descripcion=data.descripcion)))

    def update_category(self, category_id: int, data: CategoryUpdate) -> CategoryRead:
        with self.uow_factory() as uow:
            category = uow.categorias.get(category_id)
            if category is None:
                raise BusinessError('No se encontró la categoría.', 404)
            changes = data.model_dump(exclude_unset=True)
            if 'nombre' in changes and changes['nombre'] is not None:
                changes['nombre'] = changes['nombre'].strip()
                duplicate = uow.session.exec(select(Categoria).where(
                    func.lower(Categoria.nombre) == changes['nombre'].lower(), Categoria.id != category_id
                )).first()
                if duplicate:
                    raise BusinessError('Ya existe una categoría con ese nombre.', 409)
            for key, value in changes.items():
                setattr(category, key, value)
            return self._category_read(uow.categorias.save(category))

    def deactivate_category(self, category_id: int) -> CategoryRead:
        with self.uow_factory() as uow:
            category = uow.categorias.get(category_id)
            if category is None:
                raise BusinessError('No se encontró la categoría.', 404)
            category.activo = False
            for product in uow.session.exec(select(Producto).where(Producto.categoria_id == category_id)).all():
                product.disponible = False
            uow.session.flush()
            return self._category_read(category)

    def list_products(self, *, page: int = 1, page_size: int = 12, search: str | None = None, category_id: int | None = None, admin: bool = False) -> ProductPage:
        with self.uow_factory() as uow:
            query = select(Producto, Categoria).join(Categoria, Producto.categoria_id == Categoria.id)
            count_query = select(func.count(Producto.id)).join(Categoria, Producto.categoria_id == Categoria.id)
            filters = []
            if not admin:
                filters.extend([Producto.activo.is_(True), Producto.disponible.is_(True), Categoria.activo.is_(True)])
            if search:
                filters.append(func.lower(Producto.nombre).contains(search.strip().lower()))
            if category_id is not None:
                filters.append(Producto.categoria_id == category_id)
            if filters:
                query = query.where(*filters)
                count_query = count_query.where(*filters)
            total = int(uow.session.exec(count_query).one())
            rows = uow.session.exec(query.order_by(Producto.nombre).offset((page - 1) * page_size).limit(page_size)).all()
            return ProductPage(items=[self._product_read(product, category) for product, category in rows], total=total, page=page, page_size=page_size)

    def create_product(self, data: ProductCreate) -> ProductRead:
        with self.uow_factory() as uow:
            category = uow.categorias.get(data.categoria_id)
            if category is None or not category.activo:
                raise BusinessError('Elegí una categoría activa.', 422)
            product = uow.productos.add(Producto(**data.model_dump(), activo=True))
            return self._product_read(product, category)

    def update_product(self, product_id: int, data: ProductUpdate) -> ProductRead:
        with self.uow_factory() as uow:
            product = uow.productos.get(product_id)
            if product is None:
                raise BusinessError('No se encontró el producto.', 404)
            changes = data.model_dump(exclude_unset=True)
            if 'categoria_id' in changes and changes['categoria_id'] is not None:
                category = uow.categorias.get(changes['categoria_id'])
                if category is None or not category.activo:
                    raise BusinessError('Elegí una categoría activa.', 422)
            for key, value in changes.items():
                setattr(product, key, value.strip() if key == 'nombre' and value is not None else value)
            category = uow.categorias.get(product.categoria_id)
            assert category is not None
            return self._product_read(uow.productos.save(product), category)

    def update_stock(self, product_id: int, data: StockUpdate) -> ProductRead:
        changes = data.model_dump(exclude_unset=True)
        if not changes:
            raise BusinessError('Indicá el stock o la disponibilidad que querés actualizar.', 422)
        with self.uow_factory() as uow:
            product = uow.productos.get(product_id)
            if product is None:
                raise BusinessError('No se encontró el producto.', 404)
            for key, value in changes.items():
                setattr(product, key, value)
            category = uow.categorias.get(product.categoria_id)
            assert category is not None
            return self._product_read(uow.productos.save(product), category)

    def deactivate_product(self, product_id: int) -> None:
        with self.uow_factory() as uow:
            product = uow.productos.get(product_id)
            if product is None:
                raise BusinessError('No se encontró el producto.', 404)
            product.activo = False
            product.disponible = False
            uow.productos.save(product)

    def create_order(self, data: OrderCreate, user: Usuario) -> OrderRead:
        product_ids = [item.producto_id for item in data.items]
        if len(product_ids) != len(set(product_ids)):
            raise BusinessError('El pedido no puede repetir productos.', 422)
        with self.uow_factory() as uow:
            order = uow.pedidos.add(Pedido(
                usuario_id=user.id, estado='PENDIENTE', forma_pago=data.forma_pago,
                direccion_entrega=data.direccion_entrega.strip(), notas=data.notas,
                total=Decimal('0.00'),
            ))
            details: list[DetallePedido] = []
            total = Decimal('0.00')
            for line in data.items:
                product = uow.session.exec(
                    select(Producto).where(Producto.id == line.producto_id).with_for_update()
                ).first()
                if product is None or not product.activo or not product.disponible:
                    raise BusinessError(f'El producto {line.producto_id} no está disponible.', 422)
                category = uow.categorias.get(product.categoria_id)
                if category is None or not category.activo:
                    raise BusinessError(f'El producto {product.nombre} no pertenece a una categoría activa.', 422)
                if product.stock < line.cantidad:
                    raise BusinessError(f'Stock insuficiente para {product.nombre}. Disponible: {product.stock}.', 409)
                subtotal = (product.precio * line.cantidad).quantize(Decimal('0.01'))
                product.stock -= line.cantidad
                if product.stock == 0:
                    product.disponible = False
                uow.session.add(product)
                detail = DetallePedido(
                    pedido_id=order.id, producto_id=product.id, cantidad=line.cantidad,
                    nombre_producto=product.nombre, precio_unitario=product.precio, subtotal=subtotal,
                )
                uow.session.add(detail)
                uow.session.flush()
                details.append(detail)
                total += subtotal
            order.total = total.quantize(Decimal('0.01'))
            order.updated_at = datetime.now(UTC)
            uow.pedidos.save(order)
            return self._order_read(order, user, details)

    def list_orders(self, user: Usuario, *, admin: bool = False) -> list[OrderRead]:
        with self.uow_factory() as uow:
            query = select(Pedido).order_by(Pedido.created_at.desc(), Pedido.id.desc())
            if not admin:
                query = query.where(Pedido.usuario_id == user.id)
            orders = list(uow.session.exec(query).all())
            result = []
            for order in orders:
                owner = uow.usuarios.get(order.usuario_id)
                details = list(uow.session.exec(select(DetallePedido).where(DetallePedido.pedido_id == order.id).order_by(DetallePedido.id)).all())
                if owner is not None:
                    result.append(self._order_read(order, owner, details))
            return result

    def get_order(self, order_id: int, user: Usuario, *, admin: bool = False) -> OrderRead:
        with self.uow_factory() as uow:
            order = uow.pedidos.get(order_id)
            if order is None or (not admin and order.usuario_id != user.id):
                raise BusinessError('No se encontró el pedido solicitado.', 404)
            owner = uow.usuarios.get(order.usuario_id)
            assert owner is not None
            details = list(uow.session.exec(select(DetallePedido).where(DetallePedido.pedido_id == order.id).order_by(DetallePedido.id)).all())
            return self._order_read(order, owner, details)

    def cancel_order(self, order_id: int, user: Usuario, *, admin: bool = False) -> OrderRead:
        with self.uow_factory() as uow:
            order = uow.pedidos.get(order_id)
            if order is None or (not admin and order.usuario_id != user.id):
                raise BusinessError('No se encontró el pedido solicitado.', 404)
            if order.estado != 'PENDIENTE' and not admin:
                raise BusinessError('Solo podés cancelar tus pedidos pendientes.', 409)
            if order.estado in {'ENTREGADO', 'CANCELADO'}:
                raise BusinessError('El pedido ya está en un estado final.', 409)
            self._restore_stock(uow.session, order)
            order.estado = 'CANCELADO'
            order.updated_at = datetime.now(UTC)
            uow.pedidos.save(order)
            owner = uow.usuarios.get(order.usuario_id)
            assert owner is not None
            details = list(uow.session.exec(select(DetallePedido).where(DetallePedido.pedido_id == order.id).order_by(DetallePedido.id)).all())
            return self._order_read(order, owner, details)

    def change_order_state(self, order_id: int, new_state: str) -> OrderRead:
        with self.uow_factory() as uow:
            order = uow.pedidos.get(order_id)
            if order is None:
                raise BusinessError('No se encontró el pedido.', 404)
            if new_state not in self.TRANSITIONS.get(order.estado, set()):
                raise BusinessError(f'No se permite pasar el pedido de {order.estado} a {new_state}.', 409)
            if new_state == 'CANCELADO':
                self._restore_stock(uow.session, order)
            order.estado = new_state
            order.updated_at = datetime.now(UTC)
            uow.pedidos.save(order)
            owner = uow.usuarios.get(order.usuario_id)
            assert owner is not None
            details = list(uow.session.exec(select(DetallePedido).where(DetallePedido.pedido_id == order.id).order_by(DetallePedido.id)).all())
            return self._order_read(order, owner, details)

    @staticmethod
    def _restore_stock(session: Session, order: Pedido) -> None:
        details = session.exec(select(DetallePedido).where(DetallePedido.pedido_id == order.id)).all()
        for detail in details:
            product = session.exec(select(Producto).where(Producto.id == detail.producto_id).with_for_update()).first()
            if product is not None:
                product.stock += detail.cantidad
                category = session.get(Categoria, product.categoria_id)
                product.disponible = product.activo and category is not None and category.activo and product.stock > 0
                session.add(product)
        session.flush()

    def admin_summary(self) -> AdminSummary:
        today = datetime.now(UTC).date()
        with self.uow_factory() as uow:
            orders = list(uow.session.exec(select(Pedido)).all())
            products_active = int(uow.session.exec(select(func.count(Producto.id)).where(Producto.activo.is_(True))).one())
            users_active = int(uow.session.exec(select(func.count(Usuario.id)).where(Usuario.disabled.is_(False))).one())
            delivered_today = [o for o in orders if o.estado == 'ENTREGADO' and o.updated_at.date() == today]
            return AdminSummary(
                pedidos_hoy=sum(1 for order in orders if order.created_at.date() == today),
                ventas_entregadas_hoy=sum((order.total for order in delivered_today), Decimal('0.00')),
                pedidos_pendientes=sum(1 for order in orders if order.estado == 'PENDIENTE'),
                pedidos_en_preparacion=sum(1 for order in orders if order.estado == 'EN_PREPARACION'),
                pedidos_entregados=sum(1 for order in orders if order.estado == 'ENTREGADO'),
                productos_activos=products_active,
                usuarios_activos=users_active,
            )

    def list_users(self) -> list[UserRead]:
        with self.uow_factory() as uow:
            users = uow.session.exec(select(Usuario).order_by(Usuario.created_at.desc())).all()
            return [UserRead.model_validate(user) for user in users]

    def set_user_disabled(self, user_id: int, disabled: bool, acting_user: Usuario) -> UserRead:
        with self.uow_factory() as uow:
            user = uow.usuarios.get(user_id)
            if user is None:
                raise BusinessError('No se encontró el usuario.', 404)
            if user.id == acting_user.id and disabled:
                raise BusinessError('No podés desactivar tu propia cuenta.', 409)
            user.disabled = disabled
            return UserRead.model_validate(uow.usuarios.save(user))
