import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Package, Ban, Trash2, CheckCircle, 
  Loader2, Lock, Unlock, Crown, Plus, Calendar, Star, 
  Search, TrendingUp
} from 'lucide-react';
import { UserProfile, Product } from '../types';

export const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSold: 0,
    blockedUsers: 0
  });
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'products'>('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Buscar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // 2. Buscar produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Mapeamento correto user_id -> sellerId
      const formattedProducts = (productsData || []).map((p: any) => ({
        ...p,
        sellerId: p.user_id, 
        sellerName: p.seller_name,
        sellerPhone: p.seller_phone
      }));

      const totalSold = formattedProducts.filter((p: any) => p.status === 'sold').length;
      const blockedUsers = (usersData || []).filter((u: any) => u.status === 'blocked').length;

      setStats({
        totalUsers: usersData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalSold,
        blockedUsers
      });

      setUsers(usersData as UserProfile[]);
      setProducts(formattedProducts as any);

    } catch (error) {
      console.error("Erro ao carregar painel:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA FINANCEIRA ---

  const handleAddQuota = async (user: UserProfile) => {
    if (!window.confirm(`Adicionar +6 anúncios para ${user.full_name}?`)) return;
    
    // Busca dado atualizado para garantir
    const { data: freshUser } = await supabase.from('profiles').select('posts_limit').eq('id', user.id).single();
    const currentLimit = freshUser?.posts_limit ?? 6; 
    const newLimit = currentLimit + 6;

    const { error } = await supabase.from('profiles').update({ posts_limit: newLimit }).eq('id', user.id);
        
    if (!error) {
        alert(`Sucesso! Limite: ${newLimit}`);
        // Atualiza interface localmente
        setUsers(users.map(u => u.id === user.id ? { ...u, posts_limit: newLimit } : u));
    } else {
        alert("Erro ao atualizar.");
    }
  };

  const handleAddVip = async (user: UserProfile, days: number, label: string) => {
    if (!window.confirm(`Ativar VIP de ${label} para ${user.full_name}?`)) return;

    const { data: currentUser } = await supabase.from('profiles').select('premium_until').eq('id', user.id).single();
    const now = new Date();
    let baseDate = now;
    if (currentUser?.premium_until && new Date(currentUser.premium_until) > now) {
        baseDate = new Date(currentUser.premium_until);
    }
    
    const futureDate = new Date(baseDate);
    futureDate.setDate(baseDate.getDate() + days);

    const { error } = await supabase.from('profiles').update({ 
        plan: 'vip', 
        premium_until: futureDate.toISOString() 
    }).eq('id', user.id);

    if (!error) {
        alert(`Sucesso! VIP até ${futureDate.toLocaleDateString()}`);
        fetchData(); // Recarrega para garantir
    } else {
        alert("Erro ao atualizar VIP.");
    }
  };

  const handleToggleBlock = async (user: any) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    if(!window.confirm(`Deseja alterar status para ${newStatus}?`)) return;
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
    if (!error) fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("ATENÇÃO: Apagar usuário e todos os dados?")) {
        await supabase.from('profiles').delete().eq('id', id);
        fetchData();
    }
  };
  
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Apagar produto?")) {
        await supabase.from('products').delete().eq('id', id);
        fetchData();
    }
  };

  const formatMoney = (amount: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);
  const isVipActive = (user: UserProfile) => user.plan === 'vip' && user.premium_until && new Date(user.premium_until) > new Date();

  // Filtro de busca
  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.whatsapp?.includes(searchTerm));

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in p-4 md:p-8 bg-gray-50 dark:bg-slate-900 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Painel Admin</h1>
          <p className="text-gray-500 font-medium mt-1">Gestão completa do sistema DesapegAí</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
          {[
            { id: 'dashboard', icon: TrendingUp, label: 'Visão Geral' },
            { id: 'users', icon: Users, label: 'Usuários' },
            { id: 'products', icon: Package, label: 'Produtos' }
          ].map(tab => (
             <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'}`}
             >
                <tab.icon size={18} />
                {tab.label}
             </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            <StatsCard icon={<Users size={24}/>} label="Total Usuários" value={stats.totalUsers} color="blue" />
            <StatsCard icon={<Package size={24}/>} label="Total Desapegos" value={stats.totalProducts} color="purple" />
            <StatsCard icon={<CheckCircle size={24}/>} label="Itens Vendidos" value={stats.totalSold} color="green" />
            <StatsCard icon={<Ban size={24}/>} label="Contas Bloqueadas" value={stats.blockedUsers} color="red" />
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-slide-up">
          
          {/* Barra de Busca e Filtros */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-slate-800/50">
            <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600"><Users size={20}/></div>
                Gerenciar Usuários
            </h3>
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Buscar nome ou telefone..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-5">Usuário</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Plano & Limite</th>
                  <th className="p-5 text-center">Ações (Monetização)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredUsers.map((u: any) => {
                  const vip = isVipActive(u);
                  
                  // --- CORREÇÃO AQUI ---
                  // Agora usamos o campo 'posts_created_total' que é o mesmo que o App usa.
                  // Se for null, usa 0.
                  const usageCount = u.posts_created_total || 0; 
                  const limit = u.posts_limit || 6;
                  const isBlocked = u.status === 'blocked';

                  return (
                    <tr key={u.id} className={`group transition-colors ${isBlocked ? 'bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-10 h-10 rounded-full bg-gray-200 object-cover ring-2 ring-white dark:ring-slate-700 shadow-sm" alt="" />
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-base">{u.full_name}</p>
                                <p className="text-xs text-gray-500 font-mono">{u.whatsapp || 'Sem Whats'}</p>
                            </div>
                        </div>
                      </td>
                      
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {isBlocked ? <><Ban size={12}/> Bloqueado</> : <><CheckCircle size={12}/> Ativo</>}
                        </span>
                      </td>
                      
                      <td className="p-5">
                        {vip ? (
                            <div className="flex flex-col items-start">
                                <span className="flex items-center gap-1.5 bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    <Crown size={12} className="fill-amber-800"/> VIP ILIMITADO
                                </span>
                                <span className="text-[10px] text-gray-500 mt-1 font-medium ml-1">Até {new Date(u.premium_until).toLocaleDateString()}</span>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-600 font-bold dark:text-gray-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">FREE</span>
                                    {usageCount >= limit && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold animate-pulse">LIMITE</span>}
                                </div>
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    {/* Barra de progresso visual */}
                                    <div className={`h-full ${usageCount >= limit ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${Math.min(100, (usageCount/limit)*100)}%`}}></div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">{usageCount} de {limit} usados</p>
                            </div>
                        )}
                      </td>

                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <ActionButton onClick={() => handleAddQuota(u)} icon={<Plus size={16}/>} label="+6" color="blue" />
                            <ActionButton onClick={() => handleAddVip(u, 7, "1 Semana")} icon={<Calendar size={16}/>} label="7D" color="amber" />
                            <ActionButton onClick={() => handleAddVip(u, 30, "1 Mês")} icon={<Star size={16}/>} label="30D" color="orange" isGradient />
                            
                            <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 mx-2"></div>

                            <button onClick={() => handleToggleBlock(u)} className={`p-2 rounded-xl transition-all ${isBlocked ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-400'}`} title={isBlocked ? "Desbloquear" : "Bloquear"}>
                                {isBlocked ? <Unlock size={18}/> : <Lock size={18}/>}
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all" title="Apagar Usuário">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-slide-up">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
             <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600"><Package size={20}/></div>
                Todos os Desapegos
             </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 uppercase text-xs font-bold tracking-wider">
                <tr><th className="p-5">Produto</th><th className="p-5">Preço</th><th className="p-5">Vendedor</th><th className="p-5">Status</th><th className="p-5 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} className="w-12 h-12 rounded-xl object-cover bg-gray-200 shadow-sm" alt="" />
                        <span className="font-bold text-gray-900 dark:text-white line-clamp-1 text-base">{p.title}</span>
                      </div>
                    </td>
                    <td className="p-5 font-black text-indigo-600">{formatMoney(p.price)}</td>
                    <td className="p-5 text-gray-600 dark:text-gray-300">
                        <p className="font-bold">{p.sellerName}</p>
                        <p className="text-xs text-gray-400">{p.sellerPhone}</p>
                    </td>
                    <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {p.status === 'sold' ? 'Vendido' : 'Disponível'}
                        </span>
                    </td>
                    <td className="p-5 text-right">
                       <button onClick={() => handleDeleteProduct(p.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTES VISUAIS (Cards e Botões) ---

const StatsCard = ({ icon, label, value, color }: any) => {
    const colorClasses: any = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        red: 'bg-red-50 text-red-600 border-red-100',
    };
    const c = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`p-6 rounded-3xl border shadow-sm flex items-start justify-between hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700`}>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</p>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${c} dark:bg-opacity-20`}>{icon}</div>
        </div>
    );
};

const ActionButton = ({ onClick, icon, label, color, isGradient }: any) => {
    const base = "px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-transform hover:scale-105 shadow-sm";
    const colors: any = {
        blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        amber: "bg-amber-100 text-amber-700 hover:bg-amber-200",
        orange: "bg-orange-500 text-white hover:bg-orange-600",
    };
    
    return (
        <button onClick={onClick} className={`${base} ${isGradient ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : colors[color]}`}>
            {icon} {label}
        </button>
    );
};
