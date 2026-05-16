/**
 * Battle Card Generator
 * Generates personalized battle cards with pain points and hooks.
 * Uses a rule-based engine powered by the industry knowledge base.
 */

const industriesData = require('../data/industries.json');

/**
 * Get pain points for a given industry and seniority level
 */
function getPainPoints(industry, seniority) {
  const industryData = industriesData.industries[industry];
  
  if (!industryData) {
    // Fallback to technology if industry not found
    return industriesData.industries.technology.painPoints[seniority] ||
           industriesData.industries.technology.painPoints.mid;
  }

  return industryData.painPoints[seniority] ||
         industryData.painPoints.mid;
}

/**
 * Get a contextual hook for a given industry and seniority level
 */
function getHook(industry, seniority) {
  const industryData = industriesData.industries[industry];
  
  if (!industryData) {
    return industriesData.industries.technology.hooks[seniority] ||
           industriesData.industries.technology.hooks.mid;
  }

  return industryData.hooks[seniority] ||
         industryData.hooks.mid;
}

/**
 * Get industry trends
 */
function getTrends(industry) {
  const industryData = industriesData.industries[industry];
  return industryData ? industryData.trends : industriesData.industries.technology.trends;
}

/**
 * Generate a personalized suggested hook message
 */
function generateSuggestedHook(profile) {
  const { firstName, company, seniority, industry, skills, title, yearsExperience } = profile;
  const name = firstName || 'there';
  const hookTheme = getHook(industry, seniority);
  const trends = getTrends(industry);
  
  // Build a contextual hook based on available data
  const hooks = [];

  // Skill-based hook
  if (skills && skills.length > 0) {
    const topSkill = skills[0];
    hooks.push(
      `"Hi ${name}, your ${topSkill} expertise caught my eye — I'm working with a team that's using it to solve problems most companies haven't even identified yet. Would love to share more."`
    );
  }

  // Company tenure hook
  if (company && yearsExperience) {
    hooks.push(
      `"Hi ${name}, ${yearsExperience}+ years at ${company} is a serious track record. I'm curious — if you could design your perfect next role (${hookTheme}), what would it look like?"`
    );
  }

  // Industry trend hook
  if (trends.length > 0) {
    const trend = trends[Math.floor(Math.random() * trends.length)];
    hooks.push(
      `"Hi ${name}, with ${trend} reshaping ${industry}, the best ${seniority}-level talent is being recruited harder than ever. I have something worth 10 minutes of your time."`
    );
  }

  // Seniority-specific hook
  if (seniority === 'executive') {
    hooks.push(
      `"${name}, at your level you don't need another recruiter pitch. But this role — ${hookTheme} — is one I genuinely think will make you pause. Five minutes?"`
    );
  } else if (seniority === 'junior') {
    hooks.push(
      `"Hi ${name}, I see a lot of potential in your profile. I'm working with a company offering ${hookTheme}. It could be the launchpad your career deserves."`
    );
  } else {
    hooks.push(
      `"Hi ${name}, I know you're probably not actively looking — the best people never are. But ${hookTheme} is rare enough that I had to reach out."`
    );
  }

  // Return the best hook (prefer skill-based if available)
  return hooks[0];
}

/**
 * Generate the full battle card
 */
function generateBattleCard(profile) {
  const {
    name,
    firstName,
    title,
    company,
    seniority,
    industry,
    skills,
    yearsExperience,
    linkedinUrl,
    bio
  } = profile;

  const painPoints = getPainPoints(industry, seniority);
  const suggestedHook = generateSuggestedHook(profile);
  const trends = getTrends(industry);
  const hookTheme = getHook(industry, seniority);

  // Calculate confidence based on how much data we have
  let confidenceScore = 40; // Base
  if (title) confidenceScore += 10;
  if (company) confidenceScore += 10;
  if (skills && skills.length > 0) confidenceScore += 10;
  if (yearsExperience) confidenceScore += 10;
  if (bio && bio.length > 50) confidenceScore += 10;
  if (industry !== 'technology' || bio) confidenceScore += 10; // Non-default industry = real detection
  confidenceScore = Math.min(confidenceScore, 98);

  const battleCard = {
    candidate: {
      name: name || 'Unknown Candidate',
      firstName: firstName || null,
      title: title || `${seniority.charAt(0).toUpperCase() + seniority.slice(1)} Professional`,
      company: company || 'Unknown Company',
      seniority: seniority,
      seniorityLabel: seniority.charAt(0).toUpperCase() + seniority.slice(1) + ' Level',
      industry: industry,
      industryLabel: industry.charAt(0).toUpperCase() + industry.slice(1).replace(/-/g, ' '),
      skills: skills || [],
      yearsExperience: yearsExperience,
      linkedinUrl: linkedinUrl
    },
    battleCard: {
      painPoints: painPoints.map((point, index) => ({
        id: index + 1,
        text: point,
        severity: index === 0 ? 'high' : index === 1 ? 'medium' : 'moderate'
      })),
      suggestedHook: suggestedHook,
      hookTheme: hookTheme,
      industryTrends: trends,
      approachStrategy: generateApproachStrategy(seniority, industry)
    },
    metadata: {
      confidenceScore: confidenceScore,
      generatedAt: new Date().toISOString(),
      dataSource: profile.source,
      engine: 'rule-based-v1'
    }
  };

  return battleCard;
}

/**
 * Generate approach strategy based on seniority and industry
 */
function generateApproachStrategy(seniority, industry) {
  const strategies = {
    executive: {
      tone: 'Executive & Confidential',
      timing: 'Tuesday-Thursday, early morning (7-9am)',
      channel: 'LinkedIn InMail or warm introduction',
      doNot: 'Never mass-message or use generic templates',
      tips: [
        'Lead with the business problem, not the job description',
        'Reference board-level or P&L-impacting challenges',
        'Keep initial message under 80 words',
        'Offer a "confidential conversation" rather than a "job opportunity"'
      ]
    },
    senior: {
      tone: 'Professional & Peer-to-Peer',
      timing: 'Tuesday-Thursday, 10am-2pm',
      channel: 'LinkedIn message or email',
      doNot: 'Avoid overselling or making generic claims',
      tips: [
        'Show you understand their specific technical or domain expertise',
        'Mention a concrete problem the role solves',
        'Be transparent about compensation range',
        'Offer market insight as value even if they\'re not interested'
      ]
    },
    mid: {
      tone: 'Enthusiastic & Growth-Oriented',
      timing: 'Monday-Thursday, 11am-4pm',
      channel: 'LinkedIn message, email, or referral',
      doNot: 'Don\'t be condescending about their current experience level',
      tips: [
        'Focus on career trajectory and growth opportunities',
        'Highlight learning culture and mentorship',
        'Be specific about what makes this role a step up',
        'Use data points about market demand for their skills'
      ]
    },
    junior: {
      tone: 'Encouraging & Supportive',
      timing: 'Any weekday, responsive to quick replies',
      channel: 'LinkedIn message or email',
      doNot: 'Don\'t assume they\'re desperate — top juniors have options',
      tips: [
        'Emphasize learning opportunities and career growth',
        'Highlight team culture and mentorship programs',
        'Be specific about onboarding and ramp-up support',
        'Make the application process clear and easy'
      ]
    }
  };

  return strategies[seniority] || strategies.mid;
}

module.exports = { generateBattleCard, getPainPoints, getHook };
