import { ComboItem, ExtraItem, GoogleReviewItem } from '../types';

// real product catalog categories and prices directly from productos_y_precios_foodtrucksanmartin(Productos).csv
export const MENU_CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'sandwiches', name: 'Sándwiches' },
  { id: 'vianesas', name: 'Vianesas' },
  { id: 'ases', name: 'As' },
  { id: 'chorrillanas', name: 'Chorrillanas' },
  { id: 'acompanamientos', name: 'Acompañamientos' },
  { id: 'salsas', name: 'Salsas' },
  { id: 'bebestibles', name: 'Bebestibles' },
  { id: 'agregados', name: 'Agregados' },
] as const;

export const CHILEAN_EXTRAS: ExtraItem[] = [
  { id: 'agregado-tomate', name: 'Tomate (3 rodajas)', price: 500 },
  { id: 'agregado-palta', name: 'Palta', price: 1000 },
  { id: 'agregado-americana', name: 'Americana', price: 700 },
  { id: 'agregado-chucrut', name: 'Chucrut', price: 700 },
  { id: 'agregado-lechuga', name: 'Lechuga', price: 700 },
  { id: 'agregado-pepinillo', name: 'Pepinillo', price: 700 },
  { id: 'agregado-queso-mantecoso', name: 'Queso mantecoso (1.5 láminas)', price: 1000 },
  { id: 'agregado-queso-mozzarella', name: 'Queso mozzarella (3 láminas)', price: 1000 },
  { id: 'agregado-queso-cheddar', name: 'Queso cheddar (3 láminas)', price: 1000 },
  { id: 'agregado-cebolla-caramelizada', name: 'Cebolla caramelizada', price: 700 },
  { id: 'agregado-tocino', name: 'Tocino', price: 1000 },
  { id: 'agregado-papa-hilo', name: 'Papa hilo', price: 700 },
  { id: 'agregado-poroto-verde', name: 'Poroto verde', price: 700 },
  { id: 'agregado-aji-verde', name: 'Ají verde', price: 0 },
];

// ponytail: exact 4 promotions from CSV (Promocion rows)
export const COMBOS_DATA: ComboItem[] = [
  {
    id: 'promo-2-sandwich-papas',
    name: '2 Sándwich + Papas',
    price: 7000,
    originalPrice: 13200,
    description: '2 sándwich tradicionales a elección + papas fritas para acompañar.',
    includes: [
      '2 Sándwich tradicionales a elección',
      'Papas fritas para acompañar',
    ],
    badge: 'Promo Estrella 🔥',
    serves: 'Para 2 personas',
    image: '/productos/sandwich-italiano.jpg',
  },
  {
    id: 'promo-2-sandwich-casa-papas',
    name: '2 Sándwich de la Casa + Papas',
    price: 7500,
    originalPrice: 16000,
    description: '2 sándwich de la casa + papas fritas para acompañar.',
    includes: [
      '2 Sándwich De la Casa (Proteína a elección, champiñón, queso mantecoso, bbq, mayo)',
      'Papas fritas para acompañar',
    ],
    badge: 'Especialidad 👑',
    serves: 'Para 2 personas',
    image: '/productos/sandwich-delacasa.jpg',
  },
  {
    id: 'promo-chorrillana-chica-bebida',
    name: 'Chorrillana Chica + Bebida/Jugo 1.5L',
    price: 15000,
    originalPrice: 16500,
    description: 'Chorrillana chica + bebida o jugo 1.5L a elección.',
    includes: [
      '1 Chorrillana Chica (Papas fritas, 2 proteínas a elección, cebolla caramelizada, 2 huevos fritos, longaniza)',
      '1 Bebida o Jugo 1.5L a elección',
    ],
    badge: 'Ideal para Compartir 🍟',
    serves: 'Tamaño Chico',
    image: '/productos/chorrillana.jpg',
  },
  {
    id: 'promo-chorrillana-grande-bebida',
    name: 'Chorrillana Grande + Bebida/Jugo 1.5L',
    price: 17000,
    originalPrice: 19500,
    description: 'Chorrillana grande + bebida o jugo 1.5L a elección.',
    includes: [
      '1 Chorrillana Grande (Papas fritas, 2 proteínas a elección, cebolla caramelizada, 4 huevos fritos, longaniza)',
      '1 Bebida o Jugo 1.5L a elección',
    ],
    badge: 'Familiar XL ⭐',
    serves: 'Tamaño Grande',
    image: '/productos/chorrillana.jpg',
  },
];

export const GOOGLE_MAPS_SUMMARY = {
  rating: 4.7,
  totalReviews: 90,
  stars: 5,
  source: 'Google Maps',
  highlights: ['Estacionamiento disponible', 'Atención nocturna', 'Porciones contundentes'],
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
      ambiente: 5,
    },
    comment: 'Primera vez que paso y muy buena calidad la comida.',
    highlights: ['Estacionamiento gratuito', 'Acceso para silla de ruedas'],
    initials: 'K',
    avatarColor: 'from-purple-600 to-indigo-600',
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
      ambiente: 5,
    },
    comment: 'Muy rico, contundente y muy buena atención. Totalmente recomendado!!!',
    initials: 'MB',
    avatarColor: 'from-amber-600 to-red-600',
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
      ambiente: 5,
    },
    comment: 'Muy rico, buena relación precio calidad.',
    highlights: ['Espera: 10 a 30 min', 'Ambiente conversable'],
    initials: 'DC',
    avatarColor: 'from-rose-600 to-pink-600',
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
      ambiente: 5,
    },
    comment: 'Hola , me tomé un té de buena calidad ,me gustó ese detalle',
    initials: 'CM',
    avatarColor: 'from-emerald-600 to-teal-600',
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
      ambiente: 5,
    },
    comment: 'Me encanta venir a este lugar, la atención un 7, la comida deliciosa y la mayoría de las veces son muy rápidos en entregar los pedidos.',
    initials: 'A',
    avatarColor: 'from-orange-500 to-amber-600',
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
    avatarColor: 'from-blue-600 to-cyan-600',
  },
];

// Alias for backwards compatibility if needed
export const TESTIMONIALS_DATA = GOOGLE_REVIEWS_DATA;

export const FEATURES_DATA = [
  {
    id: 'carne',
    icon: 'Flame',
    title: 'Proteína a Elección a la Plancha',
    description: 'Sándwiches, ases y chorrillanas preparados al momento en plancha caliente con proteína a elección e ingredientes frescos.',
    tag: 'Calidad Premium',
  },
  {
    id: 'pan',
    icon: 'Utensils',
    title: 'Pan Artesanal Crujiente',
    description: 'Pan de sándwich, vianesa y as recién horneado, con corteza dorada y miga firme que resiste la abundancia de ingredientes.',
    tag: 'Recién Horneado',
  },
  {
    id: 'palta',
    icon: 'Sparkles',
    title: 'Palta Fresca & Mayo Casera',
    description: 'Palta molida el mismo día y nuestra famosa mayonesa casera, además de salsas BBQ, queso cheddar, rocoto, ajo cilantro y ciboulette.',
    tag: '100% Casero',
  },
  {
    id: 'porciones',
    icon: 'ShieldCheck',
    title: 'Chorrillanas & Promos Reales',
    description: 'Desde vianesas desde $1.000 hasta chorrillanas familiares y promos de 2 sándwiches + papas desde $7.000.',
    tag: 'Precios Imbatibles',
  },
];
