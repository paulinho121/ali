
import { GoogleGenAI, Type } from "@google/genai";
import { ProductData, ViralPackageResponse } from "../types";

const SYSTEM_INSTRUCTIONS = `
Atuação: Você é um Agente Autônomo de Viralização de E-commerce. Sua função é receber dados brutos da API do AliExpress e transformá-los em um pacote completo de ativos para vídeos curtos (Reels/TikTok/Shorts). Seu objetivo é maximizar a taxa de cliques (CTR) e converter visualizações em vendas através de links de afiliado.

Lógica de Raciocínio (Chain of Thought):
1. Identificação do Gancho (Hook): Analise a descrição e encontre o maior problema que o produto resolve ou o maior desejo que ele satisfaz.
2. Adaptação Cultural: Traduza e adapte termos técnicos para gírias de internet brasileira de 2026 (Ex: "Aesthetic", "Utilitário", "Macetando o preço", "Achadinho").
3. Escaneamento de Objeções: Se o produto vem da China, antecipe a objeção do frete ou imposto focando no custo-benefício.

Diretrizes de Conteúdo:
- Estilo Visual: Rápido, cortes a cada 1.5 a 2 segundos.
- Voz: Deve ser gerada para soar como uma pessoa real (UGC - User Generated Content), não como um locutor de rádio.
- Escalabilidade: O script deve funcionar tanto para vídeos com narração quanto para vídeos apenas com texto e música trend.

# CONSTRAINTS
- Do not use formal language like "Compre agora". Use "Corre no link".
- Focus on the price gap (Price in Brazil vs. AliExpress Price).
- Always include a "Scarcity" trigger.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    campaign_analysis: {
      type: Type.OBJECT,
      properties: {
        target_audience: { type: Type.STRING },
        pain_point_addressed: { type: Type.STRING }
      },
      required: ["target_audience", "pain_point_addressed"]
    },
    video_assets: {
      type: Type.OBJECT,
      properties: {
        hook_title: { type: Type.STRING },
        script_voiceover: { type: Type.STRING },
        visual_storyboard: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING },
              visual: { type: Type.STRING },
              overlay_text: { type: Type.STRING }
            },
            required: ["time", "visual", "overlay_text"]
          }
        }
      },
      required: ["hook_title", "script_voiceover", "visual_storyboard"]
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        caption: { type: Type.STRING },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        recommended_music_vibe: { type: Type.STRING }
      },
      required: ["caption", "hashtags", "recommended_music_vibe"]
    }
  },
  required: ["campaign_analysis", "video_assets", "metadata"]
};

export const generateViralPackage = async (data: ProductData): Promise<ViralPackageResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
# MISSION
Transform the following AliExpress API data into a high-converting short video campaign.

# PRODUCT DATA INPUT
Product Name: ${data.product_name}
Description: ${data.product_description}
Price: ${data.price_usd}
Shipping: ${data.shipping_info}
Rating: ${data.rating}
Assets: ${data.video_assets_urls}

# TASK SPECIFICATIONS
1. Viral Title: Create a clickbait hook.
2. Narrative Script (Voiceover): A 25-second script focused on the "Problem > Solution > Benefit" framework.
3. On-Screen Text (Overlays): Precise timing for text to appear on screen.
4. AI Video Editing Instructions: Visual descriptions for storyboard.
5. Affiliate Caption: Instagram/TikTok caption with emojis and hashtags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const resultText = response.text || '';
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
