import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ excuse: z.string().min(1).max(500) });

export type RoastResult = {
  roast: string;
  score: number;
  title: string;
  realityCheck: string;
  challenge: string;
  minutes: number;
};

const TITLES = [
  "Professional Procrastinator 🏆",
  "Certified Tomorrow Person",
  "Last-Minute Legend",
  "Almost Started 😭",
  "Academic Survivor",
  "Actually Trying 👏",
];

const SYSTEM = `You are Excuse.exe, a funny best friend who playfully roasts students for not studying.
Rules:
- Roast the EXCUSE, never the person's identity, appearance, body, race, gender, religion or any protected characteristic.
- Keep it friendly, silly, Gen-Z, emoji-sprinkled, PG.
- Roast: max 2 short sentences.
- realityCheck: one short kind constructive sentence.
- challenge: one tiny study task, 5-25 minutes.
Reply with ONLY JSON:
{"roast":string,"score":number 40-100,"title":one of ${JSON.stringify(TITLES)},"realityCheck":string,"challenge":string,"minutes":number}`;

function extractText(data: unknown): string {
  const d = data as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };
  if (typeof d.output_text === "string" && d.output_text.trim()) return d.output_text;
  const parts: string[] = [];
  for (const item of d.output ?? []) {
    for (const c of item.content ?? []) {
      if (typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("");
}

export const roastExcuse = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<RoastResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-luna",
        input: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `My excuse: ${data.excuse}` },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Too many roasts at once! Try again in a moment. 😅");
      if (res.status === 402)
        throw new Error("The roast machine ran out of credits. Add AI credits to keep roasting. 💸");
      throw new Error(`Roast machine hiccup (${res.status}): ${body.slice(0, 200)}`);
    }

    const text = extractText(await res.json());
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The roast came out unreadable. Try again!");
    const parsed = JSON.parse(match[0]) as Partial<RoastResult>;

    const minutes = Math.min(60, Math.max(5, Math.round(Number(parsed.minutes) || 15)));
    return {
      roast: String(parsed.roast ?? "That excuse is so weak my textbook laughed. 📚"),
      score: Math.min(100, Math.max(40, Math.round(Number(parsed.score) || 78))),
      title: TITLES.includes(String(parsed.title)) ? String(parsed.title) : TITLES[0]!,
      realityCheck: String(
        parsed.realityCheck ?? "You don't need 5 hours. Just start with 15 minutes.",
      ),
      challenge: String(parsed.challenge ?? `Study for ${minutes} minutes.`),
      minutes,
    };
  });
