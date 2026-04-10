import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function getOpenAI() {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey  = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseURL || !apiKey) throw new Error("OpenAI env vars not configured");
  return new OpenAI({ baseURL, apiKey });
}

function buildSystemPrompt(context: Record<string, unknown>): string {
  return `You are MoFi AI, a helpful financial assistant built into the MoFi business finance tracker.
Your job is to help users manage their income and expenses through natural language.

Current financial data:
- Currency: ${context.currencySymbol} (${context.currencyCode})
- Total balance: ${context.balance}
- Total income: ${context.totalIncome}
- Total expenses: ${context.totalExpenses}
- Available income categories: ${(context.incomeCategories as string[])?.join(", ")}
- Available expense categories: ${(context.expenseCategories as string[])?.join(", ")}

Today's date: ${new Date().toISOString().split("T")[0]}

RULES:
1. Respond ONLY with valid JSON — no extra text, no markdown code blocks.
2. Respond in the SAME LANGUAGE as the user's input.
3. Category names must exactly match the available lists above.
4. If user says "cash", "gotovina", "contanti", "Bargeld", "наличные", "efectivo" — use paymentMethod "cash", else "bank".

Always return this exact JSON structure:
{
  "action": "add_transaction" | "query_response" | "general",
  "message": "<human-readable response in user's language>",
  "transaction": {
    "type": "income" | "expense",
    "amount": <positive number>,
    "category": "<exact category name>",
    "description": "<optional description>",
    "date": "<YYYY-MM-DD>",
    "paymentMethod": "bank" | "cash"
  } | null
}

Use "add_transaction" when user wants to add/record/enter a transaction.
Use "query_response" when user asks about balance, reports, totals, or financial summaries.
Use "general" for everything else.
Set "transaction" to null when action is not "add_transaction".`;
}

router.post("/message", async (req, res) => {
  try {
    const { messages, context } = req.body as {
      messages: { role: string; content: string }[];
      context: Record<string, unknown>;
    };

    if (!Array.isArray(messages) || !context) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const openai = getOpenAI();

    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(context) },
      ...messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: chatMessages,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content
      ?? '{"action":"general","message":"No response.","transaction":null}';

    res.json(JSON.parse(raw));
  } catch (err) {
    console.error("AI message error:", err);
    res.status(500).json({ action: "general", message: "AI service error.", transaction: null });
  }
});

export default router;
