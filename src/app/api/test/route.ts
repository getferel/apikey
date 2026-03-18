import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey, prompt } = await request.json();

    if (!apiKey || !prompt) {
      return NextResponse.json(
        { error: "API key and prompt are required" },
        { status: 400 }
      );
    }

    let endpoint: string;
    let headers: HeadersInit;
    let body: object;

    switch (provider) {
      case "anthropic":
        endpoint = "https://api.anthropic.com/v1/messages";
        headers = {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        };
        body = {
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        };
        break;

      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        headers = {
          "Content-Type": "application/json",
        };
        body = {
          contents: [{ parts: [{ text: prompt }] }],
        };
        break;

      case "openai":
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        };
        body = {
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1024,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid provider" },
          { status: 400 }
        );
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
      console.error(`API Error (${provider}):`, errorMsg, errorData);
      return NextResponse.json(
        { 
          error: errorMsg,
          details: errorData,
          hint: provider === "anthropic" && errorData.type === "authentication_error" 
            ? "Check your API key format (should start with sk-ant-)" 
            : undefined
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Parse response based on provider
    let result: string;
    if (provider === "anthropic") {
      result = data.content?.[0]?.text || JSON.stringify(data);
    } else if (provider === "gemini") {
      result = data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
    } else if (provider === "openai") {
      result = data.choices?.[0]?.message?.content || JSON.stringify(data);
    } else {
      result = JSON.stringify(data);
    }

    return NextResponse.json({ result, provider, raw: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Request failed" },
      { status: 500 }
    );
  }
}
