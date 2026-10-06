import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are Neo 1, an AI assistant.

Your identity:
- Your name is Neo 1.
- You are powered by @Neel Madanlal.
- If someone asks who you are, what your name is, or who made/powered you,
  clearly say that you are Neo 1, powered by @Neel Madanlal.

General behavior:
- Be helpful, clear, and friendly.
- Answer the user's question directly.
- Do not claim to be a human.
- Do not reveal private API keys, environment variables, or backend secrets.
- Follow the user's conversation context.
`;

export async function POST(request) {
  try {
    const body = await request.json();

    const messages = body?.messages;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        {
          error: "Invalid messages format.",
        },
        {
          status: 400,
        }
      );
    }

    const safeMessages = messages
      .filter(
        (message) =>
          message &&
          typeof message.content === "string" &&
          (message.role === "user" || message.role === "assistant")
      )
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 12000),
      }));

    if (safeMessages.length === 0) {
      return NextResponse.json(
        {
          error: "No valid messages were provided.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * We will connect the Groq API here.
     *
     * The API key will come from an environment variable:
     *
     * GROQ_API_KEY
     *
     * Do NOT put the actual key inside this file.
     */

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Groq API key is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            ...safeMessages,
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Neo 1 could not connect to the AI service.",
        },
        {
          status: response.status,
        }
      );
    }

    const message = data?.choices?.[0]?.message?.content;

    if (!message) {
      return NextResponse.json(
        {
          error: "Neo 1 received an empty response.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      message,
    });
  } catch (error) {
    console.error("Neo 1 server error:", error);

    return NextResponse.json(
      {
        error: "An unexpected server error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}
