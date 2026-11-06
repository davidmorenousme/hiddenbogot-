# Hidden Bogotá — React + Express + MySQL

Aplicación web de varias páginas con cuentas de usuario.

## Páginas (rutas)
- `/`                Inicio con buscador (público)
- `/explorar`        Búsqueda con filtro por categoría (público)
- `/comercio/:id`    Perfil: info, mapa, fotos, reseñas, ES/EN (público)
- `/login` `/registro`  Cuenta (turista o dueño de comercio)
- `/favoritos` `/referidos`  Requieren sesión
- `/panel`, `/panel/negocio`, `/panel/galeria`  Módulo del comercio
- `/admin`           Aprobar comercios (solo administrador)

## Puesta en marcha
1. MySQL Workbench: ejecuta `database/hiddenbogota.sql` (borra y crea la base `hiddenbogota`).
2. `cd server` → copia `.env.example` a `.env` y completa los datos → `npm install` → `npm start`
3. `cd client` → `npm install` → `npm run dev` → abre http://localhost:5173

Administrador inicial: el correo y la contraseña de ADMIN_EMAIL / ADMIN_PASSWORD del `.env`.

## Políticas, planes y pago demostrativo

- El pie de página enlaza a páginas internas con el aviso de privacidad, tratamiento de datos, respaldo, cookies y créditos.
- La sección `/precios` presenta el plan gratuito y un plan destacado con valor de referencia de $29.900 COP al mes.
- El botón `/pago-demo` muestra identificación de marca de tarjeta (Visa, Mastercard, entre otras), validación del número con algoritmo de Luhn y una confirmación exitosa para presentación.
- El pago es solo una simulación: no guarda ni transmite datos de tarjeta, no se conecta a Mercado Pago y no realiza cobros.
- Antes de publicar, reemplaza `contacto@hiddenbogota.co` por el correo oficial del responsable, confirma los datos legales de Hidden Bogotá y ajusta el precio de demostración a las condiciones comerciales aprobadas.
- La política de respaldo describe el procedimiento recomendado. El proyecto incluye el esquema SQL, pero no configura respaldos automáticos ni almacenamiento externo; debe montarse en el servidor de producción.

## Ejecutar

En una terminal, instala dependencias con `npm install` en `server` y `client` según los pasos anteriores. Para compilar el cliente: `cd client` y `npm run build`.
