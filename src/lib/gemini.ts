import { getCollection, addToCollection, updateCollection } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

// Simple Gemini wrapper – returns AI insights if API key is set, otherwise returns empty array.
export async function runGeminiAnalysis(content: string, campaignId: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set – skipping AI analysis');
    return [];
  }

  const prompt = `You are an AI brand‑governance assistant for the TAARA platform.
  Analyze the following marketing content and provide:
  1. Tone assessment (Professional, Friendly, etc.)
  2. Any messaging that may conflict with brand tone or rules (you will receive the brand facts, terms, and rules in a separate step).
  3. Suggested improvements or re‑phrasing.
  Return a JSON array of objects with keys: category, issue, explanation, severity (Critical/High/Medium/Low), suggestion.
  Content:\n"""\n${content}\n"""`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini API error', data);
      return [];
    }
    // Expect the model to output JSON in the first text part.
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Gemini response not valid JSON', text);
      return [];
    }
  } catch (err) {
    console.error('Gemini request failed', err);
    return [];
  }
}

export async function runFullAnalysis(submissionId: string, content: string, campaignId: string) {
  // Deterministic part
  const deterministicFindings = await (await import('./analysis')).runDeterministicAnalysis(submissionId, content);

  // Gemini part
  const aiFindings = await runGeminiAnalysis(content, campaignId);

  // Merge, avoid duplicate IDs (they already have uuid IDs)
  const allFindings = [...deterministicFindings, ...aiFindings.map((f: any) => ({
    id: uuidv4(),
    submissionId,
    category: f.category || 'AI',
    issue: f.issue || f.title || 'AI insight',
    excerpt: '',
    severity: f.severity || 'LOW',
    evidenceState: 'AI generated',
    suggestedFix: f.suggestion || null,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  }))];

  // Persist AI findings if any
  await Promise.all(allFindings.map((f) => addToCollection('findings', f)));
  return allFindings;
}
