import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(3, "Título muito curto").max(50, "Título muito longo").regex(/^[a-zA-Z0-9À-ÿ\s.,!?'-]+$/, "Caracteres inválidos no título"),
  description: z.string().min(10, "Descrição muito curta").max(500, "Descrição muito longa"),
  price: z.number().min(5).max(1000000),
  category: z.enum(["Mulher", "Homem", "Criança", "Acessórios", "Calçados", "Casa"]),
  condition: z.enum(["Novo", "Como Novo", "Bom Estado", "Marcas de Uso"]),
  location: z.string().max(50),
  sellerPhone: z.string().regex(/^8[2-7]\d{7}$/, "Número de Moçambique inválido (ex: 8xxxxxxxx)")
});