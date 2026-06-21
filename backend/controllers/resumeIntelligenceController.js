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
  computeJobMatchScore,
  scoreToStatus,
} = require("../utils/atsScoringService");

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
  return `You are an ATS feedback and job recommendation explanation assistant inside a MERN-based ATS job portal.

IMPORTANT RULES (DO NOT IGNORE):
1. You are NEVER allowed to calculate or change the ATS score. The ATS score has already been calculated by backend logic using a deterministic formula. Your job is ONLY to explain the score and provide grounded recommendations.
2. You must NEVER invent skills, experience, tools, projects, certifications, or achievements.
3. You must NEVER recommend jobs outside the provided internal job list.
4. You must NEVER change backend match scores for jobs.
5. You must use ONLY the data provided in this input.
6. You must output JSON only, no extra text.

INPUT DATA:

1. Candidate Parsed Resume Data:
${JSON.stringify(parsedResumeData, null, 2).substring(0, 2500)}

2. Job Description:
${jobDescription.substring(0, 1500)}

3. Backend ATS Match Data (FIXED AND IMMUTABLE — do NOT recalculate):
${JSON.stringify({ atsScore, matchedSkills, missingSkills, matchedRequirements, missingRequirements }, null, 2)}

4. Internal Job List (ONLY recruiter-posted jobs from the database):
${JSON.stringify(internalJobsList, null, 2)}

5. Precomputed Job Match Scores (do NOT change these):
${JSON.stringify(jobMatchScores, null, 2)}

YOUR TASKS:

A. ATS Feedback Task
- Output atsScore as exactly ${atsScore}. DO NOT change it.
- matchLevel: 80-100 = "Strong", 60-79 = "Moderate", below 60 = "Weak"
- strengths: come ONLY from matchedSkills or matchedRequirements (max 5 items)
- weaknesses: come ONLY from missingSkills or missingRequirements (max 5 items)
- recommendations: practical, based ONLY on real gaps in missingSkills/missingRequirements (max 5 items)
- If atsScore < 60, do NOT give overly positive feedback.

B. Job Recommendation Explanation Task
- Use ONLY the internal job list above. If it is empty, return recommendedJobs: [].
- Do NOT invent or recommend any job outside that list.
- Use the precomputed matchScore values — do NOT change them.
- For each job, write a concise reason explaining the match based on candidate skills and job requirements.
- Return at most 5 recommended jobs.

OUTPUT (valid JSON only, no markdown, no extra text):
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
  "recommendedJobs": [
    { "jobId": "", "title": "", "company": "", "matchScore": 0, "reason": "" }
  ]
}

CRITICAL: The atsScore in your output MUST be exactly ${atsScore}. Do not modify it under any circumstances.`;
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

    const prompt = `You are a professional resume parser. Extract the following information from the resume and return it as valid JSON only (no markdown, no explanation).

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
  "certifications": [{ "name": "string", "issuer": "string", "year": "string" }]
}

RULES:
- If a field is not found, use empty string "" or empty array [].
- Do NOT invent any information. Extract only what is present.
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
    try { await Resume.findByIdAndUpdate(req.params.id, { parsingStatus: "failed" }); } catch (_) {}
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
    if (!jobDescription || jobDescription.trim().length < 20) {
      return next(new ErrorResponse("A job description (min 20 chars) is required for ATS matching.", 400));
    }

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return next(new ErrorResponse("Resume not found", 404));
    if (resume.parsingStatus !== "done" || !resume.parsedData) {
      return next(new ErrorResponse("Resume must be parsed before ATS matching.", 400));
    }

    // Pure deterministic scoring — no AI
    const { atsScore, matchedKeywords, missingKeywords, status } =
      computeAtsScore(resume.parsedData, jobDescription);

    res.status(200).json({
      success: true,
      message: "ATS match analysis complete",
      data: { matchScore: atsScore, matchedKeywords, missingKeywords, status },
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
