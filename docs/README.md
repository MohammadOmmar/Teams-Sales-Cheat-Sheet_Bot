# SalesCheat Bot 

**AI-powered Battle Card generator for recruiters — built as a Microsoft Teams integration.**

Drop a LinkedIn URL or a candidate bio, and get instant intel: 3 likely pain points, a personalized hook, and top-performing outreach templates matched to the candidate's seniority and industry.


---

##  Features

- ** Battle Card Generation** — Instant intel on any candidate with pain points, hooks, and approach strategy
- ** Vector Database Matching** — Cosine similarity on TF-IDF embeddings matches candidates to top-performing templates
- ** 20+ Curated Templates** — Real outreach templates with performance scores and response rates
- ** Industry Knowledge Base** — 8 industries × 4 seniority levels = 32 pain point clusters
- ** Microsoft Teams Bot** — Full Bot Framework integration with Adaptive Cards
- ** Web Demo UI** — Beautiful Teams-inspired simulator for portfolio showcase
- ** Dark/Light Mode** — Premium design with glassmorphism and smooth animations

---

##  Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd salescheat-bot

# Install dependencies
npm install

# Start the server
npm start
```

Open **[http://localhost:3000](https://github.com/MohammadOmmar/Teams-Sales-Cheat-Sheet_Bot)** in your browser.

### Try It Out

1. Click one of the **example buttons** in the welcome screen
2. Or paste your own candidate bio, for example:
   ```
   Senior Software Engineer at Google with 8 years of experience 
   in cloud infrastructure, Kubernetes, and distributed systems. 
   Previously at Amazon AWS.
   ```
3. The bot generates a **Battle Card** with:
   -  Parsed candidate profile
   -  3 likely pain points
   -  Personalized hook message
   -  Approach strategy (tone, timing, channel)
   -  Top matching templates (with copy buttons)

---

##  Architecture

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                        │
│   Teams Simulator UI (HTML/CSS/JS)               │
└───────────────────┬─────────────────────────────┘
                    │ REST API
┌───────────────────▼─────────────────────────────┐
│               BACKEND (Node.js + Express)        │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │  Profile    │  │  Battle    │  │  Template  │ │
│  │  Parser     │  │  Card Gen  │  │  Matcher   │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │
│        └────────────────┼────────────────┘        │
│                         │                         │
│  ┌──────────────────────▼───────────────────────┐│
│  │        Vector Database (JSON + TF-IDF)        ││
│  └───────────────────────────────────────────────┘│
└───────────────────────────────────────────────────┘
```

**Data Flow:**
1. Recruiter inputs LinkedIn URL or candidate bio
2. **Profile Parser** extracts seniority, industry, skills, company
3. **Battle Card Generator** maps profile to pain points and hooks
4. **Template Matcher** uses cosine similarity to find best templates
5. Results rendered as an interactive Battle Card

---

##  Project Structure

```
├── server/
│   ├── index.js                   # Express server + API routes
│   ├── bot.js                     # Teams Bot Framework handler
│   ├── services/
│   │   ├── profileParser.js       # LinkedIn URL & bio parser
│   │   ├── battleCardGenerator.js # Pain point & hook generator
│   │   ├── templateMatcher.js     # Vector similarity matcher
│   │   └── embeddingService.js    # TF-IDF embedding engine
│   └── data/
│       ├── templates.json         # 20+ curated outreach templates
│       ├── industries.json        # Industry pain point knowledge base
│       └── vectorStore.json       # Pre-computed template embeddings
├── client/
│   ├── index.html                 # Teams-inspired chat UI
│   ├── styles.css                 # Premium design system
│   └── app.js                     # Frontend application logic
├── teams-manifest/
│   └── manifest.json              # Teams app manifest
├── docs/
│   ├── architecture.md            # Technical architecture
│   ├── workflow-diagram.md        # Workflow diagrams
│   ├── setup-guide.md             # Detailed setup guide
│   └── api-reference.md           # API documentation
└── package.json
```

---

##  Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | HTML5 + CSS3 + Vanilla JS | Teams-inspired chat simulator UI |
| Backend | Node.js + Express | REST API server |
| Bot | Bot Framework SDK (`botbuilder`) | Microsoft Teams integration |
| Vector DB | JSON + TF-IDF + Cosine Similarity | Template matching engine |
| Embeddings | Custom 100+ dimension keyword vectors | Text → vector conversion |
| Cards | Adaptive Cards | Rich message formatting in Teams |

---

##  Teams Deployment

To deploy to Microsoft Teams:

1. Register a bot in [Azure Portal](https://portal.azure.com)
2. Get your `MICROSOFT_APP_ID` and `MICROSOFT_APP_PASSWORD`
3. Update `.env` with your credentials
4. Use [ngrok](https://ngrok.com) or Dev Tunnels for local development
5. Upload `teams-manifest/manifest.json` to Teams Developer Portal

See [docs/setup-guide.md](docs/setup-guide.md) for detailed instructions.

---

##  Documentation

- [Architecture](docs/architecture.md) — Technical architecture deep dive
- [Workflow Diagrams](docs/workflow-diagram.md) — Visual flow diagrams
- [Setup Guide](docs/setup-guide.md) — Step-by-step installation
- [API Reference](docs/api-reference.md) — Endpoint documentation

---

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Generate battle card from bio/URL |
| `GET` | `/api/templates` | Browse template library |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/messages` | Teams bot messaging endpoint |

---

##  Developer

- **Lead Developer**: Mohammad Ommar Waza (AI Analyst)
- **Company**: Consulting Point
- **LinkedIn**: [www.linkedin.com/in/ommanz](https://www.linkedin.com/in/ommanz)

##  License


MIT License
