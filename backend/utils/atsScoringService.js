/**
 * atsScoringService.js
 *
 * Pure, deterministic ATS scoring logic.
 * NO Gemini calls — same resume + same JD always produces the same score.
 *
 * Exports:
 *   computeAtsScore(parsedResumeData, jobDescriptionText)  → { atsScore, matchedKeywords, missingKeywords, status }
 *   computeJobMatchScore(parsedResumeData, jobDoc)         → { jobId, matchScore }
 */

// ─── Stopword List ─────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "as","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall",
  "can","need","needs","must","you","your","we","our","their","they",
  "this","that","these","those","it","its","by","from","up","about","into",
  "through","during","including","following","across","behind","beyond",
  "plus","except","both","under","like","looking","work","working","who",
  "what","when","where","how","which","not","no","also","other","such",
  "use","using","used","well","very","highly","strong","good","excellent",
  "required","preferred","minimum","least","etc","then","than","so","if",
  "each","any","all","some","more","most","own","just","over","after",
  "while","since","between","team","hands","ability","knowledge","skills",
  "skill","experience","years","year","proficiency","proficient","understanding",
  "responsibilities","requirements","qualifications","role","position","job",
  // Casual user-input filler words
  "want","wants","wanted","apply","applying","applied","find","finding",
  "get","getting","got","become","becoming","hire","hiring","hired",
  "search","searching","seek","seeking","join","joining","am","im","me",
  "my","myself","please","help","tell","show","check","see","give",
  "based","related","relevant","suitable","appropriate","available","open",
]);

// ─── Common tech aliases (normalized form → canonical) ────────────────────
const ALIASES = {
  "react.js": "react",
  "reactjs": "react",
  "node.js": "node",
  "nodejs": "node",
  "express.js": "express",
  "expressjs": "express",
  "next.js": "next",
  "nextjs": "next",
  "vue.js": "vue",
  "vuejs": "vue",
  "typescript": "typescript",
  "javascript": "javascript",
  "mongo db": "mongodb",
  "postgres": "postgresql",
  "c++": "c++",
  "c#": "c#",
};

function applyAlias(token) {
  return ALIASES[token] || token;
}

// ─── Normalize a single skill string ──────────────────────────────────────
function normalizeSkill(raw) {
  const n = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+#.\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return applyAlias(n);
}

// ─── Extract candidate skills from parsedData ──────────────────────────────
function extractCandidateSkills(parsedData) {
  const raw = [
    ...(parsedData.technicalSkills || []),
    ...(parsedData.tools || []),
    ...(parsedData.softSkills || []),
  ];
  return [...new Set(raw.map(normalizeSkill).filter(Boolean))];
}

/**
 * Extract individual meaningful skill tokens from a free-text job description.
 *
 * Strategy:
 *   1. Tokenize the JD into individual words (lowercase, stripped of punctuation).
 *   2. Build single-word tokens for each meaningful word (non-stopword, len >= 2).
 *   3. Build two-word compound tokens for common tech bigrams
 *      (e.g. "machine learning", "deep learning", "rest api").
 *   4. Apply alias normalization.
 *
 * This ensures that a resume skill like "React" always matches the word "react"
 * found anywhere in the job description, regardless of surrounding context.
 */
function extractJobKeywords(jdText) {
  // Tokenize: lowercase, keep alphanumeric + special tech chars (+, #, .)
  const words = jdText
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  const tokens = new Set();

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    // Single-word token — skip pure stopwords
    if (!STOPWORDS.has(w)) {
      tokens.add(applyAlias(w));
    }

    // Two-word compound token (bigram) — at least one word must be non-stopword
    if (i + 1 < words.length) {
      const w2 = words[i + 1];
      if (!STOPWORDS.has(w) || !STOPWORDS.has(w2)) {
        const bigram = `${w} ${w2}`;
        tokens.add(applyAlias(bigram));
      }
    }
  }

  return [...tokens].filter((k) => k.length >= 2);
}

/**
 * Check if a candidate skill matches a JD keyword.
 * Uses bidirectional substring matching for flexibility.
 * Short tokens (< 4 chars) require exact match to avoid false positives.
 */
function isMatch(candidateSkill, jdKeyword) {
  if (!candidateSkill || !jdKeyword) return false;
  if (candidateSkill === jdKeyword) return true;

  // For very short tokens, only allow exact match to avoid noise
  const minLen = Math.min(candidateSkill.length, jdKeyword.length);
  if (minLen < 4) return false;

  return (
    candidateSkill.includes(jdKeyword) ||
    jdKeyword.includes(candidateSkill)
  );
}

// ─── Map atsScore → status ─────────────────────────────────────────────────
function scoreToStatus(atsScore) {
  if (atsScore >= 80) return "Strong";
  if (atsScore >= 60) return "Moderate";
  return "Weak";
}

// ─── Public: computeAtsScore ───────────────────────────────────────────────
/**
 * Deterministic ATS match scoring.
 *
 * Formula:
 *   atsScore = floor(matchedKeywords.length / max(jdKeywords.length, 1) * 100)
 *   clamped to [0, 100]
 *
 * @param {Object} parsedResumeData  - Resume.parsedData from MongoDB
 * @param {string} jobDescriptionText - Raw job description string
 * @returns {{ atsScore, matchedKeywords, missingKeywords, status }}
 */
function computeAtsScore(parsedResumeData, jobDescriptionText) {
  const candidateSkills = extractCandidateSkills(parsedResumeData);
  const jdKeywords = extractJobKeywords(jobDescriptionText);

  if (jdKeywords.length === 0) {
    return { atsScore: 0, matchedKeywords: [], missingKeywords: [], status: "Weak" };
  }

  const matchedKeywords = [];
  const missingKeywords = [];

  for (const kw of jdKeywords) {
    const matched = candidateSkills.some((cs) => isMatch(cs, kw));
    if (matched) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const raw = (matchedKeywords.length / jdKeywords.length) * 100;
  const atsScore = Math.min(100, Math.floor(raw));
  const status = scoreToStatus(atsScore);

  return { atsScore, matchedKeywords, missingKeywords, status };
}

// ─── Public: computeRoleScore ──────────────────────────────────────────────
/**
 * Score a resume against a predefined job role title.
 * Uses roleSkillsMap to get expected skills for the role.
 *
 * @param {Object} parsedResumeData - Resume.parsedData from MongoDB
 * @param {string[]} roleSkills     - Array of expected skills from roleSkillsMap
 * @returns {{ atsScore, matchedKeywords, missingKeywords, status }}
 */
function computeRoleScore(parsedResumeData, roleSkills) {
  const candidateSkills = extractCandidateSkills(parsedResumeData);
  const required = roleSkills.map(normalizeSkill).filter(Boolean);

  if (required.length === 0) {
    return { atsScore: 0, matchedKeywords: [], missingKeywords: [], status: "Weak" };
  }

  const matchedKeywords = [];
  const missingKeywords = [];

  for (const kw of required) {
    const matched = candidateSkills.some((cs) => isMatch(cs, kw));
    if (matched) matchedKeywords.push(kw);
    else missingKeywords.push(kw);
  }

  const raw = (matchedKeywords.length / required.length) * 100;
  const atsScore = Math.min(100, Math.floor(raw));
  const status = scoreToStatus(atsScore);

  return { atsScore, matchedKeywords, missingKeywords, status };
}

// ─── Public: computeJobMatchScore ─────────────────────────────────────────
/**
 * Deterministic match score for a single recruiter-posted job.
 * Uses the structured requiredSkills array (no NLP extraction needed).
 *
 * @param {Object} parsedResumeData - Resume.parsedData
 * @param {Object} jobDoc           - Mongoose Job document (or plain object)
 * @returns {{ jobId: string, matchScore: number }}
 */
function computeJobMatchScore(parsedResumeData, jobDoc) {
  const candidateSkills = extractCandidateSkills(parsedResumeData);
  const required = (jobDoc.requiredSkills || []).map(normalizeSkill).filter(Boolean);

  if (required.length === 0) {
    return { jobId: String(jobDoc._id), matchScore: 0 };
  }

  const matched = required.filter((rs) =>
    candidateSkills.some((cs) => isMatch(cs, rs))
  );

  const matchScore = Math.min(100, Math.floor((matched.length / required.length) * 100));
  return { jobId: String(jobDoc._id), matchScore };
}

module.exports = {
  computeAtsScore,
  computeRoleScore,
  computeJobMatchScore,
  normalizeSkill,
  extractCandidateSkills,
  scoreToStatus,
};
