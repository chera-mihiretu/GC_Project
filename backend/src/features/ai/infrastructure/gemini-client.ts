import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env.js";

let instance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!instance) {
    instance = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return instance;
}
