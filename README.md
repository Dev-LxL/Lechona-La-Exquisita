# Lechona La Exquisita — LXL V3.5 (DEMO)

Versión derivada de V3.4. **No es una tienda productiva.**

## Abrir
Desde esta carpeta ejecutar `python -m http.server 8000`. Abrir `http://localhost:8000/`, `http://localhost:8000/pedido/` y `http://localhost:8000/admin/`. Utilizar el mismo hostname y puerto.

## Componentes
- Inicio: catálogo, galería, marca, contacto, horarios provisionales y carrito lateral.
- Pedido: carrito completo, entrega y pago *simulado*, pedidos solo en almacenamiento local.
- Admin: catálogo, fotografías, estados de pedidos ficticios, despachos y configuración de negocio, horarios, logo, zonas y enlaces sociales.

## Importante
- Los precios y las zonas de entrega no están confirmados. Las tarifas quedan vacías hasta que el operador introduzca datos **ficticios** para la presentación.
- Dirección #14-70 es la más reciente aportada, pero existe una pieza anterior con #14-46. El estado en vivo de horarios permanece por confirmar.
- Para cambiar imágenes de producto, usar panel Productos. Para el logo, Configuración del negocio. Los archivos originales no cambian.
- El panel **no tiene contraseña**, roles ni seguridad: debe protegerse con backend antes de publicar.
- `localStorage` es demostrativo y puede borrarse o alcanzar su límite. No conecta equipos ni dispositivos.
- No hay pagos Wompi, WhatsApp automático, producción ni backend. No ingreses datos reales de clientes.
- Facebook no se ha descargado ni se han extraído videos externos.
