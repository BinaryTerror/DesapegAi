import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
const checkAdminStatus = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log("⛔ Debug: Sem sessão ativa.");
      setIsAdmin(false); 
      setLoading(false); 
      return; 
    }

    console.log("🔍 Debug: Usuário ID:", session.user.id);

    // Chamada RPC
    const { data, error } = await supabase.rpc('am_i_admin');
    
    if (error) {
        console.error("❌ Erro no RPC:", error);
    }
    
    console.log("✅ Resultado do am_i_admin:", data); // Isso tem que ser TRUE

    setIsAdmin(data || false);
  } catch (err) {
    console.error('Falha de segurança:', err);
    setIsAdmin(false);
  } finally {
    setLoading(false);
  }
};

    checkAdminStatus();
  }, []);

  return { isAdmin, loading };
}