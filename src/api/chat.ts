import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert technical shopping assistant for SUNX Technologies.
Your goal is to help users compare PC components, find compatible motherboards/RAM, and answer specific technical product questions.
Be concise, helpful, and technically accurate. Suggest specific component types or specs when appropriate.
Keep your responses short and scannable for a chat widget interface.`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Start a chat session to maintain conversation context
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    // We can't actually seed the chat object with history easily using the current SDK structure 
    // for a stateless API endpoint without making multiple calls, so we'll prepend history to the user's message 
    // or just use generateContent for stateless calls if history is simple.
    // For a robust chat, it's better to pass the whole contents array to generateContent.

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return new Response(JSON.stringify({ text: response.text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
