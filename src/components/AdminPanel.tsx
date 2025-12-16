import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { Trash2, Unlock, Lock, ShieldAlert, Loader2, Search, Plus, Calendar } from 'lucide-react';

interface UserWithStats extends UserProfile {
  product_count: number;
}

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_users_and_product_counts');
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // Adiciona +6 ao limite
  const addLimit = async (userId: string, currentLimit: number) => {
    if (!window.confirm("Adicionar +6 posts para este usuário?")) return;
    const newLimit = (currentLimit || 6) + 6;
    await supabase.from('profiles').update({ post_limit: newLimit }).eq('id', userId);
    fetchUsers();
  };

  // Define Ilimitado por tempo
  const setUnlimited = async (userId: string, days: number) => {
    if (!window.confirm(`Liberar ilimitado por ${days} dias?`)) return;
    const date = new Date();
    date.setDate(date.getDate() + days); // Soma os dias
    
    await supabase.from('profiles').update({ 
      unlimited_until: date.toISOString(),
      is_unlimited: true // Mantém flag antiga também
    }).eq('id', userId);
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('TEM CERTEZA?')) return;
    await supabase.from('profiles').delete().eq('id', userId);
    fetchUsers();
  };

  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-slate-700">
        <h2 className="text-2xl font-black flex items-center gap-2 text-red-600 mb-6"><ShieldAlert /> Painel Admin</h2>
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 mb-6 bg-gray-50 dark:bg-slate-900 border rounded-xl" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b dark:border-slate-700"><th className="p-3">Usuário</th><th className="p-3">Posts</th><th className="p-3">Plano Atual</th><th className="p-3 text-right">Ações</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const isVip = user.unlimited_until && new Date(user.unlimited_until) > new Date();
                const limit = user.post_limit || 6;
                return (
                  <tr key={user.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="p-3 font-bold">{user.full_name}<br/><span className="text-xs text-gray-500 font-normal">{user.whatsapp}</span></td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${user.product_count >= limit && !isVip ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{user.product_count} / {isVip ? '∞' : limit}</span></td>
                    <td className="p-3">
                      {isVip ? <span className="text-green-600 font-bold flex gap-1"><Calendar size={14}/> Até {new Date(user.unlimited_until!).toLocaleDateString()}</span> : <span className="text-gray-500">Padrão</span>}
                    </td>
                    <td className="p-3 flex justify-end gap-2">
                      <button onClick={() => addLimit(user.id, limit)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="+6 Posts"><Plus size={16}/></button>
                      <button onClick={() => setUnlimited(user.id, 7)} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100" title="1 Semana"><Calendar size={16}/></button>
                      <button onClick={() => setUnlimited(user.id, 30)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100" title="1 Mês"><ShieldAlert size={16}/></button>
                      <button onClick={() => deleteUser(user.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
