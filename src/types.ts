// Enum para Categorias (usado no Sidebar e Formulários)
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

// Árvore de Subcategorias (usado no SellForm)
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

// Interface do Produto
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
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
}

// Interface do Carrinho
export interface CartItem extends Product {
  quantity: number;
}

// Interface do Perfil do Usuário
export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  whatsapp?: string;
  role: 'user' | 'admin';
  is_unlimited: boolean;
}

// --- AQUI ESTÁ O QUE FALTAVA (ViewState) ---
// Define as telas possíveis para navegação no App
export type ViewState = 'HOME' | 'CART' | 'PROFILE' | 'PRODUCT_DETAIL' | 'FAVORITES' | 'SELL' | 'ADMIN' | 'SETTINGS';

// Interface de Comentários
export interface Review {
  id: string;
  userName: string;
  comment: string;
  rating: number;
  date: string;
}