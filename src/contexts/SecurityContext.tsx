import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface SecurityContextType {
  isAdminMode: boolean;
  unlockAdmin: (keyword: string) => boolean;
  lockAdmin: () => void;
  logAction: (action: string, details: string) => Promise<void>;
  checkRateLimit: (action: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const navigate = useNavigate();
  

const SECRET_KEYWORD = import.meta.env.VITE_ADMIN_SECRET_KEY || "";

  const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 Minutos

  // 1. AUTO-LOGOUT (Timer de Inatividade)
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(async () => {
        console.log("Sessão expirada por inatividade.");
        await supabase.auth.signOut();
        setIsAdminMode(false);
        navigate('/');
        alert("Sessão encerrada por segurança (30min inativo).");
      }, INACTIVITY_LIMIT);
    };

    // Eventos que resetam o timer
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer(); // Inicia

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [navigate]);

  // 2. PALAVRA-CHAVE SECRETA
  const unlockAdmin = (keyword: string) => {
    if (keyword === SECRET_KEYWORD) {
      setIsAdminMode(true);
      return true;
    }
    return false;
  };

  const lockAdmin = () => setIsAdminMode(false);

  // 3. LOGS DE AUDITORIA
  const logAction = async (action: string, details: string) => {
    await supabase.rpc('log_admin_action', { 
      action_text: action, 
      details_text: details 
    });
  };

  // 4. RATE LIMITING (Chamada ao Banco)
  const checkRateLimit = async (action: string) => {
    const { data } = await supabase.rpc('check_rate_limit', { 
      action_name: action, 
      max_count: 10 // Max 10 ações por minuto
    });
    return data as boolean;
  };

  return (
    <SecurityContext.Provider value={{ isAdminMode, unlockAdmin, lockAdmin, logAction, checkRateLimit }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within a SecurityProvider');
  return context;
};