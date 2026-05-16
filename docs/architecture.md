# Technical Architecture

## System Overview

SalesCheat Bot is a **full-stack application** that combines natural language processing, vector-based similarity matching, and a curated knowledge base to generate real-time recruitment intelligence (Battle Cards) for consultants on the sales floor.

The system is designed with two delivery channels:
1. **Web Interface** — Teams-inspired simulator for standalone demo
2. **Microsoft Teams Bot** — Native Teams integration via Bot Framework SDK

---

## High-Level Architecture

```
                          ┌──────────────────┐
                          │    Recruiter      │
                          │  (User Input)     │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │               │
              ┌─────▼────┐  ┌─────▼─────┐  ┌─────▼──────┐
              │  Web UI   │  │  Teams    │  │  REST API  │
              │  (Chat)   │  │  Bot      │  │  (Direct)  │
              └─────┬────┘  └─────┬─────┘  └─────┬──────┘
                    │              │               │
                    └──────────────┼───────────────┘
                                   │
                          ┌────────▼────────┐
                          │  Express Server  │
                          │  (Orchestrator)  │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
        ┌─────▼──────┐   ┌───────▼───────┐   ┌────────▼────────┐
        │  Profile    │   │  Battle Card  │   │   Template      │
        │  Parser     │   │  Generator    │   │   Matcher       │
        └─────┬──────┘   └───────┬───────┘   └────────┬────────┘
              │                    │                     │
              │            ┌───────▼───────┐   ┌────────▼────────┐
              │            │  Industries   │   │  Vector Store   │
              │            │  Knowledge    │   │  (JSON + TF-IDF)│
              │            │  Base         │   │                 │
              │            └───────────────┘   └─────────────────┘
              │
        ┌─────▼──────────────────────────────────────┐
        │           Embedding Service                 │
        │  (TF-IDF Keyword Vector Generation)         │
        └─────────────────────────────────────────────┘
```

---

## Component Deep Dive

### 1. Profile Parser (`profileParser.js`)

**Purpose:** Extract structured candidate data from unstructured input.

**Input Types:**
- LinkedIn URLs (e.g., `https://linkedin.com/in/jane-doe`)
- Free-text bios
- Combined URL + bio

**Extraction Pipeline:**
```
Raw Input
  ├─→ URL Detection (regex)
  │     ├─→ LinkedIn URL Pattern Match
  │     └─→ Name Extraction from URL slug
  ├─→ Seniority Detection
  │     └─→ Keyword hierarchy: executive > senior > mid > junior
  ├─→ Industry Detection
  │     └─→ Multi-keyword scoring across 8 industries
  ├─→ Skill Extraction
  │     └─→ 50+ technology/skill pattern matching
  ├─→ Company Extraction
  │     └─→ Regex patterns ("at Company", "Company - Title")
  ├─→ Title Extraction
  │     └─→ Role title pattern matching
  └─→ Experience Estimation
        └─→ Year patterns ("X years of experience")
```

**Output:** Structured `profile` object:
```json
{
  "name": "Jane Doe",
  "firstName": "Jane",
  "title": "Senior Software Engineer",
  "company": "Google",
  "seniority": "senior",
  "industry": "technology",
  "skills": ["kubernetes", "cloud computing", "python"],
  "yearsExperience": 8
}
```

---

### 2. Battle Card Generator (`battleCardGenerator.js`)

**Purpose:** Generate contextual pain points, hooks, and approach strategies.

**Engine:** Rule-based with industry knowledge base mapping.

**Pain Point Generation:**
- Maps `industry × seniority` to a pre-curated set of 3 pain points
- Knowledge base covers 8 industries × 4 seniority levels = **32 pain point clusters**
- Each pain point tagged with severity (high/medium/moderate)

**Hook Generation:**
- Dynamically selects hook strategy based on available profile data
- Priority: Skill-based → Tenure-based → Industry trend → Seniority-specific
- Templates include personalized variables (name, company, skill, etc.)

**Approach Strategy:**
- Maps seniority to optimal outreach parameters:
  - **Tone** (Executive & Confidential → Encouraging & Supportive)
  - **Timing** (best days/hours for each level)
  - **Channel** (LinkedIn InMail → Email → Referral)
  - **Pro Tips** (4 tailored recommendations per level)

**Confidence Scoring:**
```
Base score: 40%
+ Title detected:     +10%
+ Company detected:   +10%
+ Skills found:       +10%
+ Experience found:   +10%
+ Rich bio (>50 chars): +10%
+ Industry detected:  +10%
Maximum: 98%
```

---

### 3. Template Matcher (`templateMatcher.js`)

**Purpose:** Match candidate profiles to the best-performing outreach templates using vector similarity.

**Algorithm: Hybrid Cosine Similarity + Metadata Scoring**

```
Combined Score = (Vector Similarity × 0.6) + (Metadata Bonus × 0.4)

Where:
  Vector Similarity = cosine_sim(profile_vector, template_vector)
  
  Metadata Bonus = seniority_match (0.15)
                  + industry_match (0.10)
                  + performance_score (0-0.10)
```

**Why Hybrid?** Pure vector similarity works well for semantic matching, but recruiting templates have structured metadata (seniority, industry) that should be weighted explicitly. The 60/40 split ensures semantic relevance while respecting exact-match criteria.

**Template Selection:**
1. Compute combined scores for all 20 templates
2. Apply filters (seniority, industry, category)
3. Sort by combined score
4. Return top 3 matches with personalized text

---

### 4. Embedding Service (`embeddingService.js`)

**Purpose:** Convert text into vector representations for similarity matching.

**Method:** TF-IDF-inspired keyword vector generation (no external API required).

**Vocabulary:** 100+ dimensions covering:
- Seniority signals (junior, senior, executive, etc.)
- Industry signals (technology, finance, healthcare, etc.)
- Skill signals (python, react, kubernetes, etc.)
- Tone signals (curiosity, direct, exclusive, etc.)

**Vector Generation:**
```
1. Tokenize text → lowercase words
2. For each vocabulary term:
   - Single word: TF = 1 + log(frequency) if present, 0 otherwise
   - Multi-word: 1.5 if all words present, 0 otherwise
3. L2-normalize the resulting vector
```

**Profile Vector:** Weighted concatenation of fields:
- Title: 3× weight
- Industry: 3× weight
- Seniority: 2× weight
- Skills, company, bio: 1× weight

---

### 5. Vector Store (`vectorStore.json`)

**Purpose:** Persistent storage of pre-computed template embeddings.

**Structure:**
```json
{
  "vectors": [
    {
      "templateId": "t001",
      "vector": [0.12, 0.04, ...],
      "metadata": {
        "name": "The Curiosity Opener",
        "seniority": ["mid", "senior"],
        "industry": ["technology", "software", "saas"],
        "performanceScore": 94,
        "category": "initial-outreach"
      }
    }
  ],
  "computedAt": "2024-01-01T00:00:00Z",
  "vocabularySize": 100
}
```

**Lifecycle:**
- Computed on first server start
- Persisted to disk as JSON
- Loaded from disk on subsequent starts

---

### 6. Teams Bot (`bot.js`)

**Purpose:** Handle Microsoft Teams messaging via Bot Framework SDK.

**Key Features:**
- Welcome message with usage instructions
- Natural language message handling
- Adaptive Card rendering for Battle Cards
- Help command support

**Adaptive Card Schema:** Uses v1.5 with:
- FactSets for candidate info
- ColumnSets for pain points with severity icons
- Containers for template previews
- Styled headers with accent colors

---

## Data Flow Sequence

```
1. User Input        → "Senior Engineer at Google, 8 years, Kubernetes expert"
2. Profile Parser    → { seniority: "senior", industry: "technology", skills: ["kubernetes"] }
3. Embedding Service → [0.12, 0.04, 0.31, ...] (100+ dims)
4. Battle Card Gen   → { painPoints: [...], hook: "...", strategy: {...} }
5. Template Matcher  → [{ name: "Curiosity Opener", score: 0.94 }, ...]
6. Personalization   → Template text with {{firstName}}, {{company}} replaced
7. Response          → Combined Battle Card + personalized templates
```

---

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| JSON Vector Store vs. Pinecone | Self-contained, no external dependencies, easy to demo; production would use Pinecone |
| TF-IDF vs. OpenAI Embeddings | Works without API key; sufficient for keyword-based matching in recruiting domain |
| Rule-based vs. GPT-4 | Deterministic, fast, free; can be upgraded to AI with a single API key |
| Bot Framework SDK | Official Microsoft library, production-ready Teams integration |
| Vanilla JS Frontend | No build tools needed, lightweight, easy to deploy anywhere |
