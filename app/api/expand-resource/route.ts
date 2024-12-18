import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EXPAND_PROMPT = `
You are an educational content expert. Your task is to provide detailed, well-structured explanations of educational resources.
For the given resource title and description, provide:
1. A comprehensive overview
2. Key points and concepts
3. Practical applications or examples
4. Additional context or related topics

Format your response in markdown for better readability.
`;

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();
    
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required." },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: EXPAND_PROMPT },
        { 
          role: "user", 
          content: `Resource Title: ${title}\nDescription: ${description}\n\nPlease provide a detailed explanation of this resource.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("No content received from OpenAI.");
    }

    return NextResponse.json({
      content: content,
      success: true
    });
  } catch (error) {
    console.error("Error in expand-resource route:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate expanded content. Please try again later.",
        details: error.message
      },
      { status: 500 }
    );
  }
}
