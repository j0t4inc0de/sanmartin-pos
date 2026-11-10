# Contrato de acceso y turnos del POS

- **Versión:** 1.3
- **Estado:** acceso online con contraseña, apertura, cierre manual con arqueo y resumen por medio de pago implementados; PIN offline y registro de ventas en cola local implementados. La cola se sincroniza al reconectar cuando el turno sigue abierto en el servidor; apertura y cierre offline pendientes.
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

Estas rutas implementan el acceso online con contraseña y las operaciones básicas del turno. Después de iniciar sesión online, el acceso offline solicita un PIN compartido de cuatro cifras, válido durante 24 horas desde la última autenticación online y bloqueado durante 15 minutos tras cinco intentos fallidos. Una sesión que ya esté abierta permanece activa. El verificador se guarda en IndexedDB usando Web Crypto PBKDF2-HMAC-SHA-256 con 600.000 iteraciones y sal aleatoria de 16 bytes; el PIN no se guarda en texto legible. [OWASP da 600.000 iteraciones como referencia para PBKDF2-HMAC-SHA-256 cuando se requiere FIPS](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); el PIN de cuatro cifras conserva solo 10.000 combinaciones y el almacenamiento local puede manipularse. [Web Crypto requiere un contexto seguro](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey), por lo que el despliegue deberá usar HTTPS. El acceso offline permite registrar ventas localmente y sincronizarlas al reconectar mientras el turno exista y siga abierto en el servidor. La apertura/cierre offline y la recuperación de una venta cuyo turno ya cerró siguen pendientes. El usuario confirmó que probó el acceso offline por PIN; la cola de ventas frontend aún requiere aceptación manual en navegador.
