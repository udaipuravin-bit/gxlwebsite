
import { GoogleGenAI } from "@google/genai";
import { EmailMasterAction } from "../types";

const SYSTEM_INSTRUCTION_MASTER = `You are an expert HTML Email Engineer and Email Deliverability Specialist.
Your role is to assist users inside a browser-based HTML Email Editor with Writing, Fixing, Decoding, Optimizing, and Validating email-safe HTML.
- Tone: Concise and technical.`;

const SYSTEM_INSTRUCTION_HEADER = `You are a deterministic email message header analyzer.
Your role is to parse and analyze a raw email header and return a structured, technical diagnostic report.
Do NOT mention artificial intelligence, machine learning, or assumptions.
Operate strictly as a protocol and standards-based email analysis engine.

ANALYSIS REQUIREMENTS:
1. BASIC MESSAGE DETAILS: From, To, Subject, Date, Message-ID, Return-Path, Reply-To, MIME-Version, Content-Type, User-Agent/X-Mailer.
2. AUTHENTICATION RESULTS: SPF, DKIM (selector, domain, key length), DMARC (policy, alignment), ARC.
3. RECEIVED HEADER ANALYSIS (HOP-BY-HOP): Correct order, hostnames, IPs, Protocol, TLS, Timestamp, Delay.
4. EMAIL PROVIDER DETECTION: Gmail, Outlook, Yahoo, iCloud, Zoho, ESPs, or Custom.
5. PROVIDER NOTES: ARC (Gmail), SCL Score (Outlook), shared IPs (ESPs).
6. SECURITY CHECKS: Misalignment, spoofing indicators, forwarding breaks.
7. FINAL SUMMARY: Status (PASS/PARTIAL/FAIL), Risk Levels, Key Problems.
8. RECOMMENDATIONS: DNS fixes, alignment corrections.

OUTPUT FORMAT:
Return a JSON object with two top-level keys:
"report_markdown": A comprehensive, well-formatted human-readable diagnostic report using Markdown tables and headings.
"structured_data": A nested object containing message_details, authentication_results, hops, provider_detection, security_findings, and recommendations.`;

export const processEmailWithAI = async (content: string, action: EmailMasterAction): Promise<string> => {
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
      systemInstruction: SYSTEM_INSTRUCTION_MASTER,
      temperature: 0.2,
    },
  });
  return response.text || "";
};

export const analyzeEmailHeader = async (header: string): Promise<{ report_markdown: string; structured_data: any }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this raw header:\n\n${header}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_HEADER,
      temperature: 0.1,
      responseMimeType: "application/json"
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Failed to parse analyzer response.");
  }
};
