/**
 * SalesCheat Bot — Microsoft Teams Bot Handler
 * Handles incoming messages from Teams and returns battle cards.
 */

const { ActivityHandler, CardFactory } = require('botbuilder');
const { parseProfile } = require('./services/profileParser');
const { generateBattleCard } = require('./services/battleCardGenerator');
const { findMatchingTemplates, personalizeTemplate } = require('./services/templateMatcher');

class SalesCheatBot extends ActivityHandler {
  constructor() {
    super();

    // Handle incoming messages
    this.onMessage(async (context, next) => {
      const input = context.activity.text?.trim();

      if (!input) {
        await context.sendActivity('Please send me a LinkedIn URL or a candidate bio to analyze.');
        await next();
        return;
      }

      // Check for help command
      if (input.toLowerCase() === 'help' || input.toLowerCase() === '/help') {
        await this.sendHelpCard(context);
        await next();
        return;
      }

      // Show typing indicator
      await context.sendActivity({ type: 'typing' });

      try {
        // Process the input
        const profile = parseProfile(input);
        const battleCard = generateBattleCard(profile);
        const matchedTemplates = findMatchingTemplates(profile, { topK: 3 });
        const personalizedTemplates = matchedTemplates.map(t => personalizeTemplate(t, profile));

        // Send battle card as an Adaptive Card
        const card = this.buildBattleCardAdaptiveCard(battleCard, personalizedTemplates);
        await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });

      } catch (error) {
        console.error('[Bot Error]', error);
        await context.sendActivity(
          '❌ Sorry, I couldn\'t process that input. Please try sending a LinkedIn URL (e.g., https://linkedin.com/in/john-doe) or paste a candidate bio.'
        );
      }

      await next();
    });

    // Handle new members joining
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await this.sendWelcomeCard(context);
        }
      }
      await next();
    });
  }

  /**
   * Build an Adaptive Card for the battle card
   */
  buildBattleCardAdaptiveCard(battleCard, templates) {
    const { candidate, battleCard: card, metadata } = battleCard;
    
    const painPointItems = card.painPoints.map((pp, i) => ({
      type: 'ColumnSet',
      columns: [
        {
          type: 'Column',
          width: 'auto',
          items: [{
            type: 'TextBlock',
            text: pp.severity === 'high' ? '🔴' : pp.severity === 'medium' ? '🟡' : '🟢',
            size: 'Medium'
          }]
        },
        {
          type: 'Column',
          width: 'stretch',
          items: [{
            type: 'TextBlock',
            text: pp.text,
            wrap: true,
            size: 'Small'
          }]
        }
      ]
    }));

    const templateItems = templates.slice(0, 2).map(t => ({
      type: 'Container',
      style: 'emphasis',
      items: [
        {
          type: 'TextBlock',
          text: `📧 ${t.name}`,
          weight: 'Bolder',
          size: 'Small'
        },
        {
          type: 'TextBlock',
          text: `Performance: ${t.performanceScore}/100 | Response Rate: ${(t.responseRate * 100).toFixed(0)}%`,
          size: 'Small',
          isSubtle: true
        },
        {
          type: 'TextBlock',
          text: t.matchReasons[0] || 'Good match',
          size: 'Small',
          color: 'Good',
          italic: true
        }
      ],
      separator: true
    }));

    return {
      type: 'AdaptiveCard',
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      version: '1.5',
      body: [
        // Header
        {
          type: 'Container',
          style: 'accent',
          bleed: true,
          items: [
            {
              type: 'TextBlock',
              text: '🎯 BATTLE CARD',
              weight: 'Bolder',
              size: 'Large',
              color: 'Light'
            },
            {
              type: 'TextBlock',
              text: `Confidence: ${metadata.confidenceScore}%`,
              size: 'Small',
              color: 'Light',
              isSubtle: true
            }
          ]
        },
        // Candidate Info
        {
          type: 'FactSet',
          facts: [
            { title: '👤 Name', value: candidate.name },
            { title: '💼 Title', value: candidate.title },
            { title: '🏢 Company', value: candidate.company },
            { title: '📊 Seniority', value: candidate.seniorityLabel },
            { title: '🏭 Industry', value: candidate.industryLabel }
          ]
        },
        // Pain Points
        {
          type: 'TextBlock',
          text: '💥 LIKELY PAIN POINTS',
          weight: 'Bolder',
          size: 'Medium',
          separator: true,
          spacing: 'Medium'
        },
        ...painPointItems,
        // Suggested Hook
        {
          type: 'TextBlock',
          text: '🪝 SUGGESTED HOOK',
          weight: 'Bolder',
          size: 'Medium',
          separator: true,
          spacing: 'Medium'
        },
        {
          type: 'TextBlock',
          text: card.suggestedHook,
          wrap: true,
          size: 'Small',
          color: 'Good'
        },
        // Approach Strategy
        {
          type: 'TextBlock',
          text: '📋 APPROACH STRATEGY',
          weight: 'Bolder',
          size: 'Medium',
          separator: true,
          spacing: 'Medium'
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Tone', value: card.approachStrategy.tone },
            { title: 'Best Time', value: card.approachStrategy.timing },
            { title: 'Channel', value: card.approachStrategy.channel },
            { title: '⚠️ Avoid', value: card.approachStrategy.doNot }
          ]
        },
        // Matching Templates
        {
          type: 'TextBlock',
          text: '📨 TOP MATCHING TEMPLATES',
          weight: 'Bolder',
          size: 'Medium',
          separator: true,
          spacing: 'Medium'
        },
        ...templateItems
      ]
    };
  }

  /**
   * Send a welcome card to new users
   */
  async sendWelcomeCard(context) {
    const card = {
      type: 'AdaptiveCard',
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      version: '1.5',
      body: [
        {
          type: 'TextBlock',
          text: '🎯 Welcome to SalesCheat Bot!',
          weight: 'Bolder',
          size: 'Large'
        },
        {
          type: 'TextBlock',
          text: 'I help you generate instant intel on candidates. Drop a **LinkedIn URL** or a **candidate bio**, and I\'ll create a Battle Card with pain points, a suggested hook, and matched outreach templates.',
          wrap: true,
          size: 'Small'
        },
        {
          type: 'TextBlock',
          text: '**Try sending:**\n- A LinkedIn URL: `https://linkedin.com/in/jane-doe`\n- A bio: `Senior Software Engineer at Google with 8 years experience in cloud infrastructure and DevOps`',
          wrap: true,
          size: 'Small'
        }
      ]
    };

    await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
  }

  /**
   * Send help card
   */
  async sendHelpCard(context) {
    const card = {
      type: 'AdaptiveCard',
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      version: '1.5',
      body: [
        {
          type: 'TextBlock',
          text: '❓ SalesCheat Bot — Help',
          weight: 'Bolder',
          size: 'Large'
        },
        {
          type: 'TextBlock',
          text: '**What I do:**\nI generate Battle Cards — instant intel sheets that help you craft personalized outreach to candidates.',
          wrap: true
        },
        {
          type: 'TextBlock',
          text: '**How to use me:**',
          weight: 'Bolder'
        },
        {
          type: 'TextBlock',
          text: '1. **Paste a LinkedIn URL** — I\'ll extract what I can from the URL\n2. **Paste a candidate bio** — More detail = better battle card\n3. **Combine both** — Paste the URL followed by their bio for best results',
          wrap: true,
          size: 'Small'
        },
        {
          type: 'TextBlock',
          text: '**What you get:**',
          weight: 'Bolder'
        },
        {
          type: 'TextBlock',
          text: '• 🎯 3 likely pain points for the candidate\n• 🪝 A personalized hook to get a reply\n• 📧 Top-performing outreach templates matched to their profile\n• 📋 Approach strategy with timing and tone recommendations',
          wrap: true,
          size: 'Small'
        }
      ]
    };

    await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
  }
}

module.exports = { SalesCheatBot };
