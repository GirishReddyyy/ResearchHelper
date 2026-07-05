import { NextResponse } from 'next/server';
import { searchSemanticScholar } from '@/lib/sources/semanticScholar';
import { checkRateLimit } from '@/lib/utils/rateLimit';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_allow_build_if_unset',
});

const SYSTEM_PROMPT = `You are a strict Data Synthesis Engine for Academic Gap Analysis.
You will be provided with strictly computed, factual statistical signals regarding a specific research topic.
These signals include:
1. "Temporal Trends": Growth or decline of publication volumes per year.
2. "Unmade Connections (Gaps)": High-frequency concepts that almost never appear together in the same paper.

CRITICAL CONSTRAINTS - HALLUCINATION GUARDRAIL:
- You must synthesize a plain-language "Gap Report" interpreting ONLY the computed signals provided below.
- You must NEVER invent, brainstorm, or hallucinate gaps from your own memory or training data.
- If the computed signals show no obvious gaps, you must state that the dataset is highly connected and no obvious gaps emerge from this sample.
- Do not cite specific papers or authors unless they are explicitly provided in the data.

Structure your response strictly as JSON:
{
  "summary": "A 2-3 sentence overview of the temporal trajectory.",
  "identifiedGaps": [
    {
      "title": "Short title of the gap (e.g., 'Concept A + Concept B')",
      "description": "Explanation of why this unmade connection represents an interesting opportunity based strictly on the provided data."
    }
  ]
}`;

export async function GET(request: Request) {
  // Rate limiting (20 requests per hour keyed by auth token or IP)
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || request.headers.get('x-forwarded-for') || 'anonymous';
  const isAllowed = checkRateLimit(token, 20, 60 * 60 * 1000);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Rate limit exceeded (20 req/hour). Please try again later.' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');

  if (!topic) {
    return NextResponse.json({ error: 'Topic parameter is required' }, { status: 400 });
  }

  try {
    // Fetch a robust sample for statistical analysis
    const papers = await searchSemanticScholar(topic, 50);
    
    if (papers.length === 0) {
      return NextResponse.json({ error: 'Not enough data to analyze gaps.' }, { status: 404 });
    }

    // 1. Compute Temporal Trends
    const yearCounts = new Map<number, number>();
    const conceptFreq = new Map<string, number>();
    
    papers.forEach(p => {
      if (p.year && p.year > 2000) {
        yearCounts.set(p.year, (yearCounts.get(p.year) || 0) + 1);
      }
      p.concepts.forEach(c => conceptFreq.set(c, (conceptFreq.get(c) || 0) + 1));
    });

    // Top 20 concepts to keep the graph manageable
    const topConcepts = Array.from(conceptFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(e => e[0]);

    // 2. Compute Co-occurrence Graph
    const nodes = topConcepts.map(c => ({ id: c, val: conceptFreq.get(c)! }));
    const linksMap = new Map<string, number>();

    papers.forEach(p => {
      // Find which top concepts are in this paper
      const paperConcepts = p.concepts.filter(c => topConcepts.includes(c));
      for (let i = 0; i < paperConcepts.length; i++) {
        for (let j = i + 1; j < paperConcepts.length; j++) {
          const [a, b] = [paperConcepts[i], paperConcepts[j]].sort();
          const key = `${a}||${b}`;
          linksMap.set(key, (linksMap.get(key) || 0) + 1);
        }
      }
    });

    const links = Array.from(linksMap.entries()).map(([key, weight]) => {
      const [source, target] = key.split("||");
      return { source, target, weight };
    });

    // 3. Compute Unmade Connections (Gaps) algorithmically
    const unmadeConnections: { concept1: string, concept2: string, freq1: number, freq2: number }[] = [];
    
    // Look at top 10 concepts specifically for gaps
    const eliteConcepts = topConcepts.slice(0, 10);
    for (let i = 0; i < eliteConcepts.length; i++) {
      for (let j = i + 1; j < eliteConcepts.length; j++) {
        const [a, b] = [eliteConcepts[i], eliteConcepts[j]].sort();
        const key = `${a}||${b}`;
        const weight = linksMap.get(key) || 0;
        
        // If two very popular concepts rarely occur together
        if (weight <= 1) {
          unmadeConnections.push({
            concept1: a,
            concept2: b,
            freq1: conceptFreq.get(a)!,
            freq2: conceptFreq.get(b)!
          });
        }
      }
    }

    // Sort temporal data for the chart
    const temporalData = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    // 4. LLM Synthesis ONLY if key is present
    let gapReport = null;
    if (process.env.OPENAI_API_KEY) {
      const llmData = {
        temporalTrajectory: temporalData,
        computedUnmadeConnections: unmadeConnections
      };

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Topic: ${topic}\n\nComputed Signals:\n${JSON.stringify(llmData, null, 2)}` }
        ],
        response_format: { type: "json_object" }
      });

      gapReport = JSON.parse(completion.choices[0].message.content || "{}");
    }

    return NextResponse.json({
      temporalData,
      graph: { nodes, links },
      gapReport
    });
  } catch (error: any) {
    console.error("Gap Analysis API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
