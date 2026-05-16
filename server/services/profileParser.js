/**
 * Profile Parser
 * Extracts structured candidate data from LinkedIn URLs or free-text bios.
 */

const industriesData = require('../data/industries.json');

// Seniority keyword mappings
const SENIORITY_KEYWORDS = {
  executive: [
    'ceo', 'cto', 'cfo', 'coo', 'cio', 'cmo', 'cpo', 'cro',
    'chief', 'president', 'vice president', 'vp', 'svp', 'evp',
    'founder', 'co-founder', 'cofounder', 'partner', 'managing director',
    'general manager', 'gm', 'executive director', 'board member',
    'c-level', 'c-suite'
  ],
  senior: [
    'senior', 'sr', 'lead', 'principal', 'staff', 'head of', 'head',
    'director', 'architect', 'fellow', 'distinguished', 'group lead',
    'team lead', 'tech lead', 'engineering manager', 'senior manager'
  ],
  mid: [
    'mid', 'intermediate', 'specialist', 'analyst', 'consultant',
    'coordinator', 'associate', 'engineer', 'developer', 'designer',
    'manager', 'administrator', 'advisor', 'strategist'
  ],
  junior: [
    'junior', 'jr', 'entry', 'entry-level', 'graduate', 'intern',
    'trainee', 'apprentice', 'assistant', 'associate', 'fresher',
    'new grad', 'early career'
  ]
};

// Industry keyword mappings (extend from industries.json)
const INDUSTRY_KEYWORDS = {};
for (const [industry, data] of Object.entries(industriesData.industries)) {
  INDUSTRY_KEYWORDS[industry] = [industry, ...data.aliases];
}

// Common tech skills
const SKILL_PATTERNS = [
  'python', 'javascript', 'typescript', 'java', 'c\\+\\+', 'c#', 'ruby', 'go', 'golang', 'rust', 'swift', 'kotlin',
  'react', 'angular', 'vue', 'node\\.js', 'nodejs', 'express', 'django', 'flask', 'spring',
  'aws', 'azure', 'gcp', 'google cloud', 'cloud computing',
  'docker', 'kubernetes', 'k8s', 'terraform', 'devops', 'ci/cd',
  'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
  'agile', 'scrum', 'kanban', 'project management', 'product management',
  'figma', 'sketch', 'ux design', 'ui design', 'user research',
  'salesforce', 'hubspot', 'sap', 'oracle', 'tableau', 'power bi',
  'blockchain', 'web3', 'smart contracts', 'solidity',
  'data analysis', 'data engineering', 'etl', 'data pipeline',
  'cybersecurity', 'penetration testing', 'security',
  'marketing automation', 'seo', 'sem', 'content strategy',
  'financial modeling', 'risk management', 'compliance', 'audit'
];

/**
 * Parse a LinkedIn URL to extract basic information
 */
function parseLinkedInUrl(url) {
  const result = {
    source: 'linkedin-url',
    linkedinUrl: url,
    name: null,
    firstName: null,
    lastName: null
  };

  // Extract username from LinkedIn URL patterns
  const patterns = [
    /linkedin\.com\/in\/([a-zA-Z0-9\-]+)/i,
    /linkedin\.com\/pub\/([a-zA-Z0-9\-]+)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const slug = match[1];
      // Convert slug to name (e.g., "john-doe-123abc" -> "John Doe")
      const nameParts = slug
        .split('-')
        .filter(part => !/^\d+$/.test(part) && part.length > 1)
        .filter(part => !/^[a-f0-9]{6,}$/i.test(part))
        .map(part => part.charAt(0).toUpperCase() + part.slice(1));

      if (nameParts.length >= 1) {
        result.firstName = nameParts[0];
        result.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        result.name = nameParts.join(' ');
      }
      break;
    }
  }

  return result;
}

/**
 * Detect seniority level from text
 */
function detectSeniority(text) {
  const lowerText = text.toLowerCase();
  
  // Check from highest to lowest seniority
  for (const level of ['executive', 'senior', 'mid', 'junior']) {
    for (const keyword of SENIORITY_KEYWORDS[level]) {
      if (lowerText.includes(keyword)) {
        return level;
      }
    }
  }
  
  // Default to mid if we can't determine
  return 'mid';
}

/**
 * Detect industry from text
 */
function detectIndustry(text) {
  const lowerText = text.toLowerCase();
  const scores = {};

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    scores[industry] = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        scores[industry] += 1;
      }
    }
  }

  // Return industry with highest score
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  return sorted.length > 0 ? sorted[0][0] : 'technology';
}

/**
 * Extract skills from text
 */
function extractSkills(text) {
  const lowerText = text.toLowerCase();
  const found = [];

  for (const skill of SKILL_PATTERNS) {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    if (regex.test(lowerText)) {
      found.push(skill.replace(/\\\+/g, '+').replace(/\\\./g, '.'));
    }
  }

  return [...new Set(found)];
}

/**
 * Extract company name from text
 */
function extractCompany(text) {
  // Common patterns: "at Company", "@ Company", "working at Company"
  const patterns = [
    /(?:at|@|working at|currently at|employed at|employed by)\s+([A-Z][A-Za-z0-9\s&.,]+?)(?:\s+(?:as|for|since|where|doing|\.|,|\n|$))/i,
    /(?:^|\n)([A-Z][A-Za-z0-9\s&]+?)\s*[-–—|]\s*(?:senior|lead|principal|staff|head|director|manager|engineer|developer|designer|analyst|consultant|vp|chief)/im
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().replace(/[.,]$/, '');
    }
  }

  return null;
}

/**
 * Extract title/role from text
 */
function extractTitle(text) {
  const patterns = [
    /(?:^|\n)\s*([A-Za-z\s]+(?:Engineer|Developer|Designer|Manager|Director|Analyst|Consultant|Lead|Architect|Specialist|Coordinator|VP|Chief|Officer|Head|Partner|Founder))\s*(?:at|@|-|–|—|\n|$)/im,
    /(?:role|position|title|working as)\s*:?\s*([A-Za-z\s]+?)(?:\.|,|\n|at|@|$)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Estimate years of experience from text
 */
function estimateExperience(text) {
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
    /(?:experience|exp)\s*:?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    /over\s+(\d+)\s*(?:years?|yrs?)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  return null;
}

/**
 * Main parsing function — takes raw input and returns structured profile
 */
function parseProfile(input) {
  const isLinkedInUrl = /linkedin\.com\/(in|pub)\//i.test(input);

  let profile = {
    source: 'bio',
    rawInput: input,
    name: null,
    firstName: null,
    lastName: null,
    title: null,
    company: null,
    seniority: 'mid',
    industry: 'technology',
    skills: [],
    yearsExperience: null,
    linkedinUrl: null,
    bio: input,
    parsedAt: new Date().toISOString()
  };

  if (isLinkedInUrl) {
    // It's a LinkedIn URL — extract what we can from the URL
    const urlData = parseLinkedInUrl(input);
    profile = { ...profile, ...urlData };
    
    // Check if there's additional text after the URL
    const urlPattern = /https?:\/\/[^\s]+/;
    const remainingText = input.replace(urlPattern, '').trim();
    
    if (remainingText.length > 10) {
      profile.bio = remainingText;
      profile.seniority = detectSeniority(remainingText);
      profile.industry = detectIndustry(remainingText);
      profile.skills = extractSkills(remainingText);
      profile.company = extractCompany(remainingText) || profile.company;
      profile.title = extractTitle(remainingText) || profile.title;
      profile.yearsExperience = estimateExperience(remainingText);
    }
  } else {
    // It's a bio/free text — parse everything
    profile.seniority = detectSeniority(input);
    profile.industry = detectIndustry(input);
    profile.skills = extractSkills(input);
    profile.company = extractCompany(input);
    profile.title = extractTitle(input);
    profile.yearsExperience = estimateExperience(input);
    
    // Try to extract name from first line if it looks like a name
    const firstLine = input.split('\n')[0].trim();
    if (firstLine.length < 50 && /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(firstLine)) {
      const nameParts = firstLine.split(' ');
      profile.name = firstLine;
      profile.firstName = nameParts[0];
      profile.lastName = nameParts.slice(1).join(' ');
    }
  }

  return profile;
}

module.exports = { parseProfile, parseLinkedInUrl };
