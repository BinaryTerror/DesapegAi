// types.ts

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
  // Usamos '| string' para flexibilidade com dados do Supabase
  category: Category | string; 
  condition: Condition | string;
  sellerName: string;
  sellerPhone?: string;
  sellerRating: number;
  location: string; 
  likes: number;
  isPromoted?: boolean;
  reviews: Review[];
  sizes?: string[];
  
  // Status do produto (Obrigatório)
  status: 'available' | 'sold'; 
  
  // ID do usuário que está vendendo (Obrigatório)
  sellerId: string; 
  
  // Datas (Obrigatórias no seu fetch)
  createdAt: string; 
  
  // Campo que estava faltando para o SellForm (Opcional)
  updatedAt?: string; 
}

export interface CartItem extends Product {
  quantity: number;
}

// Estados de visualização do App
export type ViewState = 
  | 'HOME' 
  | 'SELL' 
  | 'CART' 
  | 'PROFILE' 
  | 'PRODUCT_DETAIL' 
  | 'SETTINGS' 
  | 'FAVORITES';

// Resposta da Inteligência Artificial Gemini
export interface GeminiResponse {
  title: string;
  description: string;
  suggestedPrice: number;
  category: string;
}

// Perfil do Usuário no Banco de Dados
export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  whatsapp: string | null;
  reputation: number;
}