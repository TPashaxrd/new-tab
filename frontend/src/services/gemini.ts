
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBEUwE6azDUJz7GnRGD_NMD6cyHd6D2CTs" });

export const generateAiResponse = async (messages: ChatMessage[]) => {
  const model = 'gemini-2.5-flash';
  
  const contents = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: "You are Comet AI, a helpful, concise, and futuristic personal assistant for a search dashboard. Keep answers informative and brief."
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateAiStream = async (messages: ChatMessage[], onChunk: (text: string) => void) => {
  const model = 'gemini-2.5-flash';
  
  const contents = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const result = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: "You are Comet AI, a helpful, concise, and futuristic personal assistant for a search dashboard. Keep answers informative and brief."
      }
    });

    let fullText = "";
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw error;
  }
};