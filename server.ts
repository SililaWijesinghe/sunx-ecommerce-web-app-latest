import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { uploadRouter } from './upload-handler.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Dynamic Image Upload API Route
  app.use(uploadRouter);

  // Serve uploaded images statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // API Routes
  app.post('/api/chat', async (req, res) => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { message, history } = req.body;

      const SYSTEM_INSTRUCTION = `You are an expert technical shopping assistant for SUNX Technologies.
Your goal is to help users compare PC components, find compatible motherboards/RAM, and answer specific technical product questions.
Be concise, helpful, and technically accurate. Suggest specific component types or specs when appropriate.
Keep your responses short and scannable for a chat widget interface. Do not use markdown headers, just plain text and bullet points.`;

      const formattedHistory = history ? history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })) : [];

      const contents = [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ];

      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
      let productContext = "";
      
      if (supabaseUrl && supabaseKey) {
         try {
           const { createClient } = await import('@supabase/supabase-js');
           const supabase = createClient(supabaseUrl, supabaseKey);
           const { data: products } = await supabase.from('products').select('id, title, price, description, category_id, brand_id, slug, image_url, discount').limit(50);
           if (products) {
              productContext = "\n\nHere is the current catalog of products available in the store:\n" + JSON.stringify(products.map(p => ({ id: p.id, title: p.title, price: p.price, description: p.description })), null, 2);
           }
         } catch (e) {
           console.error("Failed to fetch products for context", e);
         }
      }

      const FINAL_SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION + productContext + "\n\nIMPORTANT INSTRUCTION FOR OUTPUT FORMAT: When you recommend a product from the catalog, you MUST include its ID wrapped exactly like this: [PRODUCT: <PRODUCT_ID>]. For example: [PRODUCT: INTEL-I5-12400F]. Do not use markdown headers, just plain text, bullet points, and these tags.";

      const responseGen = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contents,
        config: {
          systemInstruction: FINAL_SYSTEM_INSTRUCTION
        }
      });
      
      res.json({ text: responseGen.text });
    } catch (error: any) {
      console.error('Chat API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to communicate with AI' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
