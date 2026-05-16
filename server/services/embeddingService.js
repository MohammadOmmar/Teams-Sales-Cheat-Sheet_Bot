/**
 * Embedding Service
 * Converts text into vector representations for similarity matching.
 * Uses a TF-IDF inspired keyword vector approach (no external API needed).
 */

// Vocabulary built from recruiting/professional domain keywords
const VOCABULARY = [
  // Seniority signals
  'junior', 'entry', 'associate', 'intern', 'graduate', 'trainee',
  'mid', 'intermediate', 'specialist', 'analyst', 'coordinator',
  'senior', 'lead', 'principal', 'staff', 'architect', 'head',
  'executive', 'director', 'vp', 'chief', 'cto', 'ceo', 'cfo', 'coo', 'svp', 'evp', 'partner', 'founder',
  
  // Industry signals
  'technology', 'software', 'engineering', 'developer', 'programmer', 'devops', 'cloud', 'saas', 'startup',
  'finance', 'banking', 'investment', 'trading', 'fintech', 'accounting', 'audit',
  'healthcare', 'medical', 'clinical', 'biotech', 'pharma', 'patient', 'hospital',
  'marketing', 'brand', 'digital', 'content', 'seo', 'growth', 'advertising',
  'sales', 'revenue', 'pipeline', 'quota', 'account', 'business development',
  'consulting', 'advisory', 'strategy', 'management consulting', 'professional services',
  'data', 'analytics', 'machine learning', 'ai', 'artificial intelligence', 'data science',
  'manufacturing', 'industrial', 'mechanical', 'civil', 'electrical',
  
  // Skill signals
  'python', 'javascript', 'java', 'react', 'node', 'aws', 'azure', 'gcp',
  'sql', 'database', 'api', 'microservices', 'kubernetes', 'docker',
  'agile', 'scrum', 'product', 'project management', 'leadership', 'team',
  'design', 'ux', 'ui', 'figma', 'creative',
  'communication', 'presentation', 'negotiation', 'stakeholder',
  
  // Tone/approach signals
  'curiosity', 'direct', 'authentic', 'exclusive', 'confidential', 'urgent',
  'career', 'growth', 'mentorship', 'culture', 'remote', 'flexible', 'equity',
  'impact', 'mission', 'innovation', 'transform', 'disrupt', 'scale',
  'compensation', 'salary', 'benefits', 'perks', 'balance',
  'pain', 'frustration', 'challenge', 'problem', 'struggle',
  'opportunity', 'potential', 'vision', 'future', 'next'
];

/**
 * Tokenize text into lowercase words
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

/**
 * Generate a keyword frequency vector for given text
 * Each dimension corresponds to a vocabulary term
 */
function textToVector(text) {
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  const tokenFreq = {};
  
  tokens.forEach(t => {
    tokenFreq[t] = (tokenFreq[t] || 0) + 1;
  });

  // Build vector: for each vocab term, calculate TF score
  const vector = VOCABULARY.map(term => {
    const termWords = term.split(' ');
    
    if (termWords.length === 1) {
      // Single word — direct frequency lookup
      const freq = tokenFreq[term] || 0;
      // TF with sublinear scaling
      return freq > 0 ? 1 + Math.log(freq) : 0;
    } else {
      // Multi-word term — check if all words appear near each other
      const allPresent = termWords.every(w => tokenSet.has(w));
      return allPresent ? 1.5 : 0;
    }
  });

  // L2 normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map(v => v / magnitude);
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * Generate embedding for a profile object
 * Combines multiple fields into a weighted text representation
 */
function profileToVector(profile) {
  const parts = [];
  
  if (profile.title) parts.push(profile.title.repeat(3)); // Weight title heavily
  if (profile.industry) parts.push(profile.industry.repeat(3));
  if (profile.seniority) parts.push(profile.seniority.repeat(2));
  if (profile.company) parts.push(profile.company);
  if (profile.skills) parts.push(profile.skills.join(' '));
  if (profile.bio) parts.push(profile.bio);
  
  return textToVector(parts.join(' '));
}

/**
 * Generate embedding for a template object
 */
function templateToVector(template) {
  const parts = [
    template.text,
    template.name.repeat(2),
    template.tags.join(' ').repeat(2),
    template.seniority.join(' '),
    template.industry.join(' '),
    template.category
  ];
  
  return textToVector(parts.join(' '));
}

module.exports = {
  textToVector,
  cosineSimilarity,
  profileToVector,
  templateToVector,
  VOCABULARY
};
