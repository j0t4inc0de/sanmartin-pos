import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { loadSourceModule } from './helpers/loader.mjs';

describe('Tier 1: Chilean Schedule Engine (America/Santiago)', async () => {
  const businessModule = await loadSourceModule('./src/utils/businessHours.ts');
  const { getBusinessStatus } = businessModule;

  it('Contract: getBusinessStatus is exported as a function', () => {
    assert.strictEqual(typeof getBusinessStatus, 'function', 'getBusinessStatus should be exported as a function');
  });

  it('Contract: getBusinessStatus accepts a deterministic Date parameter', () => {
    // If the function signature accepts an optional Date argument, it should execute without error
    const testDate = new Date('2026-10-13T21:30:00Z');
    const status = getBusinessStatus(testDate);
    assert.ok(status, 'getBusinessStatus should return a status object');
    assert.strictEqual(typeof status.isOpen, 'boolean', 'status.isOpen should be a boolean');
    assert.strictEqual(typeof status.statusText, 'string', 'status.statusText should be a string');
    assert.strictEqual(typeof status.statusDetail, 'string', 'status.statusDetail should be a string');
    assert.strictEqual(typeof status.badgeColor, 'string', 'status.badgeColor should be a string');
    assert.strictEqual(typeof status.nextOpenText, 'string', 'status.nextOpenText should be a string');
  });

  const testVectors = [
    {
      id: 'vector-1',
      description: 'Vector 1: Tuesday 18:29:59 CLT (1 second before opening) -> CLOSED',
      utcIso: '2026-10-13T21:29:59Z',
      expectedOpen: false,
      expectedBadge: 'amber',
      expectedStatusIncludes: 'Cerrado',
    },
    {
      id: 'vector-2',
      description: 'Vector 2: Tuesday 18:30:00 CLT (exact opening second) -> OPEN',
      utcIso: '2026-10-13T21:30:00Z',
      expectedOpen: true,
      expectedBadge: 'emerald',
      expectedStatusIncludes: 'Abiertos',
    },
    {
      id: 'vector-3',
      description: 'Vector 3: Tuesday 23:00:00 CLT (mid evening service) -> OPEN',
      utcIso: '2026-10-14T02:00:00Z',
      expectedOpen: true,
      expectedBadge: 'emerald',
      expectedStatusIncludes: 'Abiertos',
    },
    {
      id: 'vector-4',
      description: 'Vector 4: Tuesday 23:30:00 CLT (exact closing minute) -> OPEN',
      utcIso: '2026-10-14T02:30:00Z',
      expectedOpen: true,
      expectedBadge: 'emerald',
      expectedStatusIncludes: 'Abiertos',
    },
    {
      id: 'vector-5',
      description: 'Vector 5: Tuesday 23:31:00 CLT (1 minute after closing) -> CLOSED',
      utcIso: '2026-10-14T02:31:00Z',
      expectedOpen: false,
      expectedBadge: 'amber',
      expectedStatusIncludes: 'Cerrado',
    },
    {
      id: 'vector-6',
      description: 'Vector 6: Sunday 23:31:00 CLT (after close on Sunday; next open is Tuesday) -> CLOSED',
      utcIso: '2026-10-19T02:31:00Z',
      expectedOpen: false,
      expectedBadge: 'amber',
      expectedNextOpenIncludes: 'Martes',
    },
    {
      id: 'vector-7',
      description: 'Vector 7: Monday 15:00:00 CLT (Monday afternoon - rest day) -> CLOSED',
      utcIso: '2026-10-19T18:00:00Z',
      expectedOpen: false,
      expectedBadge: 'rose',
      expectedStatusIncludes: 'lunes',
    },
    {
      id: 'vector-8',
      description: 'Vector 8: Monday 20:00:00 CLT (Monday evening during standard service hours) -> CLOSED',
      utcIso: '2026-10-19T23:00:00Z',
      expectedOpen: false,
      expectedBadge: 'rose',
      expectedStatusIncludes: 'lunes',
    },
    {
      id: 'vector-9',
      description: 'Vector 9: Winter CLT UTC-4 (2026-07-15 18:30 CLT / 22:30 UTC) -> OPEN',
      utcIso: '2026-07-15T22:30:00Z',
      expectedOpen: true,
      expectedBadge: 'emerald',
      expectedStatusIncludes: 'Abiertos',
    },
    {
      id: 'vector-10',
      description: 'Vector 10: Summer CLT UTC-3 (2026-12-15 18:30 CLT / 21:30 UTC) -> OPEN',
      utcIso: '2026-12-15T21:30:00Z',
      expectedOpen: true,
      expectedBadge: 'emerald',
      expectedStatusIncludes: 'Abiertos',
    },
  ];

  for (const v of testVectors) {
    it(v.description, () => {
      const date = new Date(v.utcIso);
      const status = getBusinessStatus(date);

      assert.strictEqual(
        status.isOpen,
        v.expectedOpen,
        `Expected isOpen to be ${v.expectedOpen} for ${v.utcIso} (${v.description}) but got ${status.isOpen}`
      );

      if (v.expectedBadge) {
        assert.strictEqual(
          status.badgeColor,
          v.expectedBadge,
          `Expected badgeColor to be ${v.expectedBadge} for ${v.utcIso} but got ${status.badgeColor}`
        );
      }

      if (v.expectedStatusIncludes) {
        assert.match(
          status.statusText.toLowerCase(),
          new RegExp(v.expectedStatusIncludes.toLowerCase()),
          `Expected statusText to include '${v.expectedStatusIncludes}' but got '${status.statusText}'`
        );
      }

      if (v.expectedNextOpenIncludes) {
        assert.match(
          status.nextOpenText.toLowerCase(),
          new RegExp(v.expectedNextOpenIncludes.toLowerCase()),
          `Expected nextOpenText to include '${v.expectedNextOpenIncludes}' but got '${status.nextOpenText}'`
        );
      }
    });
  }
});
