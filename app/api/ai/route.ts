import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

interface ParsedRule {
  id: string;
  title: string;
  content: string;
  keywords: string[];
}

interface RequestBody {
  question: string;
  topRules: ParsedRule[];
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek formatı" }, { status: 400 });
    }

    const { question, topRules } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: "Soru boş olamaz" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI servisi şu anda kullanılamıyor" }, { status: 503 });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const rulesContext = (topRules ?? [])
      .map(r => `### ${r.title}\n${r.content.slice(0, 1000)}`)
      .join('\n\n');

    const prompt = `Sen bir basketbol kuralları asistanısın. Aşağıdaki kural belgelerine dayanarak soruyu Türkçe olarak yanıtla.
Yalnızca verilen belgelerden cevap ver. Eğer belgelerden yeterli bilgi bulamazsan "Bu konuda elimde yeterli kural bilgisi yok" de.

KURAL BELGELERİ:
${rulesContext || "(Kural belgesi bulunamadı)"}

SORU: ${question.trim()}

YANIT:`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("[API /api/ai POST] Error:", error);
    return NextResponse.json({ error: "AI yanıt üretemedi" }, { status: 500 });
  }
}
