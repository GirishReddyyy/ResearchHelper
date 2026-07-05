import { NextResponse } from 'next/server';
import { searchCrossRef } from '@/lib/sources/crossref';
import { searchSemanticScholar } from '@/lib/sources/semanticScholar';
import { checkDoajIsOA } from '@/lib/sources/doaj';
import { Journal, Paper } from '@/lib/types';
import { checkRateLimit } from '@/lib/utils/rateLimit';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_allow_build_if_unset',
});

const SYSTEM_PROMPT = `You are a strict, factual Academic Journal Recommendation Assistant.
You will be given structured data about several candidate academic journals based on a user's research topic.
Your job is to:
1. Group these journals into logical sub-areas based on their dominant concepts.
2. Write a single-sentence editorial-leaning note for each journal based ONLY on the provided concept data.
3. Select the 2-3 "best fit" journals for the user's topic and provide a brief reasoning.

CRITICAL CONSTRAINTS - HALLUCINATION GUARDRAIL:
- You may only describe journals using the data provided in this prompt (from CrossRef/Semantic Scholar/DOAJ).
- You must NEVER assert, state, or imply that a journal "is Scopus-indexed", "is Web of Science (WoS) indexed", or has an "ABDC" or "UGC-CARE" rating under any circumstances, even if you believe you know it.
- If the user asks about indexing, direct them to verify via the Scimago lookup link provided.
- Do not invent metrics, impact factors, or editorial boards. Stick strictly to the provided works count, OA status, and concepts.

Respond strictly in this JSON format:
{
  "subAreas": [
    {
      "name": "Area Name",
      "journals": [
        {
          "name": "Journal Name",
          "editorialNote": "One sentence note based on concepts."
        }
      ]
    }
  ],
  "bestFits": [
    {
      "name": "Journal Name",
      "reasoning": "Brief explanation of why it fits best."
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

  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is not set. OpenAI synthesis will fail if called.");
  }

  try {
    // 1. Fetch works from CrossRef to aggregate journals
    const crossRefWorks = await searchCrossRef(topic, 40);
    
    const journalCounts = new Map<string, number>();
    for (const work of crossRefWorks) {
      if (work.venue) {
        journalCounts.set(work.venue, (journalCounts.get(work.venue) || 0) + 1);
      }
    }

    // Pick top 6 candidate journals
    const topJournals = Array.from(journalCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(entry => entry[0]);

    if (topJournals.length === 0) {
      return NextResponse.json({ error: 'No journals found for this topic.' }, { status: 404 });
    }

    // 2. Process each journal
    const journals: Journal[] = [];
    
    await Promise.allSettled(
      topJournals.map(async (jName) => {
        // DOAJ check
        const isOA = await checkDoajIsOA(jName);
        
        // Semantic Scholar for sample articles and concepts
        const samples = await searchSemanticScholar(`"${jName}" ${topic}`, 3);
        
        // Aggregate concepts from samples
        const conceptCounts = new Map<string, number>();
        samples.forEach(s => {
          s.concepts.forEach(c => conceptCounts.set(c, (conceptCounts.get(c) || 0) + 1));
        });
        
        const dominantConcepts = Array.from(conceptCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(e => e[0]);

        journals.push({
          name: jName,
          publisher: null, // Hard to get reliably without exact crossref metadata for the journal
          issn: [],
          worksCountInTopic: journalCounts.get(jName) || 0,
          isOpenAccess: isOA,
          sampleArticles: samples,
          dominantConcepts,
          scimagoLookupUrl: `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(jName)}`
        });
      })
    );

    // 3. OpenAI Synthesis
    // Clean up data to send to LLM to save tokens
    const llmData = journals.map(j => ({
      name: j.name,
      worksCountInTopic: j.worksCountInTopic,
      isOpenAccess: j.isOpenAccess,
      dominantConcepts: j.dominantConcepts
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost effective, fast
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Topic: ${topic}\n\nCandidate Journals Data:\n${JSON.stringify(llmData, null, 2)}` }
      ],
      response_format: { type: "json_object" }
    });

    const synthesisText = completion.choices[0].message.content || "{}";
    const synthesis = JSON.parse(synthesisText);

    return NextResponse.json({
      journals,
      synthesis
    });
  } catch (error: any) {
    console.error("Journal Finder API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
