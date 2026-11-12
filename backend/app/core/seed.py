from decimal import Decimal

from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import engine
from app.core.security import hash_password
from app.tpi.models import Categoria, Producto, Usuario

CATEGORIAS = (
    ('Frutas y verduras', 'Productos frescos de estación.'),
    ('Almacén', 'Alimentos secos y productos de despensa.'),
    ('Bebidas', 'Bebidas sin alcohol.'),
)
PRODUCTOS = (
    ('Manzanas rojas', 'Fruta fresca por kilo.', '1200.00', 'Frutas y verduras', 30),
    ('Bananas', 'Bananas seleccionadas por kilo.', '1100.00', 'Frutas y verduras', 25),
    ('Tomates', 'Tomates frescos por kilo.', '1500.00', 'Frutas y verduras', 20),
    ('Arroz largo fino', 'Paquete de arroz de 1 kg.', '1800.00', 'Almacén', 40),
    ('Fideos tirabuzón', 'Paquete de fideos de 500 g.', '1250.00', 'Almacén', 35),
    ('Aceite de girasol', 'Botella de aceite de 900 ml.', '3200.00', 'Almacén', 18),
    ('Agua mineral', 'Botella de agua de 1.5 l.', '900.00', 'Bebidas', 50),
    ('Jugo de naranja', 'Jugo de naranja de 1 l.', '2200.00', 'Bebidas', 22),
)


def seed() -> None:
    with Session(engine) as session:
        admin = session.exec(select(Usuario).where(Usuario.username == settings.admin_username)).first()
        if admin is None:
            session.add(Usuario(
                username=settings.admin_username,
                full_name='Administración FoodStore',
                email=settings.admin_email,
                hashed_password=hash_password(settings.admin_password),
                role='admin',
            ))
        elif admin.email != settings.admin_email.lower():
            admin.email = settings.admin_email.lower()
        categories: dict[str, Categoria] = {}
        for name, description in CATEGORIAS:
            category = session.exec(select(Categoria).where(Categoria.nombre == name)).first()
            if category is None:
                category = Categoria(nombre=name, descripcion=description)
                session.add(category)
                session.flush()
            categories[name] = category
        for name, description, price, category_name, stock in PRODUCTOS:
            existing = session.exec(select(Producto).where(Producto.nombre == name)).first()
            if existing is None:
                session.add(Producto(
                    categoria_id=categories[category_name].id,
                    nombre=name,
                    descripcion=description,
                    precio=Decimal(price),
                    stock=stock,
                    disponible=True,
                    activo=True,
                ))
        session.commit()
