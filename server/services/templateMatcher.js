/**
 * Template Matcher
 * Matches candidate profiles to top-performing outreach templates
 * using vector similarity (cosine similarity on keyword embeddings).
 */

const fs = require('fs');
const path = require('path');
const { profileToVector, templateToVector, cosineSimilarity } = require('./embeddingService');

let templatesData = null;
let templateVectors = null;

/**
 * Load templates and compute/load vectors
 */
function initialize() {
  if (templatesData && templateVectors) return;

  // Load templates
  const templatesPath = path.join(__dirname, '..', 'data', 'templates.json');
  templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));

  // Try to load pre-computed vectors, otherwise compute them
  const vectorStorePath = path.join(__dirname, '..', 'data', 'vectorStore.json');
  
  if (fs.existsSync(vectorStorePath)) {
    const stored = JSON.parse(fs.readFileSync(vectorStorePath, 'utf-8'));
    templateVectors = stored.vectors;
    console.log(`[TemplateMatcher] Loaded ${templateVectors.length} pre-computed vectors`);
  } else {
    // Compute vectors on first run
    console.log('[TemplateMatcher] Computing template vectors...');
    templateVectors = templatesData.templates.map(template => ({
      templateId: template.id,
      vector: templateToVector(template),
      metadata: {
        name: template.name,
        seniority: template.seniority,
        industry: template.industry,
        performanceScore: template.performanceScore,
        category: template.category
      }
    }));

    // Save for next time
    fs.writeFileSync(vectorStorePath, JSON.stringify({ 
      vectors: templateVectors,
      computedAt: new Date().toISOString(),
      vocabularySize: require('./embeddingService').VOCABULARY.length
    }, null, 2));
    console.log(`[TemplateMatcher] Computed and saved ${templateVectors.length} vectors`);
  }
}

/**
 * Find matching templates for a candidate profile
 * 
 * @param {Object} profile - Parsed candidate profile
 * @param {Object} options - Matching options
 * @param {number} options.topK - Number of results to return (default: 3)
 * @param {boolean} options.filterBySeniority - Filter by exact seniority match (default: true)
 * @param {boolean} options.filterByIndustry - Filter by industry match (default: false)
 * @param {string} options.category - Filter by template category (default: null)
 * @returns {Array} Matched templates with similarity scores
 */
function findMatchingTemplates(profile, options = {}) {
  initialize();

  const {
    topK = 3,
    filterBySeniority = true,
    filterByIndustry = false,
    category = null
  } = options;

  // Generate profile vector
  const profileVec = profileToVector(profile);

  // Score all templates
  let scored = templateVectors.map(tv => {
    const template = templatesData.templates.find(t => t.id === tv.templateId);
    if (!template) return null;

    // Calculate vector similarity
    const vectorSim = cosineSimilarity(profileVec, tv.vector);

    // Calculate metadata-based bonus
    let metadataBonus = 0;

    // Seniority match bonus
    if (template.seniority.includes(profile.seniority)) {
      metadataBonus += 0.15;
    }

    // Industry match bonus
    if (template.industry.includes(profile.industry)) {
      metadataBonus += 0.10;
    }

    // Performance score bonus (normalized to 0-0.1 range)
    metadataBonus += (template.performanceScore / 100) * 0.10;

    // Combined score (weighted: 60% vector, 40% metadata)
    const combinedScore = vectorSim * 0.6 + metadataBonus * 0.4;

    return {
      templateId: template.id,
      name: template.name,
      subject: template.subject,
      text: template.text,
      category: template.category,
      seniority: template.seniority,
      industry: template.industry,
      performanceScore: template.performanceScore,
      responseRate: template.responseRate,
      tags: template.tags,
      similarityScore: Math.round(vectorSim * 100) / 100,
      combinedScore: Math.round(combinedScore * 100) / 100,
      matchReasons: buildMatchReasons(template, profile)
    };
  }).filter(Boolean);

  // Apply filters
  if (filterBySeniority && profile.seniority) {
    const filtered = scored.filter(s => s.seniority.includes(profile.seniority));
    if (filtered.length >= topK) scored = filtered;
  }

  if (filterByIndustry && profile.industry) {
    const filtered = scored.filter(s => s.industry.includes(profile.industry));
    if (filtered.length >= topK) scored = filtered;
  }

  if (category) {
    const filtered = scored.filter(s => s.category === category);
    if (filtered.length >= topK) scored = filtered;
  }

  // Sort by combined score and return top K
  scored.sort((a, b) => b.combinedScore - a.combinedScore);
  return scored.slice(0, topK);
}

/**
 * Build human-readable reasons why a template matched
 */
function buildMatchReasons(template, profile) {
  const reasons = [];

  if (template.seniority.includes(profile.seniority)) {
    reasons.push(`Tailored for ${profile.seniority}-level candidates`);
  }

  if (template.industry.includes(profile.industry)) {
    reasons.push(`Relevant to the ${profile.industry} industry`);
  }

  if (template.performanceScore >= 90) {
    reasons.push(`Top performer with ${template.responseRate * 100}% response rate`);
  } else if (template.performanceScore >= 85) {
    reasons.push(`High performer with ${template.responseRate * 100}% response rate`);
  }

  if (template.tags.includes('personalized') || template.tags.includes('skill-based')) {
    reasons.push('Supports deep personalization');
  }

  if (template.tags.includes('direct') || template.tags.includes('no-bs')) {
    reasons.push('Direct approach — works well for busy professionals');
  }

  if (template.tags.includes('value-first') || template.tags.includes('value-add')) {
    reasons.push('Leads with value — higher engagement expected');
  }

  return reasons.length > 0 ? reasons : ['Good general match for this profile'];
}

/**
 * Personalize a template with candidate data
 */
function personalizeTemplate(template, profile) {
  let text = template.text;
  let subject = template.subject;

  const replacements = {
    '{{firstName}}': profile.firstName || profile.name || 'there',
    '{{company}}': profile.company || '[Company]',
    '{{industry}}': profile.industry.charAt(0).toUpperCase() + profile.industry.slice(1),
    '{{role}}': profile.title || 'Professional',
    '{{skill}}': (profile.skills && profile.skills[0]) || '[Key Skill]',
    '{{seniorityLevel}}': profile.seniority.charAt(0).toUpperCase() + profile.seniority.slice(1),
    '{{tenure}}': profile.yearsExperience ? `${profile.yearsExperience} years` : 'a while',
    '{{senderName}}': '[Your Name]',
    '{{mutualConnection}}': '[Mutual Connection]',
    '{{executiveTitle}}': 'CEO',
    '{{trendTopic}}': require('../data/industries.json').industries[profile.industry]?.trends[0] || 'innovation',
    '{{location}}': '[Location]',
    '{{painPoint}}': require('../data/industries.json').industries[profile.industry]?.painPoints[profile.seniority]?.[0] || 'scaling challenges',
    '{{employeeNumber}}': '25',
    '{{fundingStage}}': 'B'
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    text = text.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return {
    ...template,
    personalizedSubject: subject,
    personalizedText: text
  };
}

module.exports = { findMatchingTemplates, personalizeTemplate, initialize };
