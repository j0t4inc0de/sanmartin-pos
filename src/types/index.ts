export interface MenuItem {
  id: string;
  name: string;
  category: string;
  size?: string;
  price: number;
  originalPrice?: number;
  original_price?: number | null;
  description: string;
  ingredients: string[];
  badge?: string;
  image: string;
  image_url?: string;
  popular?: boolean;
  is_available?: boolean;
  is_active?: boolean;
}

export interface ComboItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  includes: string[];
  badge?: string;
  image: string;
  serves: string;
}

export interface ExtraItem {
  id: string;
  name: string;
  price: number;
}

export interface ModifierItem {
  id: number | string;
  name: string;
  price: number;
  modifier_type: 'EXTRA_PAGO' | 'EXCLUSION_COCINA';
  is_available: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
  selectedExtras?: ExtraItem[];
  type: 'menu' | 'combo';
}

export interface BusinessStatus {
  isOpen: boolean;
  statusText: string;
  statusDetail: string;
  badgeColor: 'emerald' | 'amber' | 'rose';
  nextOpenText: string;
}

export interface GoogleReviewItem {
  id: string;
  name: string;
  badge?: string;
  timeAgo: string;
  orderType?: string;
  rating: number;
  scores?: {
    comida?: number;
    servicio?: number;
    ambiente?: number;
  };
  comment: string;
  highlights?: string[];
  initials: string;
  avatarColor: string;
}

