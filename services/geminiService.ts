
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateTaskDescription(title: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Vytvor krátky, profesionálny popis pre úlohu v hudobnom štúdiu s názvom: "${title}". Maximálne 100 znakov, v slovenčine.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 50,
      }
    });
    return response.text?.trim() || "Popis nebol vygenerovaný.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Chyba pri generovaní popisu.";
  }
}
