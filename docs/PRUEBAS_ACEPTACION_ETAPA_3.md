# Pruebas de aceptación — Etapa 3: Acceso y caja

- **Estado:** casos POS-01 a POS-12 aprobados en el entorno local
- **Alcance:** inicio/cierre de sesión y apertura/cierre de turno en el entorno local.
- **Fuera de alcance:** ventas, operación offline, sincronización, impresión, arqueo y reportes.

## Preparación

1. Confirma que PostgreSQL 16 está iniciado.
2. Inicia el backend y el frontend según [`backend/README.md`](../backend/README.md).
3. Abre `http://localhost:5173/pos`.
4. Usa cuentas locales de desarrollo. No registres ventas reales durante estas pruebas.
5. Anota el resultado de cada caso: **Aprobado**, **Fallido** o **No ejecutado**, junto con fecha y observaciones.

## Casos manuales

| ID | Prueba | Pasos | Resultado esperado |
|---|---|---|---|
| POS-01 | Acceso sin sesión | Abre `/pos` en una ventana privada o después de cerrar sesión. | Se muestra el inicio de sesión; no aparecen datos ni controles de turno. |
| POS-02 | Contraseña incorrecta | Envía un usuario válido con una contraseña incorrecta. | El acceso se rechaza con un mensaje claro; no se crea sesión. |
| POS-03 | Inicio válido | Ingresa con una cuenta autorizada para operar el POS. | Se reconoce al usuario y se muestra si hay un turno abierto o la opción de abrirlo. |
| POS-04 | Persistencia de sesión | Con sesión iniciada, recarga la página. | La sesión continúa y se recupera el estado actual del turno. |
| POS-05 | Cierre de sesión | Cierra sesión y recarga `/pos`. | Vuelve al formulario de acceso; los endpoints protegidos ya no entregan datos de caja. |
| POS-06 | Apertura de turno | Abre un turno con monto inicial entero válido y una nota opcional. | Se muestra el turno abierto con identificador y datos coincidentes; no se pierde al recargar. |
| POS-07 | Reapertura de la pantalla | Con un turno abierto, recarga `/pos`. | Se recupera el mismo turno, sin crear otro ni cambiar el monto inicial. |
| POS-08 | Segundo turno simultáneo | Intenta abrir otro turno mientras el primero sigue abierto. | La operación se bloquea y se mantiene un único turno abierto. |
| POS-09 | Cierre de turno | Solicita cerrar el turno y confirma la acción. | El turno queda cerrado y la pantalla permite iniciar un turno posterior. |
| POS-10 | Cancelar cierre | Solicita cerrar el turno, pero cancela la confirmación. | El turno permanece abierto y conserva sus datos. |
| POS-11 | Permiso de operador | Prueba con una cuenta sin permiso POS; luego asígnale el permiso `sales.can_operate_pos` mediante el grupo definido y repite. | Sin permiso, las operaciones protegidas se rechazan. Con permiso, se autorizan. |
| POS-12 | Protección CSRF | En las herramientas de desarrollo del navegador, revisa las solicitudes POST de acceso y turno; intenta una solicitud sin token CSRF válido. | Las solicitudes legítimas incluyen protección CSRF y una solicitud con token inválido es rechazada. |

## Registro de ejecución

| ID | Estado | Fecha | Observaciones / evidencia |
|---|---|---|---|
| POS-01 | Aprobado | 2026-11-02 | Confirmado por el usuario: sin sesión se presenta el acceso y se bloquea la operación. |
| POS-02 | Aprobado | 2026-11-02 | Confirmado por el usuario: el acceso con contraseña incorrecta se rechazó. |
| POS-03 | Aprobado | 2026-11-02 | El inicio de sesión con una cuenta autorizada funcionó en el entorno local. |
| POS-04 | Aprobado | 2026-11-02 | Confirmado por el usuario: al recargar, la sesión y el estado esperado se conservaron. |
| POS-05 | Aprobado | 2026-11-02 | Confirmado por el usuario: cerrar sesión regresó al formulario de acceso. |
| POS-06 | Aprobado | 2026-11-02 | Se abrió el turno correctamente desde `/pos`. |
| POS-07 | Aprobado | 2026-11-02 | Confirmado por el usuario: al recargar se recuperó el mismo turno. |
| POS-08 | Aprobado | 2026-11-02 | Confirmado por el usuario: no se permitió abrir un segundo turno simultáneo. |
| POS-09 | Aprobado | 2026-11-02 | Se cerró el turno correctamente desde `/pos`. |
| POS-10 | Aprobado | 2026-11-02 | Confirmado por el usuario: cancelar la confirmación mantuvo el turno abierto. |
| POS-11 | Aprobado | 2026-11-02 | La cuenta normal sin permiso fue bloqueada. Tras asignar el permiso POS, el acceso se comportó según lo esperado. |
| POS-12 | Aprobado | 2026-11-02 | Verificado en backend local con cliente Django y CSRF estricto: token inválido recibió HTTP 403 y la sesión autorizada permaneció activa (HTTP 200). |

## Criterio para avanzar

Antes de comenzar la captura de ventas, deben estar aprobados POS-01 a POS-11. POS-12 debe revisarse como control de seguridad. Si una prueba falla, registra los pasos, el resultado observado y cualquier error de consola o red; corrige la causa y repite los casos afectados.

No marques como validadas las funciones que todavía no existen. En particular, estas pruebas no certifican operación sin internet, sincronización, ventas, idempotencia de ventas, impresión ni cierre contable.
