import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const parseQuestions = (text: string): Question[] => {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse JSON", e);
        return [];
    }
}

export const generateQuizFromText = async (content: string): Promise<Question[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert teacher. Create a multiple-choice quiz based on the text content provided below.
    Generate at least 5 questions.
    
    Content:
    ${content.substring(0, 30000)}

    The output must be a valid JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER },
                    text: { type: Type.STRING },
                    options: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    correctAnswerIndex: { type: Type.INTEGER, description: "Zero-based index of the correct option" }
                }
            }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return parseQuestions(text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
};