import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

interface ParsedRule {
  id: string;
  title: string;
  content: string;
  keywords: string[];
}

const STOP_WORDS = new Set([
  "ve", "veya", "ile", "bir", "bu", "da", "de", "ki", "için", "olan", "gibi",
  "her", "daha", "çok", "az", "en", "ne", "o", "şu", "ise", "değil", "ancak",
  "fakat", "ama", "eğer", "the", "a", "an", "is", "in", "on", "at", "to",
  "of", "and", "or", "are", "was", "be", "has", "had", "that", "it", "as",
]);

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-zçğıöşü0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  return [...new Set(words)].slice(0, 20);
}

function tryParseContent(raw: string | null): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    if (Array.isArray(parsed)) {
      return parsed.map(p => (typeof p === 'string' ? p : JSON.stringify(p))).join('\n');
    }
    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await db.ruleBook.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsed: ParsedRule[] = rules.map(rule => {
      const content = tryParseContent(rule.content) || rule.description || '';
      return {
        id: String(rule.id),
        title: rule.title,
        content,
        keywords: extractKeywords(content + ' ' + rule.title),
      };
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[API /api/ai/rules GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
