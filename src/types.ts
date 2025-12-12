
export enum Category {
  WOMEN = 'Mulher',
  MEN = 'Homem',
  KIDS = 'Criança',
  ACCESSORIES = 'Acessórios',
  SHOES = 'Sapatos',
  SPORTS = 'Desporto',
  BEAUTY = 'Beleza',
  HOME = 'Casa & Decor'
}

export enum Condition {
  NEW = 'Novo com etiqueta',
  LIKE_NEW = 'Como novo',
  GOOD = 'Bom estado',
  FAIR = 'Estado razoável'
}

export interface Review {
  id: string;
  userName: string;
  comment: string;
  rating: number;
  date: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: Category;
  condition: Condition;
  sellerName: string;
  sellerPhone?: string;
  sellerRating: number;
  location: string; // e.g., "Maputo", "Matola"
  likes: number;
  isPromoted?: boolean;
  reviews: Review[];
  sizes?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export type ViewState = 'HOME' | 'SELL' | 'CART' | 'PROFILE' | 'PRODUCT_DETAIL' | 'SETTINGS' | 'FAVORITES';

export interface GeminiResponse {
  title: string;
  description: string;
  suggestedPrice: number;
  category: string;
}


export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  whatsapp: string | null;
  reputation: number;
}