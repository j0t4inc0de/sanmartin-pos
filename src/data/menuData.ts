import { MenuItem, ComboItem, ExtraItem } from '../types';

export const MENU_CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'churrascos', name: 'Churrascos' },
  { id: 'mechadas', name: 'Mechadas' },
  { id: 'lomitos', name: 'Lomitos' },
  { id: 'completos', name: 'Completos & Ases' },
  { id: 'papas', name: 'Papas Fritas' },
  { id: 'bebidas', name: 'Bebidas' },
] as const;

export const CHILEAN_EXTRAS: ExtraItem[] = [
  { id: 'extra-palta', name: 'Palta Hass Extra', price: 1000 },
  { id: 'extra-queso', name: 'Queso Mantecoso Fundido Extra', price: 900 },
  { id: 'extra-mayo', name: 'Mayonesa Casera San Martín Extra', price: 500 },
  { id: 'extra-salsa-verde', name: 'Salsa Verde Chilena', price: 500 },
  { id: 'extra-aji', name: 'Ají Verde en Rodajas', price: 400 },
  { id: 'extra-cebolla-caramelizada', name: 'Cebolla Caramelizada', price: 700 },
  { id: 'extra-tocino', name: 'Tocino Ahumado Crocante', price: 900 },
  { id: 'extra-carne', name: 'Porción Extra de Carne / Doble Carne', price: 1800 },
];

export const MENU_ITEMS: MenuItem[] = [
  // --- CHURRASCOS ---
  {
    id: 'churrasco-italiano',
    name: 'Churrasco Italiano Gigante',
    category: 'churrascos',
    price: 6500,
    description: 'Finas láminas de vacuno a la plancha, abundante palta hass cremosa molida en el momento, tomate fresco en rodajas y mayonesa casera artesanal en pan frica tostado.',
    ingredients: ['Carne de vacuno a la plancha', 'Palta Hass molida fresca', 'Tomate natural seleccionado', 'Mayonesa casera San Martín', 'Pan frica artesanal crujiente'],
    badge: 'Más Vendido ⭐',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=900&auto=format&fit=crop',
    popular: true
  },
  {
    id: 'churrasco-luco',
    name: 'Churrasco Barros Luco',
    category: 'churrascos',
    price: 6200,
    description: 'El clásico indiscutido chileno: abundante vacuno jugoso a la plancha bañado en una generosa cascada de queso mantecoso fundido.',
    ingredients: ['Carne de vacuno jugosa', 'Doble queso mantecoso fundido', 'Mantequilla a la plancha', 'Pan frica dorado'],
    badge: 'Favorito 🔥',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=900&auto=format&fit=crop',
    popular: true
  },
  {
    id: 'churrasco-chacarero',
    name: 'Churrasco Chacarero Tradicional',
    category: 'churrascos',
    price: 6500,
    description: 'Churrasco de primera, porotos verdes tiernos al dente, tomate fresco, toque de ají verde suave a elección y mayonesa casera.',
    ingredients: ['Carne de vacuno seleccionada', 'Porotos verdes frescos', 'Tomate en rodajas', 'Ají verde chileno (opcional)', 'Mayonesa casera artesanal'],
    badge: 'Tradicional 🇨🇱',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'churrasco-san-martin',
    name: 'Churrasco Especial San Martín',
    category: 'churrascos',
    price: 7900,
    description: 'La joya de la casa: doble porción de vacuno a la plancha, cebolla caramelizada casera, tocino crujiente ahumado, queso mantecoso y salsa secreta de la casa.',
    ingredients: ['Doble porción carne de vacuno', 'Cebolla caramelizada al vino', 'Tocino ahumado crocante', 'Queso mantecoso fundido', 'Salsa secreta San Martín'],
    badge: 'Especialidad de la Casa 👑',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=900&auto=format&fit=crop',
    popular: true
  },

  // --- MECHADAS ---
  {
    id: 'mechada-italiana',
    name: 'Mechada Italiana de Vacuno',
    category: 'mechadas',
    price: 6900,
    description: 'Carne de vacuno desmechada a mano tras 6 horas de cocción lenta en vino y verduras, cubierta de palta fresca, tomate y mayo casera.',
    ingredients: ['Carne mechada braseada 6 hrs', 'Palta Hass extra fresca', 'Tomate maduro en láminas', 'Mayo casera suave', 'Pan frica tostado con sésamo'],
    badge: 'Súper Jugosa 🥩',
    image: 'https://images.unsplash.com/photo-1549611016-3a70d82b5040?q=80&w=900&auto=format&fit=crop',
    popular: true
  },
  {
    id: 'mechada-luco',
    name: 'Mechada Luco Queso Fundido',
    category: 'mechadas',
    price: 6700,
    description: 'Incomparable carne mechada tierna y jugosa con triple capa de queso mantecoso derretido directamente a la plancha.',
    ingredients: ['Carne mechada en su propio caldo', 'Triple queso mantecoso fundido', 'Pan frica artesanal caliente'],
    badge: 'Recomendado ⭐',
    image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'mechada-bbq-crispy',
    name: 'Mechada BBQ & Cebolla Crispy',
    category: 'mechadas',
    price: 7500,
    description: 'Mechada suave macerada en salsa barbacoa ahumada, queso cheddar fundido, tocino crocante y lluvia de cebolla crispy.',
    ingredients: ['Mechada braseada a fuego lento', 'Salsa BBQ ahumada artesanal', 'Queso cheddar fundido', 'Tocino crocante', 'Cebolla crispy frita'],
    badge: 'Gourmet 🔥',
    image: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?q=80&w=900&auto=format&fit=crop'
  },

  // --- LOMITOS ---
  {
    id: 'lomito-italiano',
    name: 'Lomito Italiano Criollo',
    category: 'lomitos',
    price: 6200,
    description: 'Lomito de cerdo marinado en receta criolla secreta cocinado a la plancha, acompañado de palta hass, tomate fresco y mayonesa casera.',
    ingredients: ['Lomito de cerdo adobado a la plancha', 'Palta hass molida', 'Tomate natural', 'Mayonesa casera', 'Pan amasado o frica crujiente'],
    badge: 'Clásico Bajonero 🥪',
    image: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?q=80&w=900&auto=format&fit=crop',
    popular: true
  },
  {
    id: 'lomito-luco',
    name: 'Lomito Luco Queso Dorado',
    category: 'lomitos',
    price: 5900,
    description: 'Lomito de cerdo tierno y dorado a la plancha con queso mantecoso fundido en pan frica artesanal caliente.',
    ingredients: ['Lomito de cerdo sazonado', 'Abundante queso mantecoso', 'Pan frica recién horneado'],
    badge: 'Para Fanáticos del Queso 🧀',
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'lomito-chacarero',
    name: 'Lomito Chacarero del Huerto',
    category: 'lomitos',
    price: 6200,
    description: 'Finas lonjas de lomito a la plancha, porotos verdes frescos, tomate jugoso, ají verde suave y un toque de mayonesa de la casa.',
    ingredients: ['Lomito de cerdo a la plancha', 'Porotos verdes al dente', 'Tomate fresco', 'Ají verde suave', 'Mayo casera'],
    badge: '100% Chileno 🇨🇱',
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=900&auto=format&fit=crop'
  },

  // --- COMPLETOS & ASES ---
  {
    id: 'completo-italiano-gigante',
    name: 'Completo Italiano Gigante',
    category: 'completos',
    price: 3200,
    description: 'Vienesa sureña premium en pan de completo tostado artesanal, tomate en cubitos, abundante palta hass y la auténtica mayonesa casera San Martín.',
    ingredients: ['Vienesa sureña premium', 'Tomate picado fino', 'Palta hass abundante', 'Mayo casera San Martín', 'Pan tostado al vapor'],
    badge: 'El Rey de la Noche 🌭',
    image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?q=80&w=900&auto=format&fit=crop',
    popular: true
  },
  {
    id: 'completo-dinamico',
    name: 'Completo Dinámico Especial',
    category: 'completos',
    price: 3400,
    description: 'Vienesa sureña, salsa americana casera, chucrut seleccionado tibio, tomate fresco, palta hass y mayonesa casera en pan tostado.',
    ingredients: ['Vienesa premium', 'Salsa americana artesanal', 'Chucrut seleccionado', 'Tomate fresco', 'Palta hass', 'Mayo casera'],
    badge: 'Contundente ⚡',
    image: 'https://images.unsplash.com/photo-1541214113241-21578d2d9b62?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'as-italiano',
    name: 'As Italiano de Vacuno',
    category: 'completos',
    price: 4200,
    description: 'Carne picada de vacuno a la plancha con aliño especial, palta fresca, tomate y mayo casera en pan de completo gigante.',
    ingredients: ['Carne de vacuno a la plancha en tiras', 'Palta hass molida', 'Tomate en cubos', 'Mayo casera artesanal', 'Pan de completo alargado tostado'],
    badge: 'Favorito Puente Alto 🥖',
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=900&auto=format&fit=crop',
    popular: true
  },
  {
    id: 'as-luco',
    name: 'As Barros Luco Queso Doble',
    category: 'completos',
    price: 3900,
    description: 'Carne de vacuno a la plancha tapada con una sábana de queso mantecoso derretido en pan alargado tostado con mantequilla.',
    ingredients: ['Carne picada de vacuno', 'Queso mantecoso fundido abundante', 'Pan de completo tostado'],
    badge: 'Queso Extremo 🧀',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=900&auto=format&fit=crop'
  },

  // --- PAPAS FRITAS ---
  {
    id: 'papas-san-martin-cargadas',
    name: 'Papas San Martín Cargadas (Para Compartir)',
    category: 'papas',
    price: 6900,
    description: 'Canasta gigante de papas rústicas doradas, coronadas con abundante carne mechada desmenuzada, salsa de queso cheddar fundido, tocino crocante y cebollín fresco.',
    ingredients: ['Papas rústicas doble fritura crocantes', 'Carne mechada braseada', 'Salsa cheddar fundido', 'Tocino ahumado en cubos', 'Cebollín fresco picado'],
    badge: 'Imperdible Para Compartir 🍟',
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=900&auto=format&fit=crop',
    popular: true
  },
  {
    id: 'papas-rusticas-clasicas',
    name: 'Papas Rústicas Caseras Familiares',
    category: 'papas',
    price: 3500,
    description: 'Papas cortadas a mano, crujientes por fuera y esponjosas por dentro, sazonadas con sal de mar de Cáhuil y orégano fino.',
    ingredients: ['Papas seleccionadas corte rústico', 'Sal de mar artesanal', 'Salsas a elección (Ketchup, Mostaza, Mayo)'],
    badge: '100% Caseras ✨',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'salchipapas-san-martin',
    name: 'Salchipapas San Martín Crujientes',
    category: 'papas',
    price: 4800,
    description: 'Papas fritas recién hechas con generosa porción de salchichas sureñas doradas a la plancha, bañadas en mayo casera y salsa BBQ.',
    ingredients: ['Papas fritas crujientes', 'Salchichas sureñas en rodajas doradas', 'Mayo casera', 'Salsa barbacoa'],
    badge: 'El Clásico de la Noche 🌭',
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=900&auto=format&fit=crop'
  },

  // --- BEBIDAS ---
  {
    id: 'bebida-1500ml',
    name: 'Bebida Familiar 1.5 Litros',
    category: 'bebidas',
    price: 2500,
    description: 'Heladita para compartir: Coca-Cola Original, Coca-Cola Sin Azúcar, Sprite o Fanta (indicar preferencia en tu pedido).',
    ingredients: ['Botella 1.5 L bien helada', 'Línea Coca-Cola Company'],
    badge: 'Familiar ❄️',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'bebida-lata-350ml',
    name: 'Bebida en Lata 350ml',
    category: 'bebidas',
    price: 1500,
    description: 'Lata individual bien fría: Coca-Cola Original, Zero, Sprite, Fanta o Canada Dry.',
    ingredients: ['Lata 350ml fría'],
    badge: 'Individual 🥤',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'jugo-natural-500ml',
    name: 'Néctar / Jugo Frutal 500ml',
    category: 'bebidas',
    price: 1800,
    description: 'Jugo refrescante sabor Durazno, Frutilla o Naranja bien helado.',
    ingredients: ['Fruta seleccionada', 'Botella 500ml helada'],
    badge: 'Refrescante 🍊',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=900&auto=format&fit=crop'
  }
];

export const COMBOS_DATA: ComboItem[] = [
  {
    id: 'combo-pareja',
    name: 'Combo Pareja San Martín',
    price: 16900,
    originalPrice: 19500,
    description: 'Ideal para 2 personas que buscan el sabor definitivo de un auténtico Food Truck chileno.',
    includes: [
      '2 Sánguches gigantes a elección (Churrasco, Mechada o Lomito Italiano/Luco)',
      '1 Porción grande de Papas Rústicas Caseras crocantes',
      '2 Bebidas en lata 350ml bien heladas o 1 Bebida 1.5L',
      'Salsas de la casa y mayonesa casera incluida'
    ],
    badge: 'Ahorra $2.600 🔥',
    serves: 'Para 2 personas',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'combo-familiar-bajonero',
    name: 'Combo Familiar Bajonero',
    price: 28900,
    originalPrice: 33500,
    description: 'El festín completo para la familia o el grupo de amigos. Sánguches contundentes que no decepcionan a nadie.',
    includes: [
      '4 Sánguches gigantes a elección de la carta completa',
      '1 Canasta familiar de Papas San Martín Cargadas (Mechada + Cheddar + Tocino)',
      '1 Bebida familiar 1.5 Litros bien helada',
      'Pocillos de mayonesa casera artesanal extra'
    ],
    badge: 'El Más Pedido ⭐ Ahorra $4.600',
    serves: 'Para 4 a 5 personas',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'combo-completo-fest',
    name: 'Combo Completo Fest',
    price: 14900,
    originalPrice: 17200,
    description: 'Para los verdaderos amantes del completo tradicional chileno con palta fresca y mayo casera de verdad.',
    includes: [
      '4 Completos Italianos o Dinámicos gigantes en pan tostado',
      '1 Porción grande de Papas Fritas crujientes',
      '1 Bebida familiar de 1.5 Litros helada'
    ],
    badge: 'Ahorra $2.300 🌭',
    serves: 'Para 3 a 4 personas',
    image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'combo-duo-mechada',
    name: 'Combo Dúo Mechada & Papas Cargadas',
    price: 18900,
    originalPrice: 21800,
    description: 'Para los que no transan: dos mechadas jugosas de cocción lenta y papas bañadas en queso cheddar fundido.',
    includes: [
      '2 Sánguches de Mechada Italiana o Luco extra jugosos',
      '1 Porción de Papas San Martín Cargadas con tocino y cheddar',
      '2 Bebidas en lata bien heladas'
    ],
    badge: 'Sabor Intenso 👑 Ahorra $2.900',
    serves: 'Para 2 personas',
    image: 'https://images.unsplash.com/photo-1549611016-3a70d82b5040?q=80&w=900&auto=format&fit=crop'
  }
];

import { GoogleReviewItem } from '../types';

export const GOOGLE_MAPS_SUMMARY = {
  rating: 4.7,
  totalReviews: 90,
  stars: 5,
  source: 'Google Maps',
  highlights: ['Estacionamiento disponible', 'Atención nocturna', 'Porciones contundentes']
};

export const GOOGLE_REVIEWS_DATA: GoogleReviewItem[] = [
  {
    id: 'rev-karoshi',
    name: 'Karōshi',
    badge: 'Local Guide · 96 opiniones · 136 fotos',
    timeAgo: 'Hace 10 meses',
    orderType: 'Comida para llevar · $25.000-30.000',
    rating: 5,
    scores: {
      comida: 5,
      servicio: 5,
      ambiente: 5
    },
    comment: 'Primera vez que paso y muy buena calidad la comida.',
    highlights: ['Estacionamiento gratuito', 'Acceso para silla de ruedas'],
    initials: 'K',
    avatarColor: 'from-purple-600 to-indigo-600'
  },
  {
    id: 'rev-matty',
    name: 'Matty Boter',
    badge: 'Local Guide · 57 opiniones · 137 fotos',
    timeAgo: 'Hace 2 años',
    rating: 5,
    scores: {
      comida: 5,
      servicio: 5,
      ambiente: 5
    },
    comment: 'Muy rico, contundente y muy buena atención. Totalmente recomendado!!!',
    initials: 'MB',
    avatarColor: 'from-amber-600 to-red-600'
  },
  {
    id: 'rev-daniela',
    name: 'daniela chavez',
    badge: 'Local Guide · 29 opiniones · 13 fotos',
    timeAgo: 'Hace 6 meses',
    rating: 5,
    scores: {
      comida: 5,
      servicio: 5,
      ambiente: 5
    },
    comment: 'Muy rico, buena relación precio calidad.',
    highlights: ['Espera: 10 a 30 min', 'Ambiente conversable'],
    initials: 'DC',
    avatarColor: 'from-rose-600 to-pink-600'
  },
  {
    id: 'rev-cecilia',
    name: 'Cecilia Molina',
    badge: '2 opiniones · 1 foto',
    timeAgo: 'Hace un año',
    rating: 5,
    scores: {
      comida: 5,
      servicio: 5,
      ambiente: 5
    },
    comment: 'Hola , me tomé un té de buena calidad ,me gustó ese detalle',
    initials: 'CM',
    avatarColor: 'from-emerald-600 to-teal-600'
  },
  {
    id: 'rev-almendrita',
    name: 'Almendrita',
    badge: '5 opiniones',
    timeAgo: 'Hace 10 meses',
    orderType: 'Consumo en el lugar · $1.000-5.000',
    rating: 5,
    scores: {
      comida: 5,
      servicio: 5,
      ambiente: 5
    },
    comment: 'Me encanta venir a este lugar, la atención un 7, la comida deliciosa y la mayoría de las veces son muy rápidos en entregar los pedidos.',
    initials: 'A',
    avatarColor: 'from-orange-500 to-amber-600'
  },
  {
    id: 'rev-seba',
    name: 'seba awx',
    badge: '5 opiniones',
    timeAgo: 'Hace 9 meses',
    orderType: 'Comida para llevar · $1.000-5.000',
    rating: 5,
    comment: 'Muy buena comida y sobre todo precios, atienden hasta bastante tarde, recomendado',
    initials: 'SA',
    avatarColor: 'from-blue-600 to-cyan-600'
  }
];

// Alias for backwards compatibility if needed
export const TESTIMONIALS_DATA = GOOGLE_REVIEWS_DATA;


export const FEATURES_DATA = [
  {
    id: 'carne',
    icon: 'Flame',
    title: 'Carne 100% de Primera',
    description: 'Vacuno tierno a la plancha y mechada cocinada por más de 6 horas a fuego lento en su propio caldo. Nada de procesados.',
    tag: 'Calidad Premium'
  },
  {
    id: 'pan',
    icon: 'Utensils',
    title: 'Pan Artesanal Crujiente',
    description: 'Pan frica y de completo horneado a diario, con corteza dorada y miga firme que resiste la abundancia de ingredientes y jugos.',
    tag: 'Recién Horneado'
  },
  {
    id: 'palta',
    icon: 'Sparkles',
    title: 'Palta Hass & Mayo Casera',
    description: 'Palta Hass cremosa molida a mano el mismo día y nuestra famosa mayonesa casera batida con receta secreta familiar.',
    tag: '100% Natural'
  },
  {
    id: 'porciones',
    icon: 'ShieldCheck',
    title: 'Porciones Gigantes Reales',
    description: 'En Food Truck San Martín no escatimamos. Sánguches contundentes, bien cargados y con el auténtico sabor sanguchero.',
    tag: 'XL Sin Mezquindad'
  }
];
