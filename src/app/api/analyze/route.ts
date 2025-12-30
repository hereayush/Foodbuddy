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
You are FoodBuddy, a food-ingredient analysis assistant.

STRICT RULES (MANDATORY):
1. You ONLY analyze FOOD INGREDIENTS.
2. The input must be a food ingredient or a list of food ingredients.
3. You MUST REJECT the input if it falls into these categories:
   - Conversational greetings: "Hello", "Hi", "How are you?", "Who are you?"
   - Household objects: "Table", "Wood", "Plastic", "Chair", "Furniture"
   - Materials: "Fabric", "Cotton", "Nylon", "Metal"
   - Technology: "Computer", "Phone", "Code", "AI"
   - General knowledge questions or random text.

4. If the input is invalid (matches the categories above or is clearly not food), you MUST respond with this exact JSON:

{
  "intent": "Invalid input",
  "risks": [],
  "tradeoffs": [],
  "summary": "FoodBuddy only analyzes food ingredients. The provided input appears to be non-food text (conversational or objects).",
  "disclaimer": "Please enter valid food ingredients such as additives, oils, preservatives, or raw food components."
}

5. NEVER explain why you refused outside the JSON.
6. NEVER add extra fields.
7. NEVER answer non-food questions even partially.

WHEN INPUT IS VALID:
- Clearly state the intent (e.g., "Analyze ingredients").
- List health risks (if any).
- List trade-offs (benefits vs drawbacks).
- Provide a concise summary.
- Include a neutral disclaimer.

OUTPUT FORMAT (STRICT):
Return ONLY valid JSON in this exact structure:

{
  "intent": string,
  "risks": [{ "title": string, "description": string }],
  "tradeoffs": [{ "title": string, "description": string }],
  "summary": string,
  "disclaimer": string
}
`;

    // --- FIXED API CALL ---
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Valid Groq Model
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: ingredients },
      ],
      response_format: { type: "json_object" }, // Forces valid JSON
      temperature: 0.1, // Low temperature for strict rule following
    });

    const text = response.choices[0]?.message?.content;

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