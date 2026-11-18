/**
 * TAARA — Google Gemini 1.5 Flash analysis integration.
 * Runs ONLY on the server. Falls back to empty array if no API key.
 */
import { getCollection } from '@/lib/storage';
import type { Finding, BrandFact, BrandTerm, BrandRule } from '@/lib/storage';

export interface GeminiAnalysisResult {
  findings: Omit<Finding, 'id' | 'createdAt'>[];
  toneAssessment: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  aiMode: 'live' | 'demo';
}

function buildBrandContext(
  facts: BrandFact[],
  terms: BrandTerm[],
  rules: BrandRule[]
): string {
  const lines: string[] = ['=== BRAND KNOWLEDGE ==='];

  if (facts.length > 0) {
    lines.push('\nAPPROVED BRAND FACTS (must be stated accurately):');
    for (const f of facts.filter(f => f.status === 'APPROVED')) {
      lines.push(`  - ${f.key}: "${f.value}"`);
    }
  }

  const forbidden = terms.filter(t => t.isForbidden && t.status === 'APPROVED');
  if (forbidden.length > 0) {
    lines.push('\nFORBIDDEN TERMS (must not appear):');
    for (const t of forbidden) {
      lines.push(`  - "${t.term}"${t.replacement ? ` → use "${t.replacement}" instead` : ''}`);
    }
  }

  const preferred = terms.filter(t => !t.isForbidden && t.status === 'APPROVED');
  if (preferred.length > 0) {
    lines.push('\nPREFERRED TERMS (use where appropriate):');
    for (const t of preferred) {
      lines.push(`  - "${t.term}"`);
    }
  }

  if (rules.length > 0) {
    lines.push('\nBRAND RULES:');
    for (const r of rules.filter(r => r.status === 'APPROVED')) {
      lines.push(`  - [${r.ruleType}] ${r.description}`);
    }
  }

  return lines.join('\n');
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function runGeminiAnalysis(
  submissionId: string,
  content: string
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  const [facts, terms, rules] = await Promise.all([
    getCollection('brandFacts'),
    getCollection('brandTerms'),
    getCollection('brandRules'),
  ]);

  if (!apiKey) {
    return getDemoResult(submissionId, content, facts, terms, rules);
  }

  const brandContext = buildBrandContext(facts, terms, rules);

  const prompt = `You are TAARA, a strict brand-governance AI. Your job is to analyze marketing copy against approved brand standards and return ONLY a JSON object — no markdown, no code fences, just raw JSON.

${brandContext}

=== CONTENT TO ANALYZE ===
${content}

=== INSTRUCTIONS ===
Analyze the content above. Identify:
1. Factual errors vs approved brand facts
2. Forbidden terms usage
3. Tone misalignment (overly promotional, unsubstantiated superlatives, etc.)
4. Unsupported or legally risky claims
5. Missing required disclosures or key brand messages

CRITICAL RULES:
- Never invent evidence. Base every finding on specific text from the content above.
- Never autonomously approve or reject content.
- Quote the EXACT excerpt from the content for every finding.
- If content is perfect, return empty findings array.

Return EXACTLY this JSON structure:
{
  "toneAssessment": "string describing overall tone",
  "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "2-3 sentence executive summary",
  "findings": [
    {
      "category": "Factual|Terminology|Tone|LegalRisk|Claim|Structural",
      "issue": "Brief description of the issue",
      "excerpt": "EXACT quote from the content (empty string if no specific excerpt)",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "evidence": "Explanation of why this is an issue, grounded in brand knowledge",
      "suggestedFix": "Specific correction or rewrite suggestion"
    }
  ]
}`;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1, // low temp for factual/deterministic output
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[TAARA Gemini] API error:', res.status, errText);
      return getDemoResult(submissionId, content, facts, terms, rules);
    }

    const data = await res.json();
    const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Strip any accidental markdown code fences
    const jsonText = rawText
      .replace(/^```(?:json)?\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim();

    const parsed = JSON.parse(jsonText);

    const findings: Omit<Finding, 'id' | 'createdAt'>[] = (parsed.findings ?? []).map((f: any) => ({
      submissionId,
      source: 'AI' as const,
      category: f.category ?? 'AI',
      issue: f.issue ?? 'Issue identified',
      excerpt: f.excerpt ?? '',
      severity: (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(f.severity)
        ? f.severity
        : 'MEDIUM') as Finding['severity'],
      evidence: f.evidence ?? '',
      suggestedFix: f.suggestedFix ?? undefined,
      status: 'OPEN' as const,
    }));

    return {
      findings,
      toneAssessment: parsed.toneAssessment ?? 'Not assessed',
      overallRisk: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.overallRisk)
        ? parsed.overallRisk
        : 'MEDIUM') as GeminiAnalysisResult['overallRisk'],
      summary: parsed.summary ?? '',
      aiMode: 'live',
    };
  } catch (err) {
    console.error('[TAARA Gemini] Parse/request error:', err);
    return getDemoResult(submissionId, content, facts, terms, rules);
  }
}

/** Demo mode — returns realistic pre-computed findings based on simple heuristics */
function getDemoResult(
  submissionId: string,
  content: string,
  facts: BrandFact[],
  terms: BrandTerm[],
  rules: BrandRule[]
): GeminiAnalysisResult {
  const findings: Omit<Finding, 'id' | 'createdAt'>[] = [];
  const lower = content.toLowerCase();

  // Superlative / unsupported claim detector
  const superlatives = ['best in class', 'industry-leading', 'world-class', 'revolutionary', 'guaranteed', 'always', 'never fails', 'proven to'];
  for (const s of superlatives) {
    if (lower.includes(s)) {
      const idx = lower.indexOf(s);
      const excerpt = content.slice(Math.max(0, idx - 20), idx + s.length + 20);
      findings.push({
        submissionId,
        source: 'AI',
        category: 'Claim',
        issue: `Unsubstantiated superlative: "${s}"`,
        excerpt: excerpt.trim(),
        severity: 'HIGH',
        evidence: `The phrase "${s}" makes an unqualified claim that may not be supportable or legally defensible without evidence.`,
        suggestedFix: `Replace with specific, evidence-backed language. E.g. "one of the leading..." or cite a study.`,
        status: 'OPEN',
      });
    }
  }

  // Tone: overly casual
  if (lower.includes('!!!') || (content.match(/!/g) || []).length > 3) {
    findings.push({
      submissionId,
      source: 'AI',
      category: 'Tone',
      issue: 'Excessive exclamation marks — tone too informal',
      excerpt: '',
      severity: 'LOW',
      evidence: 'Multiple exclamation marks suggest an overly casual or salesy tone, inconsistent with professional brand voice.',
      suggestedFix: 'Limit exclamation marks to one per document. Use confident, measured language.',
      status: 'OPEN',
    });
  }

  // Check for forbidden terms AI-side too (in case deterministic missed case variations)
  for (const term of terms) {
    if (!term.isForbidden || term.status !== 'APPROVED') continue;
    if (lower.includes(term.term.toLowerCase())) {
      findings.push({
        submissionId,
        source: 'AI',
        category: 'Terminology',
        issue: `AI: Forbidden term "${term.term}" detected`,
        excerpt: term.term,
        severity: 'HIGH',
        evidence: `The term "${term.term}" is on the brand's forbidden list.`,
        suggestedFix: term.replacement ? `Use "${term.replacement}"` : 'Remove this term.',
        status: 'OPEN',
      });
    }
  }

  // Check for key facts missing
  for (const fact of facts) {
    if (fact.status !== 'APPROVED') continue;
    if (!lower.includes(fact.value.toLowerCase())) {
      findings.push({
        submissionId,
        source: 'AI',
        category: 'Factual',
        issue: `AI: Fact "${fact.key}" may be missing or misstated`,
        excerpt: '',
        severity: 'MEDIUM',
        evidence: `The approved value "${fact.value}" for "${fact.key}" does not appear in the content.`,
        suggestedFix: `Ensure the content states "${fact.value}" for "${fact.key}".`,
        status: 'OPEN',
      });
    }
  }

  const hasCritical = findings.some(f => f.severity === 'CRITICAL');
  const hasHigh = findings.some(f => f.severity === 'HIGH');

  return {
    findings,
    toneAssessment: 'Demo mode: AI tone analysis unavailable — set GEMINI_API_KEY to enable live analysis.',
    overallRisk: hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : findings.length > 0 ? 'MEDIUM' : 'LOW',
    summary: `Demo analysis: ${findings.length} potential issue(s) identified through heuristic checks. Add GEMINI_API_KEY for full AI analysis.`,
    aiMode: 'demo',
  };
}
