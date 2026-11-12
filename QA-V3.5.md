# QA V3.5 — resultados

| Prueba | Estado | Evidencia / limitación |
|---|---|---|
| Archivos y ZIP | PASS | Archivos generados y ZIP verificado |
| Sintaxis JavaScript | PASS con node --check | Revisión local de sintaxis |
| Subtotal 1×15000 + 1×22000 + 1×95000 | VERIFICADO fórmula estática | Fórmula compartida suma 132000 COP |
| Cintillo al ancho y movimiento reducido | IMPLEMENTADO / PENDIENTE navegador | Animación CSS y media query |
| Rutas tienda, pedido, panel | VERIFICADO estructura / PENDIENTE navegador | Tres rutas relativas |
| Cambio de imagen de producto | IMPLEMENTADO / PENDIENTE navegador | V3.4 |
| Configuración de logo, contacto, horarios, tarifas | IMPLEMENTADO / PENDIENTE navegador | localStorage mismo origen |
| Simulación de pedidos y estados | IMPLEMENTADO / PENDIENTE navegador | Sin backend |
| Responsive y acceso por teclado | PENDIENTE navegador | Verificar en dispositivo |
| Acceso al Drive LXL | PENDIENTE | No se localizaron normas institucionales en búsqueda del proyecto |
| Derechos sobre contenido de Facebook | PENDIENTE | No se descargó ni incorporó |
| Dirección y horarios finales | PENDIENTE CLIENTE | Datos contradictorios #14-46/#14-70; horarios no confirmados |

Nota: se intentó Playwright con localhost y file:// pero el navegador respondió `ERR_BLOCKED_BY_ADMINISTRATOR`; no se certificó UX interactiva.
