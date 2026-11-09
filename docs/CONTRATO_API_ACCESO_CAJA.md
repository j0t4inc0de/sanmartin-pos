# Contrato de acceso y turnos del POS

- **Versión:** 1.1
- **Estado:** apertura y cierre manual con arqueo de efectivo implementados en local; cierre automático y operación offline pendientes
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
| `GET /api/shifts/current/` | Devuelve el turno abierto del usuario; también indica si existe otro turno abierto. |
| `POST /api/shifts/open/` | Abre un turno con `uuid`, `opened_at`, `initial_cash` y `notes`. El UUID del cliente permite reintentar sin duplicar la apertura. |
| `POST /api/shifts/{uuid}/close/` | Cierra el turno de la cuenta compartida con `closed_at`, `counted_cash` y notas opcionales. El servidor calcula y devuelve `final_cash` y la diferencia. Repetir el cierre devuelve el estado ya guardado. En un cierre automático, `counted_cash` queda vacío. |

Los montos se expresan en pesos chilenos enteros y no pueden ser negativos. El servidor impide un segundo turno abierto y responde `409` ante el conflicto. Un usuario no puede consultar ni cerrar el turno perteneciente a otra cuenta.

## Límite de esta versión

Estas rutas implementan el acceso online y las operaciones básicas del turno. El arqueo, el cierre automático a las 00:30 hora de Santiago y el acceso offline con PIN compartido aún requieren implementación. El POS debe persistir localmente el cierre sin conexión y sincronizarlo después de la apertura, las ventas y las anulaciones del turno.
