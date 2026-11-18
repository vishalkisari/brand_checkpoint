/**
 * TAARA — Deterministic brand governance analysis engine.
 * Runs server-side only.
 */
import { getCollection } from '@/lib/storage';
import type { Finding } from '@/lib/storage';

function escapeRegex(str: string): string {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export interface DeterministicResult {
  findings: Omit<Finding, 'id' | 'createdAt'>[];
}

export async function runDeterministicAnalysis(
  submissionId: string,
  content: string
): Promise<DeterministicResult> {
  const [brandFacts, brandTerms, brandRules] = await Promise.all([
    getCollection('brandFacts'),
    getCollection('brandTerms'),
    getCollection('brandRules'),
  ]);

  const findings: Omit<Finding, 'id' | 'createdAt'>[] = [];

  const add = (
    category: string,
    issue: string,
    excerpt: string,
    severity: Finding['severity'],
    evidence: string,
    suggestedFix?: string
  ) => {
    findings.push({
      submissionId,
      source: 'DETERMINISTIC',
      category,
      issue,
      excerpt,
      severity,
      evidence,
      suggestedFix,
      status: 'OPEN',
    });
  };

  // --- Forbidden terms ---
  for (const term of brandTerms) {
    if (!term.isForbidden || term.status !== 'APPROVED') continue;
    const regex = new RegExp(`\\b${escapeRegex(term.term)}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      // Extract surrounding context
      const idx = content.toLowerCase().indexOf(term.term.toLowerCase());
      const excerpt = content.slice(Math.max(0, idx - 40), idx + term.term.length + 40);
      add(
        'Terminology',
        `Forbidden term "${term.term}" used`,
        excerpt.trim(),
        'HIGH',
        `Found forbidden term "${term.term}" in content (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
        term.replacement ? `Replace with "${term.replacement}"` : 'Remove this term'
      );
    }
  }

  // --- Required terms must be present ---
  for (const term of brandTerms) {
    if (term.isForbidden || term.status !== 'APPROVED') continue;
    const regex = new RegExp(`\\b${escapeRegex(term.term)}\\b`, 'gi');
    if (!regex.test(content)) {
      add(
        'Terminology',
        `Preferred term "${term.term}" not found`,
        '',
        'LOW',
        `Approved preferred term "${term.term}" was not used`,
        term.replacement ? `Consider using "${term.term}" or "${term.replacement}"` : `Use "${term.term}"`
      );
    }
  }

  // --- Brand facts must appear verbatim ---
  for (const fact of brandFacts) {
    if (fact.status !== 'APPROVED') continue;
    const regex = new RegExp(`\\b${escapeRegex(fact.value)}\\b`, 'gi');
    if (!regex.test(content)) {
      add(
        'Factual',
        `Approved fact "${fact.key}" value "${fact.value}" not found`,
        '',
        'MEDIUM',
        `Approved brand fact "${fact.key}: ${fact.value}" is missing or stated differently`,
        `Ensure content states "${fact.value}" for "${fact.key}"`
      );
    } else {
      // Also look for incorrect alternative values in content (simple heuristic)
      // e.g. if fact.key contains "founded" check for wrong years
      const keyWords = fact.key.toLowerCase().split(/\s+/);
      const keyRegex = new RegExp(keyWords.map(escapeRegex).join('.{0,30}'), 'gi');
      const keyMatches = content.match(keyRegex);
      if (keyMatches) {
        // Check if any sentence containing the key word contradicts the value
        const sentences = content.split(/[.!?]/);
        for (const sentence of sentences) {
          if (!keyWords.some(kw => sentence.toLowerCase().includes(kw))) continue;
          if (!new RegExp(`\\b${escapeRegex(fact.value)}\\b`, 'gi').test(sentence)) {
            const trimmed = sentence.trim();
            if (trimmed.length > 10) {
              add(
                'Factual',
                `Possible incorrect value for "${fact.key}"`,
                trimmed,
                'HIGH',
                `Sentence about "${fact.key}" does not contain approved value "${fact.value}"`,
                `Correct to "${fact.value}"`
              );
              break;
            }
          }
        }
      }
    }
  }

  // --- Brand rules (pattern-based) ---
  for (const rule of brandRules) {
    if (rule.status !== 'APPROVED') continue;
    if (rule.pattern) {
      try {
        const regex = new RegExp(rule.pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          add(
            `Rule:${rule.ruleType}`,
            `Rule violation: ${rule.description}`,
            matches[0],
            rule.ruleType === 'LEGAL' ? 'CRITICAL' : rule.ruleType === 'CLAIM' ? 'HIGH' : 'MEDIUM',
            `Pattern "${rule.pattern}" matched: "${matches[0]}"`,
            `Revise to comply with rule: ${rule.description}`
          );
        }
      } catch {
        // Invalid regex — skip
      }
    }
  }

  return { findings };
}
