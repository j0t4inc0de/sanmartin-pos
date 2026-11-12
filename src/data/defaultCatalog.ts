import type { PosCatalog } from '../services/posLocalStore';

export const BASE_POS_CATALOG: PosCatalog = {
  "generated_at": "2026-01-01T00:00:00.000Z",
  "categories": [
    {
      "id": 1,
      "slug": "sandwiches",
      "name": "Sándwiches",
      "sort_order": 1,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "slug": "vianesas",
      "name": "Vianesas",
      "sort_order": 2,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "slug": "ases",
      "name": "Ases",
      "sort_order": 3,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 4,
      "slug": "chorrillanas",
      "name": "Chorrillanas",
      "sort_order": 4,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 5,
      "slug": "acompanamientos",
      "name": "Acompañamientos",
      "sort_order": 5,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 6,
      "slug": "salsas",
      "name": "Salsas",
      "sort_order": 6,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 7,
      "slug": "bebestibles",
      "name": "Bebestibles",
      "sort_order": 7,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 8,
      "slug": "agregados",
      "name": "Agregados",
      "sort_order": 8,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "products": [
    {
      "id": 1,
      "slug": "sandwich-italiano",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich Italiano",
      "description": "Proteína a elección, tomate, palta, mayo.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Palta",
        "Mayo"
      ],
      "price": 5200,
      "original_price": null,
      "image_url": "/productos/sandwich-italiano.jpg",
      "badge": "Más Vendido ⭐",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "slug": "sandwich-dinamico",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich Dinámico",
      "description": "Proteína a elección, tomate, americana, chucrut, palta, mayo.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Americana",
        "Chucrut",
        "Palta",
        "Mayo"
      ],
      "price": 5900,
      "original_price": null,
      "image_url": "/productos/sandwich-dinamico.jpg",
      "badge": "Contundente 🔥",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "slug": "sandwich-chacarero",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich Chacarero",
      "description": "Proteína a elección, tomate, poroto verde, ají verde, mayo.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Poroto verde",
        "Ají verde",
        "Mayo"
      ],
      "price": 5700,
      "original_price": null,
      "image_url": "/productos/sandwich-chacarero.jpg",
      "badge": "Tradicional 🇨🇱",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 4,
      "slug": "sandwich-completo",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich Completo",
      "description": "Proteína a elección, tomate, americana, chucrut, mayo.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Americana",
        "Chucrut",
        "Mayo"
      ],
      "price": 5200,
      "original_price": null,
      "image_url": "/productos/sandwich-completo.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 5,
      "slug": "sandwich-napolitano",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich Napolitano",
      "description": "Proteína a elección, tomate, queso mantecoso, orégano.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Queso mantecoso",
        "Orégano"
      ],
      "price": 5500,
      "original_price": null,
      "image_url": "/productos/sandwich-napolitano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 6,
      "slug": "sandwich-a-lo-pobre",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich A lo Pobre",
      "description": "Proteína a elección, cebolla caramelizada, papas hilo, huevo frito.",
      "ingredients": [
        "Proteína a elección",
        "Cebolla caramelizada",
        "Papas hilo",
        "Huevo frito"
      ],
      "price": 5900,
      "original_price": null,
      "image_url": "/productos/sandwich-alopobre.jpg",
      "badge": "Clásico Chileno 🍳",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 7,
      "slug": "sandwich-luco",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich Luco",
      "description": "Proteína a elección, queso mantecoso.",
      "ingredients": [
        "Proteína a elección",
        "Queso mantecoso"
      ],
      "price": 5300,
      "original_price": null,
      "image_url": "/productos/sandwich-luco.jpg",
      "badge": "Favorito 🧀",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 8,
      "slug": "sandwich-vegetariano",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich Vegetariano",
      "description": "Champiñón, tomate, poroto verde, lechuga, palta.",
      "ingredients": [
        "Champiñón",
        "Tomate",
        "Poroto verde",
        "Lechuga",
        "Palta"
      ],
      "price": 5000,
      "original_price": null,
      "image_url": "/productos/sandwich-vegetariano.jpg",
      "badge": "Veggie 🥑",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 9,
      "slug": "sandwich-de-la-casa",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich De la Casa",
      "description": "Proteína a elección, champiñón, queso mantecoso, bbq, mayo.",
      "ingredients": [
        "Proteína a elección",
        "Champiñón",
        "Queso mantecoso",
        "BBQ",
        "Mayo"
      ],
      "price": 6600,
      "original_price": null,
      "image_url": "/productos/sandwich-delacasa.jpg",
      "badge": "Especialidad 👑",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 10,
      "slug": "sandwich-campesino",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich Campesino",
      "description": "Proteína a elección, cebolla caramelizada, champiñón, tomate, lechuga, pepinillo.",
      "ingredients": [
        "Proteína a elección",
        "Cebolla caramelizada",
        "Champiñón",
        "Tomate",
        "Lechuga",
        "Pepinillo"
      ],
      "price": 6900,
      "original_price": null,
      "image_url": "/productos/sandwich-campesino.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 11,
      "slug": "sandwich-granjero",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich Granjero",
      "description": "Proteína a elección, cebolla caramelizada, champiñón, cheddar, lechuga.",
      "ingredients": [
        "Proteína a elección",
        "Cebolla caramelizada",
        "Champiñón",
        "Queso cheddar",
        "Lechuga"
      ],
      "price": 6900,
      "original_price": null,
      "image_url": "/productos/sandwich-granjero.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 12,
      "slug": "sandwich-york",
      "category_id": 1,
      "category_name": "Sándwiches",
      "name": "Sándwich York",
      "description": "Proteína a elección, cebolla caramelizada, queso mozzarella, queso cheddar, tomate, lechuga, tocino.",
      "ingredients": [
        "Proteína a elección",
        "Cebolla caramelizada",
        "Queso mozzarella",
        "Queso cheddar",
        "Tomate",
        "Lechuga",
        "Tocino"
      ],
      "price": 7500,
      "original_price": null,
      "image_url": "/productos/sandwich-york.jpg",
      "badge": "Full Cargado 🥓",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 13,
      "slug": "vianesa-sola",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Sola",
      "description": "Vianesa, pan.",
      "ingredients": [
        "Vianesa",
        "Pan"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/vianesa-italiano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 14,
      "slug": "vianesa-mayo-casera",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Mayo Casera",
      "description": "Vianesa, mayo casera.",
      "ingredients": [
        "Vianesa",
        "Mayo casera"
      ],
      "price": 1300,
      "original_price": null,
      "image_url": "/productos/vianesa-italiano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 15,
      "slug": "vianesa-tomate-mayo",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Tomate Mayo",
      "description": "Vianesa, tomate, mayo casera.",
      "ingredients": [
        "Vianesa",
        "Tomate",
        "Mayo casera"
      ],
      "price": 1500,
      "original_price": null,
      "image_url": "/productos/vianesa-italiano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 16,
      "slug": "vianesa-palta-mayo",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Palta Mayo",
      "description": "Vianesa, palta, mayo casera.",
      "ingredients": [
        "Vianesa",
        "Palta",
        "Mayo casera"
      ],
      "price": 1800,
      "original_price": null,
      "image_url": "/productos/vianesa-italiano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 17,
      "slug": "vianesa-italiano",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Italiano",
      "description": "Vianesa, palta, tomate, mayo casera.",
      "ingredients": [
        "Vianesa",
        "Palta",
        "Tomate",
        "Mayo casera"
      ],
      "price": 2000,
      "original_price": null,
      "image_url": "/productos/vianesa-italiano.jpg",
      "badge": "Clásico 🌭",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 18,
      "slug": "vianesa-chacarero",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Chacarero",
      "description": "Vianesa, tomate, poroto verde, mayo casera, ají verde.",
      "ingredients": [
        "Vianesa",
        "Tomate",
        "Poroto verde",
        "Mayo casera",
        "Ají verde"
      ],
      "price": 2200,
      "original_price": null,
      "image_url": "/productos/vianesa-dinamico.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 19,
      "slug": "vianesa-completo",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Completo",
      "description": "Vianesa, tomate, americana, chucrut, mayo casera.",
      "ingredients": [
        "Vianesa",
        "Tomate",
        "Americana",
        "Chucrut",
        "Mayo casera"
      ],
      "price": 1800,
      "original_price": null,
      "image_url": "/productos/vianesa-dinamico.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 20,
      "slug": "vianesa-napolitano",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Napolitano",
      "description": "Vianesa, queso mantecoso, tomate, orégano.",
      "ingredients": [
        "Vianesa",
        "Queso mantecoso",
        "Tomate",
        "Orégano"
      ],
      "price": 2200,
      "original_price": null,
      "image_url": "/productos/vianesa-italiano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 21,
      "slug": "vianesa-a-lo-pobre",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa A lo Pobre",
      "description": "Vianesa, cebolla caramelizada, papas hilo, huevo frito.",
      "ingredients": [
        "Vianesa",
        "Cebolla caramelizada",
        "Papas hilo",
        "Huevo frito"
      ],
      "price": 2500,
      "original_price": null,
      "image_url": "/productos/vianesa-dinamico.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 22,
      "slug": "vianesa-luco",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Luco",
      "description": "Vianesa, queso mantecoso.",
      "ingredients": [
        "Vianesa",
        "Queso mantecoso"
      ],
      "price": 2000,
      "original_price": null,
      "image_url": "/productos/vianesa-italiano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 23,
      "slug": "vianesa-dinamico",
      "category_id": 2,
      "category_name": "Vianesas",
      "name": "Vianesa Dinámico",
      "description": "Vianesa, palta, tomate, americana, chucrut, mayo casera.",
      "ingredients": [
        "Vianesa",
        "Palta",
        "Tomate",
        "Americana",
        "Chucrut",
        "Mayo casera"
      ],
      "price": 2200,
      "original_price": null,
      "image_url": "/productos/vianesa-dinamico.jpg",
      "badge": "Imperdible ⚡",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 24,
      "slug": "as-italiano",
      "category_id": 3,
      "category_name": "Ases",
      "name": "As Italiano",
      "description": "Proteína a elección, tomate, palta, mayo.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Palta",
        "Mayo"
      ],
      "price": 3500,
      "original_price": null,
      "image_url": "/productos/as-italiano.jpg",
      "badge": "Favorito 🥖",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 25,
      "slug": "as-chacarero",
      "category_id": 3,
      "category_name": "Ases",
      "name": "As Chacarero",
      "description": "Proteína a elección, tomate, poroto verde, ají verde, mayo.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Poroto verde",
        "Ají verde",
        "Mayo"
      ],
      "price": 3600,
      "original_price": null,
      "image_url": "/productos/as-italiano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 26,
      "slug": "as-completo",
      "category_id": 3,
      "category_name": "Ases",
      "name": "As Completo",
      "description": "Proteína a elección, tomate, americana, chucrut, mayo.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Americana",
        "Chucrut",
        "Mayo"
      ],
      "price": 3200,
      "original_price": null,
      "image_url": "/productos/as-italiano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 27,
      "slug": "as-napolitano",
      "category_id": 3,
      "category_name": "Ases",
      "name": "As Napolitano",
      "description": "Proteína a elección, tomate, queso mantecoso, orégano.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Queso mantecoso",
        "Orégano"
      ],
      "price": 3500,
      "original_price": null,
      "image_url": "/productos/as-luco.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 28,
      "slug": "as-a-lo-pobre",
      "category_id": 3,
      "category_name": "Ases",
      "name": "As A lo Pobre",
      "description": "Proteína a elección, cebolla caramelizada, papas hilo, huevo frito.",
      "ingredients": [
        "Proteína a elección",
        "Cebolla caramelizada",
        "Papas hilo",
        "Huevo frito"
      ],
      "price": 3900,
      "original_price": null,
      "image_url": "/productos/as-luco.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 29,
      "slug": "as-luco",
      "category_id": 3,
      "category_name": "Ases",
      "name": "As Luco",
      "description": "Proteína a elección, queso mantecoso.",
      "ingredients": [
        "Proteína a elección",
        "Queso mantecoso"
      ],
      "price": 3200,
      "original_price": null,
      "image_url": "/productos/as-luco.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 30,
      "slug": "as-dinamico",
      "category_id": 3,
      "category_name": "Ases",
      "name": "As Dinámico",
      "description": "Proteína a elección, tomate, americana, chucrut, palta, mayo.",
      "ingredients": [
        "Proteína a elección",
        "Tomate",
        "Americana",
        "Chucrut",
        "Palta",
        "Mayo"
      ],
      "price": 3700,
      "original_price": null,
      "image_url": "/productos/as-italiano.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 31,
      "slug": "chorrillana-chica",
      "category_id": 4,
      "category_name": "Chorrillanas",
      "name": "Chorrillana Chica",
      "description": "Papas fritas, 2 proteínas a elección, cebolla caramelizada, 2 huevos fritos, longaniza.",
      "ingredients": [
        "Papas fritas",
        "2 proteínas a elección",
        "Cebolla caramelizada",
        "2 huevos fritos",
        "Longaniza"
      ],
      "price": 12000,
      "original_price": null,
      "image_url": "/productos/chorrillana.jpg",
      "badge": "Para Compartir 🍟",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 32,
      "slug": "chorrillana-grande",
      "category_id": 4,
      "category_name": "Chorrillanas",
      "name": "Chorrillana Grande",
      "description": "Papas fritas, 2 proteínas a elección, cebolla caramelizada, 4 huevos fritos, longaniza.",
      "ingredients": [
        "Papas fritas",
        "2 proteínas a elección",
        "Cebolla caramelizada",
        "4 huevos fritos",
        "Longaniza"
      ],
      "price": 15000,
      "original_price": null,
      "image_url": "/productos/chorrillana.jpg",
      "badge": "Familiar XL 🔥",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 33,
      "slug": "papas-chicas",
      "category_id": 5,
      "category_name": "Acompañamientos",
      "name": "Papas Chicas",
      "description": "Porción chica de papas fritas crujientes recién hechas.",
      "ingredients": [
        "Papas fritas",
        "Toque de sal"
      ],
      "price": 2800,
      "original_price": null,
      "image_url": "/productos/papas-fritas.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 34,
      "slug": "papas-medianas",
      "category_id": 5,
      "category_name": "Acompañamientos",
      "name": "Papas Medianas",
      "description": "Porción mediana de papas fritas doradas y crujientes.",
      "ingredients": [
        "Papas fritas",
        "Toque de sal"
      ],
      "price": 3800,
      "original_price": null,
      "image_url": "/productos/papas-fritas.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 35,
      "slug": "papas-grandes",
      "category_id": 5,
      "category_name": "Acompañamientos",
      "name": "Papas Grandes",
      "description": "Porción grande de papas fritas crujientes ideal para compartir.",
      "ingredients": [
        "Papas fritas",
        "Toque de sal"
      ],
      "price": 4800,
      "original_price": null,
      "image_url": "/productos/papas-fritas.jpg",
      "badge": "Para Compartir 🍟",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 36,
      "slug": "nuggets",
      "category_id": 5,
      "category_name": "Acompañamientos",
      "name": "Nuggets (10 Unidades)",
      "description": "10 unidades + salsa a elección.",
      "ingredients": [
        "10 nuggets de pollo",
        "Salsa a elección"
      ],
      "price": 3500,
      "original_price": null,
      "image_url": "/productos/nuggets.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 37,
      "slug": "salsa-mayo",
      "category_id": 6,
      "category_name": "Salsas",
      "name": "Salsa Mayo Casera",
      "description": "Pote grande de mayo casera.",
      "ingredients": [
        "Mayo casera"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 38,
      "slug": "salsa-bbq",
      "category_id": 6,
      "category_name": "Salsas",
      "name": "Salsa BBQ",
      "description": "Pote grande de bbq.",
      "ingredients": [
        "Salsa BBQ"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 39,
      "slug": "salsa-queso",
      "category_id": 6,
      "category_name": "Salsas",
      "name": "Salsa de Queso",
      "description": "Pote grande de salsa de queso.",
      "ingredients": [
        "Salsa de queso"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 40,
      "slug": "salsa-rocoto",
      "category_id": 6,
      "category_name": "Salsas",
      "name": "Salsa Rocoto",
      "description": "Pote grande de rocoto.",
      "ingredients": [
        "Salsa de rocoto"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 41,
      "slug": "salsa-ajo-cilantro",
      "category_id": 6,
      "category_name": "Salsas",
      "name": "Salsa Ajo Cilantro",
      "description": "Pote grande de ajo cilantro.",
      "ingredients": [
        "Ajo",
        "Cilantro",
        "Base cremosa"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 42,
      "slug": "salsa-ciboulette",
      "category_id": 6,
      "category_name": "Salsas",
      "name": "Salsa Ciboulette",
      "description": "Pote grande de ciboulette.",
      "ingredients": [
        "Ciboulette",
        "Base cremosa"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 43,
      "slug": "salsa-cheddar",
      "category_id": 6,
      "category_name": "Salsas",
      "name": "Salsa Queso Cheddar",
      "description": "Pote grande de salsa de queso cheddar.",
      "ingredients": [
        "Queso cheddar fundido"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 44,
      "slug": "bebestible-lata",
      "category_id": 7,
      "category_name": "Bebestibles",
      "name": "Bebida en Lata 350ml",
      "description": "Lata 350ml a elección.",
      "ingredients": [
        "Lata 350ml helada"
      ],
      "price": 1300,
      "original_price": null,
      "image_url": "/productos/bebida-lata.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 45,
      "slug": "bebestible-agua",
      "category_id": 7,
      "category_name": "Bebestibles",
      "name": "Agua 600ml",
      "description": "Agua 600ml con o sin gas.",
      "ingredients": [
        "Agua mineral 600ml"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/jugo.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 46,
      "slug": "bebestible-redbull",
      "category_id": 7,
      "category_name": "Bebestibles",
      "name": "Red Bull 250ml",
      "description": "Red Bull 250ml.",
      "ingredients": [
        "Energética Red Bull 250ml"
      ],
      "price": 2000,
      "original_price": null,
      "image_url": "/productos/bebida-lata.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 47,
      "slug": "bebestible-monster",
      "category_id": 7,
      "category_name": "Bebestibles",
      "name": "Monster 473ml",
      "description": "Monster 473ml.",
      "ingredients": [
        "Energética Monster 473ml"
      ],
      "price": 2000,
      "original_price": null,
      "image_url": "/productos/bebida-lata.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 48,
      "slug": "bebestible-boca-ancha",
      "category_id": 7,
      "category_name": "Bebestibles",
      "name": "Boca Ancha 300ml",
      "description": "Boca ancha 300ml a elección.",
      "ingredients": [
        "Jugo / bebida boca ancha 300ml"
      ],
      "price": 1300,
      "original_price": null,
      "image_url": "/productos/jugo.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 49,
      "slug": "bebestible-bebida-15l",
      "category_id": 7,
      "category_name": "Bebestibles",
      "name": "Bebida 1.5L",
      "description": "Bebida 1.5L a elección.",
      "ingredients": [
        "Botella 1.5L helada"
      ],
      "price": 2500,
      "original_price": null,
      "image_url": "/productos/bebida-15l.jpg",
      "badge": "Familiar ❄️",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 50,
      "slug": "bebestible-jugo-15l",
      "category_id": 7,
      "category_name": "Bebestibles",
      "name": "Jugo 1.5L",
      "description": "Jugo 1.5L a elección.",
      "ingredients": [
        "Jugo 1.5L helado"
      ],
      "price": 2500,
      "original_price": null,
      "image_url": "/productos/jugo.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 51,
      "slug": "agregado-item-tomate",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Tomate",
      "description": "Porción extra de 3 rodajas de tomate fresco.",
      "ingredients": [
        "Tomate (3 rodajas)"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 52,
      "slug": "agregado-item-palta",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Palta",
      "description": "Porción extra de palta fresca molida.",
      "ingredients": [
        "Palta"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 53,
      "slug": "agregado-item-americana",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Americana",
      "description": "Porción extra de salsa americana.",
      "ingredients": [
        "Salsa americana"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 54,
      "slug": "agregado-item-chucrut",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Chucrut",
      "description": "Porción extra de chucrut.",
      "ingredients": [
        "Chucrut"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 55,
      "slug": "agregado-item-lechuga",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Lechuga",
      "description": "Porción extra de lechuga fresca.",
      "ingredients": [
        "Lechuga"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 56,
      "slug": "agregado-item-pepinillo",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Pepinillo",
      "description": "Porción extra de pepinillo en rodajas.",
      "ingredients": [
        "Pepinillo"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 57,
      "slug": "agregado-item-queso-mantecoso",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Queso Mantecoso",
      "description": "1.5 láminas de queso mantecoso fundido.",
      "ingredients": [
        "Queso mantecoso (1.5 láminas)"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 58,
      "slug": "agregado-item-queso-mozzarella",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Queso Mozzarella",
      "description": "3 láminas de queso mozzarella fundido.",
      "ingredients": [
        "Queso mozzarella (3 láminas)"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 59,
      "slug": "agregado-item-queso-cheddar",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Queso Cheddar",
      "description": "3 láminas de queso cheddar fundido.",
      "ingredients": [
        "Queso cheddar (3 láminas)"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 60,
      "slug": "agregado-item-cebolla-caramelizada",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Cebolla Caramelizada",
      "description": "Porción extra de cebolla caramelizada.",
      "ingredients": [
        "Cebolla caramelizada"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 61,
      "slug": "agregado-item-tocino",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Tocino",
      "description": "Porción extra de tocino crocante.",
      "ingredients": [
        "Tocino"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 62,
      "slug": "agregado-item-papa-hilo",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Papa Hilo",
      "description": "Porción extra de papas hilo crujientes.",
      "ingredients": [
        "Papa hilo"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 63,
      "slug": "agregado-item-poroto-verde",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Poroto Verde",
      "description": "Porción extra de poroto verde fresco.",
      "ingredients": [
        "Poroto verde"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 64,
      "slug": "agregado-item-aji-verde",
      "category_id": 8,
      "category_name": "Agregados",
      "name": "Agregado Ají Verde",
      "description": "Toque de ají verde chileno sin costo adicional.",
      "ingredients": [
        "Ají verde"
      ],
      "price": 0,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "modifiers": [
    {
      "id": 1,
      "name": "Tomate (3 rodajas)",
      "price": 500,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Palta",
      "price": 1000,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "name": "Americana",
      "price": 700,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 4,
      "name": "Chucrut",
      "price": 700,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 5,
      "name": "Lechuga",
      "price": 700,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 6,
      "name": "Pepinillo",
      "price": 700,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 7,
      "name": "Queso mantecoso (1.5 láminas)",
      "price": 1000,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 8,
      "name": "Queso mozzarella (3 láminas)",
      "price": 1000,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 9,
      "name": "Queso cheddar (3 láminas)",
      "price": 1000,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 10,
      "name": "Cebolla caramelizada",
      "price": 700,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 11,
      "name": "Tocino",
      "price": 1000,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 12,
      "name": "Papa hilo",
      "price": 700,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 13,
      "name": "Poroto verde",
      "price": 700,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 14,
      "name": "Ají verde",
      "price": 0,
      "modifier_type": "EXTRA_PAGO",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 15,
      "name": "Sin cebolla",
      "price": 0,
      "modifier_type": "EXCLUSION_COCINA",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 16,
      "name": "Sin mayo",
      "price": 0,
      "modifier_type": "EXCLUSION_COCINA",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 17,
      "name": "Sin tomate",
      "price": 0,
      "modifier_type": "EXCLUSION_COCINA",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 18,
      "name": "Sin chucrut",
      "price": 0,
      "modifier_type": "EXCLUSION_COCINA",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 19,
      "name": "Sin ají",
      "price": 0,
      "modifier_type": "EXCLUSION_COCINA",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 20,
      "name": "Sin mostaza",
      "price": 0,
      "modifier_type": "EXCLUSION_COCINA",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 21,
      "name": "Sin ketchup",
      "price": 0,
      "modifier_type": "EXCLUSION_COCINA",
      "is_available": true,
      "is_active": true,
      "updated_at": "2026-01-01T00:00:00.000Z"
    }
  ]
};
