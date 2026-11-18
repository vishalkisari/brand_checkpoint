<div align="center">

# TAARA

### Your brand's last checkpoint before publication.

**A pre-publication brand governance platform that catches brand violations, factual errors, and compliance risks in marketing content — before it goes live.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-orange?style=flat-square&logo=google)](https://aistudio.google.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

</div>

---

## What is TAARA?

Marketing teams ship content every day — emails, ads, social posts, landing pages. Any one of them can contain a wrong statistic, a forbidden term, a false regulatory claim, or an off-brand tone. By the time someone catches it, it's already published.

**TAARA sits between your content creator and the publish button.**

It analyzes every piece of marketing copy against your approved brand knowledge — facts, terminology, rules — using a combination of deterministic rule-checking and Google Gemini AI. Reviewers see exactly what's wrong, why it's wrong, and what to fix. Creators can correct and resubmit. Everything is logged.

---

## Features

### Brand Governance Engine
- **Deterministic analysis** — catches forbidden terms, missing required terminology, factual deviations, and regex-based rule violations with zero false negatives
- **Gemini 1.5 Flash AI analysis** — evidence-grounded tone assessment, unsupported claims detection, nuanced contradictions, and suggested corrections
- **Merged findings** — both engines run in parallel; results are deduplicated and merged by severity

### Full Review Workflow
- **Submit** → content enters the review queue with instant analysis results
- **Review** → reviewers see a split-view: findings on the left, content on the right
- **Decide** → Approve, Request Changes, or Reject with required comments
- **Correct** → creators resubmit corrections; a new versioned submission is created and re-analyzed
- **Approve** → final approval recorded and logged

### Brand Knowledge Management
- **Facts** — approved key/value pairs that must appear verbatim (e.g. `FDA Status: "Not evaluated by the FDA"`)
- **Terms** — forbidden terms with approved replacements, and preferred terminology
- **Rules** — structured rules with optional regex patterns (`LEGAL`, `CLAIM`, `TONE`, `STRUCTURE`)
- **Approval workflow** — all knowledge items go through PENDING → APPROVED → ARCHIVED

### Campaigns & Truth Sheets
- Organize submissions by campaign
- Each campaign has a **Truth Sheet** — required facts and approved claims that content must include

### Audit Trail
- Every action logged: submissions, analyses, decisions, corrections, approvals
- Full version history per submission chain (v1 → v2 → v3...)
- Activity log page with category filters

### Demo Ready
- One-click **NOVA Wellness** demo scenario — a realistic wellness brand with a flawed submission containing a CRITICAL FDA false claim, wrong statistics, and forbidden terms, plus a corrected v2
- Role switcher: **Admin**, **Creator**, **Reviewer** — no login required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Vanilla CSS with custom design system |
| AI | Google Gemini 1.5 Flash |
| Storage | Local JSON file (`data.json`) or Supabase |
| Auth | Demo role switcher (client-side) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/amulyeahhreddy/brand_checkpoint.git
cd brand_checkpoint
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Seed demo data

On the Dashboard, click **"🌱 Seed NOVA Demo"** — or run:

```bash
curl -X POST http://localhost:3000/api/seed
```

This loads the complete NOVA Wellness scenario: brand knowledge, campaign, a flawed v1 submission with 5 findings (including a CRITICAL regulatory violation), and a corrected v2 that passed review.

---

## Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Enables live Gemini AI analysis. Without it, TAARA uses built-in demo heuristics that still catch most violations. Get a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Use Supabase instead of local `data.json` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key |

**The app works fully out of the box with no configuration.** Adding `GEMINI_API_KEY` activates live AI analysis — no code changes needed.

---

## Project Structure

```
app/                          # Next.js App Router pages + API routes
  dashboard/                  # KPI overview
  brand/                      # Brand knowledge (facts, terms, rules)
  campaigns/[id]/             # Campaign detail + Truth Sheet
  submit/                     # Content submission form
  submissions/[id]/           # Review Studio — split view
  review/                     # Reviewer queue (severity sorted)
  activity/                   # Audit log
  api/
    seed/                     # POST — load NOVA demo data
    submit/                   # POST — submit + analyze content
    resubmit/                 # POST — creator correction + re-analysis
    brand/approve/            # POST — approve/archive brand knowledge
    collections/[name]/       # GET/POST — generic collection access
    submissions/[id]/
      findings/               # GET findings, PATCH status
      review/                 # GET/POST review decisions
      history/                # GET full version chain

lib/                          # Server-side modules
  storage.ts                  # JSON file persistence layer
  analysis.ts                 # Deterministic brand governance engine
  gemini.ts                   # Gemini 1.5 Flash integration + demo fallback
  orchestrator.ts             # Merge, deduplicate, persist, log

context/AuthContext.tsx       # Demo role switcher
components/Sidebar.tsx        # Navigation with role-based filtering
```

---

## Demo Walkthrough

> Make sure you've seeded the NOVA demo data first.

1. **Dashboard** — see KPI stats: 2 submissions, 1 needing review, 1 approved, 5 findings total
2. **Submissions** → open `Email — Subject Line Test (v1)`
3. **Review Studio** → 5 findings shown:
   - 🚨 **CRITICAL** — "This product has been approved by the FDA." ← false regulatory claim
   - ⚠️ **HIGH** — forbidden term `"guaranteed"` with suggested fix
   - ⚠️ **HIGH** — forbidden term `"cure"` with suggested fix
   - ⚠️ **HIGH** — forbidden term `"treat"` with suggested fix
   - ⚠️ **HIGH** — wrong statistic: `"90% overnight"` vs approved `"89% within 30 days"`
4. **Switch to Creator role** → click **Submit Correction** → edit the content → Submit Revision
5. **v2 is analyzed** — findings drop to near zero
6. **Switch to Reviewer** → find v2 in Review Queue → Approve it
7. **Activity Log** — see the complete audit trail of every step

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/seed` | POST | Load NOVA demo scenario (idempotent) |
| `/api/submit` | POST | Submit content for analysis and review |
| `/api/resubmit` | POST | Submit a correction (creates v+1) |
| `/api/collections/:name` | GET | Fetch any collection |
| `/api/collections/:name` | POST | Add item to collection |
| `/api/submissions/:id/findings` | GET | Get findings for a submission |
| `/api/submissions/:id/findings` | PATCH | Update finding status |
| `/api/submissions/:id/review` | GET | Get review decisions |
| `/api/submissions/:id/review` | POST | Submit a review decision |
| `/api/submissions/:id/history` | GET | Get full version chain |
| `/api/brand/approve` | POST | Approve/archive a brand knowledge item |

---

## Roles

| Role | Capabilities |
|---|---|
| **Admin** | Everything — manage brand knowledge, approve items, review, submit, seed data |
| **Creator** | Submit content, resubmit corrections, view their submissions |
| **Reviewer** | Review queue, submit decisions, dismiss findings |

Switch roles using the dropdown in the bottom-left sidebar — no login required.

---

## AI Safety Principles

TAARA's AI integration follows strict evidence-grounding rules:

- **Never invents evidence** — every AI finding quotes exact text from the submitted content
- **Never autonomously approves** — only a human reviewer can approve content
- **Never silently modifies** — content is never changed without creator action
- **Transparent sourcing** — each finding is tagged `AI` or `Rule` so reviewers know its origin
- **Graceful degradation** — if Gemini is unavailable, demo heuristics run instead

---

<div align="center">

Built for the hackathon · TAARA · 2025

</div>
