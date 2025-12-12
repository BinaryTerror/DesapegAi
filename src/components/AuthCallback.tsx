import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Aguarda o Supabase processar o retorno do OAuth
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao processar login:', error);
          navigate('/');
          return;
        }

        if (session) {
          console.log('✅ Usuário logado:', session.user.email);
          
          // Pequeno delay para garantir processamento
          setTimeout(() => {
            navigate('/');
          }, 800);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Erro no callback:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Processando login...</h2>
        <p className="text-gray-600 dark:text-gray-400">Um momento, por favor</p>
      </div>
    </div>
  );
}