import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { loadSourceModule } from './helpers/loader.mjs';

/**
 * Attempts to load buildWhatsAppOrderUrl from known module locations.
 * If not exported yet (pre-M3 implementation), returns null.
 */
async function getOrderUrlBuilder() {
  try {
    const whatsappModule = await loadSourceModule('./src/utils/whatsapp.ts');
    if (typeof whatsappModule.buildWhatsAppOrderUrl === 'function') {
      return whatsappModule.buildWhatsAppOrderUrl;
    }
  } catch {
    // Module may not exist yet
  }

  try {
    const businessModule = await loadSourceModule('./src/utils/businessHours.ts');
    if (typeof businessModule.buildWhatsAppOrderUrl === 'function') {
      return businessModule.buildWhatsAppOrderUrl;
    }
  } catch {
    // Ignore
  }

  return null;
}

describe('Tier 1: WhatsApp Order Builder & URL Percent-Encoding', async () => {
  const businessModule = await loadSourceModule('./src/utils/businessHours.ts');
  const { RESTAURANT_INFO } = businessModule;
  const buildWhatsAppOrderUrl = await getOrderUrlBuilder();

  it('Restaurant metadata: Official WhatsApp phone is 56983294514', () => {
    assert.strictEqual(
      RESTAURANT_INFO.whatsappNumber,
      '56983294514',
      'RESTAURANT_INFO.whatsappNumber must match official Chilean mobile number 56983294514'
    );
  });

  it('Contract: buildWhatsAppOrderUrl function is exported', () => {
    assert.ok(
      typeof buildWhatsAppOrderUrl === 'function',
      'Contract missing: buildWhatsAppOrderUrl must be exported from src/utils/whatsapp.ts or src/utils/businessHours.ts (see PROJECT.md §Interface Contract 3)'
    );
  });

  it('Generates valid WhatsApp URL starting with official endpoint', () => {
    assert.strictEqual(
      typeof buildWhatsAppOrderUrl,
      'function',
      'Contract missing: buildWhatsAppOrderUrl must be exported (see PROJECT.md §Interface Contract 3)'
    );

    const url = buildWhatsAppOrderUrl({
      cartItems: [
        {
          id: 'churrasco-italiano',
          name: 'Churrasco Italiano Gigante',
          price: 6500,
          quantity: 2,
          type: 'menu',
        },
      ],
      subtotal: 13000,
      deliveryType: 'pickup',
      customerName: 'Juan Pérez',
    });

    assert.ok(
      url.startsWith('https://wa.me/56983294514?text='),
      `URL must begin with 'https://wa.me/56983294514?text=', got '${url.slice(0, 45)}...'`
    );
  });

  it('Encodes linebreaks, Chilean pesos, and emojis without unescaped fragment meta-characters', () => {
    assert.strictEqual(
      typeof buildWhatsAppOrderUrl,
      'function',
      'Contract missing: buildWhatsAppOrderUrl must be exported (see PROJECT.md §Interface Contract 3)'
    );

    const url = buildWhatsAppOrderUrl({
      cartItems: [
        {
          id: 'churrasco-luco',
          name: 'Churrasco Barros Luco',
          price: 6200,
          quantity: 1,
          type: 'menu',
          notes: 'Extra fundido #01216 & sin sal',
        },
      ],
      subtotal: 6200,
      deliveryType: 'delivery',
      customerName: 'María & Amigos',
      customerAddress: 'Av. Gabriela Oriente #01216, Puente Alto',
      customerNotes: 'Timbre malo, llamar al llegar',
    });

    // Assert raw URL does NOT contain unencoded '#' (which breaks into URL fragment)
    const queryParam = url.split('?text=')[1];
    assert.ok(queryParam, 'URL must have ?text= parameter');
    assert.ok(!queryParam.includes('#'), "Raw '#' must be percent-encoded as '%23' to avoid URL fragment truncation");
    assert.ok(!queryParam.includes(' '), "Spaces must be percent-encoded as '%20' or '+'");

    // Decode and verify contents
    const decoded = decodeURIComponent(queryParam);
    assert.match(decoded, /Food Truck San Martín/i, 'Decoded message must greet food truck');
    assert.match(decoded, /Churrasco Barros Luco/, 'Decoded message must contain item name');
    assert.match(decoded, /María & Amigos/, 'Decoded message must contain customer name');
    assert.match(decoded, /Av\. Gabriela Oriente #01216/, 'Decoded message must contain address');
    assert.match(decoded, /Delivery a Domicilio/, 'Decoded message must specify Delivery modality');
    assert.match(decoded, /Timbre malo/, 'Decoded message must include notes');
  });

  it('Includes extras / agregados breakdown in WhatsApp message', () => {
    assert.strictEqual(
      typeof buildWhatsAppOrderUrl,
      'function',
      'Contract missing: buildWhatsAppOrderUrl must be exported (see PROJECT.md §Interface Contract 3)'
    );

    const url = buildWhatsAppOrderUrl({
      cartItems: [
        {
          id: 'mechada-italiana',
          name: 'Mechada Italiana de Vacuno',
          price: 6900,
          quantity: 1,
          type: 'menu',
          selectedExtras: [
            { id: 'extra-palta', name: 'Palta Hass Extra', price: 1000 },
            { id: 'extra-queso', name: 'Queso Mantecoso Extra', price: 900 },
          ],
        },
      ],
      subtotal: 8800,
      deliveryType: 'pickup',
      customerName: 'Carlos',
    });

    const decoded = decodeURIComponent(url.split('?text=')[1]);
    assert.match(decoded, /Palta Hass Extra/, 'Message must include customized extras');
    assert.match(decoded, /Queso Mantecoso Extra/, 'Message must include customized extras');
  });

  it('Differentiates pickup modality with food truck address', () => {
    assert.strictEqual(
      typeof buildWhatsAppOrderUrl,
      'function',
      'Contract missing: buildWhatsAppOrderUrl must be exported (see PROJECT.md §Interface Contract 3)'
    );

    const url = buildWhatsAppOrderUrl({
      cartItems: [
        {
          id: 'completo-italiano-gigante',
          name: 'Completo Italiano Gigante',
          price: 3200,
          quantity: 1,
          type: 'menu',
        },
      ],
      subtotal: 3200,
      deliveryType: 'pickup',
      customerName: 'Pedro',
    });

    const decoded = decodeURIComponent(url.split('?text=')[1]);
    assert.match(decoded, /Retiro en Food Truck/, 'Must state Retiro en Food Truck');
    assert.match(decoded, /Gabriela Oriente #01216/, 'Must state pickup location address');
  });
});
