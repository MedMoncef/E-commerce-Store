import { streamText } from "ai";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { createOllama } from "ollama-ai-provider";

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});

const system = `You are the internal dashboard assistant for ShopFlow Marketplace.
Your role is to help staff work faster by answering questions about operations,
orders, inventory, and policies using the facts below.

Company Name: ShopFlow Marketplace
Dashboard Pages:
- /dashboard (Overview)
- /dashboard/products (Inventory)
- /dashboard/orders (Sales)
- /dashboard/analytics (Reports)

Business Rules:
- Standard shipping is $5.99, free over $50.
- Returns are allowed within 30 days.
- Products can be draft, published, or archived.

Guidelines:
- Be concise and action-oriented.
- If you do not know something, say so and suggest where to check next.
`;

export async function POST(request: Request) {
  const body = await request.json();
  const model = ollama("llama3.1") as unknown as LanguageModelV1;
  const result = await streamText({
    model,
    system,
    messages: body.messages ?? [],
  });

  return result.toDataStreamResponse();
}
