# Workflow Diagrams
**Architect**: Mohammad Ommar Waza (AI Analyst)
**Company**: Consulting Point

This document contains visual workflow diagrams explaining the SalesCheat Bot's processes.

---

## 1. End-to-End User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RECRUITER WORKFLOW                                │
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ Identify  │──→│ Open Bot in  │──→│ Input:        │              │
│  │ Candidate │    │ Teams / Web  │    │ LinkedIn URL  │              │
│  │           │    │              │    │ or Bio text   │              │
│  └──────────┘    └──────────────┘    └──────┬───────┘              │
│                                             │                       │
│                                    ┌────────▼────────┐              │
│                                    │  Bot processes   │              │
│                                    │  (1-2 seconds)   │              │
│                                    └────────┬────────┘              │
│                                             │                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    BATTLE CARD OUTPUT                          │ │
│  │                                                                │ │
│  │  ┌─── Candidate Profile ─────────────────────────────────┐    │ │
│  │  │ Name | Title | Company | Seniority | Industry | Skills│    │ │
│  │  └───────────────────────────────────────────────────────┘    │ │
│  │                                                                │ │
│  │  ┌─── Pain Points ──────────────────────────────────────┐     │ │
│  │  │ 🔴 High:     Primary frustration                      │     │ │
│  │  │ 🟡 Medium:   Secondary challenge                      │     │ │
│  │  │ 🟢 Moderate: Underlying concern                       │     │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  │                                                                │ │
│  │  ┌─── Suggested Hook ──────────────────────────────────┐      │ │
│  │  │ Personalized opening message ready to copy & send    │      │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  │                                                                │ │
│  │  ┌─── Approach Strategy ───────────────────────────────┐      │ │
│  │  │ Tone | Best Time | Channel | Tips                    │      │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  │                                                                │ │
│  │  ┌─── Matched Templates (Top 3) ──────────────────────┐       │ │
│  │  │ Ranked by vector similarity + performance score      │       │ │
│  │  │ Each with: Copy button | Match reasons | Stats       │       │ │
│  │  └───────────────────────────────────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                             │                       │
│                                    ┌────────▼────────┐              │
│                                    │ Recruiter copies │              │
│                                    │ hook/template &   │              │
│                                    │ sends to candidate│              │
│                                    └──────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Processing Pipeline

```
INPUT                  PARSING                GENERATION             MATCHING              OUTPUT
─────                  ───────                ──────────             ────────              ──────

┌──────────┐     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────┐
│ LinkedIn │────→│  URL Pattern │─────→│  Industry    │─────→│  Generate    │─────→│ Battle   │
│ URL      │     │  Matching    │      │  Knowledge   │      │  Profile     │      │ Card     │
└──────────┘     │              │      │  Base Lookup │      │  Vector      │      │ Response │
                 │  Extract:    │      │              │      │              │      │          │
┌──────────┐     │  • Name      │      │  Map to:     │      │  Cosine      │      │ Includes:│
│ Bio      │────→│  • Company   │─────→│  • Pain pts  │─────→│  Similarity  │─────→│ • Profile│
│ Text     │     │  • Title     │      │  • Hooks     │      │  vs 20       │      │ • Pain   │
└──────────┘     │  • Seniority │      │  • Strategy  │      │  template    │      │   points │
                 │  • Industry  │      │  • Trends    │      │  vectors     │      │ • Hook   │
                 │  • Skills    │      │              │      │              │      │ • Top 3  │
                 │  • Experience│      │  Confidence  │      │  Hybrid      │      │   templs │
                 │              │      │  Scoring     │      │  scoring:    │      │ • Strat  │
                 └──────────────┘      └──────────────┘      │  60% vector  │      └──────────┘
                                                              │  40% metadata│
                                                              └──────────────┘
```

---

## 3. Vector Matching Process

```
                    VECTOR DATABASE WORKFLOW
                    
  ┌─────────────────────────────────────────────────┐
  │              INITIALIZATION (Server Start)       │
  │                                                  │
  │  templates.json ──→ Tokenize each template       │
  │                      │                           │
  │                      ▼                           │
  │                 TF-IDF Vector Gen                 │
  │                 (100+ dimensions)                 │
  │                      │                           │
  │                      ▼                           │
  │                 L2 Normalize                      │
  │                      │                           │
  │                      ▼                           │
  │                 Save to vectorStore.json          │
  └─────────────────────────────────────────────────┘
  
  ┌─────────────────────────────────────────────────┐
  │              QUERY TIME (Per Request)            │
  │                                                  │
  │  Candidate Profile ──→ Build weighted text       │
  │                         (title×3, industry×3,    │
  │                          seniority×2, skills×1)  │
  │                              │                   │
  │                              ▼                   │
  │                     TF-IDF Vector Gen             │
  │                              │                   │
  │                              ▼                   │
  │                     For each template:            │
  │                       cosine_sim(query, template) │
  │                              │                   │
  │                              ▼                   │
  │                     Apply metadata bonus:         │
  │                       +0.15 seniority match       │
  │                       +0.10 industry match        │
  │                       +0.10 performance score     │
  │                              │                   │
  │                              ▼                   │
  │                     Combined = 0.6×sim + 0.4×meta│
  │                              │                   │
  │                              ▼                   │
  │                     Sort by combined score        │
  │                     Return top 3                  │
  └─────────────────────────────────────────────────┘
```

---

## 4. Teams Integration Flow

```
  ┌──────────┐        ┌──────────────┐        ┌─────────────┐
  │ Recruiter│        │  Microsoft   │        │ SalesCheat  │
  │ in Teams │        │  Bot Service │        │ Bot Server  │
  └────┬─────┘        └──────┬───────┘        └──────┬──────┘
       │                     │                       │
       │  Send message       │                       │
       │────────────────────→│                       │
       │                     │  POST /api/messages   │
       │                     │──────────────────────→│
       │                     │                       │
       │                     │                       │ Parse profile
       │                     │                       │ Generate battle card
       │                     │                       │ Match templates
       │                     │                       │
       │                     │  Adaptive Card        │
       │                     │←──────────────────────│
       │  Display card       │                       │
       │←────────────────────│                       │
       │                     │                       │
       │  ┌────────────────────────────────────────┐ │
       │  │         Adaptive Card in Teams          │ │
       │  │                                        │ │
       │  │  🎯 BATTLE CARD                        │ │
       │  │  ─────────────────────                 │ │
       │  │  👤 Jane Doe                           │ │
       │  │  💼 Senior Engineer                    │ │
       │  │  🏢 Google                             │ │
       │  │                                        │ │
       │  │  💥 Pain Points                        │ │
       │  │  🔴 Politics blocking decisions        │ │
       │  │  🟡 Bored solving same problems        │ │
       │  │  🟢 Wants to build from scratch        │ │
       │  │                                        │ │
       │  │  🪝 "Hi Jane, your kubernetes..."      │ │
       │  │                                        │ │
       │  │  📧 Top Templates                      │ │
       │  │  • The Curiosity Opener (94/100)       │ │
       │  │  • The Skill Spotlight (90/100)        │ │
       │  └────────────────────────────────────────┘ │
       │                     │                       │
```

---

## 5. Data Model

```
  ┌───────────────────────────────────────────────────────────────┐
  │                        DATA LAYER                             │
  │                                                               │
  │  ┌─── templates.json ──────────────────────────────────────┐  │
  │  │ 20 templates, each with:                                │  │
  │  │ • id, name, subject, text                               │  │
  │  │ • seniority: ["junior" | "mid" | "senior" | "executive"]│  │
  │  │ • industry: ["technology" | "finance" | ...]            │  │
  │  │ • performanceScore: 0-100                               │  │
  │  │ • responseRate: 0.0-1.0                                 │  │
  │  │ • tags: ["curiosity", "direct", "exclusive", ...]       │  │
  │  │ • category: "initial-outreach" | "follow-up" | "breakup"│  │
  │  └─────────────────────────────────────────────────────────┘  │
  │                                                               │
  │  ┌─── industries.json ─────────────────────────────────────┐  │
  │  │ 8 industries:                                           │  │
  │  │ technology, finance, healthcare, marketing,             │  │
  │  │ sales, consulting, engineering, data-science            │  │
  │  │                                                         │  │
  │  │ Each industry has:                                      │  │
  │  │ • aliases (keyword synonyms)                            │  │
  │  │ • painPoints[junior/mid/senior/executive] (3 each)      │  │
  │  │ • hooks[junior/mid/senior/executive] (1 each)           │  │
  │  │ • trends (4 current industry trends)                    │  │
  │  └─────────────────────────────────────────────────────────┘  │
  │                                                               │
  │  ┌─── vectorStore.json ────────────────────────────────────┐  │
  │  │ Pre-computed embeddings:                                │  │
  │  │ • 20 template vectors (100+ dimensions each)            │  │
  │  │ • Computed via TF-IDF on vocabulary                     │  │
  │  │ • L2-normalized for cosine similarity                   │  │
  │  │ • Auto-generated on first server start                  │  │
  │  └─────────────────────────────────────────────────────────┘  │
  └───────────────────────────────────────────────────────────────┘
```

---

## 6. Confidence Score Calculation

```
  Profile Data Available         Score Contribution
  ─────────────────────         ──────────────────
  ┌─────────────────┐
  │ Base Score       │────────→  +40%
  │                  │
  │ Title detected?  │──── Y ─→  +10%
  │                  │
  │ Company found?   │──── Y ─→  +10%
  │                  │
  │ Skills extracted?│──── Y ─→  +10%
  │                  │
  │ Experience found?│──── Y ─→  +10%
  │                  │
  │ Rich bio (>50ch)?│──── Y ─→  +10%
  │                  │
  │ Industry non-    │
  │ default detected?│──── Y ─→  +10%
  │                  │           ─────
  └─────────────────┘           Max: 98%
```
