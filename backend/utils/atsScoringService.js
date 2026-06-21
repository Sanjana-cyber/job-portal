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
]);

// ─── Normalize a single skill string ──────────────────────────────────────
function normalizeSkill(raw) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+#.\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
 * Extract skill-like keyword phrases from a free-text job description.
 * Strategy: split on natural delimiters (bullets, commas, semicolons, newlines)
 * so each phrase is a candidate requirement token. Then filter out noise.
 */
function extractJobKeywords(jdText) {
  // Split on common JD delimiter patterns
  const phrases = jdText
    .split(/[\n\r,;|•·▪▸▹►✓✔\-–—\/\\]+/)
    .map((p) =>
      p
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9+#.\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((p) => p.length >= 2 && p.length <= 60);

  // Keep only phrases where at least one word is meaningful (not a stopword, len ≥ 2)
  const keywords = phrases
    .filter((phrase) => {
      const words = phrase.split(" ");
      return words.some((w) => w.length >= 2 && !STOPWORDS.has(w));
    })
    .map((phrase) =>
      phrase
        .split(" ")
        .filter((w) => w.length >= 2)
        .join(" ")
        .trim()
    )
    .filter((k) => k.length >= 2);

  return [...new Set(keywords)];
}

/**
 * Check if a candidate skill matches a JD keyword.
 * Uses bidirectional substring matching for flexibility
 * (e.g. "react" matches "react.js", "node" matches "node.js").
 */
function isMatch(candidateSkill, jdKeyword) {
  if (!candidateSkill || !jdKeyword) return false;
  return (
    candidateSkill === jdKeyword ||
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
  computeJobMatchScore,
  normalizeSkill,
  extractCandidateSkills,
  scoreToStatus,
};
