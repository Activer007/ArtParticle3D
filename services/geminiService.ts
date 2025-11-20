import { GoogleGenAI } from "@google/genai";
import { Painting, AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePainting = async (painting: Painting): Promise<AIResponse> => {
  try {
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
