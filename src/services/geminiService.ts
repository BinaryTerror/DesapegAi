import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GeminiResponse, Condition } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// --- Função Auxiliar: Converte Arquivo para Base64 ---
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- Função Principal ---
export const generateProductListing = async (
  userInput: string, 
  condition: Condition,
  imageFile?: File | null // <--- AGORA ESTÁ AQUI O PARÂMETRO
): Promise<GeminiResponse | null> => {
  
  if (!genAI) {
    console.error("⚠️ Falta a API Key no arquivo .env");
    return null;
  }

  try {
    // Configuração do Modelo (JSON + Flash)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            suggestedPrice: { type: SchemaType.NUMBER },
            category: { type: SchemaType.STRING }
          },
          required: ["title", "description", "suggestedPrice", "category"]
        }
      }
    });

    const promptText = `
      Atue como especialista em moda no DesapegAi Moçambique.
      Analise o item para venda.
      Condição: "${condition}".
      Nota do usuário: "${userInput}".
      
      INSTRUÇÕES OBRIGATÓRIAS:
Gere informações completas para um item de venda, seguindo rigorosamente os critérios abaixo:

1. TÍTULO
- Crie um título curto, claro e apelativo.
- Baseie-se no aspecto visual do item (se houver imagem) ou nas características mais valorizadas do produto.
- Use palavras que transmitam qualidade, utilidade ou estilo, sem exageros artificiais.

2. DESCRIÇÃO
- Escreva uma descrição persuasiva em português de Moçambique.
- Use gírias leves e naturais (ex.: nice, top, mola), sem parecer forçado.
- Destaque benefícios reais para o dia-a-dia do cliente.
- Considere o clima local (calor, chuva, uso urbano ou rural) sempre que for relevante.
- Evite promessas falsas; foque-se no valor prático.

3. PREÇO (INTELIGENTE)
- Estime o preço em Meticais (MZN) com base nos seguintes factores:
  • Categoria do produto
  • Aparência de qualidade e durabilidade
  • Utilidade prática no contexto moçambicano
  • Se o item é comum ou diferenciado
- Use preços realistas e psicologicamente atractivos (ex.: 1.950 MT em vez de 2.000 MT).
- Mantenha o valor entre 100 e 10.000 MT.

4. CATEGORIA
- Classifique o item numa única categoria:
  Mulher, Homem, Criança, Acessórios, Calçados ou Casa.

5. TOM GERAL
- O conteúdo deve transmitir confiança, utilidade e bom gosto.
- Pense como um vendedor honesto que quer clientes recorrentes, não ganhos rápidos.

    `;

    // Prepara o conteúdo (Texto + Imagem se existir)
    const requestContent: any[] = [promptText];

    if (imageFile) {
      console.log("📸 Convertendo imagem para a IA...");
      const imagePart = await fileToGenerativePart(imageFile);
      requestContent.push(imagePart);
    }

    console.log("🤖 Enviando dados para o Gemini...");
    
    const result = await model.generateContent(requestContent);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Resposta recebida:", text);
    
    return JSON.parse(text) as GeminiResponse;

  } catch (error: any) {
    console.error("❌ Erro na IA:", error);
    return null;
  }
};

// --- Funções Extras ---

export const suggestSellingTips = async (): Promise<string> => {
  if (!genAI) return "Tire fotos com boa iluminação!";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Dica curta sobre vender roupa usada em Maputo.");
    return result.response.text();
  } catch (e) { return "Tire fotos claras."; }
}

export const generateHeroSlogan = async (): Promise<string> => {
  if (!genAI) return "Moda circular Moçambique.";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Slogan curto para app de moda em Moçambique.");
    return result.response.text();
  } catch (e) { return "Seu estilo, nossa economia."; }
}