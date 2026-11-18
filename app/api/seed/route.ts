/**
 * POST /api/seed — seed the NOVA demo data (idempotent)
 */
import { loadData, saveData, logActivity, type Data } from '@/lib/storage';


const NOVA_SEED: Partial<Data> = {
  organizations: [
    {
      id: 'org_nova',
      name: 'NOVA Wellness',
      logoUrl: undefined,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
  brandFacts: [
    {
      id: 'fact_1',
      orgId: 'org_nova',
      key: 'Year Founded',
      value: '2019',
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
      approvedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'fact_2',
      orgId: 'org_nova',
      key: 'Clinical Study Efficacy',
      value: '89% of participants reported improved sleep within 30 days',
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
      approvedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'fact_3',
      orgId: 'org_nova',
      key: 'FDA Status',
      value: 'Not evaluated by the FDA',
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
      approvedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'fact_4',
      orgId: 'org_nova',
      key: 'Hero Product',
      value: 'NOVA SleepSync',
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
      approvedAt: '2024-01-02T00:00:00Z',
    },
  ],
  brandTerms: [
    {
      id: 'term_1',
      orgId: 'org_nova',
      term: 'cure',
      replacement: 'support',
      isForbidden: true,
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'term_2',
      orgId: 'org_nova',
      term: 'guaranteed',
      replacement: 'clinically studied',
      isForbidden: true,
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'term_3',
      orgId: 'org_nova',
      term: 'treat',
      replacement: 'support healthy sleep',
      isForbidden: true,
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'term_4',
      orgId: 'org_nova',
      term: 'NOVA SleepSync',
      replacement: undefined,
      isForbidden: false,
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'term_5',
      orgId: 'org_nova',
      term: 'clinically studied',
      replacement: undefined,
      isForbidden: false,
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
  brandRules: [
    {
      id: 'rule_1',
      orgId: 'org_nova',
      description: 'All health claims must include FDA disclaimer',
      pattern: undefined,
      ruleType: 'LEGAL',
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'rule_2',
      orgId: 'org_nova',
      description: 'Do not claim product cures, treats, or prevents any disease',
      pattern: '\\b(cures|treats|prevents|heals)\\b.*\\b(disease|disorder|condition|insomnia|anxiety)',
      ruleType: 'LEGAL',
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'rule_3',
      orgId: 'org_nova',
      description: 'Tone must be science-forward and empathetic, never alarmist',
      pattern: '\\b(dangerous|deadly|killer|toxic|poison)\\b',
      ruleType: 'TONE',
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'rule_4',
      orgId: 'org_nova',
      description: 'Percentage claims must reference the clinical study',
      pattern: '\\d+%(?!.*(?:study|participants|clinical|research))',
      ruleType: 'CLAIM',
      status: 'APPROVED',
      createdBy: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
  campaigns: [
    {
      id: 'camp_1',
      orgId: 'org_nova',
      title: 'Sleep Better Campaign — Q1 2025',
      description: 'Product launch campaign for NOVA SleepSync targeting millennials with sleep issues.',
      status: 'ACTIVE',
      createdBy: 'Admin',
      createdAt: '2024-12-01T00:00:00Z',
    },
  ],
  campaignFacts: [
    {
      id: 'cfact_1',
      campaignId: 'camp_1',
      key: 'Campaign Claim',
      value: 'NOVA SleepSync is clinically studied to support healthy sleep',
      required: true,
      status: 'APPROVED',
      createdAt: '2024-12-01T00:00:00Z',
    },
    {
      id: 'cfact_2',
      campaignId: 'camp_1',
      key: 'Disclaimer Required',
      value: 'These statements have not been evaluated by the Food and Drug Administration.',
      required: true,
      status: 'APPROVED',
      createdAt: '2024-12-01T00:00:00Z',
    },
    {
      id: 'cfact_3',
      campaignId: 'camp_1',
      key: 'Clinical Reference',
      value: '89% of participants reported improved sleep within 30 days',
      required: true,
      status: 'APPROVED',
      createdAt: '2024-12-01T00:00:00Z',
    },
  ],
  submissions: [
    {
      id: 'sub_nova_1',
      campaignId: 'camp_1',
      orgId: 'org_nova',
      title: 'Email — Subject Line Test',
      content: `Introducing NOVA SleepSync — the guaranteed cure for your sleep problems!

Tired of tossing and turning? Our revolutionary formula treats insomnia and sleep disorders fast. 
90% of customers see results overnight! Try it now — results guaranteed or your money back.

This product has been approved by the FDA.`,
      contentType: 'TEXT',
      status: 'REVIEW_REQUIRED',
      version: 1,
      createdBy: 'Creator',
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: '2025-01-10T09:01:00Z',
    },
    {
      id: 'sub_nova_2',
      campaignId: 'camp_1',
      orgId: 'org_nova',
      title: 'Email — Subject Line Test (Revision)',
      content: `Introducing NOVA SleepSync — the clinically studied way to support healthy sleep.

Struggling to get quality rest? NOVA SleepSync is formulated to support your natural sleep cycle. 
In a clinical study, 89% of participants reported improved sleep within 30 days.

These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.`,
      contentType: 'TEXT',
      status: 'APPROVED',
      version: 2,
      parentId: 'sub_nova_1',
      createdBy: 'Creator',
      createdAt: '2025-01-10T14:00:00Z',
      updatedAt: '2025-01-10T14:30:00Z',
    },
  ],
  findings: [
    {
      id: 'fnd_nova_1',
      submissionId: 'sub_nova_1',
      source: 'DETERMINISTIC',
      category: 'Terminology',
      issue: 'Forbidden term "guaranteed" used',
      excerpt: 'the guaranteed cure for your sleep problems',
      severity: 'HIGH',
      evidence: 'The term "guaranteed" is on the brand forbidden list. It makes an unqualified promise.',
      suggestedFix: 'Replace with "clinically studied"',
      status: 'ADDRESSED',
      createdAt: '2025-01-10T09:01:00Z',
    },
    {
      id: 'fnd_nova_2',
      submissionId: 'sub_nova_1',
      source: 'DETERMINISTIC',
      category: 'Terminology',
      issue: 'Forbidden term "cure" used',
      excerpt: 'guaranteed cure for your sleep problems',
      severity: 'HIGH',
      evidence: 'The term "cure" is forbidden. NOVA products may not claim to cure conditions.',
      suggestedFix: 'Replace with "support"',
      status: 'ADDRESSED',
      createdAt: '2025-01-10T09:01:00Z',
    },
    {
      id: 'fnd_nova_3',
      submissionId: 'sub_nova_1',
      source: 'AI',
      category: 'LegalRisk',
      issue: 'False FDA approval claim',
      excerpt: 'This product has been approved by the FDA.',
      severity: 'CRITICAL',
      evidence: 'Approved brand fact states "Not evaluated by the FDA". Claiming FDA approval when the product is not approved is a serious regulatory violation.',
      suggestedFix: 'Replace with the approved disclaimer: "These statements have not been evaluated by the Food and Drug Administration."',
      status: 'ADDRESSED',
      createdAt: '2025-01-10T09:01:00Z',
    },
    {
      id: 'fnd_nova_4',
      submissionId: 'sub_nova_1',
      source: 'AI',
      category: 'Factual',
      issue: 'Incorrect clinical study statistic',
      excerpt: '90% of customers see results overnight',
      severity: 'HIGH',
      evidence: 'Approved clinical study fact states "89% of participants reported improved sleep within 30 days". The content states 90% and "overnight" — both differ from the approved fact.',
      suggestedFix: 'Use the approved statistic: "89% of participants reported improved sleep within 30 days"',
      status: 'ADDRESSED',
      createdAt: '2025-01-10T09:01:00Z',
    },
    {
      id: 'fnd_nova_5',
      submissionId: 'sub_nova_1',
      source: 'DETERMINISTIC',
      category: 'Terminology',
      issue: 'Forbidden term "treat" used',
      excerpt: 'formula treats insomnia and sleep disorders',
      severity: 'HIGH',
      evidence: 'The term "treat" is forbidden for health products. It implies medical treatment.',
      suggestedFix: 'Replace with "support healthy sleep"',
      status: 'ADDRESSED',
      createdAt: '2025-01-10T09:01:00Z',
    },
  ],
  reviewDecisions: [
    {
      id: 'rdec_nova_1',
      submissionId: 'sub_nova_1',
      reviewerId: 'Reviewer',
      decision: 'CHANGES_REQUESTED',
      comments: '5 issues flagged including a CRITICAL FDA false claim. This cannot be published as-is. Creator must correct all findings before resubmission.',
      findingsSummary: { total: 5, critical: 1, high: 4, medium: 0, low: 0 },
      createdAt: '2025-01-10T10:00:00Z',
    },
    {
      id: 'rdec_nova_2',
      submissionId: 'sub_nova_2',
      reviewerId: 'Reviewer',
      decision: 'APPROVED',
      comments: 'All issues have been addressed. Correct FDA disclaimer included, accurate study statistics, no forbidden terms. Approved for publication.',
      findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      createdAt: '2025-01-10T15:00:00Z',
    },
  ],
  activityLogs: [
    { id: 'log_1', submissionId: 'sub_nova_1', campaignId: 'camp_1', orgId: 'org_nova', actor: 'Creator', action: 'SUBMISSION_CREATED', details: 'Email — Subject Line Test', createdAt: '2025-01-10T09:00:00Z' },
    { id: 'log_2', submissionId: 'sub_nova_1', actor: 'System', action: 'ANALYSIS_COMPLETE', details: '5 finding(s): 1 critical, 4 high, 0 medium, 0 low. AI mode: demo', createdAt: '2025-01-10T09:01:00Z' },
    { id: 'log_3', submissionId: 'sub_nova_1', actor: 'Reviewer', action: 'REVIEW_CHANGES_REQUESTED', details: 'CRITICAL FDA false claim plus 4 high severity issues.', createdAt: '2025-01-10T10:00:00Z' },
    { id: 'log_4', submissionId: 'sub_nova_2', campaignId: 'camp_1', actor: 'Creator', action: 'RESUBMISSION_CREATED', details: 'Revision of sub_nova_1: All issues addressed', createdAt: '2025-01-10T14:00:00Z' },
    { id: 'log_5', submissionId: 'sub_nova_2', actor: 'System', action: 'ANALYSIS_COMPLETE', details: '0 finding(s). AI mode: demo', createdAt: '2025-01-10T14:01:00Z' },
    { id: 'log_6', submissionId: 'sub_nova_2', actor: 'Reviewer', action: 'REVIEW_APPROVED', details: 'All issues addressed. Approved for publication.', createdAt: '2025-01-10T15:00:00Z' },
  ],
};

export async function POST() {
  const data = await loadData();

  // Idempotent — only seed if no NOVA org exists
  if (data.organizations.some(o => o.id === 'org_nova')) {
    return Response.json({ ok: true, message: 'Already seeded' });
  }

  for (const [key, items] of Object.entries(NOVA_SEED)) {
    (data as any)[key] = [...((data as any)[key] || []), ...(items as any[])];
  }

  await saveData();

  await logActivity({
    orgId: 'org_nova',
    actor: 'System',
    action: 'SEED_COMPLETE',
    details: 'NOVA demo data seeded successfully',
  });

  return Response.json({ ok: true, message: 'NOVA demo data seeded' });
}
