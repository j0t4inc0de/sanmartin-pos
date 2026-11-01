import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { loadSourceModule } from './helpers/loader.mjs';

describe('Tier 2: Menu Categorization, Cart Calculations & Combos Savings', async () => {
  const menuModule = await loadSourceModule('./src/data/menuData.ts');
  const { MENU_CATEGORIES, MENU_ITEMS, COMBOS_DATA } = menuModule;

  describe('Menu Categories & Item Integrity', () => {
    it('Defines all required sandwich and side categories', () => {
      const categoryIds = MENU_CATEGORIES.map((c) => c.id);
      const expectedCategories = ['all', 'churrascos', 'mechadas', 'lomitos', 'completos', 'papas', 'bebidas'];
      for (const expected of expectedCategories) {
        assert.ok(categoryIds.includes(expected), `Missing required category '${expected}' in MENU_CATEGORIES`);
      }
    });

    it('All menu items belong to a valid category', () => {
      const validCategoryIds = MENU_CATEGORIES.map((c) => c.id).filter((id) => id !== 'all');
      for (const item of MENU_ITEMS) {
        assert.ok(
          validCategoryIds.includes(item.category),
          `Item '${item.name}' has invalid category '${item.category}'`
        );
      }
    });

    it('All menu items have positive CLP prices and required Chilean attributes', () => {
      assert.ok(MENU_ITEMS.length >= 15, `Expected at least 15 menu items, found ${MENU_ITEMS.length}`);

      for (const item of MENU_ITEMS) {
        assert.ok(item.id && typeof item.id === 'string', `Item must have an id`);
        assert.ok(item.name && typeof item.name === 'string', `Item ${item.id} must have a name`);
        assert.ok(typeof item.price === 'number' && item.price > 0, `Item ${item.id} must have a positive price`);
        assert.ok(Number.isInteger(item.price), `Item ${item.id} price must be an integer (CLP)`);
        assert.ok(Array.isArray(item.ingredients) && item.ingredients.length > 0, `Item ${item.id} must list ingredients`);
        assert.ok(item.image && item.image.startsWith('http'), `Item ${item.id} must have valid image URL`);
      }
    });

    it('Contains authentic Chilean sandwich items across all categories', () => {
      const itemNames = MENU_ITEMS.map((i) => i.name.toLowerCase());
      assert.ok(itemNames.some((n) => n.includes('churrasco') && n.includes('italiano')), 'Missing Churrasco Italiano');
      assert.ok(itemNames.some((n) => n.includes('barros luco')), 'Missing Barros Luco');
      assert.ok(itemNames.some((n) => n.includes('chacarero')), 'Missing Chacarero');
      assert.ok(itemNames.some((n) => n.includes('mechada')), 'Missing Mechada');
      assert.ok(itemNames.some((n) => n.includes('lomito')), 'Missing Lomito');
      assert.ok(itemNames.some((n) => n.includes('completo')), 'Missing Completo');
      assert.ok(itemNames.some((n) => n.includes('papas')), 'Missing Papas Fritas');
    });

    it('Filters menu items correctly by category', () => {
      const churrascos = MENU_ITEMS.filter((i) => i.category === 'churrascos');
      const mechadas = MENU_ITEMS.filter((i) => i.category === 'mechadas');
      const completos = MENU_ITEMS.filter((i) => i.category === 'completos');

      assert.ok(churrascos.length >= 3, `Expected at least 3 churrascos, got ${churrascos.length}`);
      assert.ok(mechadas.length >= 3, `Expected at least 3 mechadas, got ${mechadas.length}`);
      assert.ok(completos.length >= 3, `Expected at least 3 completos/ases, got ${completos.length}`);
    });
  });

  describe('Cart Subtotal Calculation with Quantities and Extras', () => {
    it('Calculates simple cart subtotal correctly', () => {
      const cartItems = [
        { id: '1', name: 'Churrasco Italiano', price: 6500, quantity: 2, type: 'menu' },
        { id: '2', name: 'Bebida 1.5L', price: 2500, quantity: 1, type: 'menu' },
      ];

      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      assert.strictEqual(subtotal, 15500, 'Subtotal should be (6500*2) + (2500*1) = 15500');
    });

    it('Calculates cart subtotal including item-level Chilean extras', () => {
      const cartItems = [
        {
          id: '1',
          name: 'Churrasco Italiano',
          price: 6500,
          quantity: 2,
          type: 'menu',
          selectedExtras: [
            { id: 'extra-palta', name: 'Palta Hass Extra', price: 1000 },
            { id: 'extra-mayo', name: 'Mayo Casera Extra', price: 500 },
          ],
        },
        {
          id: '2',
          name: 'Papas Rústicas',
          price: 3500,
          quantity: 1,
          type: 'menu',
          selectedExtras: [
            { id: 'extra-queso', name: 'Queso Fundido', price: 900 },
          ],
        },
      ];

      const calculateItemTotal = (item) => {
        const extrasTotal = (item.selectedExtras || []).reduce((acc, e) => acc + e.price, 0);
        return (item.price + extrasTotal) * item.quantity;
      };

      const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
      // Item 1: (6500 + 1000 + 500) * 2 = 16000
      // Item 2: (3500 + 900) * 1 = 4400
      // Total: 20400
      assert.strictEqual(subtotal, 20400, 'Expected subtotal with extras to be 20400');
    });

    it('Handles empty cart (subtotal 0)', () => {
      const cartItems = [];
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      assert.strictEqual(subtotal, 0);
    });
  });

  describe('Combos Promotions & Savings Verification', () => {
    it('Defines at least 4 family and group combos', () => {
      assert.ok(COMBOS_DATA.length >= 4, `Expected at least 4 combos, got ${COMBOS_DATA.length}`);
    });

    it('Every combo offers genuine mathematical savings compared to original price', () => {
      for (const combo of COMBOS_DATA) {
        assert.ok(combo.originalPrice > combo.price, `Combo '${combo.name}' must have originalPrice > price`);
        const savings = combo.originalPrice - combo.price;
        const discountPercent = (savings / combo.originalPrice) * 100;

        assert.ok(savings >= 1000, `Combo '${combo.name}' savings should be at least $1.000, got ${savings}`);
        assert.ok(discountPercent >= 10, `Combo '${combo.name}' discount should be at least 10%, got ${discountPercent.toFixed(1)}%`);
      }
    });

    it('Combo savings badge reflects actual price difference', () => {
      for (const combo of COMBOS_DATA) {
        if (combo.badge && combo.badge.includes('Ahorra')) {
          const savings = combo.originalPrice - combo.price;
          // Format savings to Chilean thousands e.g. 2600 -> "2.600"
          const savingsStr = savings.toLocaleString('es-CL');
          assert.ok(
            combo.badge.includes(savingsStr),
            `Combo '${combo.name}' badge '${combo.badge}' does not match calculated savings $${savingsStr}`
          );
        }
      }
    });

    it('Combos specify servings and included items list', () => {
      for (const combo of COMBOS_DATA) {
        assert.ok(combo.serves && typeof combo.serves === 'string', `Combo '${combo.name}' must specify serves info`);
        assert.ok(Array.isArray(combo.includes) && combo.includes.length >= 2, `Combo '${combo.name}' must list included items`);
      }
    });
  });
});
