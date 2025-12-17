import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { 
  Trash2, Unlock, ShieldAlert, Loader2, Search, Plus, Calendar, 
  Users, ShoppingBag, Crown, AlertTriangle, TrendingUp, CheckCircle, Copy, Phone
} from 'lucide-react';

interface UserWithStats extends UserProfile {
  product_count: number;
}

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Métricas do Dashboard
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    vipUsers: 0,
    blockedUsers: 0
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_users_and_product_counts');
    
    if (data) {
      setUsers(data);
      
      // Calcular Métricas
      const totalUsers = data.length;
      const totalProducts = data.reduce((acc: number, u: any) => acc + (u.product_count || 0), 0);
      const vipUsers = data.filter((u: any) => u.is_unlimited || (u.unlimited_until && new Date(u.unlimited_until) > new Date())).length;
      
      // Usuários que atingiram o limite e não são VIP
      const blockedUsers = data.filter((u: any) => {
        const isVip = u.is_unlimited || (u.unlimited_until && new Date(u.unlimited_until) > new Date());
        const limit = u.post_limit || 6;
        return !isVip && u.product_count >= limit;
      }).length;

      setStats({ totalUsers, totalProducts, vipUsers, blockedUsers });
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- AÇÕES ---

  const addLimit = async (userId: string, currentLimit: number) => {
    const amount = 6;
    if (!window.confirm(`Adicionar +${amount} posts ao limite deste usuário?`)) return;
    const newLimit = (currentLimit || 6) + amount;
    await supabase.from('profiles').update({ post_limit: newLimit }).eq('id', userId);
    fetchUsers();
  };

  const setUnlimited = async (userId: string, days: number) => {
    if (!window.confirm(`Liberar ilimitado por ${days} dias?`)) return;
    const date = new Date();
    date.setDate(date.getDate() + days);
    await supabase.from('profiles').update({ 
      unlimited_until: date.toISOString(),
      is_unlimited: true 
    }).eq('id', userId);
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('⚠️ PERIGO: Isso apagará o usuário e TODOS os anúncios dele. Continuar?')) return;
    await supabase.from('profiles').delete().eq('id', userId);
    fetchUsers();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.whatsapp?.includes(searchTerm)
  );

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in pb-24">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="text-red-600" /> Painel Admin
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie usuários, planos e métricas.</p>
        </div>
        <button onClick={fetchUsers} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
          Atualizar Dados
        </button>
      </div>

      {/* --- DASHBOARD (CARDS) --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Users size={20}/></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Usuários</p>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalUsers}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600"><ShoppingBag size={20}/></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Anúncios</p>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalProducts}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600"><Crown size={20}/></div>
            <p className="text-xs font-bold text-gray-500 uppercase">VIPs Ativos</p>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.vipUsers}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600"><AlertTriangle size={20}/></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Bloqueados (Limite)</p>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.blockedUsers}</p>
        </div>
      </div>

      {/* --- BUSCA --- */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar usuário por nome ou WhatsApp..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white shadow-sm"
        />
      </div>

      {/* --- LISTA DE USUÁRIOS --- */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
        
        {/* TABELA (DESKTOP) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-300 border-b dark:border-slate-700">
                <th className="p-4 font-bold">Usuário</th>
                <th className="p-4 font-bold text-center">Uso / Limite</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => <UserRow key={user.id} user={user} actions={{ addLimit, setUnlimited, deleteUser, copyToClipboard }} />)}
            </tbody>
          </table>
        </div>

        {/* CARDS (MOBILE) */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
          {filteredUsers.map(user => <UserCardMobile key={user.id} user={user} actions={{ addLimit, setUnlimited, deleteUser, copyToClipboard }} />)}
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-10 text-center text-gray-500">Nenhum usuário encontrado.</div>
        )}
      </div>
    </div>
  );
};

// --- SUBCOMPONENTES PARA LIMPAR O CÓDIGO ---

const UserRow = ({ user, actions }: { user: UserWithStats, actions: any }) => {
  const isVip = user.unlimited_until && new Date(user.unlimited_until) > new Date();
  const limit = user.post_limit || 6;
  const isLimitReached = user.product_count >= limit && !isVip;

  return (
    <tr className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} className="w-10 h-10 rounded-full bg-gray-200" alt="" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{user.full_name}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-indigo-500" onClick={() => actions.copyToClipboard(user.whatsapp || '')}>
              <Phone size={12}/> {user.whatsapp || 'N/A'}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 text-center">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isLimitReached ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {user.product_count} / {isVip ? '∞' : limit}
        </span>
      </td>
      <td className="p-4">
        {isVip ? (
          <div className="text-green-600 font-bold text-xs flex flex-col">
            <span className="flex items-center gap-1"><Crown size={14}/> VIP ATIVO</span>
            <span className="text-[10px] opacity-70">Até {new Date(user.unlimited_until!).toLocaleDateString()}</span>
          </div>
        ) : <span className="text-gray-400 text-xs font-bold">PADRÃO</span>}
      </td>
      <td className="p-4">
        <div className="flex justify-end gap-2">
          <ActionButton onClick={() => actions.addLimit(user.id, limit)} color="blue" icon={<Plus size={16}/>} label="+6" />
          <ActionButton onClick={() => actions.setUnlimited(user.id, 30)} color="indigo" icon={<Calendar size={16}/>} label="30D" />
          <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 mx-1"></div>
          <ActionButton onClick={() => actions.deleteUser(user.id)} color="red" icon={<Trash2 size={16}/>} />
        </div>
      </td>
    </tr>
  );
};

const UserCardMobile = ({ user, actions }: { user: UserWithStats, actions: any }) => {
  const isVip = user.unlimited_until && new Date(user.unlimited_until) > new Date();
  const limit = user.post_limit || 6;
  
  return (
    <div className="p-4 bg-white dark:bg-slate-800">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} className="w-10 h-10 rounded-full bg-gray-200" alt="" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{user.full_name}</p>
            <p className="text-xs text-gray-500">{user.whatsapp || 'Sem contato'}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${isVip ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {isVip ? 'VIP' : 'Free'}
        </div>
      </div>
      
      <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl mb-4">
         <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Posts</p>
            <p className="font-black dark:text-white">{user.product_count}</p>
         </div>
         <div className="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>
         <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Limite</p>
            <p className="font-black dark:text-white">{isVip ? '∞' : limit}</p>
         </div>
         <div className="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>
         <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Expira</p>
            <p className="font-bold text-xs dark:text-white">{isVip ? new Date(user.unlimited_until!).toLocaleDateString() : '-'}</p>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => actions.addLimit(user.id, limit)} className="py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100">
           <Plus size={14}/> +6 Posts
        </button>
        <button onClick={() => actions.setUnlimited(user.id, 30)} className="py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-100">
           <Crown size={14}/> 1 Mês
        </button>
        <button onClick={() => actions.deleteUser(user.id)} className="py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-100">
           <Trash2 size={14}/> Banir
        </button>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, color, icon, label }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };
  
  return (
    <button onClick={onClick} className={`p-2 rounded-lg transition-colors flex items-center gap-2 font-bold text-xs ${colors[color]}`}>
      {icon} {label}
    </button>
  );
};
