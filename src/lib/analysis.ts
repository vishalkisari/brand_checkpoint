import { addToCollection, getCollection, updateCollection } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

// Deterministic analysis: compare content against approved facts, terms, and rules
export async function runDeterministicAnalysis(submissionId: string, content: string) {
  const brandFacts = await getCollection('brandFacts');
  const brandTerms = await getCollection('brandTerms');
  const brandRules = await getCollection('brandRules');
  const campaignFacts = await getCollection('campaignFacts');

  const findings: any[] = [];

  // Helper to add finding
  const addFinding = (category: string, issue: string, excerpt: string, severity: string, evidence: string, suggestion?: string) => {
    findings.push({
      id: uuidv4(),
      submissionId,
      category,
      issue,
      excerpt,
      severity,
      evidenceState: evidence,
      suggestedFix: suggestion || null,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    });
  };

  // Check approved brand facts (exact matches for key/value)
  for (const fact of brandFacts) {
    if (fact.status !== 'APPROVED') continue;
    const regex = new RegExp(`\\b${fact.value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (!regex.test(content)) {
      addFinding(
        'Factual',
        `Missing approved fact "${fact.key}" with value "${fact.value}"`,
        '',
        'MEDIUM',
        'Missing evidence',
        `Add or correct to "${fact.value}"`
      );
    }
  }

  // Check forbidden terms
  for (const term of brandTerms) {
    if (term.isForbidden && term.status === 'APPROVED') {
      const regex = new RegExp(`\\b${term.term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(content)) {
        addFinding(
          'Terminology',
          `Forbidden term "${term.term}" used`,
          term.term,
          'HIGH',
          'Found forbidden term',
          term.replacement ? `Replace with "${term.replacement}"` : undefined
        );
      }
    }
  }

  // Check required terminology (non-forbidden terms with isForbidden false but approved)
  for (const term of brandTerms) {
    if (!term.isForbidden && term.status === 'APPROVED') {
      const regex = new RegExp(`\\b${term.term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (!regex.test(content)) {
        addFinding(
          'Terminology',
          `Preferred term "${term.term}" missing`,
          '',
          'LOW',
          'Missing preferred terminology',
          term.replacement ? `Consider using "${term.replacement}"` : undefined
        );
      }
    }
  }

  // Check brand rules (simple substring search)
  for (const rule of brandRules) {
    if (rule.status !== 'APPROVED') continue;
    const regex = new RegExp(rule.rule, 'i');
    if (!regex.test(content)) {
      addFinding(
        'Rule',
        `Content does not satisfy rule: ${rule.rule}`,
        '',
        'LOW',
        'Rule not matched',
        undefined
      );
    }
  }

  // Store findings
  await Promise.all(
    findings.map((f) => addToCollection('findings', f))
  );

  // Return findings for immediate response
  return findings;
}
