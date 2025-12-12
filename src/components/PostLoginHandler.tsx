import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function PostLoginHandler() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'processing' | 'needPhone' | 'complete'>('processing');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    checkUserAndPhone();
  }, []);

  async function checkUserAndPhone() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Verifica se já tem whatsapp no perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('whatsapp')
        .eq('id', user.id)
        .single();
      
      if (!profile?.whatsapp) {
        setStep('needPhone'); // Pede telefone
      } else {
        navigate('/'); // Já tem tudo, vai pra home
      }
    } else {
      navigate('/login'); // Não está logado, volta pro login
    }
  }

  async function savePhoneNumber() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && phone) {
      await supabase
        .from('profiles')
        .update({ whatsapp: phone })
        .eq('id', user.id);
      
      navigate('/'); // Redireciona pra home
    }
  }

  if (step === 'needPhone') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4">📱 Qual seu WhatsApp?</h2>
          <p className="text-gray-600 mb-6">Para contato com vendedores</p>
          
          <input
            type="tel"
            placeholder="Ex: 853691613"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border rounded-xl mb-4"
          />
          
          <button
            onClick={savePhoneNumber}
            className="w-full bg-black text-white py-3 rounded-xl font-bold"
          >
            Salvar e Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4">Processando login...</p>
      </div>
    </div>
  );
}