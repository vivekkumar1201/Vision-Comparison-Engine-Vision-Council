export interface CouncilMember {
  id: string;
  name: string;
  role: string;
  description: string;
  systemInstruction: string;
  icon: string; // Lucide icon name or emoji
  color: string; // Tailwind color class stub (e.g., 'blue')
  model: string;
}

export interface Attachment {
  base64: string;
  mimeType: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  memberId?: string; // If assistant, which member?
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  isThinking?: boolean;
}

export interface ConversationState {
  messages: Message[];
  isProcessing: boolean;
}