/**
 * SalesCheat Bot — Express Server
 * Serves the web UI and handles API requests + Teams bot messages.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { BotFrameworkAdapter } = require('botbuilder');
const { SalesCheatBot } = require('./bot');
const { parseProfile } = require('./services/profileParser');
const { generateBattleCard } = require('./services/battleCardGenerator');
const { findMatchingTemplates, personalizeTemplate, initialize: initMatcher } = require('./services/templateMatcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'client')));

// Initialize template matcher (pre-computes vectors if needed)
initMatcher();

// ═══════════════════════════════════════════════
// REST API ENDPOINTS (for the Web UI)
// ═══════════════════════════════════════════════

/**
 * POST /api/analyze
 * Main endpoint — accepts a LinkedIn URL or bio, returns a battle card
 */
app.post('/api/analyze', (req, res) => {
  try {
    const { input } = req.body;

    if (!input || input.trim().length === 0) {
      return res.status(400).json({
        error: 'Please provide a LinkedIn URL or candidate bio.'
      });
    }

    // Step 1: Parse the profile
    const profile = parseProfile(input.trim());

    // Step 2: Generate battle card
    const battleCard = generateBattleCard(profile);

    // Step 3: Find matching templates
    const matchedTemplates = findMatchingTemplates(profile, { topK: 3 });

    // Step 4: Personalize the top template
    const personalizedTemplates = matchedTemplates.map(t => personalizeTemplate(t, profile));

    // Return combined result
    res.json({
      success: true,
      profile: profile,
      battleCard: battleCard,
      matchedTemplates: personalizedTemplates
    });

  } catch (error) {
    console.error('[API Error]', error);
    res.status(500).json({
      error: 'Something went wrong while generating the battle card.',
      details: error.message
    });
  }
});

/**
 * GET /api/templates
 * Returns all available templates (for admin/browse view)
 */
app.get('/api/templates', (req, res) => {
  try {
    const templatesPath = path.join(__dirname, 'data', 'templates.json');
    const data = require(templatesPath);
    
    // Optional filtering
    const { seniority, industry, category } = req.query;
    let templates = data.templates;

    if (seniority) {
      templates = templates.filter(t => t.seniority.includes(seniority));
    }
    if (industry) {
      templates = templates.filter(t => t.industry.includes(industry));
    }
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    res.json({ templates, total: templates.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'SalesCheat Bot',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════
// TEAMS BOT ENDPOINT
// ═══════════════════════════════════════════════

// Create Bot Framework adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID || '',
  appPassword: process.env.MICROSOFT_APP_PASSWORD || ''
});

// Error handler
adapter.onTurnError = async (context, error) => {
  console.error(`[Bot Error] ${error}`);
  await context.sendActivity('Sorry, something went wrong. Please try again.');
};

// Create bot instance
const bot = new SalesCheatBot();

/**
 * POST /api/messages
 * Teams bot messaging endpoint
 */
app.post('/api/messages', async (req, res) => {
  await adapter.process(req, res, (context) => bot.run(context));
});

// ═══════════════════════════════════════════════
// CATCH-ALL: Serve the frontend for any other route
// ═══════════════════════════════════════════════
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║                                          ║');
  console.log('  ║   🎯 SalesCheat Bot is running!          ║');
  console.log('  ║                                          ║');
  console.log(`  ║   Web UI:  http://localhost:${PORT}          ║`);
  console.log(`  ║   API:     http://localhost:${PORT}/api      ║`);
  console.log(`  ║   Health:  http://localhost:${PORT}/api/health║`);
  console.log('  ║                                          ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
