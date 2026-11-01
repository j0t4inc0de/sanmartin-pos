-- ==============================================================================
-- DDL POSTGRESQL 16: FOOD TRUCK SANGUCHERIA SAN MARTIN
-- Base de Datos: sanmartin_db
-- Motor: PostgreSQL 16 (Docker en jota-server)
-- Arquitectura: Cero Sobreingeniería + Soporte Offline-First para el POS All-in-One
-- ==============================================================================

-- Habilitar extensión para generación de UUID v4 nativo
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLA: users (Compatible con Django auth / AbstractUser)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Usuarios de acceso al sistema POS de mesón';

-- ------------------------------------------------------------------------------
-- 2. TABLA: categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categories IS 'Categorías de la carta: churrascos, mechadas, lomitos, etc.';

-- ------------------------------------------------------------------------------
-- 3. TABLA: products
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    price INTEGER NOT NULL CHECK (price >= 0),
    original_price INTEGER NULL CHECK (original_price IS NULL OR original_price >= 0),
    image_url VARCHAR(500) NULL,
    badge VARCHAR(50) NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active_available ON products(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

COMMENT ON TABLE products IS 'Catálogo maestro de sándwiches, completos y bebidas';
COMMENT ON COLUMN products.is_available IS 'Switch diario: si se apaga en mesón, se oculta en carta QR';
COMMENT ON COLUMN products.is_active IS 'Soft delete: descontinúa el ítem sin romper ventas históricas';
COMMENT ON COLUMN products.updated_at IS 'Permite al POS descargar solo productos modificados tras un corte de internet';

-- ------------------------------------------------------------------------------
-- 4. TABLA: modifiers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modifiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
    modifier_type VARCHAR(20) NOT NULL DEFAULT 'EXTRA_PAGO' CHECK (modifier_type IN ('EXTRA_PAGO', 'EXCLUSION_COCINA')),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modifiers_active_available ON modifiers(is_active, is_available);

COMMENT ON TABLE modifiers IS 'Extras con costo (queso, palta) y exclusiones de cocina (sin mayo)';

-- ------------------------------------------------------------------------------
-- 5. TABLA: cash_shifts (Offline-First)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_shifts (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ NULL,
    initial_cash INTEGER NOT NULL DEFAULT 0 CHECK (initial_cash >= 0),
    notes TEXT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cash_shifts_user ON cash_shifts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_cash_shifts_single_open ON cash_shifts(user_id) WHERE closed_at IS NULL;

COMMENT ON TABLE cash_shifts IS 'Turnos y arqueos de caja del mesón';
COMMENT ON COLUMN cash_shifts.uuid IS 'Identificador universal generado por el POS (permite operar offline)';

-- ------------------------------------------------------------------------------
-- 6. TABLA: orders (Offline-First con Idempotency Key)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    cash_shift_id INTEGER NOT NULL REFERENCES cash_shifts(id) ON DELETE RESTRICT,
    daily_order_number INTEGER NOT NULL CHECK (daily_order_number >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consumption_type VARCHAR(30) NOT NULL DEFAULT 'PARA_LLEVAR' 
        CHECK (consumption_type IN ('PARA_SERVIR', 'PARA_LLEVAR', 'CONSUMO_PROPIO', 'DELIVERY', 'RETIRO')),
    payment_method VARCHAR(30) NOT NULL 
        CHECK (payment_method IN ('EFECTIVO', 'DEBITO_TRANSBANK', 'TRANSFERENCIA', 'SIN_COSTO_CONSUMO_PROPIO')),
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    amount_paid INTEGER NULL CHECK (amount_paid IS NULL OR amount_paid >= 0),
    change_given INTEGER NULL CHECK (change_given IS NULL OR change_given >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA' 
        CHECK (status IN ('COMPLETADA', 'ANULADA')),
    cancelled_at TIMESTAMPTZ NULL,
    cancellation_reason VARCHAR(255) NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_orders_shift_daily_number ON orders(cash_shift_id, daily_order_number);
CREATE INDEX IF NOT EXISTS idx_orders_shift_status_aggregation ON orders(cash_shift_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_status_rush_hours ON orders(created_at, status);

COMMENT ON TABLE orders IS 'Ventas cobradas y comandas de cocina emitidas';
COMMENT ON COLUMN orders.uuid IS 'Clave idempotente generada por el POS: evita duplicar ventas si reintenta enviar';
COMMENT ON COLUMN orders.created_at IS 'Fecha real del cobro en POS (preserva Horas Punta tras reconectar)';

-- ------------------------------------------------------------------------------
-- 7. TABLA: order_items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    notes VARCHAR(150) NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

COMMENT ON TABLE order_items IS 'Líneas de producto por comanda con nombre y precio congelados';

-- ------------------------------------------------------------------------------
-- 8. TABLA: order_item_modifiers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_item_modifiers (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_id INTEGER NOT NULL REFERENCES modifiers(id) ON DELETE RESTRICT,
    modifier_name VARCHAR(50) NOT NULL,
    price_at_sale INTEGER NOT NULL DEFAULT 0 CHECK (price_at_sale >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_item_id ON order_item_modifiers(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_modifier_id ON order_item_modifiers(modifier_id);

COMMENT ON TABLE order_item_modifiers IS 'Modificadores asignados a un sándwich específico en ticket';

-- ==============================================================================
-- SEED DATA DE ARRANQUE
-- ==============================================================================
INSERT INTO users (id, username, password_hash, is_active)
VALUES (1, 'admin', 'pbkdf2_sha256$sanmartin_secret_hash', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, slug, sort_order, is_active) VALUES
(1, 'Churrascos', 'churrascos', 1, TRUE),
(2, 'Mechadas', 'mechadas', 2, TRUE),
(3, 'Lomitos', 'lomitos', 3, TRUE),
(4, 'Completos & Ases', 'completos', 4, TRUE),
(5, 'Papas Fritas', 'papas', 5, TRUE),
(6, 'Bebidas', 'bebidas', 6, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, category_id, name, ingredients, price, original_price, badge, is_available, is_active) VALUES
(1, 1, 'Churrasco Italiano Gigante', '["Carne vacuno laminada", "Palta hass fresca", "Tomate fresco", "Mayonesa casera", "Pan frica artesanal"]'::jsonb, 6500, NULL, 'Más Vendido ⭐', TRUE, TRUE),
(2, 1, 'Churrasco Barros Luco', '["Carne vacuno laminada", "Doble queso fundido", "Pan frica artesanal"]'::jsonb, 6200, NULL, 'Favorito 🔥', TRUE, TRUE),
(3, 2, 'Mechada Italiana Campestre', '["Carne mechada de larga cocción", "Palta fresca", "Tomate", "Mayonesa", "Pan frica artesanal"]'::jsonb, 6800, NULL, 'Recomendado ⭐', TRUE, TRUE),
(4, 4, 'Completo Italiano Gigante', '["Vienesa tradicional", "Palta", "Tomate", "Mayonesa casera"]'::jsonb, 3200, NULL, NULL, TRUE, TRUE),
(5, 5, 'Papas Fritas Grandes', '["Papas fritas corte bastón crujientes"]'::jsonb, 3500, NULL, NULL, TRUE, TRUE),
(6, 6, 'Coca Cola Original 350ml', '["Bebida gaseosa lata 350ml"]'::jsonb, 1500, NULL, NULL, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO modifiers (id, name, price, modifier_type, is_available, is_active) VALUES
(1, 'Queso Mantecoso Extra', 900, 'EXTRA_PAGO', TRUE, TRUE),
(2, 'Palta Hass Extra', 1000, 'EXTRA_PAGO', TRUE, TRUE),
(3, 'Tocino Crocante', 900, 'EXTRA_PAGO', TRUE, TRUE),
(4, 'Doble Carne Vacuno', 1800, 'EXTRA_PAGO', TRUE, TRUE),
(5, 'Sin Mayo', 0, 'EXCLUSION_COCINA', TRUE, TRUE),
(6, 'Sin Ají Verde', 0, 'EXCLUSION_COCINA', TRUE, TRUE),
(7, 'Sin Tomate', 0, 'EXCLUSION_COCINA', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Sincronizar secuencias
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('modifiers_id_seq', (SELECT MAX(id) FROM modifiers));
