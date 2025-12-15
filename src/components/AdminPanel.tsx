import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { Trash2, Unlock, Lock, ShieldAlert, Loader2, Search } from 'lucide-react';

// Interface estendida apenas para usoAA local neste componente
interface UserWithStats extends UserProfile {
  product_count: number;
}

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Busca dados do Supabase
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Tenta usar a função RPC otimizada se você criou no SQL
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_and_product_counts');

      if (!rpcError && rpcData) {
        setUsers(rpcData);
      } else {
        // FALLBACK: Se não tiver RPC, busca manualmente (menos eficiente mas funciona)
        console.warn("RPC não encontrada, usando método manual. Crie a função SQL para melhor performance.");
        
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (profiles) {
          const usersWithCounts = await Promise.all(profiles.map(async (p) => {
             const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', p.id);
             return { ...p, product_count: count || 0 };
          }));
          setUsers(usersWithCounts as UserWithStats[]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar painel:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Alternar status Ilimitado
  const toggleUnlimited = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_unlimited: !currentStatus })
      .eq('id', userId);
    
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_unlimited: !currentStatus } : u));
    } else {
      alert("Erro ao atualizar status.");
    }
  };

  // Apagar Usuário
  const deleteUser = async (userId: string) => {
    if (!window.confirm('TEM CERTEZA? Isso apagará o perfil e todos os produtos deste usuário.')) return;

    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    } else {
      alert("Erro ao apagar. Você precisa de permissões de admin no banco de dados.");
    }
  };

  // Filtragem local
  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.whatsapp?.includes(searchTerm)
  );

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-slate-700">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-black flex items-center gap-2 text-red-600 dark:text-red-500">
            <ShieldAlert size={28} /> Painel Administrativo
          </h2>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar usuário..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-slate-700 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4">Usuário</th>
                <th className="p-4">WhatsApp</th>
                <th className="p-4 text-center">Produtos</th>
                <th className="p-4 text-center">Status Venda</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                        <img src={`https://ui-avatars.com/api/?name=${user.full_name}&background=random`} alt="" className="w-full h-full object-cover"/>
                      </div>
                      {user.full_name}
                      {user.role === 'admin' && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full uppercase">Admin</span>}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 font-mono">
                      {user.whatsapp || 'Sem número'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.product_count >= 20 && !user.is_unlimited ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.product_count} / 20
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {user.is_unlimited ? (
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg text-xs font-bold">
                          <Unlock size={12} /> Ilimitado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-xs font-bold">
                          <Lock size={12} /> Padrão
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button 
                        onClick={() => toggleUnlimited(user.id, user.is_unlimited)}
                        title={user.is_unlimited ? "Bloquear Limite" : "Liberar Ilimitado"}
                        className={`p-2 rounded-lg transition-colors ${user.is_unlimited ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        {user.is_unlimited ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      
                      <button 
                        onClick={() => deleteUser(user.id)}
                        title="Excluir Usuário"
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};