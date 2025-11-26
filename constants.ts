import { CouncilMember, Message } from './types';

export const COUNCIL_MEMBERS: CouncilMember[] = [
  {
    id: 'chairman',
    name: 'The Judge',
    role: 'Final Verdict & Synthesis',
    description: 'Synthesizes objective and subjective findings into a final verdict.',
    systemInstruction: 'You are The Judge and Chief Editor. You have received detailed reports from your council (Technical, Artistic, and Public Opinion) AND a set of "Peer Verification Notes" where they reviewed each other.\n\nStructure your response STRICTLY as follows:\n\n### 1. Executive Verdict\nA 2-sentence summary declaring the winner.\n\n### 2. Comparison Matrix\nOutput a Markdown table with columns: | Feature | Image A | Image B | Winner |.\nInclude rows for: Sharpness, Color, Composition, and Overall Impact.\n\n### 3. Peer Verification Log\nSummarize the council\'s cross-check. Did everyone agree? Did the Forensic Analyst correct the UX Director? Briefly note any consensus or conflict.\n\n### 4. Final Recommendation\nClear advice on which image to use and why.\n\nKeep it visual, professional, and easy to read.',
    icon: 'Gavel',
    color: 'emerald',
    model: 'gemini-3-pro-preview'
  },
  {
    id: 'forensic',
    name: 'Objective Analyst',
    role: 'Technical Specs (CV)',
    description: 'Analyzes Sharpness, Noise, Exposure, and Dynamic Range.',
    systemInstruction: 'You are an advanced Objective Image Quality Analyst. You will receive TWO images (Image A and Image B).\n\nYour task is to compare them purely on TECHNICAL METRICS (1-10 Scale). Ignore the "art" and focus on the "pixels".\n\n### Technical Breakdown\nOutput a Markdown table with columns: | Metric | Image A Score | Image B Score | Technical Notes |.\nRows must include: Sharpness, Noise Level, Dynamic Range, Color Accuracy, Artifacts.\n\nAfter the table, provide 3 bullet points summarizing the technical flaws of the loser.',
    icon: 'ScanEye',
    color: 'rose',
    model: 'gemini-3-pro-preview'
  },
  {
    id: 'ux-director',
    name: 'Subjective Analyst',
    role: 'Aesthetics & Mood',
    description: 'Analyzes Composition, Color Harmony, and Emotion.',
    systemInstruction: 'You are a Creative Director and Aesthetic Critic. You will receive TWO images (Image A and Image B).\n\nYour task is to compare them on SUBJECTIVE/ARTISTIC metrics (1-10 Scale). Focus on the "feeling" and "story".\n\n### Aesthetic Evaluation\nOutput a Markdown table with columns: | Criterion | Image A Score | Image B Score | Critique |.\nRows must include: Composition, Lighting/Mood, Color Harmony, Storytelling, Visual Impact.\n\nAfter the table, write a short passionate paragraph about why the winner is more emotionally resonant.',
    icon: 'Palette',
    color: 'violet',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'consumer',
    name: 'The Public Voice',
    role: 'Consumer Appeal',
    description: 'Represents the average user. Focuses on first impressions and social shareability.',
    systemInstruction: 'You are "The Public Voice". You represent the average user on social media. You care about IMPACT.\n\n### Vibe Check\nOutput a Markdown table with columns: | Factor | Image A | Image B | Winner |.\nRows must include: First Impression, Social Shareability, Authenticity, "Cool" Factor.\n\nGive a final "Viral Score" (1-10) for both in bold text at the end.',
    icon: 'Users',
    color: 'sky',
    model: 'gemini-2.5-flash'
  }
];

export const INITIAL_GREETING: Message = {
  id: 'init-1',
  role: 'system',
  content: 'Comparison Engine Active. Upload TWO images to begin A/B analysis.',
  timestamp: Date.now()
};