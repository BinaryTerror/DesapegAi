// MUDANÇA: Usamos 'Type' em vez de SchemaType
import { GoogleGenAI, Type } from "@google/genai"; 
import { GeminiResponse } from "../t/types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Inicialização segura
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateProductListing = async (
  userInput: string, 
  condition: string
): Promise<GeminiResponse | null> => {
  
  if (!ai || !apiKey) {
    console.warn("⚠️ Gemini API Key não encontrada.");
    return null;
  }

  try {
    const model = "gemini-2.0-flash";
    
    const prompt = `
      Atue como um especialista em moda e vendas online em Moçambique para o app "DesapegAi".
      Crie um anúncio para vender um item de roupa usada.
      Item: "${userInput}". Condição: "${condition}".
      
      Retorne APENAS um JSON com: title, description, suggestedPrice (number), category.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          // MUDANÇA: Usando Type.OBJECT e Type.STRING
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedPrice: { type: Type.NUMBER },
            category: { type: Type.STRING }
          },
          required: ["title", "description", "suggestedPrice", "category"]
        }
      }
    });

    // Ajuste para pegar o texto (algumas versões usam .text(), outras .text)
    const jsonText = typeof response.text === 'function' ? response.text : response.text;
    
    if (!jsonText) return null;

    return JSON.parse(jsonText) as GeminiResponse;

  } catch (error) {
    console.error("Erro ao gerar descrição com Gemini:", error);
    return null;
  }
};

export const suggestSellingTips = async (): Promise<string> => {
  if (!ai) return "Tire fotos claras e detalhadas.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Dê uma dica muito curta (máx 1 frase) sobre moda sustentável em Maputo.",
    });
    return (typeof response.text === 'function' ? response.text : response.text) || "Tire boas fotos!";
  } catch (e) {
    return "Tire fotos claras e detalhadas.";
  }
}

export const generateHeroSlogan = async (): Promise<string> => {
  if (!ai) return "Moda circular que conecta Moçambique.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Slogan curto (máx 8 palavras) sobre moda usada em Moçambique.",
    });
    return (typeof response.text === 'function' ? response.text : response.text) || "Seu estilo, nossa economia.";
  } catch (e) {
    return "Moda circular que conecta Moçambique.";
  }
}