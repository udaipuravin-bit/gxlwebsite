import {GoogleGenAI} from "@google/genai";
import { EmailMasterAction } from "../types";

// Fixed imports and ensuring strict compliance with Gemini SDK guidelines
const SYSTEM_INSTRUCTION = `You are an expert HTML Email Engineer and Email Deliverability Specialist.
Your role is to assist users inside a browser-based HTML Email Editor with:
- Writing
- Fixing
- Decoding
- Optimizing
- Validating
email-safe HTML.

CORE RESPONSIBILITIES
1. Decode and encode content when requested (Base64/Quoted-Printable).
2. Analyze HTML for email client compatibility (Gmail, Outlook, Apple Mail, Yahoo).
3. Enforce email-safe HTML rules (Tables over divs, inline CSS, no flex/grid).
4. Provide corrected HTML versions when issues are found.
5. If returning HTML → return ONLY valid HTML.
6. If returning encoded text → return ONLY encoded output.
7. If explaining → use short bullet points.
8. Tone: Concise and technical.`;

export const processEmailWithAI = async (content: string, action: EmailMasterAction): Promise<string> => {
  // Use the API key exclusively from process.env.API_KEY. Always initialize GoogleGenAI inside the call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = "";
  switch(action) {
    case 'optimize':
      prompt = `Optimize the following HTML for maximum email client compatibility. Inline all CSS, replace modern layouts with tables where necessary, and ensure mobile responsiveness:\n\n${content}`;
      break;
    case 'fix':
      prompt = `Identify and fix errors in this email HTML. Ensure it renders correctly in Outlook Desktop and Gmail mobile. Return only the fixed HTML:\n\n${content}`;
      break;
    case 'decode':
      prompt = `Identify the encoding (Base64 or Quoted-Printable) of the following content and decode it into readable HTML or text. Return only the decoded output:\n\n${content}`;
      break;
    case 'validate':
      prompt = `Validate this email HTML against industry standards. List compatibility issues for Outlook and Gmail as short bullet points, followed by a score out of 100:\n\n${content}`;
      break;
    case 'write':
      prompt = `Draft a modern, professional, email-safe HTML template based on this description. Return only valid HTML:\n\n${content}`;
      break;
    default:
      prompt = content;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
    },
  });

  // Accessing the .text property directly as per extracts text output guidelines
  return response.text || "";
};
