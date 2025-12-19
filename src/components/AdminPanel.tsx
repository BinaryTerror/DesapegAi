import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Package, Ban, Trash2, CheckCircle, 
  Loader2, Lock, Unlock, Crown, Plus, Calendar, Star
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

      // --- CORREÇÃO DE MAPEAMENTO ---
      // Transformamos os dados do banco para o formato do TypeScript (Product)
      const formattedProducts = (productsData || []).map((p: any) => ({
        ...p,
        // O banco devolve 'user_id', mas nosso código espera 'sellerId'.
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

  // --- AÇÕES DO ADMIN ---

  const handleAddQuota = async (user: UserProfile) => {
    if (!window.confirm(`Adicionar +6 anúncios para ${user.full_name}?`)) return;
    
    // Busca dado atualizado
    const { data: freshUser } = await supabase.from('profiles').select('posts_limit').eq('id', user.id).single();
    const currentLimit = freshUser?.posts_limit ?? 6; 
    const newLimit = currentLimit + 6;

    const { error } = await supabase.from('profiles').update({ posts_limit: newLimit }).eq('id', user.id);
        
    if (!error) {
        alert(`Sucesso! Limite atualizado para ${newLimit}.`);
        // Atualiza a lista localmente
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
        fetchData();
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
    if (window.confirm("Apagar usuário e dados?")) {
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

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div><h1 className="text-3xl font-black text-gray-900 dark:text-white">Painel Administrativo</h1><p className="text-gray-500">Gestão do Sistema</p></div>
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
          {['dashboard', 'users', 'products'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 capitalize rounded-lg text-sm font-bold ${activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>{tab}</button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
               <div className="flex items-center gap-3 text-blue-600 mb-2"><Users/> <span className="text-gray-500 text-sm">Usuários</span></div>
               <h3 className="text-3xl font-black dark:text-white">{stats.totalUsers}</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-purple-500">
               <div className="flex items-center gap-3 text-purple-600 mb-2"><Package/> <span className="text-gray-500 text-sm">Desapegos</span></div>
               <h3 className="text-3xl font-black dark:text-white">{stats.totalProducts}</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
               <div className="flex items-center gap-3 text-green-600 mb-2"><CheckCircle/> <span className="text-gray-500 text-sm">Vendidos</span></div>
               <h3 className="text-3xl font-black dark:text-white">{stats.totalSold}</h3>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl shadow-sm border-l-4 border-red-500">
               <div className="flex items-center gap-3 text-red-600 mb-2"><Ban/> <span className="text-gray-500 text-sm">Bloqueados</span></div>
               <h3 className="text-3xl font-black text-red-600 dark:text-white">{stats.blockedUsers}</h3>
            </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500">
                <tr><th className="p-4">Usuário</th><th className="p-4">Status</th><th className="p-4">Plano / Uso</th><th className="p-4 text-center">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {users.map((u: any) => {
                  const vip = isVipActive(u);
                  
                  // CONTADOR CORRIGIDO: Agora usa sellerId que foi mapeado corretamente
                  const userAdsCount = products.filter(p => p.sellerId === u.id && p.status !== 'sold').length;
                  const limit = u.posts_limit || 6;
                  
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="p-4 font-bold">{u.full_name}<br/><span className="text-xs text-gray-400 font-normal">{u.whatsapp}</span></td>
                      <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.status === 'blocked' ? 'Bloqueado' : 'Ativo'}</span></td>
                      <td className="p-4">
                        {vip ? (
                            <span className="text-amber-600 font-bold flex items-center gap-1"><Crown size={12}/> VIP</span> 
                        ) : (
                            // Exibe a contagem correta: Usado / Limite
                            <span className={userAdsCount >= limit ? 'text-red-600 font-bold' : ''}>Free ({userAdsCount}/{limit})</span>
                        )}
                      </td>
                      <td className="p-4 flex justify-center gap-2">
                            <button onClick={() => handleAddQuota(u)} className="p-1.5 bg-blue-100 text-blue-600 rounded" title="+6 Posts"><Plus size={16}/></button>
                            <button onClick={() => handleAddVip(u, 7, "1 Semana")} className="p-1.5 bg-amber-100 text-amber-600 rounded" title="VIP 7D"><Calendar size={16}/></button>
                            <button onClick={() => handleAddVip(u, 30, "1 Mês")} className="p-1.5 bg-orange-100 text-orange-600 rounded" title="VIP 30D"><Star size={16}/></button>
                            <button onClick={() => handleToggleBlock(u)} className="p-1.5 bg-gray-100 text-gray-600 rounded">{u.status === 'blocked' ? <Unlock size={16}/> : <Lock size={16}/>}</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 bg-red-100 text-red-600 rounded"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500">
                <tr><th className="p-4">Produto</th><th className="p-4">Preço</th><th className="p-4">Vendedor</th><th className="p-4">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="p-4 flex items-center gap-2"><img src={p.imageUrl} className="w-10 h-10 rounded bg-gray-200" /> <span className="font-bold">{p.title}</span></td>
                    <td className="p-4 text-indigo-600 font-bold">{formatMoney(p.price)}</td>
                    <td className="p-4 text-gray-500">{p.sellerName}</td>
                    <td className="p-4"><button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
    </div>
  );
};
