import { GoogleGenAI } from "@google/genai";
import { Painting, AIResponse } from "../types";

const getGeminiApiKey = (): string | undefined => {
  if (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  if (typeof import.meta !== "undefined" && (import.meta as any).env?.GEMINI_API_KEY) {
    return (import.meta as any).env.GEMINI_API_KEY as string;
  }

  return undefined;
};

export const hasGeminiApiKey = (): boolean => Boolean(getGeminiApiKey());

export const analyzePainting = async (painting: Painting): Promise<AIResponse> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return {
      analysis: "Gemini API key is not configured. Set GEMINI_API_KEY to enable live insights.",
      mood: "未配置 API Key"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";
    const prompt = `
      Analyze the painting "${painting.title}" by ${painting.artist} (${painting.year}).
      Provide a JSON response with two fields:
      1. "analysis": A short, engaging paragraph (max 80 words) describing the visual style, brushwork, and significance.
      2. "mood": A 3-word mood summary (e.g., "Melancholic, Vibrant, Swirling").
      
      Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      analysis: "Could not retrieve analysis at this time. Please try again later.",
      mood: "Unknown"
    };
  }
};
