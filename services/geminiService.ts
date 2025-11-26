import { GoogleGenAI } from "@google/genai";
import { CouncilMember, Attachment } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a response for a specific council member.
 */
export const getMemberResponse = async (
  member: CouncilMember,
  userPrompt: string,
  attachments: Attachment[] | undefined,
  contextHistory: string[]
): Promise<string> => {
  try {
    // Construct the contents. 
    const parts: any[] = [];
    
    // Add images if present
    if (attachments && attachments.length > 0) {
      attachments.forEach((att) => {
        parts.push({
          inlineData: {
            data: att.base64,
            mimeType: att.mimeType
          }
        });
      });
      // Add context about image order
      parts.push({ text: "Context: The first image provided is 'Image A'. The second image provided (if any) is 'Image B'." });
    }
    
    parts.push({ text: userPrompt });

    const contents = [
      ...contextHistory.map(txt => ({ role: 'user', parts: [{ text: txt }] })),
      { role: 'user', parts }
    ];

    const response = await ai.models.generateContent({
      model: member.model,
      contents: contents,
      config: {
        systemInstruction: member.systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "*The member remains silent.*";
  } catch (error) {
    console.error(`Error fetching response for ${member.name}:`, error);
    return `[Connection Error: ${member.name} could not respond]`;
  }
};

/**
 * Generates a peer critique/verification.
 */
export const getPeerCritique = async (
  reviewer: CouncilMember,
  otherResponses: { memberName: string; response: string }[]
): Promise<{ reviewer: string; critique: string }> => {
  if (otherResponses.length === 0) {
    return { reviewer: reviewer.name, critique: "No other reports to review." };
  }

  const prompt = `
    You are ${reviewer.name} (${reviewer.role}).
    
    Here are the initial findings from your colleagues:
    ${otherResponses.map(r => `[${r.memberName}]: ${r.response.substring(0, 500)}...`).join('\n')}
    
    TASK:
    Briefly review these findings. Do you see any major technical contradictions with your own perspective? 
    If you agree, simply say "Concur with findings." 
    If you disagree, point it out in 1 sentence.
    Keep it strictly professional and under 40 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use flash for fast critiques
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.5,
      }
    });
    return { reviewer: reviewer.name, critique: response.text || "No comments." };
  } catch (error) {
    return { reviewer: reviewer.name, critique: "Could not verify." };
  }
};

/**
 * Special function for the Chairman to synthesize other answers.
 */
export const getChairmanSynthesis = async (
  userPrompt: string,
  attachments: Attachment[] | undefined,
  otherResponses: { memberName: string; response: string }[],
  peerCritiques: { reviewer: string; critique: string }[] = []
): Promise<string> => {
  const synthesisModel = 'gemini-3-pro-preview'; 
  
  const parts: any[] = [];
  
  if (attachments && attachments.length > 0) {
    attachments.forEach((att) => {
      parts.push({
        inlineData: {
          data: att.base64,
          mimeType: att.mimeType
        }
      });
    });
     parts.push({ text: "Context: The first image provided is 'Image A'. The second image provided (if any) is 'Image B'." });
  }

  let promptContext = `The user asked: "${userPrompt}"\n\n`;
  
  promptContext += `=== STAGE 1: INDIVIDUAL ANALYSIS ===\n`;
  otherResponses.forEach(item => {
    promptContext += `\n[REPORT FROM: ${item.memberName}]\n${item.response}\n`;
  });

  if (peerCritiques.length > 0) {
    promptContext += `\n=== STAGE 2: COUNCIL CROSS-VERIFICATION ===\n`;
    peerCritiques.forEach(item => {
      promptContext += `\n[REVIEW BY: ${item.reviewer}]: ${item.critique}\n`;
    });
  }
  
  promptContext += `\n\nBased on the specific findings AND the cross-verification notes above, synthesize the Final Verdict. 
  If there were disagreements in the cross-verification, resolve them in your "Comparison Matrix" or "Executive Verdict".
  Provide a final, authoritative decision.`;
  
  parts.push({ text: promptContext });

  try {
    const response = await ai.models.generateContent({
      model: synthesisModel,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: "You are The Judge. Synthesize the findings into a clear, visual, final decision. Acknowledge the council's consensus or conflict.",
      }
    });
    return response.text || "*The Chairman has nothing to add.*";
  } catch (error) {
    console.error("Error fetching synthesis:", error);
    return "[The Chairman is currently unavailable to synthesize]";
  }
};
