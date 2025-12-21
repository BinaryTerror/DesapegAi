import React from 'react';
import { X, FileText, ShieldAlert, CheckCircle, LogOut } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
  onDecline?: () => void; // Função de Logout
  isMandatory?: boolean;  // Se for true, obriga a aceitar ou sair
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose, onDecline, isMandatory = false }) => {
  
  const handleAccept = () => {
    localStorage.setItem('desapegai_terms_accepted', 'true');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" 
      onClick={() => { if (!isMandatory) onClose(); }} // Só fecha clicando fora se não for obrigatório
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2 dark:text-white">
            <FileText className="text-indigo-600" /> Termos de Uso
          </h2>
          
          {/* Só mostra o X se NÃO for obrigatório (leitura voluntária) */}
          {!isMandatory && (
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-gray-600 dark:text-gray-300 space-y-4 text-sm leading-relaxed">
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 mb-4">
            <h3 className="font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
              <ShieldAlert size={16}/> Regras Rápidas
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Somos apenas um intermediário.</li>
              <li>Você negocia direto com o outro usuário.</li>
              <li>Pague só em lugares públicos e confira o produto antes.</li>
              <li>Seja respeitoso e não poste nada ilegal ou fraudulento.</li>
              <li>Não nos responsabilizamos por perdas, golpes ou produtos.</li>
              <li>Mensagens entre usuários não são 100% privadas.</li>
              <li>Use o app com responsabilidade.</li>
            </ul>
          </div>

          <p>Bem-vindo ao <strong>DesapegAí</strong>. Ao continuar, você deve aceitar:</p>

          <section>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">1. Intermediação</h3>
            <p>O DesapegAí é uma plataforma de classificados. Nós não vendemos os produtos, não participamos das negociações e não intermediamos pagamentos ou entregas. Toda a responsabilidade da transação é do comprador e do vendedor.</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">2. Segurança</h3>
            <p>Recomendamos fortemente que todas as negociações ocorram em locais públicos e movimentados. Nunca faça pagamentos antecipados sem ter a garantia do produto em mãos. Confira o item cuidadosamente antes de fechar negócio.</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">3. Conduta</h3>
            <p>É proibido postar conteúdo ilegal, fraudulento, ofensivo ou que viole direitos autorais. Contas que desrespeitarem essa regra serão banidas imediatamente.</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">4. Isenção de Responsabilidade</h3>
            <p>Não nos responsabilizamos por perdas financeiras, golpes, qualidade dos produtos ou desentendimentos entre usuários. Use o app com responsabilidade e cautela.</p>
          </section>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row gap-3">
          
          {isMandatory && onDecline && (
            <button 
              onClick={onDecline} 
              className="w-full md:w-1/3 py-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} /> Recusar e Sair
            </button>
          )}

          <button 
            onClick={handleAccept} 
            className={`w-full ${isMandatory ? 'md:w-2/3' : ''} py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold flex justify-center items-center gap-2 hover:opacity-90 transition-opacity`}
          >
            <CheckCircle size={18} /> Li e Concordo
          </button>
        </div>

      </div>
    </div>
  );
};
