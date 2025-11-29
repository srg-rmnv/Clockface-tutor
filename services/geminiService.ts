import { GoogleGenAI, Type } from "@google/genai";
import { ScenarioResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTimeScenario = async (hours: number, minutes: number): Promise<ScenarioResponse> => {
  try {
    const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Придумай очень короткое, веселое предложение для ребенка о том, что происходит в ${timeString}. 
      Используй простой русский язык. Также предложи один подходящий эмодзи.
      Пример для 8:00: "Пора вставать и чистить зубки!", эмодзи: "🪥"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: {
              type: Type.STRING,
              description: "Короткое предложение на русском языке."
            },
            emoji: {
              type: Type.STRING,
              description: "Один эмодзи, подходящий по смыслу."
            }
          },
          required: ["scenario", "emoji"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as ScenarioResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback if API fails
    return {
      scenario: "Который сейчас час?",
      emoji: "⏰"
    };
  }
};

export const getEncouragement = async (isCorrect: boolean): Promise<string> => {
  try {
    const prompt = isCorrect 
      ? "Напиши ТОЛЬКО ОДНУ короткую фразу (2-3 слова) похвалы для ребенка на русском. Без списков, без вариантов, без кавычек. Пример: 'Отлично получилось!'" 
      : "Напиши ТОЛЬКО ОДНУ короткую мягкую фразу (3-4 слова) утешения для ребенка на русском. Без списков. Пример: 'Попробуй еще разок.'";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text || "";
    // Clean up if the model still adds quotes or newlines
    text = text.replace(/["\n]/g, '').trim();
    
    return text || (isCorrect ? "Молодец!" : "Попробуй еще раз!");
  } catch (e) {
    return isCorrect ? "Супер!" : "Не сдавайся!";
  }
};