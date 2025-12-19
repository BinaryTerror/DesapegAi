export enum Category {
  WOMEN = 'Mulher',
  MEN = 'Homem',
  KIDS = 'Criança',
  SHOES = 'Sapatos',
  BEAUTY = 'Beleza',
  HOME = 'Casa',
  VEHICLES = 'Veículos',
  TECH = 'Tecnologia',
  SPORTS = 'Desporto',
  OTHERS = 'Outras'
}

export const CATEGORY_TREE: Record<string, string[]> = {
  [Category.WOMEN]: ['Vestidos', 'Blusas', 'Calças', 'Saias', 'Acessórios'],
  [Category.MEN]: ['Camisas', 'T-Shirts', 'Calças', 'Casacos', 'Ternos'],
  [Category.KIDS]: ['Menino', 'Menina', 'Brinquedos', 'Escolar'],
  [Category.SHOES]: ['Ténis', 'Sociais', 'Botas', 'Sandálias'],
  [Category.BEAUTY]: ['Maquilhagem', 'Perfumes', 'Cabelo', 'Skincare'],
  [Category.HOME]: ['Móveis', 'Decoração', 'Cozinha', 'Jardim'],
  [Category.VEHICLES]: ['Carros', 'Motorizadas', 'Peças', 'Bicicletas'],
  [Category.TECH]: ['Telemóveis', 'Laptops', 'Áudio', 'Fotografia'],
  [Category.SPORTS]: ['Ginásio', 'Futebol', 'Equipamento', 'Roupa Desportiva'],
  [Category.OTHERS]: ['Diversos', 'Serviços', 'Livros', 'Instrumentos']
};

export enum Condition {
  NEW = 'Novo',
  LIKE_NEW = 'Como Novo',
  GOOD = 'Bom Estado',
  FAIR = 'Aceitável'
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string; // Imagem principal (Capa)
  images?: string[]; // Array para até 5 fotos
  category: string;
  subcategory?: string;
  condition: string;
  location: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  status: 'available' | 'sold';
  createdAt: string;
  likes: number;
  isPromoted?: boolean;
   province?: string; 
}

export interface CartItem extends Product {
  quantity: number;
}

export const MOZ_PROVINCES = [
  "Maputo Cidade", "Maputo Província", "Gaza", "Inhambane",
  "Sofala", "Manica", "Tete", "Zambézia", "Nampula",
  "Niassa", "Cabo Delgado"
];

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  whatsapp?: string;
  role: 'user' | 'admin';
  is_unlimited: boolean;
  posts_limit?: number;        // Limite de anúncios (Ex: 6, 12)
  plan?: 'free' | 'vip';       // Tipo do plano
  premium_until?: string | null; // Data de validade do VIP (ISO String)
  status?: 'active' | 'blocked'; // Status da conta
  posts_created_total?: number;
}

export type ViewState = 'HOME' | 'CART' | 'PROFILE' | 'PRODUCT_DETAIL' | 'FAVORITES' | 'SELL' | 'ADMIN' | 'SETTINGS';

export interface Review {
  id: string;
  userName: string;
  comment: string;
  rating: number;
  date: string;
}
