import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, apiKey } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Transcript text is required" }, { status: 400 });
    }

    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "No API key configured" }, { status: 400 });
    }

    // Use Gemini for ultra-fast summary
    const prompt = `Summarize the following TikTok transcript into 2-3 concise bullet points with key takeaways:\n\n"${text}"\n\nProvide only the bullet points.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      return NextResponse.json({ success: true, summary });
    }

    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Summary failed" }, { status: 500 });
  }
}
