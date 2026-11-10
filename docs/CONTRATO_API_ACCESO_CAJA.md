# Contrato de acceso y turnos del POS

- **Versión:** 1.5
- **Estado:** acceso online con contraseña; sesión offline automática, detección de caída sin recargar, reconexión automática y operaciones locales de apertura, ventas, anulaciones y cierre implementadas y aceptadas manualmente por el usuario. Al reconectar, la apertura se envía antes de las ventas y anulaciones, y el cierre va al final. Una venta offline recibida tras el cierre del servidor se conserva marcada para conciliación y ajusta el efectivo esperado. El cierre automático a las 00:30 está implementado y pendiente de aceptación.
- **Autenticación:** sesión Django y token CSRF

## Preparar la sesión

Antes del inicio de sesión, el cliente solicita:

```http
GET /api/auth/csrf/
```

La respuesta incluye un `csrfToken` y establece la cookie CSRF. El cliente envía ese valor en el encabezado `X-CSRFToken` en las solicitudes `POST`. La cookie de sesión es `HttpOnly` y `SameSite=Lax`; el cliente no guarda contraseñas ni tokens de sesión en `localStorage`.

## Rutas de autenticación

| Método y ruta | Acceso | Comportamiento |
|---|---|---|
| `GET /api/auth/csrf/` | Público | Entrega token CSRF para el navegador local. |
| `POST /api/auth/login/` | Público con CSRF | Recibe `username` y `password`; limita intentos a 10 por minuto y crea sesión solo a usuarios activos con permiso POS o superusuario. |
| `GET /api/auth/session/` | Sesión autenticada | Devuelve el identificador, nombre de usuario y permiso POS. |
| `POST /api/auth/logout/` | Sesión autenticada y CSRF | Cierra la sesión. |

Ejemplo de inicio de sesión:

```json
{
  "username": "operador",
  "password": "contraseña ingresada por el usuario"
}
```

Respuesta correcta:

```json
{
  "user": {
    "id": 12,
    "username": "operador",
    "can_operate_pos": true
  }
}
```

Las credenciales incorrectas responden con un mensaje genérico. Una cuenta válida sin permiso recibe `403`. Las credenciales no se registran en logs.

## Permiso de operador

Django crea el permiso `sales.can_operate_pos` a partir del modelo `CashShift`. En Django Admin, crea un grupo (por ejemplo, `Operadores POS`), asígnale ese permiso y agrega los usuarios cajeros al grupo. El superusuario conserva acceso para administración local.

## Rutas de turno

Todas requieren una sesión válida y el permiso POS.

| Método y ruta | Comportamiento |
|---|---|
| `GET /api/shifts/current/` | Devuelve el turno abierto de la cuenta compartida, el resumen de ventas completadas por medio de pago y si existe otro turno abierto. |
| `POST /api/shifts/open/` | Abre un turno con `uuid`, `opened_at`, `initial_cash` y `notes`. El UUID del cliente permite reintentar sin duplicar la apertura. |
| `POST /api/shifts/{uuid}/close/` | Cierra el turno de la cuenta compartida con `closed_at`, `counted_cash` y notas opcionales. El servidor calcula y devuelve `final_cash`, la diferencia y el resumen por medio de pago. Repetir el cierre devuelve el estado ya guardado. En un cierre automático, `counted_cash` queda vacío. |

Los montos se expresan en pesos chilenos enteros y no pueden ser negativos. El servidor impide un segundo turno abierto y responde `409` ante el conflicto. Un usuario no puede consultar ni cerrar el turno perteneciente a otra cuenta.

## Límite de esta versión

El inicio de sesión online conserva la contraseña. Después de autenticar una cuenta en este equipo, el POS guarda su identidad y el turno en IndexedDB. Si Django deja de responder, cambia a modo offline sin recargar y restaura esos datos; sondea la API cada cinco segundos y reconecta la sesión y las colas cuando responde. Si el usuario está en la pantalla de inicio y el servidor no responde, puede entrar con el nombre de la cuenta guardada; la contraseña solo se valida online. Cerrar sesión termina la sesión de Django, pero conserva el perfil offline para permitir el inicio del siguiente turno aunque la API siga caída. El perfil se reemplaza al autenticar otra cuenta online o se borra al limpiar los datos locales del navegador. Para el primer uso en un equipo se requiere una autenticación online previa. Este acceso depende del perfil local del navegador y está pensado para el equipo dedicado al POS. El acceso offline permite abrir turnos, registrar ventas, anular ventas pendientes y cerrar turnos localmente. A las 00:30 (`America/Santiago`) el POS registra el cierre automático en IndexedDB sin conteo físico; al reconectar, las operaciones se envían en orden de apertura, ventas, anulaciones y cierre. El usuario confirmó las pruebas offline, incluidas anulaciones y reconexión automática. La aceptación manual del cierre automático y la recuperación de una venta cuyo turno ya cerró siguen pendientes.
