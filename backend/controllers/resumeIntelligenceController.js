/**
 * resumeIntelligenceController.js
 *
 * Handles AI-powered resume intelligence:
 *  1. Parse (text extraction + Gemini structured JSON)
 *  2. ATS Match scoring via Affinda API
 *  3. AI Feedback via Gemini
 */

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });


const mammoth = require("mammoth");
const fetch = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Resume = require("../models/Resume");
const { ErrorResponse } = require("../middleware/errorHandler");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Helper: download file buffer from Cloudinary URL ──────────────────────
async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch resume file: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Helper: extract plain text from DOCX ───────────────────────────
async function extractText(buffer, originalName) {
  const ext = (originalName || "").toLowerCase().split(".").pop();
  if (ext === "docx" || ext === "doc") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return null;
}

// ─── 1. POST /api/resume-intelligence/:id/parse ────────────────────────────
// Extracts text from the resume file and calls Gemini to produce structured JSON.
// Result is saved to Resume.parsedData.
exports.parseResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return next(new ErrorResponse("Resume not found", 404));

    // Mark as parsing
    resume.parsingStatus = "parsing";
    await resume.save();

    // Step 1: Download file and prepare for parsing
    const buffer = await fetchBuffer(resume.fileUrl);
    const ext = (resume.originalFileName || "").toLowerCase().split(".").pop();
    
    if (ext !== "pdf" && ext !== "docx" && ext !== "doc") {
      resume.parsingStatus = "failed";
      await resume.save();
      return next(new ErrorResponse("Unsupported file type. Only PDF and DOCX are supported.", 422));
    }

    let rawText = null;
    let pdfPart = null;

    if (ext === "pdf") {
      // Use Gemini native PDF parsing
      pdfPart = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf"
        }
      };
    } else {
      // Extract text from DOCX
      rawText = await extractText(buffer, resume.originalFileName);
      if (!rawText || rawText.trim().length < 50) {
        resume.parsingStatus = "failed";
        await resume.save();
        return next(new ErrorResponse("Could not extract sufficient text from the resume file.", 422));
      }
    }

    // Step 2: Gemini extracts structured JSON
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a professional resume parser. Extract the following information from the resume text below and return it as valid JSON only (no markdown, no explanation).

The JSON must match this schema exactly:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "portfolio": "string",
  "headline": "string (professional title/summary, 1 line)",
  "about": "string (professional summary, 2-4 sentences)",
  "technicalSkills": ["array of technical skill strings"],
  "tools": ["array of tool/technology strings"],
  "softSkills": ["array of soft skill strings"],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string (e.g. Jan 2022)",
      "endDate": "string (e.g. Dec 2023 or Present)",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startYear": "string",
      "endYear": "string",
      "grade": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "techStack": ["array"],
      "link": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "year": "string"
    }
  ]
}

RULES:
- If a field is not found, use an empty string "" or empty array [].
- Do NOT invent or fabricate any information. Only extract what is present.
- Return ONLY valid JSON, no markdown code fences.
`;

    const promptWithText = rawText ? prompt + `\nResume Text:\n---\n${rawText.substring(0, 12000)}\n---` : prompt;

    const promptParts = pdfPart ? [promptWithText, pdfPart] : [promptWithText];
    const result = await model.generateContent(promptParts);
    const responseText = result.response.text().trim();

    // Parse the JSON from Gemini response
    let parsedData;
    try {
      // Strip any accidental markdown fences
      const cleaned = responseText.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
      parsedData = JSON.parse(cleaned);
    } catch (parseErr) {
      resume.parsingStatus = "failed";
      await resume.save();
      return next(new ErrorResponse("AI returned invalid JSON. Please try again.", 500));
    }

    // Save parsed data
    resume.parsedData = parsedData;
    resume.parsingStatus = "done";
    await resume.save();

    res.status(200).json({
      success: true,
      message: "Resume parsed successfully",
      data: { parsedData, resumeId: resume._id },
    });
  } catch (err) {
    // Mark failed on unexpected errors
    try {
      await Resume.findByIdAndUpdate(req.params.id, { parsingStatus: "failed" });
    } catch (_) {}
    next(err);
  }
};

// ─── 2. POST /api/resume-intelligence/:id/ats-match ───────────────────────
// Sends resume + job description to Affinda for an ATS score.
exports.matchATS = async (req, res, next) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim().length < 20) {
      return next(new ErrorResponse("A job description is required for ATS matching.", 400));
    }

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return next(new ErrorResponse("Resume not found", 404));
    if (resume.parsingStatus !== "done" || !resume.parsedData) {
      return next(new ErrorResponse("Resume must be parsed before ATS matching. Please parse the resume first.", 400));
    }

    // Compute ATS Match Score locally using Gemini.
    // (Affinda API call was removed here because Gemini is more reliable and natively handles scoring)

    // Build the text representation of the parsed resume for Gemini ATS scoring
    const parsedData = resume.parsedData;
    const resumeText = [
      parsedData.fullName || "",
      parsedData.headline || "",
      parsedData.about || "",
      "Skills: " + ([...(parsedData.technicalSkills || []), ...(parsedData.tools || []), ...(parsedData.softSkills || [])].join(", ")),
      (parsedData.experience || []).map(e => `${e.role} at ${e.company}: ${e.description}`).join("\n"),
      (parsedData.education || []).map(e => `${e.degree} ${e.field} from ${e.institution}`).join("\n"),
      (parsedData.certifications || []).map(c => c.name).join(", "),
    ].filter(Boolean).join("\n\n");

    // Compute a simple keyword overlap score locally using Gemini
    // We use Gemini as the scorer for reliability
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const scorePrompt = `You are a ruthless, highly critical Applicant Tracking System (ATS) for top-tier tech companies. Analyze the following resume against the job description.

SCORING RUBRIC (BE BRUTALLY STRICT):
- 0-40: Poor match. Lacks core requirements.
- 41-60: Average match. Has some basics, but missing key skills or lacks quantifiable impact. (Most resumes fall here).
- 61-75: Strong match. Covers most requirements well.
- 76-89: Exceptional match. Highly quantifiable, covers almost all skills.
- 90-100: Unicorn candidate (extremely rare).

Do NOT inflate scores. If core keywords from the JD are missing, deduct heavily. If the resume is fluffy and lacks metrics, deduct heavily.

Return ONLY a JSON object like this:
{
  "matchScore": <number 0-100>,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword3", "keyword4"],
  "status": "<one of: Excellent Match | Strong Match | Good Match | Fair Match | Needs Improvement>"
}

No markdown, no explanation. Only valid JSON.

RESUME:
${resumeText.substring(0, 4000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}`;

    const scoreResult = await model.generateContent(scorePrompt);
    const scoreText = scoreResult.response.text().trim();
    let scoreData;
    try {
      const cleaned = scoreText.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
      scoreData = JSON.parse(cleaned);
    } catch (_) {
      scoreData = { matchScore: 0, matchedKeywords: [], missingKeywords: [], status: "Analysis failed" };
    }

    res.status(200).json({
      success: true,
      message: "ATS match analysis complete",
      data: scoreData,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. POST /api/resume-intelligence/:id/ai-feedback ─────────────────────
// Uses Gemini to generate detailed qualitative feedback based on parsed resume + JD + ATS score.
exports.getAiFeedback = async (req, res, next) => {
  try {
    const { jobDescription, atsScore, matchedSkills, missingKeywords } = req.body;
    if (!jobDescription) return next(new ErrorResponse("Job description is required", 400));

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return next(new ErrorResponse("Resume not found", 404));
    if (!resume.parsedData) {
      return next(new ErrorResponse("Resume must be parsed first.", 400));
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const feedbackPrompt = `You are a senior technical recruiter and career coach. Analyze this candidate's resume against the job description provided.

Return ONLY valid JSON matching this schema exactly (no markdown, no explanation):
{
  "matchedSkills": ["list of skills in the resume that successfully match the JD"],
  "missingSkills": ["exact keywords from the JD that the ATS will look for but are missing"],
  "strengths": ["2-3 specific strengths you observed in the resume for this role"],
  "weaknesses": ["Highlight specific mistakes, poor formatting, or weakly phrased sections in the resume that hurt the ATS score"],
  "suggestions": ["Actionable advice telling the user the EXACT keywords they should add, and where/how to include them"],
  "companyFit": ["List top tier companies (e.g., Amazon, Flipkart, Startups, specific FAANG) this resume style/skills are best suited for"],
  "overExplained": ["Highlight any specific bullet points or sections that are too long, fluffy, over-explained, or irrelevant"],
  "overallVerdict": "string (one sentence recruiter-style verdict)"
}

IMPORTANT RULES:
- Base ALL feedback strictly on what is present in the resume. Do NOT invent skills or experience.
- For weaknesses, explicitly point out the MISTAKES the user made (e.g., "You failed to include the exact keyword 'React.js' and instead just wrote 'React'").
- For suggestions, tell them the EXACT keywords to use to pass the ATS parser.
- Point out whatever is over-explained and needs to be shortened.
- Do NOT give generic advice like "improve your resume".

ATS Score: ${atsScore || "N/A"}
Matched Keywords: ${JSON.stringify(matchedSkills || [])}
Missing Keywords: ${JSON.stringify(missingKeywords || [])}

RESUME PARSED DATA:
${JSON.stringify(resume.parsedData, null, 2).substring(0, 5000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}`;

    const feedbackResult = await model.generateContent(feedbackPrompt);
    const feedbackText = feedbackResult.response.text().trim();

    let feedbackData;
    try {
      const cleaned = feedbackText.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
      feedbackData = JSON.parse(cleaned);
    } catch (_) {
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
