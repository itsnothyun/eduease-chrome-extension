import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define Scholar GPT System Prompt
const SCHOLAR_PROMPT = `
You are Scholar GPT, a research assistant that provides academic information in a strict JSON format.
Respond **only** with JSON in this format:
[
  {
    "id": "1",
    "title": "Title of the resource",
    "description": "A brief description (max 150 characters)",
    "link": "URL to the resource"
  }
]
Do not include explanations, headers, or additional text. Only return valid JSON.
`;

export async function POST(req: Request) {
  try {
    // 1. Parse and Validate Input
    const { messages, userPrompt } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid input. 'messages' must be an array." },
        { status: 400 }
      );
    }

    // Validate message format
    if (messages.some(msg => !msg.role || !msg.content)) {
      return NextResponse.json(
        { error: "Invalid message format. Each message must have 'role' and 'content'." },
        { status: 400 }
      );
    }

    // 2. Call OpenAI API with conversation history
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SCHOLAR_PROMPT },
        ...messages.slice(1) // Skip the first message as we already include system prompt
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    // 3. Extract and Parse GPT Response
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("No content received from OpenAI.");
    }

    let parsedContent;
    try {
      // Check if response content resembles JSON
      if (!content.startsWith("[") || !content.endsWith("]")) {
        throw new Error("Invalid JSON format in GPT response.");
      }

      // Attempt to parse the JSON content
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "GPT Output:", content);
      return NextResponse.json(
        {
          error: "Failed to parse GPT response. Please refine your query.",
          details: parseError.message,
          rawResponse: content,
        },
        { status: 500 }
      );
    }

    // 4. Return Parsed Content
    return NextResponse.json({
      result: parsedContent,
      role: "assistant",
    });
  } catch (error) {
    console.error("Error in scholar-gpt route:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request. Please try again later.",
        details: error.message
      },
      { status: 500 }
    );
  }
}
