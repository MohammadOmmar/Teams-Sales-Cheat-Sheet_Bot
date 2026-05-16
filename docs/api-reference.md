# API Reference

Base URL: `http://localhost:3000`

---

## Endpoints

### POST `/api/analyze`

Generate a Battle Card from a LinkedIn URL or candidate bio.

**Request:**
```json
{
  "input": "Senior Software Engineer at Google with 8 years of experience in cloud infrastructure, Kubernetes, and distributed systems."
}
```

**Response (200):**
```json
{
  "success": true,
  "profile": {
    "source": "bio",
    "name": null,
    "firstName": null,
    "title": "Senior Software Engineer",
    "company": "Google",
    "seniority": "senior",
    "industry": "technology",
    "skills": ["python", "kubernetes", "cloud computing"],
    "yearsExperience": 8,
    "linkedinUrl": null,
    "parsedAt": "2024-01-01T00:00:00.000Z"
  },
  "battleCard": {
    "candidate": {
      "name": "Unknown Candidate",
      "title": "Senior Software Engineer",
      "company": "Google",
      "seniority": "senior",
      "seniorityLabel": "Senior Level",
      "industry": "technology",
      "industryLabel": "Technology",
      "skills": ["kubernetes", "cloud computing"],
      "yearsExperience": 8
    },
    "battleCard": {
      "painPoints": [
        {
          "id": 1,
          "text": "Politics and red tape blocking technical decisions they know are right",
          "severity": "high"
        },
        {
          "id": 2,
          "text": "Compensated well but bored — solving the same class of problems repeatedly",
          "severity": "medium"
        },
        {
          "id": 3,
          "text": "Desire to build something from scratch rather than maintain legacy systems",
          "severity": "moderate"
        }
      ],
      "suggestedHook": "\"Hi there, your kubernetes expertise caught my eye — I'm working with a team that's using it to solve problems most companies haven't even identified yet. Would love to share more.\"",
      "hookTheme": "technical leadership with zero bureaucracy and high-impact problems",
      "industryTrends": ["AI/ML integration", "cloud-native architecture", "developer experience", "platform engineering"],
      "approachStrategy": {
        "tone": "Professional & Peer-to-Peer",
        "timing": "Tuesday-Thursday, 10am-2pm",
        "channel": "LinkedIn message or email",
        "doNot": "Avoid overselling or making generic claims",
        "tips": [
          "Show you understand their specific technical or domain expertise",
          "Mention a concrete problem the role solves",
          "Be transparent about compensation range",
          "Offer market insight as value even if they're not interested"
        ]
      }
    },
    "metadata": {
      "confidenceScore": 88,
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "dataSource": "bio",
      "engine": "rule-based-v1"
    }
  },
  "matchedTemplates": [
    {
      "templateId": "t001",
      "name": "The Curiosity Opener",
      "subject": "Quick question about Google",
      "personalizedSubject": "Quick question about Google",
      "personalizedText": "Hi there,\n\nI noticed you've been at Google for 8 years...",
      "category": "initial-outreach",
      "seniority": ["mid", "senior"],
      "industry": ["technology", "software", "saas"],
      "performanceScore": 94,
      "responseRate": 0.32,
      "similarityScore": 0.45,
      "combinedScore": 0.41,
      "matchReasons": [
        "Tailored for senior-level candidates",
        "Relevant to the technology industry",
        "Top performer with 32% response rate"
      ]
    }
  ]
}
```

**Response (400):**
```json
{
  "error": "Please provide a LinkedIn URL or candidate bio."
}
```

**Response (500):**
```json
{
  "error": "Something went wrong while generating the battle card.",
  "details": "Error message"
}
```

---

### GET `/api/templates`

Browse the template library with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `seniority` | string | Filter by seniority: `junior`, `mid`, `senior`, `executive` |
| `industry` | string | Filter by industry: `technology`, `finance`, `healthcare`, etc. |
| `category` | string | Filter by category: `initial-outreach`, `follow-up`, `breakup` |

**Example:**
```
GET /api/templates?seniority=senior&industry=technology
```

**Response (200):**
```json
{
  "templates": [
    {
      "id": "t001",
      "name": "The Curiosity Opener",
      "subject": "Quick question about {{company}}",
      "text": "Hi {{firstName}}...",
      "seniority": ["mid", "senior"],
      "industry": ["technology", "software", "saas"],
      "performanceScore": 94,
      "responseRate": 0.32,
      "tags": ["curiosity", "non-pushy", "relationship-building"],
      "category": "initial-outreach"
    }
  ],
  "total": 12
}
```

---

### GET `/api/health`

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "service": "SalesCheat Bot",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST `/api/messages`

Microsoft Teams Bot Framework messaging endpoint. This endpoint is called by the Bot Framework when the bot receives a message in Teams.

**Note:** This endpoint is not intended for direct API calls. It uses the Bot Framework adapter protocol.

**Headers:**
```
Authorization: Bearer <bot-framework-token>
Content-Type: application/json
```

**Body:** Bot Framework Activity object (handled by the SDK)

---

## Input Examples

### LinkedIn URL
```json
{"input": "https://linkedin.com/in/jane-doe-senior-engineer"}
```

### Short Bio
```json
{"input": "Senior Product Manager at Stripe, 6 years in fintech"}
```

### Detailed Bio
```json
{"input": "John Smith\nVP of Engineering at a Series C fintech startup. 15 years experience across Goldman Sachs, JPMorgan, and two startups. Expert in distributed systems, real-time trading platforms, and team building. Currently managing a team of 45 engineers. Interested in CTO-level opportunities with equity upside."}
```

### URL + Bio Combined
```json
{"input": "https://linkedin.com/in/sarah-chen Senior Software Engineer at Google with 8 years experience in cloud infrastructure, Kubernetes, and distributed systems. Previously at Amazon AWS. Looking for more ownership and less bureaucracy."}
```

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Human-readable error message",
  "details": "Technical details (only in 500 errors)"
}
```

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (missing or invalid input) |
| 500 | Server error |
