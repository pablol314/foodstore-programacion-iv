# Guion para el video de demostración del TPI

**Duración objetivo:** 12 minutos. La consigna pide un video de 10 a 15 minutos, con cámara encendida al comienzo, y que muestre registro, compra como cliente, administración y cancelación con restitución del stock.

## Antes de grabar

- Usar una base de demostración recién inicializada con `python -m app.db.seed`.
- Confirmar que el backend y el frontend ya están levantados y que la API responde en `/health`.
- Abrir el frontend en una ventana limpia, sin sesiones previas. Tener a mano el acceso administrador configurado para la demo, sin mostrar la contraseña en pantalla.
- Elegir dos productos del catálogo con stock suficiente y anotar su stock inicial.
- Cerrar notificaciones, correo y otras ventanas con datos personales. Grabar la pantalla y la cámara solo durante la presentación inicial.
- No publicar este video hasta comprobar que el enlace puede abrirse sin iniciar sesión.

## Recorrido sugerido

### 0:00–0:45 — Presentación con cámara

Decir, con la cámara visible:

> “Hola, soy Pablo León y presento el Trabajo Práctico Integrador de Programación IV. El proyecto se llama FoodStore y es una aplicación web para consultar un catálogo, comprar productos y administrar pedidos e inventario. Voy a mostrar el recorrido de un cliente y después las funciones del administrador.”

### 0:45–2:00 — Catálogo público

1. Mostrar el catálogo inicial y las categorías disponibles.
2. Buscar un producto por nombre.
3. Aplicar un filtro por categoría y volver al catálogo completo.
4. Señalar el precio, el stock disponible y el botón para agregar al carrito.

Explicar que los productos se cargan desde la API y que el navegador no accede directamente a la base de datos.

### 2:00–3:00 — Registro e inicio de sesión del cliente

1. Abrir “Crear cuenta”.
2. Registrar una cuenta de demostración con datos ficticios.
3. Mostrar que el registro inicia la sesión del cliente y que aparecen las opciones privadas, como el carrito y “Mis pedidos”.

### 3:00–5:30 — Compra

1. Volver al catálogo y agregar dos productos.
2. Abrir el carrito, cambiar una cantidad y mostrar cómo se recalcula el total.
3. Completar dirección y medio de pago; confirmar el pedido.
4. Mostrar el pedido creado y su importe.

Explicar que el backend vuelve a comprobar disponibilidad y stock al confirmar: no confía solo en el contenido del carrito. El pedido conserva el nombre y precio de cada producto en el momento de la compra.

### 5:30–7:00 — Historial y detalle del cliente

1. Abrir “Mis pedidos”.
2. Mostrar el pedido y su estado inicial.
3. Abrir el detalle para mostrar cantidades, precios unitarios, subtotal, total, dirección y medio de pago.

### 7:00–9:00 — Administración

1. Cerrar la sesión del cliente e ingresar con la cuenta administradora del seed.
2. Mostrar el resumen del panel.
3. Abrir productos y mostrar el precio, stock y estado. Editar un dato de un producto de demostración o ajustar su stock y guardar.
4. Mostrar las categorías y la lista de pedidos. Señalar que estas rutas requieren rol administrador.

Si se edita un valor solo para la grabación, dejar anotado el valor original y restaurarlo al final.

### 9:00–11:15 — Cambio de estado, cancelación y restitución

1. En el panel de pedidos, localizar el pedido recién creado.
2. Pasarlo de `PENDIENTE` a `EN_PREPARACION`.
3. Cancelarlo desde el panel y aceptar la confirmación.
4. Volver a productos o al catálogo y mostrar que el stock recuperó las unidades del pedido.

Explicar que el cambio de estado y la reposición del stock se confirman en la misma transacción: si la operación falla, no debe quedar media cancelación aplicada.

### 11:15–12:00 — Cierre

Decir:

> “Este recorrido mostró el registro, la compra, el historial del cliente, la administración de catálogo y pedidos, y la cancelación con restitución del inventario. El backend aplica las validaciones y guarda las operaciones en una base relacional. Gracias.”

## Control final del video

- Duración entre 10 y 15 minutos.
- La presentación inicial muestra la cámara encendida.
- Se ve el registro de una cuenta cliente y una compra confirmada.
- Se muestra el panel administrador y al menos una gestión de catálogo o pedido.
- Se ve una cancelación y el stock restituido después de cancelar.
- El audio se entiende y el video no muestra contraseñas, claves ni datos reales de terceros.
- El enlace final es público y se agrega al README raíz del ZIP y del repositorio.
