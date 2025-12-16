import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { Trash2, Unlock, ShieldAlert, Loader2, Search, Plus, Calendar, CheckCircle } from 'lucide-react';

interface UserWithStats extends UserProfile {
  product_count: number;
}

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    // Chama a função RPC que criamos no SQL
    const { data, error } = await supabase.rpc('get_users_and_product_counts');
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // Lógica para adicionar +6 posts ao limite atual
  const addLimit = async (userId: string, currentLimit: number) => {
    if (!window.confirm("Confirmar pagamento e adicionar +6 posts?")) return;
    
    // Se o limite for nulo, assume 6 e soma +6 = 12
    const newLimit = (currentLimit || 6) + 6;
    
    const { error } = await supabase
      .from('profiles')
      .update({ post_limit: newLimit })
      .eq('id', userId);
      
    if(!error) {
       alert("Limite aumentado com sucesso!");
       fetchUsers();
    }
  };

  // Lógica para dar Ilimitado por X dias
  const setUnlimited = async (userId: string, days: number) => {
    if (!window.confirm(`Liberar acesso ilimitado por ${days} dias?`)) return;
    
    const date = new Date();
    date.setDate(date.getDate() + days); // Data de hoje + dias comprados
    
    const { error } = await supabase.from('profiles').update({ 
      unlimited_until: date.toISOString(), // Salva a data futura
      is_unlimited: true 
    }).eq('id', userId);

    if(!error) {
        alert("Acesso VIP liberado!");
        fetchUsers();
    }
  };

  // Apagar usuário e tudo dele
  const deleteUser = async (userId: string) => {
    if (!window.confirm('TEM CERTEZA? Apagará tudo deste usuário.')) return;
    await supabase.from('profiles').delete().eq('id', userId);
    fetchUsers();
  };

  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-slate-700">
        <h2 className="text-2xl font-black flex items-center gap-2 text-red-600 mb-6"><ShieldAlert /> Gestão de Usuários</h2>
        
        <input 
          type="text" 
          placeholder="Buscar por nome..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="w-full p-3 mb-6 bg-gray-50 dark:bg-slate-900 border rounded-xl dark:text-white" 
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b dark:border-slate-700 uppercase text-xs">
                 <th className="p-3">Usuário</th>
                 <th className="p-3 text-center">Uso</th>
                 <th className="p-3">Status</th>
                 <th className="p-3 text-right">Liberar Acesso</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                // Verifica se é VIP pela data
                const isVip = user.unlimited_until && new Date(user.unlimited_until) > new Date();
                const limit = user.post_limit || 6;
                const isLimitReached = user.product_count >= limit && !isVip;

                return (
                  <tr key={user.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="p-3 font-bold text-gray-900 dark:text-white">
                        {user.full_name}
                        <div className="text-xs text-gray-500 font-normal">{user.whatsapp || 'Sem zap'}</div>
                    </td>
                    
                    <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${isLimitReached ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                           {user.product_count} / {isVip ? '∞' : limit}
                        </span>
                    </td>
                    
                    <td className="p-3">
                      {isVip ? (
                        <span className="text-green-600 font-bold flex gap-1 items-center text-xs">
                           <CheckCircle size={14}/> Até {new Date(user.unlimited_until!).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Padrão</span>
                      )}
                    </td>
                    
                    <td className="p-3 flex justify-end gap-2">
                      {/* Botão +6 Posts */}
                      <button onClick={() => addLimit(user.id, limit)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Adicionar +6 Posts (20MT)">
                         <Plus size={18}/>
                      </button>

                      {/* Botão 7 Dias */}
                      <button onClick={() => setUnlimited(user.id, 7)} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100" title="Dar 1 Semana VIP (50MT)">
                         <Calendar size={18}/>
                      </button>

                      {/* Botão 30 Dias */}
                      <button onClick={() => setUnlimited(user.id, 30)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100" title="Dar 1 Mês VIP (180MT)">
                         <Unlock size={18}/>
                      </button>
                      
                      <div className="w-px h-6 bg-gray-200 mx-1"></div>

                      <button onClick={() => deleteUser(user.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Banir">
                         <Trash2 size={18}/>
                      </button>
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
