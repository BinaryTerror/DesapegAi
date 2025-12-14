import { createClient } from '@supabase/supabase-js'

// Usamos uma string vazia como fallback para o site não quebrar na hora
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""


console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key existe?", supabaseKey.length > 0 ? "Sim" : "Não");

export const supabase = createClient(supabaseUrl, supabaseKey)