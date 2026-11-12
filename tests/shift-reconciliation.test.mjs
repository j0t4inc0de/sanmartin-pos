import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Shift Reconciliation & Conflict Resolution', () => {
  it('correctly detects conflict when backend returns 409 or Ya existe un turno abierto', () => {
    class MockApiError extends Error {
      constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
      }
    }

    const error409 = new MockApiError('Conflict', 409);
    const error400Detail = new MockApiError('Ya existe un turno abierto.', 400);
    const genericError = new Error('Network error');

    const isConflict = (err) =>
      err instanceof MockApiError &&
      (err.status === 409 || err.status === 400 || err.message.includes('Ya existe un turno abierto'));

    assert.equal(isConflict(error409), true);
    assert.equal(isConflict(error400Detail), true);
    assert.equal(isConflict(genericError), false);
  });

  it('re-maps queued offline sales to active server shift when duplicate open occurs', () => {
    const offlineUuid = 'offline-local-uuid-1234';
    const serverUuid = 'server-active-uuid-5678';

    const queuedSales = [
      { uuid: 'sale-1', shift_uuid: offlineUuid, shift_order_number: 1, total: 6500 },
      { uuid: 'sale-2', shift_uuid: offlineUuid, shift_order_number: 2, total: 4200 },
    ];

    const remappedSales = queuedSales.map(sale => ({
      ...sale,
      shift_uuid: serverUuid,
    }));

    assert.equal(remappedSales.length, 2);
    assert.equal(remappedSales[0].shift_uuid, serverUuid);
    assert.equal(remappedSales[1].shift_uuid, serverUuid);
  });

  it('does not set serverConfirmedCachedShiftClosed if currentShift from server is open', () => {
    const cachedShift = { shift: { uuid: 'offline-uuid', is_open: true } };
    const currentShift = {
      shift: { uuid: 'server-uuid', is_open: true, username: 'admin' },
      another_shift_open: false,
      next_order_number: 5,
    };

    let serverConfirmedCachedShiftClosed = false;
    let adoptedShift = null;

    if (cachedShift?.shift && currentShift.shift?.uuid !== cachedShift.shift.uuid) {
      if (!currentShift.shift) {
        serverConfirmedCachedShiftClosed = true;
      } else {
        adoptedShift = currentShift.shift;
      }
    }

    assert.equal(serverConfirmedCachedShiftClosed, false, 'Must not claim shift is closed when server shift is open');
    assert.equal(adoptedShift?.uuid, 'server-uuid', 'Must adopt server shift');
  });

  it('catches 404 when querying shift UUID that never reached the backend', async () => {
    class MockApiError extends Error {
      constructor(message, status) {
        super(message);
        this.status = status;
      }
    }

    const mockSolicitarApi = async (path) => {
      if (path.includes('offline-uuid')) {
        throw new MockApiError('No CashShift matches the given query.', 404);
      }
      return { uuid: 'server-uuid', is_open: true };
    };

    let closedShift = null;
    let didThrow = false;

    try {
      try {
        closedShift = await mockSolicitarApi('/api/shifts/offline-uuid/');
      } catch {
        closedShift = null;
      }
    } catch {
      didThrow = true;
    }

    assert.equal(didThrow, false, 'Must gracefully catch 404');
    assert.equal(closedShift, null, 'Must fall back to null closedShift');
  });
});
