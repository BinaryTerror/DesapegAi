import React from 'react';
import { X, Package, Calendar, Smartphone } from 'lucide-react';

interface PlansModalProps {
  onClose: () => void;
  userEmail: string;
  userId: string;
}

export const PlansModal: React.FC<PlansModalProps> = ({ onClose, userEmail, userId }) => {
  const adminPhone = '853691613'; // Seu número

  const handlePayPlan = (planName: string, price: number) => {
    const msg = `Olá Admin! Quero contratar o plano: *${planName}* (${price}MT).\n\nMeu Email: ${userEmail}\nMeu ID: ${userId}\n\nComo faço o pagamento (M-Pesa/e-Mola)?`;
    window.open(`https://wa.me/258${adminPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-lg text-center animate-scale-up max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-black dark:text-white mb-2">Aumente suas Vendas! 🚀</h2>
        <p className="text-gray-500 text-sm mb-6">Escolha um pacote para adicionar mais produtos ou remover limites:</p>
        
        <div className="space-y-3 mb-6">
          {/* Opção 1: +6 Posts */}
          <button onClick={() => handlePayPlan('Pacote +6 Posts', 20)} className="w-full bg-gray-50 dark:bg-slate-700 p-4 rounded-xl border-2 border-transparent hover:border-indigo-500 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full text-indigo-600 dark:text-indigo-300"><Package size={20}/></div>
              <div className="text-left">
                <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600">+6 Publicações</p>
                <p className="text-xs text-gray-500">Acumulativo</p>
              </div>
            </div>
            <span className="font-black text-xl text-gray-900 dark:text-white">20 MT</span>
          </button>

          {/* Opção 2: 1 Semana VIP */}
          <button onClick={() => handlePayPlan('1 Semana Ilimitado', 50)} className="w-full bg-gray-50 dark:bg-slate-700 p-4 rounded-xl border-2 border-transparent hover:border-green-500 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full text-green-600 dark:text-green-300"><Calendar size={20}/></div>
              <div className="text-left">
                <p className="font-bold text-gray-900 dark:text-white group-hover:text-green-600">1 Semana VIP</p>
                <p className="text-xs text-gray-500">Posts Ilimitados</p>
              </div>
            </div>
            <span className="font-black text-xl text-gray-900 dark:text-white">50 MT</span>
          </button>

          {/* Opção 3: 1 Mês VIP */}
          <button onClick={() => handlePayPlan('1 Mês Ilimitado', 180)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-xl text-white shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-between relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="bg-white/20 p-2 rounded-full"><Smartphone size={20}/></div>
              <div className="text-left">
                <p className="font-bold">1 Mês Pro</p>
                <p className="text-xs text-indigo-100">Tudo Ilimitado</p>
              </div>
            </div>
            <span className="font-black text-2xl relative z-10">180 MT</span>
          </button>
        </div>
        <p className="text-xs text-gray-400">Pagamento via M-Pesa/e-Mola. Ativação após envio do comprovativo no WhatsApp.</p>
      </div>
    </div>
  );
};
