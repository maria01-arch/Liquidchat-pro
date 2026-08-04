import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini Client server-side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health Check Endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "liquidchat-backend", company: "xchordlabs corp" });
});

// xchord AI Assistant API Endpoint
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt, mode, conversationHistory } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is missing on server",
        fallbackResponse:
          "xchord AI service is running in offline mode. Please configure GEMINI_API_KEY in Settings > Secrets to unlock full AI advice, chat summaries, and automation capabilities.",
      });
    }

    let systemInstruction = `You are xchord AI, the official intelligent assistant embedded inside liquidchat, built by xchordlabs corp.
liquidchat is a privacy-first, ultra-fluid WhatsApp & Telegram hybrid messaging platform featuring E2EE (End-to-End Encryption), self-destructing messages, integrated cloud file storage (Liquid Vault), voice notes, and passkey account recovery.

Your directives:
1. Provide concise, smart, friendly, and helpful responses for conversations, task management, code advice, tips, and summaries.
2. Maintain a sleek, modern, tech-forward tone representing xchordlabs corp.
3. If requested to summarize a chat or draft a response, format it cleanly using bullet points or clear key takeaways.
4. Keep security, privacy, and user convenience as core values.`;

    if (mode === "summarize") {
      systemInstruction += "\nFocus specifically on summarizing the conversation history concisely with key action items and main points.";
    } else if (mode === "smart_reply") {
      systemInstruction += "\nProvide 3 quick, short, contextually accurate reply suggestions formatted as a JSON array of strings.";
    } else if (mode === "security_advice") {
      systemInstruction += "\nProvide expert cybersecurity and passkey management advice for E2EE chats.";
    }

    let contents: any = prompt;
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      contents = [
        ...conversationHistory.map((msg: { role: string; text: string }) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
        { role: "user", parts: [{ text: prompt }] },
      ];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "xchord AI generated no text output.";

    return res.json({ text: replyText, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error("xchord AI API error:", err);
    return res.status(500).json({
      error: err?.message || "Internal server error calling xchord AI",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[liquidchat] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
