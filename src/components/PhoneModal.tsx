import React, { useState } from 'react';
import { X, Loader2, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface PhoneModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PhoneModal: React.FC<PhoneModalProps> = ({ userId, onClose, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!phone.trim() || saving) return;
    
    // Validação básica
    const phoneRegex = /^[0-9]{9,13}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      setError('Número inválido. Use apenas números (ex: 853691613)');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          whatsapp: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
      // Sucesso
      onSuccess();
      onClose();
      
    } catch (err: any) {
      console.error('Erro ao salvar telefone:', err);
      setError(err.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">WhatsApp para Contato</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Vendedores vão usar para falar com você</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            disabled={saving}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seu número (WhatsApp)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 853691613"
                className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                disabled={saving}
                maxLength={15}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Apenas números. Este número será visível para vendedores quando você demonstrar interesse em um produto.
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Pular
              </button>
              <button
                onClick={handleSave}
                disabled={!phone.trim() || saving}
                className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Salvando...
                  </>
                ) : (
                  'Salvar Número'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};