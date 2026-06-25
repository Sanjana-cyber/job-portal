/**
 * resumeIntelligenceController.js
 *
 * Three-layer resume intelligence pipeline:
 *  1. parseResume     — Gemini extracts structured JSON from PDF/DOCX
 *  2. matchATS        — DETERMINISTIC backend scoring (no Gemini)
 *  3. getAiIntelligence — Gemini explains the fixed score + recommends jobs
 *
 * Legacy endpoint preserved for backward compat:
 *  4. getAiFeedback   — original qualitative feedback (untouched)
 */

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const mammoth = require("mammoth");
const fetch = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Resume = require("../models/Resume");
const Job = require("../models/Job");
const { ErrorResponse } = require("../middleware/errorHandler");
const {
  computeAtsScore,
  computeRoleScore,
  computeJobMatchScore,
  scoreToStatus,
} = require("../utils/atsScoringService");
const { getSkillsForRole, looksLikeRoleTitle } = require("../utils/roleSkillsMap");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Helper: download file buffer from Cloudinary URL ──────────────────────
async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch resume file: ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Helper: extract plain text from DOCX ─────────────────────────────────
async function extractText(buffer, originalName) {
  const ext = (originalName || "").toLowerCase().split(".").pop();
  if (ext === "docx" || ext === "doc") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return null;
}

// ─── Helper: safe JSON parse from Gemini response ─────────────────────────
function safeParseJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```json?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// ─── Helper: build strict Gemini prompt for ai-intelligence ───────────────
function buildAiIntelligencePrompt({
  parsedResumeData,
  jobDescription,
  atsScore,
  matchedSkills,
  missingSkills,
  matchedRequirements,
  missingRequirements,
  internalJobsList,
  jobMatchScores,
}) {
  // Extract format analysis stored during parsing
  const fmt = parsedResumeData.formatAnalysis || {};

  // Build a plain-English format problem list from the format flags
  const formatIssues = [];
  if (fmt.isColorful)         formatIssues.push("COLORFUL_RESUME");
  if (fmt.hasPhoto)           formatIssues.push("HAS_PHOTO");
  if (fmt.usesColumns)        formatIssues.push("MULTI_COLUMN_LAYOUT");
  if (fmt.isOverloaded)       formatIssues.push("TOO_MUCH_INFORMATION");
  if (fmt.hasPoorAlignment)   formatIssues.push("POOR_ALIGNMENT");
  if (fmt.usesTableOrGraphic) formatIssues.push("USES_GRAPHICS_OR_TABLES");
  if (fmt.hasInconsistentFonts) formatIssues.push("INCONSISTENT_FONTS");
  if ((fmt.pageCount || 1) > 2) formatIssues.push("TOO_MANY_PAGES");

  const isFormatBad = (fmt.overallFormatScore || 10) < 6 || formatIssues.length >= 2;

  return `You are a friendly resume coach inside a job portal. Your job is to give simple, easy-to-understand advice.

IMPORTANT RULES (NEVER BREAK THESE):
1. NEVER change or recalculate the ATS score. It is fixed.
2. NEVER invent skills, jobs, or advice not based on the actual data below.
3. NEVER recommend jobs outside the provided internal list.
4. NEVER use complicated HR or technical jargon. Write like you are explaining to a college student.
5. Output JSON only, no extra text, no markdown.

─── INPUT DATA ───────────────────────────────────────────────────────────────

1. Candidate Resume:
${JSON.stringify({
  name: parsedResumeData.fullName,
  headline: parsedResumeData.headline,
  technicalSkills: parsedResumeData.technicalSkills,
  tools: parsedResumeData.tools,
  softSkills: parsedResumeData.softSkills,
  experienceCount: (parsedResumeData.experience || []).length,
  projectCount: (parsedResumeData.projects || []).length,
}, null, 2)}

2. Job Description / Role:
${jobDescription.substring(0, 1200)}

3. ATS Score (FIXED — do NOT change):
${JSON.stringify({ atsScore, matchedSkills, missingSkills }, null, 2)}

4. Resume Visual Format Analysis (detected during parsing):
${JSON.stringify({ ...fmt, detectedIssues: formatIssues, isFormatBad }, null, 2)}

5. Available Jobs (internal list only):
${JSON.stringify(internalJobsList, null, 2)}

6. Precomputed Job Match Scores (do NOT change):
${JSON.stringify(jobMatchScores, null, 2)}

─── YOUR TASKS ───────────────────────────────────────────────────────────────

A. ATS SCORE EXPLANATION
- Use atsScore = ${atsScore} exactly. Do not change it.
- matchLevel: 80-100 → "Strong", 60-79 → "Moderate", below 60 → "Weak"
- strengths: list up to 5 skills from matchedSkills only
- weaknesses: list up to 5 skills from missingSkills only
- recommendations: give up to 5 simple tips based on the actual skill gaps

B. RESUME FORMAT AUDIT
Look at the detectedIssues list and isFormatBad flag above.
Write simple, friendly advice a student can understand.

Use these plain-English messages for each detected issue:
- COLORFUL_RESUME → "Your resume uses colors. ATS software cannot read colored resumes properly. Use a plain white background with black text only."
- HAS_PHOTO → "Your resume has a photo. Remove it. ATS systems ignore photos and they waste space."
- MULTI_COLUMN_LAYOUT → "Your resume uses two columns. ATS systems read left to right and often miss the second column. Use a single column layout instead."
- TOO_MUCH_INFORMATION → "Your resume has too much text. Keep it to 1 page if you have less than 3 years of experience, or 2 pages maximum. Remove old or irrelevant information."
- POOR_ALIGNMENT → "Your resume has alignment issues. Text and sections are not lined up properly. Use consistent margins and spacing throughout."
- USES_GRAPHICS_OR_TABLES → "Your resume uses skill bars, charts, or tables. ATS software cannot read these. Replace them with a simple text list of skills."
- INCONSISTENT_FONTS → "Your resume uses too many different fonts or sizes. Stick to one simple font like Arial, Calibri, or Times New Roman in 10-12pt size."
- TOO_MANY_PAGES → "Your resume is more than 2 pages. ATS systems and recruiters prefer shorter resumes. Try to fit everything into 1-2 pages."

If isFormatBad is true, set formatPassed to false and include a clear note.
If there are no issues (detectedIssues is empty or isFormatBad is false), set formatPassed to true.

Always end formatRecommendations with these 3 golden rules (in simple words):
- "Use a simple, clean white resume. No colors, no photos, no fancy design."
- "Write your skills clearly in a Skills section so ATS can find them easily."
- "Use common section names like Work Experience, Education, Skills, Projects."

C. JOB RECOMMENDATIONS
- Use ONLY jobs from the internal list. If list is empty, return [].
- Use the precomputed matchScore values. Do NOT change them.
- Write a simple 1-sentence reason for each job match.
- Return max 5 jobs.

─── OUTPUT FORMAT (valid JSON only, no markdown) ─────────────────────────────
{
  "atsFeedback": {
    "atsScore": ${atsScore},
    "matchLevel": "",
    "matchedSkills": [],
    "missingSkills": [],
    "strengths": [],
    "weaknesses": [],
    "recommendations": []
  },
  "formatAudit": {
    "formatPassed": true,
    "overallFormatScore": ${fmt.overallFormatScore || 10},
    "detectedIssues": [],
    "formatRecommendations": []
  },
  "recommendedJobs": [
    { "jobId": "", "title": "", "company": "", "matchScore": 0, "reason": "" }
  ]
}

CRITICAL: atsScore in output MUST be exactly ${atsScore}. Do not modify it.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. POST /api/resume-intelligence/:id/parse
// ═══════════════════════════════════════════════════════════════════════════
exports.parseResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return next(new ErrorResponse("Resume not found", 404));

    resume.parsingStatus = "parsing";
    await resume.save();

    const buffer = await fetchBuffer(resume.fileUrl);
    const ext = (resume.originalFileName || "").toLowerCase().split(".").pop();

    if (!["pdf", "docx", "doc"].includes(ext)) {
      resume.parsingStatus = "failed";
      await resume.save();
      return next(new ErrorResponse("Unsupported file type. Only PDF and DOCX are supported.", 422));
    }

    let rawText = null;
    let pdfPart = null;

    if (ext === "pdf") {
      pdfPart = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };
    } else {
      rawText = await extractText(buffer, resume.originalFileName);
      if (!rawText || rawText.trim().length < 50) {
        resume.parsingStatus = "failed";
        await resume.save();
        return next(new ErrorResponse("Could not extract sufficient text from the resume file.", 422));
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a professional resume parser AND resume format auditor. Analyze the resume and return a single valid JSON object only (no markdown, no explanation).

Schema:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "portfolio": "string",
  "headline": "string (professional title, 1 line)",
  "about": "string (professional summary, 2-4 sentences)",
  "technicalSkills": ["array of technical skill strings"],
  "tools": ["array of tool/technology strings"],
  "softSkills": ["array of soft skill strings"],
  "experience": [{ "company": "string", "role": "string", "startDate": "string", "endDate": "string", "description": "string" }],
  "education": [{ "institution": "string", "degree": "string", "field": "string", "startYear": "string", "endYear": "string", "grade": "string" }],
  "projects": [{ "name": "string", "description": "string", "techStack": ["array"], "link": "string" }],
  "certifications": [{ "name": "string", "issuer": "string", "year": "string" }],
  "formatAnalysis": {
    "isColorful": "boolean — true if background colors, colored text, or colored section headers are used",
    "hasPhoto": "boolean — true if a photo/headshot is present on the resume",
    "usesColumns": "boolean — true if the layout uses two or more columns",
    "isOverloaded": "boolean — true if the resume has more than 2 pages OR has very dense/tiny text with almost no white space",
    "hasPoorAlignment": "boolean — true if text is misaligned, uneven spacing, or inconsistent indentation is visible",
    "usesTableOrGraphic": "boolean — true if skill bars, pie charts, tables, or graphics are used",
    "hasInconsistentFonts": "boolean — true if more than 2 different font styles/sizes are mixed irregularly",
    "pageCount": "number — estimated number of pages (1, 2, or 3+)",
    "overallFormatScore": "number 1-10 — 10 means perfectly clean ATS-friendly plain format, 1 means very bad for ATS"
  }
}

RULES:
- If a text field is not found, use empty string \"\" or empty array [].
- Do NOT invent any information. Extract only what is present in the resume.
- For formatAnalysis, carefully look at the VISUAL layout, colors, columns, and structure.
- Return ONLY valid JSON, no markdown code fences.`;

    const promptWithText = rawText
      ? prompt + `\nResume Text:\n---\n${rawText.substring(0, 12000)}\n---`
      : prompt;
    const promptParts = pdfPart ? [promptWithText, pdfPart] : [promptWithText];
    const result = await model.generateContent(promptParts);
    const responseText = result.response.text().trim();

    let parsedData;
    try {
      parsedData = safeParseJson(responseText);
    } catch {
      resume.parsingStatus = "failed";
      await resume.save();
      return next(new ErrorResponse("AI returned invalid JSON. Please try again.", 500));
    }

    resume.parsedData = parsedData;
    resume.parsingStatus = "done";
    await resume.save();

    res.status(200).json({
      success: true,
      message: "Resume parsed successfully",
      data: { parsedData, resumeId: resume._id },
    });
  } catch (err) {
    try { await Resume.findByIdAndUpdate(req.params.id, { parsingStatus: "failed" }); } catch (_) { }
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. POST /api/resume-intelligence/:id/ats-match
//    DETERMINISTIC — no Gemini, pure backend scoring
// ═══════════════════════════════════════════════════════════════════════════
exports.matchATS = async (req, res, next) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim().length < 3) {
      return next(new ErrorResponse("A job description or role title is required.", 400));
    }

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return next(new ErrorResponse("Resume not found", 404));
    if (resume.parsingStatus !== "done" || !resume.parsedData) {
      return next(new ErrorResponse("Resume must be parsed before ATS matching.", 400));
    }

    let result;
    let scoringMode;

    // ── Detect if user typed a role title (e.g. "Full Stack Developer")
    //    vs. a full job description
    if (looksLikeRoleTitle(jobDescription)) {
      const roleSkills = getSkillsForRole(jobDescription);

      if (roleSkills) {
        // Score against predefined role skill set
        result = computeRoleScore(resume.parsedData, roleSkills);
        scoringMode = "role";
      } else {
        // Unknown role title — fall back to JD keyword extraction
        result = computeAtsScore(resume.parsedData, jobDescription);
        scoringMode = "jd";
      }
    } else {
      // Full job description — use keyword extraction
      result = computeAtsScore(resume.parsedData, jobDescription);
      scoringMode = "jd";
    }

    const { atsScore, matchedKeywords, missingKeywords, status } = result;

    res.status(200).json({
      success: true,
      message: "ATS match analysis complete",
      data: { matchScore: atsScore, matchedKeywords, missingKeywords, status, scoringMode },
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. POST /api/resume-intelligence/:id/ai-intelligence  (NEW)
//    Accepts precomputed ATS data, Gemini only explains + recommends jobs
// ═══════════════════════════════════════════════════════════════════════════
exports.getAiIntelligence = async (req, res, next) => {
  try {
    const {
      jobDescription,
      atsScore,
      matchedSkills,
      missingSkills,
      matchedRequirements = [],
      missingRequirements = [],
      internalJobsList: providedJobsList,
      jobMatchScores: providedJobScores,
    } = req.body;

    // ── Validate required fields ──
    if (!jobDescription || jobDescription.trim().length < 20) {
      return next(new ErrorResponse("jobDescription is required (min 20 chars).", 400));
    }
    if (typeof atsScore !== "number" || atsScore < 0 || atsScore > 100) {
      return next(new ErrorResponse("atsScore must be a number between 0 and 100.", 400));
    }

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return next(new ErrorResponse("Resume not found", 404));
    if (!resume.parsedData) {
      return next(new ErrorResponse("Resume must be parsed first.", 400));
    }

    // ── Determine internal jobs list ──
    let internalJobsList = [];
    let jobMatchScores = [];

    if (Array.isArray(providedJobsList) && providedJobsList.length > 0) {
      // Frontend passed the list directly
      internalJobsList = providedJobsList;
      jobMatchScores = Array.isArray(providedJobScores) ? providedJobScores : [];
    } else {
      // Fetch from DB and score deterministically
      const jobs = await Job.find({ isActive: true }).limit(20).lean();
      if (jobs.length > 0) {
        const scored = jobs.map((job) => ({
          job,
          ...computeJobMatchScore(resume.parsedData, job),
        }));
        scored.sort((a, b) => b.matchScore - a.matchScore);
        const top5 = scored.slice(0, 5);

        internalJobsList = top5.map(({ job }) => ({
          jobId: String(job._id),
          title: job.title,
          company: job.company,
          requiredSkills: job.requiredSkills || [],
          description: (job.description || "").substring(0, 300),
        }));
        jobMatchScores = top5.map(({ jobId, matchScore }) => ({ jobId, matchScore }));
      }
    }

    // ── Build prompt and call Gemini ──
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = buildAiIntelligencePrompt({
      parsedResumeData: resume.parsedData,
      jobDescription,
      atsScore,
      matchedSkills: matchedSkills || [],
      missingSkills: missingSkills || [],
      matchedRequirements,
      missingRequirements,
      internalJobsList,
      jobMatchScores,
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    let parsed;
    try {
      parsed = safeParseJson(raw);
    } catch {
      return next(new ErrorResponse("AI returned invalid JSON. Please try again.", 500));
    }

    // ── Sanitize response — backend is source of truth for scores ──
    const matchLevel = scoreToStatus(atsScore);

    const atsFeedback = {
      atsScore,  // Always override with backend value
      matchLevel,
      matchedSkills: Array.isArray(parsed.atsFeedback?.matchedSkills)
        ? parsed.atsFeedback.matchedSkills
        : matchedSkills || [],
      missingSkills: Array.isArray(parsed.atsFeedback?.missingSkills)
        ? parsed.atsFeedback.missingSkills
        : missingSkills || [],
      strengths: (parsed.atsFeedback?.strengths || []).slice(0, 5),
      weaknesses: (parsed.atsFeedback?.weaknesses || []).slice(0, 5),
      recommendations: (parsed.atsFeedback?.recommendations || []).slice(0, 5),
    };

    // Enforce that recommended jobs come only from internalJobsList
    const allowedJobIds = new Set(internalJobsList.map((j) => j.jobId || String(j._id)));
    const scoreMap = Object.fromEntries(
      jobMatchScores.map((s) => [s.jobId, s.matchScore])
    );

    const recommendedJobs = (Array.isArray(parsed.recommendedJobs) ? parsed.recommendedJobs : [])
      .filter((j) => allowedJobIds.size === 0 || allowedJobIds.has(j.jobId))
      .slice(0, 5)
      .map((j) => ({
        jobId: j.jobId || "",
        title: j.title || "",
        company: j.company || "",
        matchScore: scoreMap[j.jobId] ?? (typeof j.matchScore === "number" ? j.matchScore : 0),
        reason: j.reason || "",
      }));

    res.status(200).json({
      success: true,
      message: "AI intelligence analysis complete",
      data: { atsFeedback, recommendedJobs },
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. POST /api/resume-intelligence/:id/ai-feedback  (LEGACY — preserved)
// ═══════════════════════════════════════════════════════════════════════════
exports.getAiFeedback = async (req, res, next) => {
  try {
    const { jobDescription, atsScore, matchedSkills, missingKeywords } = req.body;
    if (!jobDescription) return next(new ErrorResponse("Job description is required", 400));

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return next(new ErrorResponse("Resume not found", 404));
    if (!resume.parsedData) return next(new ErrorResponse("Resume must be parsed first.", 400));

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const feedbackPrompt = `You are a senior technical recruiter and career coach. Analyze this candidate's resume against the job description.

Return ONLY valid JSON matching this schema (no markdown, no explanation):
{
  "matchedSkills": ["skills in resume that match JD"],
  "missingSkills": ["exact keywords from JD missing from resume"],
  "strengths": ["2-3 specific strengths for this role"],
  "weaknesses": ["specific mistakes or weaknesses that hurt ATS score"],
  "suggestions": ["actionable advice — exact keywords to add and where"],
  "companyFit": ["top company types this resume suits"],
  "overExplained": ["bullet points that are too long or irrelevant"],
  "overallVerdict": "string (one sentence recruiter-style verdict)"
}

RULES:
- Base ALL feedback strictly on what is in the resume. Do NOT invent anything.
- For suggestions, give EXACT keywords to add to pass ATS.
- Do NOT give generic advice.

ATS Score: ${atsScore || "N/A"}
Matched Keywords: ${JSON.stringify(matchedSkills || [])}
Missing Keywords: ${JSON.stringify(missingKeywords || [])}

RESUME:
${JSON.stringify(resume.parsedData, null, 2).substring(0, 4000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 2500)}`;

    const feedbackResult = await model.generateContent(feedbackPrompt);
    const feedbackText = feedbackResult.response.text().trim();

    let feedbackData;
    try {
      feedbackData = safeParseJson(feedbackText);
    } catch {
      return next(new ErrorResponse("AI returned invalid feedback format. Please try again.", 500));
    }

    res.status(200).json({
      success: true,
      message: "AI feedback generated",
      data: feedbackData,
    });
  } catch (err) {
    next(err);
  }
};
