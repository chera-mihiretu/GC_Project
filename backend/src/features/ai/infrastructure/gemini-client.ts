import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env.js";

let instance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!instance) {
    const keyPreview = env.GEMINI_API_KEY
      ? `${env.GEMINI_API_KEY.slice(0, 6)}...${env.GEMINI_API_KEY.slice(-4)}`
      : "MISSING";
    console.log(`[AI] Initializing Gemini client (key=${keyPreview})`);
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    instance = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return instance;
}
