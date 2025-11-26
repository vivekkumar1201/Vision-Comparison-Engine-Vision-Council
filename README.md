# Gemini Vision Council 

An advanced multi-agent image analysis tool powered by Google's Gemini 2.5 Flash and Gemini 3.0 Pro models. This application allows users to upload images for A/B testing and comparative analysis through different "personas" or lenses.

## Features

- **Multi-Agent Council**: Get simultaneous perspectives from specialized AI agents:
  - **Objective Analyst (Forensic)**: Analyzes technical specs like sharpness, noise, and dynamic range.
  - **Subjective Analyst (UX Director)**: Evaluates composition, aesthetics, and emotion.
  - **The Public Voice (Consumer)**: Predicts viral potential and social shareability.
  - **The Judge (Chairman)**: Synthesizes all findings into a final verdict.
- **Cross-Verification**: Agents automatically peer-review each other's findings before the final verdict is rendered.
- **A/B Image Comparison**: Upload two images side-by-side for direct competitive analysis.
- **Technical Dashboard UX**: A clean, dark-mode interface designed for professional analysis.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI**: Google GenAI SDK (`@google/genai`)
- **Icons**: Lucide React

## Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Google Gemini API key:
   ```
   API_KEY=your_api_key_here
   ```
4. Run the application (using your preferred bundler/runner, e.g., Vite or Parcel).

## License

MIT
