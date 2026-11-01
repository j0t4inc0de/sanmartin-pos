import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { loadSourceModule } from './helpers/loader.mjs';

describe('Tier 1: CLP Currency Formatting (formatPriceCLP)', async () => {
  const businessModule = await loadSourceModule('./src/utils/businessHours.ts');
  const { formatPriceCLP } = businessModule;

  it('Contract: formatPriceCLP is exported as a function', () => {
    assert.strictEqual(typeof formatPriceCLP, 'function', 'formatPriceCLP should be exported as a function');
  });

  it('Formats standard menu price ($6.500)', () => {
    const formatted = formatPriceCLP(6500);
    // Remove narrow no-break space or non-breaking spaces for uniform check
    const normalized = formatted.replace(/\u00A0|\u202F/g, ' ');
    assert.ok(normalized.includes('$'), `Expected currency symbol $ in '${formatted}'`);
    assert.ok(normalized.includes('6.500') || normalized.includes('6 500'), `Expected thousands separated '6.500' in '${formatted}'`);
    assert.ok(!normalized.includes(',00') && !normalized.includes('.00'), `CLP must not have cents/decimals in '${formatted}'`);
  });

  it('Formats combo price ($16.900)', () => {
    const formatted = formatPriceCLP(16900);
    const normalized = formatted.replace(/\u00A0|\u202F/g, ' ');
    assert.ok(normalized.includes('$'), `Expected currency symbol $ in '${formatted}'`);
    assert.ok(normalized.includes('16.900') || normalized.includes('16 900'), `Expected thousands separated '16.900' in '${formatted}'`);
  });

  it('Formats zero ($0)', () => {
    const formatted = formatPriceCLP(0);
    const normalized = formatted.replace(/\u00A0|\u202F/g, ' ');
    assert.ok(normalized.includes('$'), `Expected currency symbol $ in '${formatted}'`);
    assert.ok(normalized.includes('0'), `Expected 0 in '${formatted}'`);
  });

  it('Formats small single item price ($1.500)', () => {
    const formatted = formatPriceCLP(1500);
    const normalized = formatted.replace(/\u00A0|\u202F/g, ' ');
    assert.ok(normalized.includes('1.500') || normalized.includes('1 500'));
  });

  it('Formats large family combo / party price ($150.000)', () => {
    const formatted = formatPriceCLP(150000);
    const normalized = formatted.replace(/\u00A0|\u202F/g, ' ');
    assert.ok(normalized.includes('150.000') || normalized.includes('150 000'));
  });
});
