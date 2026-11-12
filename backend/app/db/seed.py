from app.core.database import create_db_and_tables
from app.core.seed import seed


if __name__ == '__main__':
    create_db_and_tables()
    seed()
    print('Base inicializada. Admin: usuario admin; contraseña configurada en ADMIN_PASSWORD.')
