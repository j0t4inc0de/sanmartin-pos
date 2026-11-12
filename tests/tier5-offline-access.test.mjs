import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { loadSourceModule } from './helpers/loader.mjs';

describe('Tier 5: POS offline access primitives', async () => {
  const offlineAccess = await loadSourceModule('./src/services/posOfflineAccess.ts');

  it('requires exactly four numeric digits', async () => {
    await assert.rejects(offlineAccess.crearVerificadorPinOffline('123'));
    await assert.rejects(offlineAccess.crearVerificadorPinOffline('12a4'));
    await assert.rejects(offlineAccess.crearVerificadorPinOffline('12345'));
  });

  it('stores a salted verifier and accepts only the matching PIN', async () => {
    const first = await offlineAccess.crearVerificadorPinOffline('4821', webcrypto);
    const second = await offlineAccess.crearVerificadorPinOffline('4821', webcrypto);

    assert.notEqual(first.salt, second.salt, 'each PIN enrollment needs an independent salt');
    assert.notEqual(first.verifier, '4821', 'the PIN must never be stored as the verifier');
    assert.equal(await offlineAccess.verificarPinOffline('4821', first, webcrypto), true);
    assert.equal(await offlineAccess.verificarPinOffline('4822', first, webcrypto), false);
    assert.equal(await offlineAccess.verificarPinOffline('4821', { salt: 'bad', verifier: 'bad' }, webcrypto), false);
  });

  it('locks after five failures, stays locked for fifteen minutes, then resets', () => {
    const now = Date.parse('2026-11-09T20:00:00.000Z');
    let state = { failed_attempts: 0, blocked_until: null };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      state = offlineAccess.registrarFalloPinOffline(state, now);
      assert.equal(state.locked, false);
    }
    assert.equal(state.attempts_remaining, 1);

    state = offlineAccess.registrarFalloPinOffline(state, now);
    assert.equal(state.locked, true);
    assert.equal(state.lockout_remaining_ms, 15 * 60 * 1000);
    assert.equal(offlineAccess.registrarFalloPinOffline(state, now + 60_000).blocked_until, state.blocked_until);

    const unlocked = offlineAccess.revisarBloqueoPinOffline(state, now + 15 * 60 * 1000);
    assert.equal(unlocked.locked, false);
    assert.equal(unlocked.failed_attempts, 0);
    assert.equal(unlocked.attempts_remaining, 5);
  });

  it('expires offline authorization exactly twenty-four hours after online authentication', () => {
    const authenticatedAt = '2026-11-09T20:00:00.000Z';
    const start = Date.parse(authenticatedAt);

    assert.equal(offlineAccess.accesoOfflineVigente(authenticatedAt, start), true);
    assert.equal(offlineAccess.accesoOfflineVigente(authenticatedAt, start + 24 * 60 * 60 * 1000 - 1), true);
    assert.equal(offlineAccess.accesoOfflineVigente(authenticatedAt, start + 24 * 60 * 60 * 1000), false);
    assert.equal(offlineAccess.accesoOfflineVigente('fecha inválida', start), false);
    assert.equal(offlineAccess.accesoOfflineVigente('2026-11-09T20:00:01.000Z', start), false);
  });
});
