export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let csrfToken: string | null = null;

const notificarApiNoDisponible = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pos:api-unavailable'));
  }
};

export const cargarTokenCsrf = async (actualizar = false): Promise<string> => {
  if (csrfToken && !actualizar) return csrfToken;

  let response: Response;
  try {
    response = await fetch('/api/auth/csrf/', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    notificarApiNoDisponible();
    throw error;
  }

  if (!response.ok) {
    if (response.status >= 500) notificarApiNoDisponible();
    throw new ApiError('No se pudo preparar la sesión segura.', response.status);
  }

  const payload = (await response.json()) as { csrfToken?: string };
  if (!payload.csrfToken) {
    throw new ApiError('El servidor no entregó el token CSRF.', response.status);
  }

  csrfToken = payload.csrfToken;
  return csrfToken;
};

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
}

export const solicitarApi = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const method = options.method ?? 'GET';
  const headers = new Headers({ Accept: 'application/json' });
  let body: string | undefined;

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  if (method !== 'GET') {
    // Django rota el secreto CSRF al iniciar sesión. Obtén un token asociado
    // a la cookie actual en cada operación que modifica datos para no enviar
    // uno almacenado antes de esa rotación.
    headers.set('X-CSRFToken', await cargarTokenCsrf(true));
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      body,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch (error) {
    notificarApiNoDisponible();
    throw error;
  }

  if (response.status >= 500) notificarApiNoDisponible();

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => ({}))) as {
    detail?: string;
  };
  if (!response.ok) {
    throw new ApiError(
      payload.detail ?? 'La solicitud no pudo completarse.',
      response.status,
    );
  }

  return payload as T;
};
