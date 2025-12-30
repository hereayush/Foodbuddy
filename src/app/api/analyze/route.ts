import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const { ingredients } = await req.json();

    if (!ingredients || ingredients.trim() === "") {
      return NextResponse.json(
        { error: "Ingredients text is required" },
        { status: 400 }
      );
    }

    const prompt = `
Return ONLY valid JSON. No markdown. No extra text.

{
  "intent": string,
  "risks": [{ "title": string, "description": string }],
  "tradeoffs": [{ "title": string, "description": string }],
  "summary": string,
  "disclaimer": string
}

INPUT:
${ingredients}
`;

    const response = await client.responses.create({
      model: "openai/gpt-oss-20b",
      input: prompt,
    });

    const text = response.output_text;

    if (!text) {
      throw new Error("Model returned empty output");
    }

    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("❌ API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to analyze ingredients" },
      { status: 500 }
    );
  }
}
