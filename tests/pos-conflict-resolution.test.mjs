import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

describe('POS 409 Conflict & Folio Reconciliation Suite', () => {
  it('differentiates network / 5xx errors from 4xx ApiError conflicts', () => {
    class MockApiError extends Error {
      constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
      }
    }

    const classifyError = (e) => {
      const isApiError = e instanceof MockApiError || (e instanceof Error && typeof e.status === 'number');
      const status = isApiError ? e.status : undefined;
      const isConflictOrClientError = status !== undefined && status >= 400 && status < 500;

      if (isConflictOrClientError) {
        return {
          type: 'CLIENT_CONFLICT',
          status,
          conflictError: e.message,
          userMessage: `El servidor rechazó el registro (${status}): ${e.message}`,
        };
      }
      return {
        type: 'NETWORK_OR_SERVER',
        conflictError: null,
        userMessage: 'El pago ya está respaldado en este equipo, pero el servidor aún no confirmó la venta. No cobres nuevamente; reintenta el registro cuando haya conexión.',
      };
    };

    // 1. Network drop (fetch TypeError)
    const networkErr = new TypeError('Failed to fetch');
    const resNetwork = classifyError(networkErr);
    assert.equal(resNetwork.type, 'NETWORK_OR_SERVER');
    assert.equal(resNetwork.conflictError, null);
    assert.match(resNetwork.userMessage, /reintenta el registro cuando haya conexión/);

    // 2. 500 Internal Server Error
    const err500 = new MockApiError('Error interno del servidor', 500);
    const res500 = classifyError(err500);
    assert.equal(res500.type, 'NETWORK_OR_SERVER');
    assert.equal(res500.conflictError, null);

    // 3. 409 Conflict (Folio Collision)
    const err409Folio = new MockApiError('El turno o folio ya fue utilizado por otra operación.', 409);
    const res409Folio = classifyError(err409Folio);
    assert.equal(res409Folio.type, 'CLIENT_CONFLICT');
    assert.equal(res409Folio.status, 409);
    assert.equal(res409Folio.conflictError, 'El turno o folio ya fue utilizado por otra operación.');
    assert.match(res409Folio.userMessage, /El servidor rechazó el registro \(409\): El turno o folio ya fue utilizado/);

    // 4. 409 Conflict (Expired Quote)
    const err409Quote = new MockApiError('La cotización venció. Actualiza el precio y confirma antes de cobrar.', 409);
    const res409Quote = classifyError(err409Quote);
    assert.equal(res409Quote.type, 'CLIENT_CONFLICT');
    assert.equal(res409Quote.status, 409);
    assert.equal(res409Quote.conflictError, 'La cotización venció. Actualiza el precio y confirma antes de cobrar.');

    // 5. 400 Bad Request
    const err400 = new MockApiError('El turno de caja no está abierto.', 400);
    const res400 = classifyError(err400);
    assert.equal(res400.type, 'CLIENT_CONFLICT');
    assert.equal(res400.status, 400);
  });

  it('PosSalesPanel.tsx contains resolvePaymentConflict and unlock button', () => {
    const salesPanelPath = path.join(PROJECT_ROOT, 'src', 'components', 'PosSalesPanel.tsx');
    assert.ok(fs.existsSync(salesPanelPath), 'PosSalesPanel.tsx exists');
    const content = fs.readFileSync(salesPanelPath, 'utf-8');

    // Must import ApiError
    assert.match(content, /import\s*\{\s*ApiError,\s*solicitarApi\s*\}\s*from\s*['"]\.\.\/services\/apiClient['"]/);

    // Must have state for paymentConflictError
    assert.match(content, /const\s*\[paymentConflictError,\s*setPaymentConflictError\]\s*=\s*useState/);

    // Must define resolvePaymentConflict function
    assert.match(content, /const\s*resolvePaymentConflict\s*=\s*async\s*\(\)\s*=>/);

    // Must show button "Actualizar folio y desbloquear carrito"
    assert.ok(content.includes('Actualizar folio y desbloquear carrito'), 'Must render "Actualizar folio y desbloquear carrito" button');

    // Must confirm before unlocking
    assert.match(content, /confirm\(\{\s*title:\s*['"]¿Actualizar folio y desbloquear carrito\?['"]/);

    // Must call eliminarCobroPendientePos inside resolvePaymentConflict
    assert.match(content, /await\s+eliminarCobroPendientePos\(shiftUuid\)/);

    // Must reset paymentReceivedPending, quote, and paymentConflictError
    assert.ok(content.includes('setQuote(null)'));
    assert.ok(content.includes('setPaymentReceivedPending(false)'));
    assert.ok(content.includes('setPaymentConflictError(null)'));

    // Must refresh shift/folio via onSale()
    assert.ok(content.includes('await onSale()'));
  });

  it('PosPage.tsx synchronizes shift folio on focus, visibility change, and before sale', () => {
    const posPagePath = path.join(PROJECT_ROOT, 'src', 'components', 'PosPage.tsx');
    assert.ok(fs.existsSync(posPagePath), 'PosPage.tsx exists');
    const content = fs.readFileSync(posPagePath, 'utf-8');

    // Check visibility change handler refreshes shift when online
    assert.match(content, /if\s*\(!offlineMode\)\s*\{\s*void\s+refreshShift\(\)\.catch/);

    // Check comprobarTurnoAntesDeVenta throttled refresh
    assert.match(content, /lastShiftRefreshRef/);
    assert.match(content, /if\s*\(!offlineMode\s*&&/);
  });

  it('posLocalStore.ts preserves conflict_error in PosPendingPaymentDraft', () => {
    const storePath = path.join(PROJECT_ROOT, 'src', 'services', 'posLocalStore.ts');
    assert.ok(fs.existsSync(storePath), 'posLocalStore.ts exists');
    const content = fs.readFileSync(storePath, 'utf-8');

    assert.match(content, /conflict_error\?:\s*string\s*\|\s*null/);
    assert.match(content, /conflict_error:\s*stored\.conflict_error\s*\?\?\s*null/);
  });
});
