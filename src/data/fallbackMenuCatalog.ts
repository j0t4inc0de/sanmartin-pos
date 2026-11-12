export interface CatalogResponse {
  generated_at?: string;
  categories: Array<{
    slug: string;
    name: string;
    sort_order?: number;
  }>;
  products: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    ingredients: string[];
    price: number;
    original_price: number | null;
    image_url: string;
    badge: string;
    is_available: boolean;
    updated_at?: string;
  }>;
}

export const FALLBACK_MENU_CATALOG: CatalogResponse = {
  "generated_at": "2026-11-01T00:00:00Z",
  "categories": [
    {
      "slug": "sandwiches",
      "name": "Sándwiches",
      "sort_order": 1
    },
    {
      "slug": "vianesas",
      "name": "Vianesas",
      "sort_order": 2
    },
    {
      "slug": "ases",
      "name": "Ases",
      "sort_order": 3
    },
    {
      "slug": "chorrillanas",
      "name": "Chorrillanas",
      "sort_order": 4
    },
    {
      "slug": "acompanamientos",
      "name": "Acompañamientos",
      "sort_order": 5
    },
    {
      "slug": "salsas",
      "name": "Salsas",
      "sort_order": 6
    },
    {
      "slug": "bebestibles",
      "name": "Bebestibles",
      "sort_order": 7
    },
    {
      "slug": "agregados",
      "name": "Agregados",
      "sort_order": 8
    }
  ],
  "products": [
    {
      "id": "sandwich-italiano",
      "name": "Sándwich Italiano",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-dinamico",
      "name": "Sándwich Dinámico",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-chacarero",
      "name": "Sándwich Chacarero",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-completo",
      "name": "Sándwich Completo",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-napolitano",
      "name": "Sándwich Napolitano",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-a-lo-pobre",
      "name": "Sándwich A lo Pobre",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-luco",
      "name": "Sándwich Luco",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-vegetariano",
      "name": "Sándwich Vegetariano",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-de-la-casa",
      "name": "Sándwich De la Casa",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-campesino",
      "name": "Sándwich Campesino",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-granjero",
      "name": "Sándwich Granjero",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "sandwich-york",
      "name": "Sándwich York",
      "category": "sandwiches",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-sola",
      "name": "Vianesa Sola",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-mayo-casera",
      "name": "Vianesa Mayo Casera",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-tomate-mayo",
      "name": "Vianesa Tomate Mayo",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-palta-mayo",
      "name": "Vianesa Palta Mayo",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-italiano",
      "name": "Vianesa Italiano",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-chacarero",
      "name": "Vianesa Chacarero",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-completo",
      "name": "Vianesa Completo",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-napolitano",
      "name": "Vianesa Napolitano",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-a-lo-pobre",
      "name": "Vianesa A lo Pobre",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-luco",
      "name": "Vianesa Luco",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "vianesa-dinamico",
      "name": "Vianesa Dinámico",
      "category": "vianesas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "as-italiano",
      "name": "As Italiano",
      "category": "ases",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "as-chacarero",
      "name": "As Chacarero",
      "category": "ases",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "as-completo",
      "name": "As Completo",
      "category": "ases",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "as-napolitano",
      "name": "As Napolitano",
      "category": "ases",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "as-a-lo-pobre",
      "name": "As A lo Pobre",
      "category": "ases",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "as-luco",
      "name": "As Luco",
      "category": "ases",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "as-dinamico",
      "name": "As Dinámico",
      "category": "ases",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "chorrillana-chica",
      "name": "Chorrillana Chica",
      "category": "chorrillanas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "chorrillana-grande",
      "name": "Chorrillana Grande",
      "category": "chorrillanas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "papas-chicas",
      "name": "Papas Chicas",
      "category": "acompanamientos",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "papas-medianas",
      "name": "Papas Medianas",
      "category": "acompanamientos",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "papas-grandes",
      "name": "Papas Grandes",
      "category": "acompanamientos",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "nuggets",
      "name": "Nuggets (10 Unidades)",
      "category": "acompanamientos",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "salsa-mayo",
      "name": "Salsa Mayo Casera",
      "category": "salsas",
      "description": "Pote grande de mayo casera.",
      "ingredients": [
        "Mayo casera"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "salsa-bbq",
      "name": "Salsa BBQ",
      "category": "salsas",
      "description": "Pote grande de bbq.",
      "ingredients": [
        "Salsa BBQ"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "salsa-queso",
      "name": "Salsa de Queso",
      "category": "salsas",
      "description": "Pote grande de salsa de queso.",
      "ingredients": [
        "Salsa de queso"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "salsa-rocoto",
      "name": "Salsa Rocoto",
      "category": "salsas",
      "description": "Pote grande de rocoto.",
      "ingredients": [
        "Salsa de rocoto"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "salsa-ajo-cilantro",
      "name": "Salsa Ajo Cilantro",
      "category": "salsas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "salsa-ciboulette",
      "name": "Salsa Ciboulette",
      "category": "salsas",
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
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "salsa-cheddar",
      "name": "Salsa Queso Cheddar",
      "category": "salsas",
      "description": "Pote grande de salsa de queso cheddar.",
      "ingredients": [
        "Queso cheddar fundido"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/salsas.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "bebestible-lata",
      "name": "Bebida en Lata 350ml",
      "category": "bebestibles",
      "description": "Lata 350ml a elección.",
      "ingredients": [
        "Lata 350ml helada"
      ],
      "price": 1300,
      "original_price": null,
      "image_url": "/productos/bebida-lata.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "bebestible-agua",
      "name": "Agua 600ml",
      "category": "bebestibles",
      "description": "Agua 600ml con o sin gas.",
      "ingredients": [
        "Agua mineral 600ml"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/jugo.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "bebestible-redbull",
      "name": "Red Bull 250ml",
      "category": "bebestibles",
      "description": "Red Bull 250ml.",
      "ingredients": [
        "Energética Red Bull 250ml"
      ],
      "price": 2000,
      "original_price": null,
      "image_url": "/productos/bebida-lata.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "bebestible-monster",
      "name": "Monster 473ml",
      "category": "bebestibles",
      "description": "Monster 473ml.",
      "ingredients": [
        "Energética Monster 473ml"
      ],
      "price": 2000,
      "original_price": null,
      "image_url": "/productos/bebida-lata.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "bebestible-boca-ancha",
      "name": "Boca Ancha 300ml",
      "category": "bebestibles",
      "description": "Boca ancha 300ml a elección.",
      "ingredients": [
        "Jugo / bebida boca ancha 300ml"
      ],
      "price": 1300,
      "original_price": null,
      "image_url": "/productos/jugo.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "bebestible-bebida-15l",
      "name": "Bebida 1.5L",
      "category": "bebestibles",
      "description": "Bebida 1.5L a elección.",
      "ingredients": [
        "Botella 1.5L helada"
      ],
      "price": 2500,
      "original_price": null,
      "image_url": "/productos/bebida-15l.jpg",
      "badge": "Familiar ❄️",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "bebestible-jugo-15l",
      "name": "Jugo 1.5L",
      "category": "bebestibles",
      "description": "Jugo 1.5L a elección.",
      "ingredients": [
        "Jugo 1.5L helado"
      ],
      "price": 2500,
      "original_price": null,
      "image_url": "/productos/jugo.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-tomate",
      "name": "Agregado Tomate",
      "category": "agregados",
      "description": "Porción extra de 3 rodajas de tomate fresco.",
      "ingredients": [
        "Tomate (3 rodajas)"
      ],
      "price": 500,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-palta",
      "name": "Agregado Palta",
      "category": "agregados",
      "description": "Porción extra de palta fresca molida.",
      "ingredients": [
        "Palta"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-americana",
      "name": "Agregado Americana",
      "category": "agregados",
      "description": "Porción extra de salsa americana.",
      "ingredients": [
        "Salsa americana"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-chucrut",
      "name": "Agregado Chucrut",
      "category": "agregados",
      "description": "Porción extra de chucrut.",
      "ingredients": [
        "Chucrut"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-lechuga",
      "name": "Agregado Lechuga",
      "category": "agregados",
      "description": "Porción extra de lechuga fresca.",
      "ingredients": [
        "Lechuga"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-pepinillo",
      "name": "Agregado Pepinillo",
      "category": "agregados",
      "description": "Porción extra de pepinillo en rodajas.",
      "ingredients": [
        "Pepinillo"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-queso-mantecoso",
      "name": "Agregado Queso Mantecoso",
      "category": "agregados",
      "description": "1.5 láminas de queso mantecoso fundido.",
      "ingredients": [
        "Queso mantecoso (1.5 láminas)"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-queso-mozzarella",
      "name": "Agregado Queso Mozzarella",
      "category": "agregados",
      "description": "3 láminas de queso mozzarella fundido.",
      "ingredients": [
        "Queso mozzarella (3 láminas)"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-queso-cheddar",
      "name": "Agregado Queso Cheddar",
      "category": "agregados",
      "description": "3 láminas de queso cheddar fundido.",
      "ingredients": [
        "Queso cheddar (3 láminas)"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-cebolla-caramelizada",
      "name": "Agregado Cebolla Caramelizada",
      "category": "agregados",
      "description": "Porción extra de cebolla caramelizada.",
      "ingredients": [
        "Cebolla caramelizada"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-tocino",
      "name": "Agregado Tocino",
      "category": "agregados",
      "description": "Porción extra de tocino crocante.",
      "ingredients": [
        "Tocino"
      ],
      "price": 1000,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-papa-hilo",
      "name": "Agregado Papa Hilo",
      "category": "agregados",
      "description": "Porción extra de papas hilo crujientes.",
      "ingredients": [
        "Papa hilo"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-poroto-verde",
      "name": "Agregado Poroto Verde",
      "category": "agregados",
      "description": "Porción extra de poroto verde fresco.",
      "ingredients": [
        "Poroto verde"
      ],
      "price": 700,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    },
    {
      "id": "agregado-item-aji-verde",
      "name": "Agregado Ají Verde",
      "category": "agregados",
      "description": "Toque de ají verde chileno sin costo adicional.",
      "ingredients": [
        "Ají verde"
      ],
      "price": 0,
      "original_price": null,
      "image_url": "/productos/agregados.jpg",
      "badge": "",
      "is_available": true,
      "updated_at": "2026-11-01T00:00:00Z"
    }
  ]
};
