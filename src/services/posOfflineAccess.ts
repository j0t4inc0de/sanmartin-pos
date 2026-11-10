export const OFFLINE_PIN_LENGTH = 4;
export const OFFLINE_PIN_MAX_ATTEMPTS = 5;
export const OFFLINE_PIN_LOCKOUT_MS = 15 * 60 * 1000;
export const OFFLINE_ACCESS_VALIDITY_MS = 24 * 60 * 60 * 1000;

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_OUTPUT_BITS = 256;
type CryptoBytes = Uint8Array<ArrayBuffer>;

export interface OfflinePinVerifier {
  salt: string;
  verifier: string;
}

export interface OfflinePinAttemptState {
  failed_attempts: number;
  blocked_until: string | null;
}

export interface OfflinePinLockoutState extends OfflinePinAttemptState {
  locked: boolean;
  attempts_remaining: number;
  lockout_remaining_ms: number;
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const fromHex = (value: string): CryptoBytes | null => {
  if (!/^(?:[0-9a-f]{2})+$/i.test(value)) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

const validatePin = (pin: string): void => {
  if (!new RegExp(`^\\d{${OFFLINE_PIN_LENGTH}}$`).test(pin)) {
    throw new Error(`El PIN debe tener ${OFFLINE_PIN_LENGTH} números.`);
  }
};

const deriveVerifier = async (
  pin: string,
  salt: CryptoBytes,
  cryptoApi: Crypto,
): Promise<CryptoBytes> => {
  if (!cryptoApi?.subtle) {
    throw new Error('Este navegador requiere un contexto seguro para habilitar el acceso offline.');
  }

  const keyMaterial = await cryptoApi.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await cryptoApi.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    PBKDF2_OUTPUT_BITS,
  );
  return new Uint8Array(bits);
};

export const crearVerificadorPinOffline = async (
  pin: string,
  cryptoApi: Crypto = globalThis.crypto,
): Promise<OfflinePinVerifier> => {
  validatePin(pin);
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Este navegador no permite generar datos aleatorios seguros.');
  }

  const salt = cryptoApi.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const verifier = await deriveVerifier(pin, salt, cryptoApi);
  return { salt: toHex(salt), verifier: toHex(verifier) };
};

export const verificarPinOffline = async (
  pin: string,
  stored: OfflinePinVerifier,
  cryptoApi: Crypto = globalThis.crypto,
): Promise<boolean> => {
  validatePin(pin);
  const salt = fromHex(stored.salt);
  const expected = fromHex(stored.verifier);
  if (!salt || salt.length !== PBKDF2_SALT_BYTES || !expected || expected.length !== PBKDF2_OUTPUT_BITS / 8) {
    return false;
  }

  const actual = await deriveVerifier(pin, salt, cryptoApi);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
};

export const revisarBloqueoPinOffline = (
  state: OfflinePinAttemptState,
  now = Date.now(),
): OfflinePinLockoutState => {
  const blockedUntil = state.blocked_until ? Date.parse(state.blocked_until) : Number.NaN;
  if (Number.isFinite(blockedUntil) && blockedUntil > now) {
    return {
      failed_attempts: OFFLINE_PIN_MAX_ATTEMPTS,
      blocked_until: state.blocked_until,
      locked: true,
      attempts_remaining: 0,
      lockout_remaining_ms: blockedUntil - now,
    };
  }

  const expiredLockout = Number.isFinite(blockedUntil) && blockedUntil <= now;
  const failedAttempts = expiredLockout
    ? 0
    : Math.min(OFFLINE_PIN_MAX_ATTEMPTS - 1, Math.max(0, Math.trunc(state.failed_attempts) || 0));
  return {
    failed_attempts: failedAttempts,
    blocked_until: null,
    locked: false,
    attempts_remaining: OFFLINE_PIN_MAX_ATTEMPTS - failedAttempts,
    lockout_remaining_ms: 0,
  };
};

export const registrarFalloPinOffline = (
  state: OfflinePinAttemptState,
  now = Date.now(),
): OfflinePinLockoutState => {
  const current = revisarBloqueoPinOffline(state, now);
  if (current.locked) return current;

  const failedAttempts = current.failed_attempts + 1;
  if (failedAttempts >= OFFLINE_PIN_MAX_ATTEMPTS) {
    const blockedUntil = new Date(now + OFFLINE_PIN_LOCKOUT_MS).toISOString();
    return {
      failed_attempts: OFFLINE_PIN_MAX_ATTEMPTS,
      blocked_until: blockedUntil,
      locked: true,
      attempts_remaining: 0,
      lockout_remaining_ms: OFFLINE_PIN_LOCKOUT_MS,
    };
  }

  return {
    failed_attempts: failedAttempts,
    blocked_until: null,
    locked: false,
    attempts_remaining: OFFLINE_PIN_MAX_ATTEMPTS - failedAttempts,
    lockout_remaining_ms: 0,
  };
};

export const accesoOfflineVigente = (
  lastOnlineAuthentication: string,
  now = Date.now(),
): boolean => {
  const authenticatedAt = Date.parse(lastOnlineAuthentication);
  if (!Number.isFinite(authenticatedAt) || now < authenticatedAt) return false;
  return now - authenticatedAt < OFFLINE_ACCESS_VALIDITY_MS;
};
