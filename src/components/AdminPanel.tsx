import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Package, Ban, Trash2, CheckCircle, 
  Search, Shield, AlertTriangle, Loader2, CalendarPlus, Lock, Unlock
} from 'lucide-react';
import { UserProfile, Product } from '../types';

export const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSold: 0,
    blockedUsers: 0 // Nova métrica
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
      // 1. Buscar Usuários
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // 2. Buscar Produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // 3. Calcular Estatísticas
      const totalSold = (productsData || []).filter(p => p.status === 'sold').length;
      
      // Conta usuários onde status é 'blocked'
      // Nota: Certifique-se de que sua tabela profiles tem uma coluna 'status' ou 'banned'
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

  // --- AÇÃO: Adicionar 6 Meses de Plano ---
  const handleAddPlan6Months = async (user: UserProfile) => {
    if (!window.confirm(`Adicionar 6 meses de plano VIP para ${user.full_name}?`)) return;

    // Calcula a data atual + 6 meses
    const now = new Date();
    const futureDate = new Date(now.setMonth(now.getMonth() + 6));
    const isoDate = futureDate.toISOString();

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ 
                plan: 'vip', 
                premium_until: isoDate // Certifique-se de ter essa coluna no Supabase
            })
            .eq('id', user.id);

        if (error) throw error;

        alert(`Sucesso! ${user.full_name} agora é VIP até ${futureDate.toLocaleDateString()}`);
        fetchData(); // Recarrega os dados
    } catch (err: any) {
        alert("Erro ao atualizar plano. Verifique se a coluna 'premium_until' existe na tabela profiles.");
        console.error(err);
    }
  };

  // --- AÇÃO: Bloquear/Desbloquear Usuário ---
  const handleToggleBlock = async (user: any) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const actionName = newStatus === 'blocked' ? 'BLOQUEAR' : 'DESBLOQUEAR';
    
    if (!window.confirm(`Tem certeza que deseja ${actionName} o usuário ${user.full_name}?`)) return;

    const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', user.id);

    if (!error) {
        setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u) as any);
        // Atualiza a contagem localmente para não precisar recarregar tudo
        setStats(prev => ({
            ...prev,
            blockedUsers: newStatus === 'blocked' ? prev.blockedUsers + 1 : prev.blockedUsers - 1
        }));
    } else {
        alert("Erro ao alterar status.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("ATENÇÃO: Isso apagará o usuário e todos os seus produtos. Tem certeza?")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (!error) {
      setUsers(users.filter(u => u.id !== userId));
      setStats(prev => ({...prev, totalUsers: prev.totalUsers - 1}));
      alert("Usuário removido.");
    } else {
      alert("Erro ao remover usuário.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Apagar este desapego?")) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) {
      setProducts(products.filter(p => p.id !== productId));
      setStats(prev => ({...prev, totalProducts: prev.totalProducts - 1}));
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Painel Administrativo</h1>
          <p className="text-gray-500">Gestão do DesapegAí</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            Usuários ({stats.totalUsers})
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'products' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            Desapegos ({stats.totalProducts})
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Card Usuários */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                  <Users size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-1">Total de Usuários</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalUsers}</h3>
            </div>

            {/* Card Desapegos */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                  <Package size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-1">Total de Desapegos</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalProducts}</h3>
            </div>

            {/* Card Vendidos */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
                  <CheckCircle size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-1">Itens Vendidos</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalSold}</h3>
            </div>

            {/* Card BLOQUEADOS (NOVO EM VERMELHO) */}
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-800 text-red-600 dark:text-white rounded-xl">
                  <Ban size={24} />
                </div>
              </div>
              <p className="text-red-600/70 dark:text-red-300 text-sm mb-1 font-bold">Bloqueados</p>
              <h3 className="text-3xl font-black text-red-600 dark:text-white">{stats.blockedUsers}</h3>
            </div>
          </div>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2"><Users className="text-indigo-500"/> Gerenciar Usuários</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500">
                <tr>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">WhatsApp</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Plano</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {users.map((u: any) => (
                  <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${u.status === 'blocked' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-10 h-10 rounded-full bg-gray-200" alt="" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{u.full_name || 'Sem nome'}</p>
                          <p className="text-xs text-gray-400">{u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{u.whatsapp || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {u.status === 'blocked' ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </td>
                    <td className="p-4">
                        <span className="text-xs font-medium text-gray-500">
                            {u.plan === 'vip' ? 'VIP' : 'Grátis'}
                        </span>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center justify-center gap-2">
                           {/* BOTÃO +6 MESES (NOVO) */}
                           <button 
                             onClick={() => handleAddPlan6Months(u)}
                             className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-lg text-xs font-bold hover:scale-105 transition-transform flex items-center gap-1 shadow-sm"
                             title="Adicionar 6 meses de VIP"
                           >
                             <CalendarPlus size={14} /> +6
                           </button>

                           {/* BOTÃO BLOQUEAR/DESBLOQUEAR */}
                           <button 
                             onClick={() => handleToggleBlock(u)}
                             className={`p-2 rounded-lg text-xs font-bold transition-colors ${u.status === 'blocked' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                             title={u.status === 'blocked' ? "Desbloquear" : "Bloquear"}
                           >
                             {u.status === 'blocked' ? <Unlock size={16}/> : <Lock size={16}/>}
                           </button>

                           <button 
                             onClick={() => handleDeleteUser(u.id)} 
                             className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                             title="Apagar Usuário"
                           >
                             <Trash2 size={16}/>
                           </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-xl font-bold flex items-center gap-2"><Package className="text-indigo-500"/> Todos os Desapegos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Preço</th>
                  <th className="p-4">Vendedor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-gray-200" alt="" />
                        <span className="font-bold text-gray-900 dark:text-white line-clamp-1">{p.title}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-indigo-600">{formatMoney(p.price)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                        {p.sellerName} <br/>
                        <span className="text-xs text-gray-400">{p.sellerPhone}</span>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {p.status === 'sold' ? 'Vendido' : 'Disponível'}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                       <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
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
