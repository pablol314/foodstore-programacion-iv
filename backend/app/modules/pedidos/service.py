from collections.abc import Callable
from datetime import UTC, datetime, time, timedelta
from decimal import Decimal

from sqlmodel import Session

from app.core.errors import BusinessError
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    CambioEstado,
    DetallePedidoRead,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario


class PedidoService:
    TRANSITIONS = {
        "PENDIENTE": {"EN_PREPARACION", "CANCELADO"},
        "EN_PREPARACION": {"ENTREGADO", "CANCELADO"},
        "ENTREGADO": set(),
        "CANCELADO": set(),
    }

    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self.session_factory = session_factory

    @staticmethod
    def _read(order: Pedido, details: list[DetallePedido]) -> PedidoRead:
        return PedidoRead(
            id=order.id,
            usuario_id=order.usuario_id,
            estado=order.estado,
            forma_pago=order.forma_pago,
            direccion_entrega=order.direccion_entrega,
            notas=order.notas,
            total=order.total,
            created_at=order.created_at,
            updated_at=order.updated_at,
            items=[DetallePedidoRead(
                producto_id=item.producto_id,
                nombre_producto=item.nombre_producto,
                precio_unitario=item.precio_unitario,
                cantidad=item.cantidad,
                subtotal=item.subtotal,
            ) for item in details],
        )

    def create_order(self, data: PedidoCreate, user: Usuario) -> PedidoRead:
        product_ids = [item.producto_id for item in data.items]
        if len(product_ids) != len(set(product_ids)):
            raise BusinessError("El pedido no puede repetir productos.", 400)
        with PedidoUnitOfWork(self.session_factory) as uow:
            order = uow.pedidos.add(Pedido(
                usuario_id=user.id,
                estado="PENDIENTE",
                forma_pago=data.forma_pago,
                direccion_entrega=data.direccion_entrega,
                notas=data.notas,
                total=0.0,
            ))
            details: list[DetallePedido] = []
            total = Decimal("0.00")
            for line in data.items:
                product = uow.productos.get_for_update(line.producto_id)
                if product is None or not product.activo:
                    raise BusinessError(f"No se encontró el producto {line.producto_id}.", 404)
                if not product.disponible:
                    raise BusinessError(f"El producto {product.nombre} no está disponible.", 400)
                if product.stock < line.cantidad:
                    raise BusinessError(
                        f"Stock insuficiente para {product.nombre}. Disponible: {product.stock}.", 400
                    )
                subtotal = Decimal(str(product.precio_base)) * line.cantidad
                product.stock -= line.cantidad
                uow.productos.save(product)
                detail = uow.detalles.add(DetallePedido(
                    pedido_id=order.id,
                    producto_id=product.id,
                    cantidad=line.cantidad,
                    nombre_producto=product.nombre,
                    precio_unitario=product.precio_base,
                    subtotal=float(subtotal),
                ))
                details.append(detail)
                total += subtotal
            order.total = float(total)
            order.updated_at = datetime.now(UTC)
            uow.pedidos.save(order)
            return self._read(order, details)

    def list_orders(
        self,
        user: Usuario,
        *,
        admin: bool = False,
        skip: int = 0,
        limit: int = 20,
        estado: str | None = None,
    ) -> PedidosPaginados:
        with PedidoUnitOfWork(self.session_factory) as uow:
            owner_id = None if admin else user.id
            orders, total = uow.pedidos.list_by_usuario(
                owner_id, skip=skip, limit=limit, estado=estado
            )
            items = [self._read(order, uow.detalles.list_by_pedido(order.id)) for order in orders]
            return PedidosPaginados(total=total, items=items)

    def get_order(self, order_id: int, user: Usuario, *, admin: bool = False) -> PedidoRead:
        with PedidoUnitOfWork(self.session_factory) as uow:
            order = uow.pedidos.get_by_id(order_id)
            if order is None:
                raise BusinessError("No se encontró el pedido solicitado.", 404)
            if not admin and order.usuario_id != user.id:
                raise BusinessError("No tenés permiso para acceder a este pedido.", 403)
            return self._read(order, uow.detalles.list_by_pedido(order.id))

    def cancel_order(self, order_id: int, user: Usuario) -> PedidoRead:
        with PedidoUnitOfWork(self.session_factory) as uow:
            order = uow.pedidos.get_by_id(order_id)
            if order is None:
                raise BusinessError("No se encontró el pedido solicitado.", 404)
            if order.usuario_id != user.id:
                raise BusinessError("No tenés permiso para cancelar este pedido.", 403)
            if order.estado != "PENDIENTE":
                raise BusinessError("Solo se pueden cancelar pedidos en estado PENDIENTE.", 400)
            self._restore_stock(uow, order)
            order.estado = "CANCELADO"
            order.updated_at = datetime.now(UTC)
            uow.pedidos.save(order)
            return self._read(order, uow.detalles.list_by_pedido(order.id))

    def change_state(self, order_id: int, data: CambioEstado) -> PedidoRead:
        with PedidoUnitOfWork(self.session_factory) as uow:
            order = uow.pedidos.get_by_id(order_id)
            if order is None:
                raise BusinessError("No se encontró el pedido.", 404)
            if data.estado not in self.TRANSITIONS.get(order.estado, set()):
                raise BusinessError(
                    f"No se permite pasar el pedido de {order.estado} a {data.estado}.", 400
                )
            if data.estado == "CANCELADO":
                self._restore_stock(uow, order)
            order.estado = data.estado
            order.updated_at = datetime.now(UTC)
            uow.pedidos.save(order)
            return self._read(order, uow.detalles.list_by_pedido(order.id))

    @staticmethod
    def _restore_stock(uow: PedidoUnitOfWork, order: Pedido) -> None:
        for detail in uow.detalles.list_by_pedido(order.id):
            product = uow.productos.get_for_update(detail.producto_id)
            if product is not None:
                product.stock += detail.cantidad
                uow.productos.save(product)

    def summary(self) -> ResumenPedidos:
        with PedidoUnitOfWork(self.session_factory) as uow:
            now = datetime.now(UTC)
            start = datetime.combine(now.date(), time.min, tzinfo=UTC)
            end = start + timedelta(days=1)
            return ResumenPedidos(
                pendientes=uow.pedidos.count_by_estado("PENDIENTE"),
                en_preparacion=uow.pedidos.count_by_estado("EN_PREPARACION"),
                entregados=uow.pedidos.count_by_estado("ENTREGADO"),
                cancelados=uow.pedidos.count_by_estado("CANCELADO"),
                pedidos_hoy=uow.pedidos.count_created_between(start, end),
                ingresos_entregados=uow.pedidos.sum_entregados(),
            )
