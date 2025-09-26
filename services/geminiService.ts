
import { GoogleGenAI, Type } from "@google/genai";
import type { Question } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const questionGenerationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      questionText: {
        type: Type.STRING,
        description: "The main text of the question.",
      },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "An array of 4 possible answers.",
      },
      correctAnswer: {
        type: Type.INTEGER,
        description: "The 0-based index of the correct answer in the 'options' array.",
      },
    },
    required: ["questionText", "options", "correctAnswer"],
  },
};

export const generateMcqs = async (topic: string, count: number): Promise<Omit<Question, 'id' | 'testId'>[]> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} multiple-choice questions about "${topic}". Each question must have exactly 4 options. Ensure the correct answer index is accurate.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionGenerationSchema,
      },
    });

    const jsonText = response.text.trim();
    const generatedQuestions = JSON.parse(jsonText);
    
    // Validate the response structure
    if (!Array.isArray(generatedQuestions)) {
        throw new Error("AI response is not an array.");
    }

    return generatedQuestions.map(q => {
        if (
            typeof q.questionText !== 'string' ||
            !Array.isArray(q.options) ||
            q.options.length !== 4 ||
            typeof q.correctAnswer !== 'number' ||
            q.correctAnswer < 0 ||
            q.correctAnswer > 3
        ) {
            throw new Error("Invalid question structure from AI.");
        }
        return q;
    });

  } catch (error) {
    console.error("Error generating MCQs with Gemini:", error);
    throw new Error("Failed to generate questions. Please check the topic or try again later.");
  }
};
