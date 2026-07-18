/**
 * AtsAnalysisPanel.jsx
 *
 * Two-step analysis flow:
 *  Step 1 — matchATS (deterministic backend score, no Gemini)
 *            → displays score gauge + matched/missing keyword chips immediately
 *  Step 2 — getAiIntelligence (Gemini explains the fixed score + recommends jobs)
 *            → displays strengths, weaknesses, recommendations, job cards
 *
 * The ATS score displayed always comes from the backend deterministic calculation.
 * Gemini never calculates or overrides the score.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import { matchATS, getAiIntelligence } from "../../api/analysisApi";

// ─── Score Ring SVG ────────────────────────────────────────────────────────
const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreClass(score) {
  if (score >= 80) return "excellent";
  if (score >= 65) return "strong";
  if (score >= 50) return "good";
  if (score >= 35) return "fair";
  return "needs";
}

function ScoreGauge({ score, status }) {
  const cls = getScoreClass(score);
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  return (
    <div className="ats-score-ring">
      <div className="ats-gauge-wrapper">
        <svg className="ats-gauge-svg" viewBox="0 0 108 108">
          <circle className="ats-gauge-bg" cx="54" cy="54" r={RADIUS} />
          <circle
            className={`ats-gauge-fill ${cls}`}
            cx="54"
            cy="54"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="ats-score-number">{score}</span>
      </div>
      <span className="ats-score-label">ATS Score</span>
      <span className={`ats-status-badge ${cls}`}>{status}</span>
    </div>
  );
}

// ─── Match Level Badge ─────────────────────────────────────────────────────
function MatchLevelPill({ level }) {
  const map = {
    Strong: "excellent",
    Moderate: "fair",
    Weak: "needs",
  };
  return (
    <span className={`ats-status-badge ${map[level] || "needs"}`}>{level}</span>
  );
}

// ─── Job Recommendation Card ───────────────────────────────────────────────
function JobCard({ job }) {
  const cls = getScoreClass(job.matchScore);
  return (
    <div className="ats-job-card">
      <div className="ats-job-header">
        <div>
          <div className="ats-job-title">{job.title}</div>
          <div className="ats-job-company">{job.company}</div>
        </div>
        <span className={`ats-job-match-badge ${cls}`}>{job.matchScore}% match</span>
      </div>
      {job.reason && <p className="ats-job-reason">{job.reason}</p>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
const AtsAnalysisPanel = ({ activeResume }) => {
  const [jd, setJd] = useState("");
  const [loadingAts, setLoadingAts] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  // Step 1 result — deterministic backend score
  const [atsResult, setAtsResult] = useState(null);
  // { matchScore, matchedKeywords, missingKeywords, status }

  // Step 2 result — Gemini explanation
  const [aiFeedback, setAiFeedback] = useState(null);
  // { atsFeedback: { atsScore, matchLevel, strengths, weaknesses, recommendations },
  //   recommendedJobs: [{ jobId, title, company, matchScore, reason }] }

  const handleAnalyze = async () => {
    if (!jd.trim() || jd.trim().length < 30) {
      toast.error("Please paste a job description (at least 30 characters).");
      return;
    }
    if (!activeResume) {
      toast.error("No active resume found. Please upload and set a resume as active.");
      return;
    }
    if (activeResume.parsingStatus !== "done") {
      toast.error("Please parse your active resume first using the ✨ Parse button in your profile.");
      return;
    }

    try {
      // ── Step 1: Deterministic ATS scoring (instant, no Gemini) ──
      setLoadingAts(true);
      setAtsResult(null);
      setAiFeedback(null);

      const atsRes = await matchATS(activeResume._id, jd);
      const atsData = atsRes.data.data;
      // { matchScore, matchedKeywords, missingKeywords, status }
      setAtsResult(atsData);
      setLoadingAts(false);

      // ── Step 2: Gemini explains the fixed score + recommends jobs ──
      setLoadingAi(true);
      const aiRes = await getAiIntelligence(activeResume._id, {
        jobDescription: jd,
        atsScore: atsData.matchScore,
        matchedSkills: atsData.matchedKeywords,
        missingSkills: atsData.missingKeywords,
        matchedRequirements: [],
        missingRequirements: [],
        // No internalJobsList passed — backend fetches from Job collection
      });
      setAiFeedback(aiRes.data.data);
      // { atsFeedback, recommendedJobs }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Analysis failed. Please try again.");
    } finally {
      setLoadingAts(false);
      setLoadingAi(false);
    }
  };

  const isLoading = loadingAts || loadingAi;
  const feedback = aiFeedback?.atsFeedback;
  const recommendedJobs = aiFeedback?.recommendedJobs || [];

  return (
    <div className="ats-panel">
      {/* Header */}
      <div className="ats-panel-header">
        <h3>🎯 ATS Match Analyzer</h3>
        {activeResume && (
          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Using:{" "}
            <span style={{ color: "#a5b4fc", fontWeight: 600 }}>
              {activeResume.title}
            </span>
            {activeResume.parsingStatus !== "done" && (
              <span style={{ color: "#f59e0b", marginLeft: "8px" }}>
                ⚠ Not parsed yet
              </span>
            )}
          </div>
        )}
      </div>

      {/* JD Input */}
      <div className="ats-jd-section">
        <label className="ats-jd-label">Paste Job Description</label>
        <textarea
          className="ats-jd-textarea"
          placeholder="Paste the full job description here to analyze how well your resume matches..."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={6}
        />
        <button
          className="ats-analyze-btn"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="ats-spinner" />
              {loadingAts ? "Scoring resume..." : "Generating AI insights..."}
            </>
          ) : (
            "🚀 Analyze My Resume"
          )}
        </button>
      </div>

      {/* ── Step 1 Result: Score + Keywords ── */}
      {atsResult && (
        <>
          {/* Score row */}
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            <ScoreGauge score={atsResult.matchScore} status={atsResult.status} />
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Your resume scored{" "}
                <strong style={{ color: "#e0e7ff" }}>
                  {atsResult.matchScore}/100
                </strong>{" "}
                against this job description using deterministic keyword matching.
                {atsResult.matchScore >= 65
                  ? " Strong match — you're a competitive candidate."
                  : " There is room to improve your resume's alignment with this job."}
              </p>
              <p style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.5rem" }}>
                ✓ Score calculated by backend formula — consistent every run
              </p>
            </div>
          </div>

          {/* Keyword chips */}
          <div className="ats-keywords-grid">
            <div className="ats-keyword-card">
              <div className="ats-keyword-card-title matched">✓ Matched Keywords</div>
              <div className="ats-keyword-chips">
                {(atsResult.matchedKeywords || []).length === 0 ? (
                  <span style={{ color: "#475569", fontSize: "0.8rem" }}>None detected</span>
                ) : (
                  atsResult.matchedKeywords.map((kw, i) => (
                    <span key={i} className="ats-chip matched">{kw}</span>
                  ))
                )}
              </div>
            </div>
            <div className="ats-keyword-card">
              <div className="ats-keyword-card-title missing">✗ Missing Keywords</div>
              <div className="ats-keyword-chips">
                {(atsResult.missingKeywords || []).length === 0 ? (
                  <span style={{ color: "#475569", fontSize: "0.8rem" }}>
                    Great — no critical gaps!
                  </span>
                ) : (
                  atsResult.missingKeywords.map((kw, i) => (
                    <span key={i} className="ats-chip missing">{kw}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI loading indicator */}
      {loadingAi && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#64748b",
            fontSize: "0.875rem",
          }}
        >
          <span
            className="ats-spinner"
            style={{ borderTopColor: "#6366f1", borderColor: "rgba(99,102,241,0.2)" }}
          />
          Gemini is analysing your gaps and finding matching jobs...
        </div>
      )}

      {/* ── Step 2 Result: AI Feedback ── */}
      {feedback && (
        <div className="ats-feedback-grid">
          {/* Match level + score echo */}
          <div className="ats-feedback-card full-width" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div className="ats-feedback-card-title verdict" style={{ marginBottom: "0.3rem" }}>
                📊 AI Assessment
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0 }}>
                Score confirmed at{" "}
                <strong style={{ color: "#e0e7ff" }}>{feedback.atsScore}/100</strong>
                {" — "}
                <MatchLevelPill level={feedback.matchLevel} />
              </p>
            </div>
          </div>

          {/* Strengths */}
          {(feedback.strengths || []).length > 0 && (
            <div className="ats-feedback-card">
              <div className="ats-feedback-card-title strengths">💚 Strengths</div>
              <ul className="ats-feedback-list">
                {feedback.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {(feedback.weaknesses || []).length > 0 && (
            <div className="ats-feedback-card">
              <div className="ats-feedback-card-title weaknesses">⚠️ Weaknesses</div>
              <ul className="ats-feedback-list">
                {feedback.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {(feedback.recommendations || []).length > 0 && (
            <div className="ats-feedback-card full-width">
              <div className="ats-feedback-card-title suggestions">💡 Recommendations</div>
              <ul className="ats-feedback-list">
                {feedback.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2 Result: Job Recommendations ── */}
      {recommendedJobs.length > 0 && (
        <div className="ats-jobs-section">
          <div className="ats-jobs-title">🏢 Recommended Jobs From Our Portal</div>
          <p className="ats-jobs-subtitle">
            Based on your resume skills — sourced exclusively from recruiter-posted listings.
          </p>
          <div className="ats-jobs-grid">
            {recommendedJobs.map((job, i) => (
              <JobCard key={job.jobId || i} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state for recommendations after AI loads */}
      {aiFeedback && recommendedJobs.length === 0 && (
        <div className="ats-jobs-section">
          <div className="ats-jobs-title">🏢 Job Recommendations</div>
          <p style={{ color: "#475569", fontSize: "0.85rem" }}>
            No matching jobs found in the portal right now. Check back as recruiters post new listings.
          </p>
        </div>
      )}
    </div>
  );
};

export default AtsAnalysisPanel;
