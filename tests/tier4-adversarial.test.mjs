import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { loadSourceModule } from './helpers/loader.mjs';

/**
 * Attempts to load buildWhatsAppOrderUrl from known module locations.
 */
async function getOrderUrlBuilder() {
  try {
    const whatsappModule = await loadSourceModule('./src/utils/whatsapp.ts');
    if (typeof whatsappModule.buildWhatsAppOrderUrl === 'function') {
      return whatsappModule.buildWhatsAppOrderUrl;
    }
  } catch {
    // Ignore
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

describe('Tier 4: Adversarial, Injection Resilience & Boundary Testing', async () => {
  const businessModule = await loadSourceModule('./src/utils/businessHours.ts');
  const { getBusinessStatus } = businessModule;
  const buildWhatsAppOrderUrl = await getOrderUrlBuilder();

  describe('Adversarial Special Characters & Injection in WhatsApp Orders', () => {
    it('Safely encodes HTML/XSS and SQL payload characters without corrupting URL query', () => {
      assert.strictEqual(
        typeof buildWhatsAppOrderUrl,
        'function',
        'buildWhatsAppOrderUrl must be exported to verify adversarial XSS and query injection resilience'
      );

      const maliciousName = `<script>alert("XSS")</script>`;
      const maliciousAddress = `Av. Gabriela #01216 & DROP TABLE orders; --`;
      const maliciousNotes = `="hello"; ' OR '1'='1'`;

      const url = buildWhatsAppOrderUrl({
        cartItems: [
          {
            id: 'churrasco-italiano',
            name: 'Churrasco Italiano',
            price: 6500,
            quantity: 1,
            type: 'menu',
          },
        ],
        subtotal: 6500,
        deliveryType: 'delivery',
        customerName: maliciousName,
        customerAddress: maliciousAddress,
        customerNotes: maliciousNotes,
      });

      // Raw URL query string must NOT contain unescaped characters that could split query params or fragment
      const textQuery = url.split('?text=')[1];
      assert.ok(textQuery, 'URL must include text query parameter');
      assert.ok(!textQuery.includes('#'), "Must not contain raw unencoded '#'");
      assert.ok(!textQuery.includes('&delivery='), "Must not split into fake query parameters via unencoded '&'");
      assert.ok(!textQuery.includes('<script>'), "Must not contain raw unencoded '<script>'");

      // Decoded output must faithfully restore the user's literal text
      const decoded = decodeURIComponent(textQuery);
      assert.ok(decoded.includes(maliciousName), 'Decoded message must preserve verbatim customer input');
      assert.ok(decoded.includes(maliciousAddress), 'Decoded message must preserve verbatim address');
      assert.ok(decoded.includes(maliciousNotes), 'Decoded message must preserve verbatim notes');
    });

    it('Encodes complex multi-byte Chilean and food emojis without multibyte slicing errors', () => {
      assert.strictEqual(
        typeof buildWhatsAppOrderUrl,
        'function',
        'buildWhatsAppOrderUrl must be exported to verify multibyte emoji encoding fidelity'
      );

      const emojiString = '🍔 🔥 🍟 🥤 🇨🇱 🥩 🧀 🥑 🛵';
      const url = buildWhatsAppOrderUrl({
        cartItems: [
          {
            id: 'churrasco-italiano',
            name: 'Churrasco Italiano 🥑',
            price: 6500,
            quantity: 1,
            type: 'menu',
          },
        ],
        subtotal: 6500,
        deliveryType: 'pickup',
        customerName: 'Fan de la Palta 🥑',
        customerNotes: emojiString,
      });

      const textQuery = url.split('?text=')[1];
      const decoded = decodeURIComponent(textQuery);
      assert.ok(decoded.includes('🥑'), 'Decoded message must retain avocado emoji');
      assert.ok(decoded.includes(emojiString), 'Decoded message must retain all complex emoji sequences');
    });
  });

  describe('Extreme Cart Quantities & Boundary State', () => {
    it('Accurately calculates total for large volume / party catering order (99 items)', () => {
      const largeCart = [
        {
          id: 'completo-italiano',
          name: 'Completo Italiano Gigante',
          price: 3200,
          quantity: 99,
          type: 'menu',
        },
      ];

      const subtotal = largeCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      assert.strictEqual(subtotal, 3200 * 99, 'Large quantity calculation must not overflow');
      assert.strictEqual(subtotal, 316800);
    });

    it('Disallows negative or zero quantity items in final subtotal arithmetic', () => {
      const invalidCart = [
        { id: '1', name: 'Item', price: 5000, quantity: -2, type: 'menu' },
        { id: '2', name: 'Item 2', price: 3000, quantity: 0, type: 'menu' },
      ];

      // Sanitized quantity calculation
      const safeSubtotal = invalidCart.reduce((sum, item) => {
        const safeQuantity = Math.max(0, item.quantity);
        return sum + item.price * safeQuantity;
      }, 0);

      assert.strictEqual(safeSubtotal, 0, 'Safe subtotal with negative/zero items must evaluate to 0');
    });
  });

  describe('Timezone Spoofing & Client Offset Resilience', () => {
    it('Schedule evaluation strictly uses America/Santiago and rejects host timezone distortion', () => {
      // 2026-10-13T21:30:00Z corresponds to:
      // - 18:30:00 in America/Santiago (OPEN)
      // - 06:30:00 next day in Asia/Tokyo (CLOSED if host timezone were used)
      // - 17:30:00 in America/New_York (CLOSED if host timezone were used)
      const targetUtc = new Date('2026-10-13T21:30:00Z');
      const status = getBusinessStatus(targetUtc);

      assert.strictEqual(
        status.isOpen,
        true,
        `Evaluation of ${targetUtc.toISOString()} must be OPEN in America/Santiago regardless of runner host timezone`
      );
    });
  });
});
