import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Package, Ban, Trash2, CheckCircle, 
  Loader2, Lock, Unlock, Crown, Plus, Calendar, Star, DollarSign
} from 'lucide-react';
import { UserProfile, Product } from '../types';

export const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
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
      // Buscar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Buscar produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const totalSold = (productsData || []).filter(p => p.status === 'sold').length;
      const blockedUsers = (usersData || []).filter((u: any) => u.status === 'blocked').length;

      setStats({
        totalUsers: usersData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalSold,
        blockedUsers
      });

      setUsers(usersData as UserProfile[]);
      setProducts(productsData as any);

    } catch (error) {
      console.error("Erro ao carregar painel:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE NEGÓCIO (DINHEIRO) ---

  // Opção 1: Adicionar +6 Posts (Mantém Free, aumenta limite)
  const handleAddQuota = async (user: UserProfile) => {
    if (!window.confirm(`Adicionar +6 anúncios para ${user.full_name}?`)) return;
    
    // 1. Busca o valor ATUAL no banco para não ter erro de soma
    const { data: currentUser, error: fetchError } = await supabase
        .from('profiles')
        .select('posts_limit')
        .eq('id', user.id)
        .single();

    if (fetchError) {
        alert("Erro ao buscar dados atuais do usuário.");
        console.error(fetchError);
        return;
    }

    // 2. Soma +6
    const currentLimit = currentUser?.posts_limit || 6;
    const newLimit = currentLimit + 6;

    // 3. Salva no banco (nome da coluna: posts_limit)
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ posts_limit: newLimit })
        .eq('id', user.id);
        
    if (!updateError) {
        alert(`Sucesso! Limite aumentou de ${currentLimit} para ${newLimit}.`);
        fetchData(); // Atualiza a tabela na tela
    } else {
        alert("Erro ao salvar no banco. Abra o console (F12) para ver.");
        console.error("Erro Supabase:", updateError);
    }
  };
  // Opção 2 & 3: Adicionar VIP por Tempo (Ilimitado)
  const handleAddVip = async (user: UserProfile, days: number, label: string) => {
    if (!window.confirm(`Ativar VIP de ${label} para ${user.full_name}? (Anúncios Ilimitados)`)) return;

    const now = new Date();
    // Se já for VIP e não expirou, soma ao tempo restante. Se não, começa de agora.
    let baseDate = now;
    if (user.premium_until && new Date(user.premium_until) > now) {
        baseDate = new Date(user.premium_until);
    }
    
    const futureDate = new Date(baseDate);
    futureDate.setDate(baseDate.getDate() + days); // Adiciona dias

    const { error } = await supabase.from('profiles').update({ 
        plan: 'vip', 
        premium_until: futureDate.toISOString() 
    }).eq('id', user.id);

    if (!error) {
        alert(`Sucesso! VIP ativo até ${futureDate.toLocaleDateString()}`);
        fetchData();
    } else {
        alert("Erro ao atualizar VIP.");
    }
  };

  const handleToggleBlock = async (user: any) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const action = newStatus === 'blocked' ? 'BLOQUEAR' : 'DESBLOQUEAR';
    
    if(!window.confirm(`Deseja realmente ${action} este usuário?`)) return;

    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
    if (!error) fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("ATENÇÃO: Apagar usuário e todos os produtos?")) {
        await supabase.from('profiles').delete().eq('id', id);
        fetchData();
    }
  };
  
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Apagar produto permanentemente?")) {
        await supabase.from('products').delete().eq('id', id);
        fetchData();
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);
  };

  // Helper para verificar VIP na interface
  const isVipActive = (user: UserProfile) => {
    if (user.plan !== 'vip') return false;
    if (!user.premium_until) return false;
    return new Date(user.premium_until) > new Date();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Painel Administrativo</h1>
          <p className="text-gray-500">Gestão Financeira e Conteúdo</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
          {['dashboard', 'users', 'products'].map(tab => (
             <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`px-4 py-2 capitalize rounded-lg text-sm font-bold transition-colors ${activeTab === tab ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
             >
                {tab === 'dashboard' ? 'Visão Geral' : tab === 'users' ? `Usuários (${stats.totalUsers})` : `Desapegos (${stats.totalProducts})`}
             </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
               <div className="flex items-center gap-3 text-blue-600 mb-2"><Users/> <span className="text-gray-500 text-sm font-normal">Usuários</span></div>
               <h3 className="text-3xl font-black dark:text-white">{stats.totalUsers}</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-purple-500">
               <div className="flex items-center gap-3 text-purple-600 mb-2"><Package/> <span className="text-gray-500 text-sm font-normal">Desapegos</span></div>
               <h3 className="text-3xl font-black dark:text-white">{stats.totalProducts}</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
               <div className="flex items-center gap-3 text-green-600 mb-2"><CheckCircle/> <span className="text-gray-500 text-sm font-normal">Vendidos</span></div>
               <h3 className="text-3xl font-black dark:text-white">{stats.totalSold}</h3>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl shadow-sm border-l-4 border-red-500">
               <div className="flex items-center gap-3 text-red-600 mb-2"><Ban/> <span className="text-gray-500 text-sm font-normal dark:text-gray-300">Bloqueados</span></div>
               <h3 className="text-3xl font-black text-red-600 dark:text-white">{stats.blockedUsers}</h3>
            </div>
        </div>
      )}

      {/* USERS TAB (A MAIS IMPORTANTE) */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500">
                <tr>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">WhatsApp</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Plano / Uso</th>
                  <th className="p-4 text-center">Ações (Monetização)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {users.map((u: any) => {
                  const vip = isVipActive(u);
                  // Calcula quantos produtos ATIVOS o usuário tem
                  const userAdsCount = products.filter(p => p.sellerId === u.id && p.status !== 'sold').length;
                  const limit = u.posts_limit || 6;
                  const limitReached = !vip && userAdsCount >= limit;

                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${u.status === 'blocked' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-10 h-10 rounded-full bg-gray-200" alt="" />
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{u.full_name}</p>
                                <p className="text-xs text-gray-400">{u.id.slice(0,8)}</p>
                            </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">{u.whatsapp || '-'}</td>
                      
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.status === 'blocked' ? 'Bloqueado' : 'Ativo'}
                        </span>
                      </td>
                      
                      {/* MOSTRADOR DE LIMITE */}
                      <td className="p-4">
                        {vip ? (
                            <div className="flex flex-col items-start">
                                <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-200">
                                    <Crown size={12} className="fill-amber-500"/> VIP (Ilimitado)
                                </span>
                                <span className="text-[10px] text-gray-500 mt-1">Expira: {new Date(u.premium_until).toLocaleDateString()}</span>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 font-bold dark:text-gray-300">Free</span>
                                    {limitReached && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">Travado</span>}
                                </div>
                                <div className="text-xs mt-1 text-gray-500">
                                    Uso: <span className={limitReached ? "text-red-600 font-bold" : "text-green-600 font-bold"}>{userAdsCount}</span> / {limit}
                                </div>
                            </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                            {/* BOTÃO 1: +6 ANUNCIOS */}
                            <button 
                                onClick={() => handleAddQuota(u)} 
                                className="px-2 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1" 
                                title="Liberar +6 anúncios (Mantém plano Free)"
                            >
                                <Plus size={14} /> <span className="text-xs font-bold">+6</span>
                            </button>

                            {/* BOTÃO 2: VIP 7 Dias */}
                            <button 
                                onClick={() => handleAddVip(u, 7, "1 Semana")} 
                                className="px-2 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-100 transition flex items-center gap-1" 
                                title="VIP Ilimitado por 7 dias"
                            >
                                <Calendar size={14} /> <span className="text-xs font-bold">7D</span>
                            </button>

                            {/* BOTÃO 3: VIP 30 Dias */}
                            <button 
                                onClick={() => handleAddVip(u, 30, "1 Mês")} 
                                className="px-2 py-1.5 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-lg hover:brightness-110 transition flex items-center gap-1 shadow-sm" 
                                title="VIP Ilimitado por 30 dias"
                            >
                                <Star size={14} className="fill-white"/> <span className="text-xs font-bold">30D</span>
                            </button>

                            <div className="w-px h-6 bg-gray-200 mx-1"></div>

                            {/* Bloquear / Apagar */}
                            <button onClick={() => handleToggleBlock(u)} className={`p-1.5 rounded-lg ${u.status === 'blocked' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`} title={u.status === 'blocked' ? "Desbloquear" : "Bloquear"}>
                                {u.status === 'blocked' ? <Unlock size={16}/> : <Lock size={16}/>}
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100" title="Apagar Usuário"><Trash2 size={16}/></button>
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
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500">
                <tr><th className="p-4">Produto</th><th className="p-4">Preço</th><th className="p-4">Vendedor</th><th className="p-4">Status</th><th className="p-4 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-gray-200" alt="" />
                        <span className="font-bold text-gray-900 dark:text-white line-clamp-1">{p.title}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-indigo-600">{formatMoney(p.price)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{p.sellerName}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.status === 'sold' ? 'Vendido' : 'Disponível'}</span></td>
                    <td className="p-4 text-right"><button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></td>
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
