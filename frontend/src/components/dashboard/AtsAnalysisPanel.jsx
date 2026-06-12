/**
 * AtsAnalysisPanel.jsx
 *
 * Full ATS analysis experience:
 *  1. Job Description input
 *  2. ATS score circular gauge
 *  3. Matched / Missing keywords
 *  4. AI qualitative feedback (strengths, weaknesses, suggestions, verdict)
 *
 * Requires a parsed active resume (parsedData must be populated).
 * Used in JobSeekerDashboard or wherever a job description is available.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import { matchATS, getAiFeedback } from "../../api/analysisApi";

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

// ─── Main Component ────────────────────────────────────────────────────────
const AtsAnalysisPanel = ({ activeResume }) => {
  const [jd, setJd] = useState("");
  const [loadingAts, setLoadingAts] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [atsResult, setAtsResult] = useState(null);    // { matchScore, matchedKeywords, missingKeywords, status }
  const [feedback, setFeedback] = useState(null);      // { matchedSkills, missingSkills, strengths, weaknesses, suggestions, overallVerdict }

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
      // Step 1: ATS Match Score
      setLoadingAts(true);
      setAtsResult(null);
      setFeedback(null);
      const atsRes = await matchATS(activeResume._id, jd);
      const atsData = atsRes.data.data;
      setAtsResult(atsData);
      setLoadingAts(false);

      // Step 2: AI Feedback
      setLoadingFeedback(true);
      const feedbackRes = await getAiFeedback(activeResume._id, {
        jobDescription: jd,
        atsScore: atsData.matchScore,
        matchedSkills: atsData.matchedKeywords,
        missingKeywords: atsData.missingKeywords,
      });
      setFeedback(feedbackRes.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Analysis failed. Please try again.");
    } finally {
      setLoadingAts(false);
      setLoadingFeedback(false);
    }
  };

  const isLoading = loadingAts || loadingFeedback;

  return (
    <div className="ats-panel">
      {/* Header */}
      <div className="ats-panel-header">
        <h3>🎯 ATS Match Analyzer</h3>
        {activeResume && (
          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Using: <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{activeResume.title}</span>
            {activeResume.parsingStatus !== "done" && (
              <span style={{ color: "#f59e0b", marginLeft: "8px" }}>⚠ Not parsed yet</span>
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
              {loadingAts ? "Scoring..." : "Generating Feedback..."}
            </>
          ) : (
            "🚀 Analyze My Resume"
          )}
        </button>
      </div>

      {/* ATS Score */}
      {atsResult && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            <ScoreGauge score={atsResult.matchScore} status={atsResult.status} />
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Your resume scored <strong style={{ color: "#e0e7ff" }}>{atsResult.matchScore}/100</strong> against this job description.
                {atsResult.matchScore >= 65
                  ? " Strong match — you're a competitive candidate for this role."
                  : " There is room to improve your resume's alignment with this job."}
              </p>
            </div>
          </div>

          {/* Keywords */}
          <div className="ats-keywords-grid">
            <div className="ats-keyword-card">
              <div className="ats-keyword-card-title matched">✓ Matched Keywords</div>
              <div className="ats-keyword-chips">
                {(atsResult.matchedKeywords || []).length === 0
                  ? <span style={{ color: "#475569", fontSize: "0.8rem" }}>None detected</span>
                  : (atsResult.matchedKeywords || []).map((kw, i) => (
                      <span key={i} className="ats-chip matched">{kw}</span>
                    ))
                }
              </div>
            </div>
            <div className="ats-keyword-card">
              <div className="ats-keyword-card-title missing">✗ Missing Keywords</div>
              <div className="ats-keyword-chips">
                {(atsResult.missingKeywords || []).length === 0
                  ? <span style={{ color: "#475569", fontSize: "0.8rem" }}>Great — no critical gaps!</span>
                  : (atsResult.missingKeywords || []).map((kw, i) => (
                      <span key={i} className="ats-chip missing">{kw}</span>
                    ))
                }
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading feedback indicator */}
      {loadingFeedback && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#64748b", fontSize: "0.875rem" }}>
          <span className="ats-spinner" style={{ borderTopColor: "#6366f1", borderColor: "rgba(99,102,241,0.2)" }} />
          Generating AI recruiter feedback...
        </div>
      )}

      {/* AI Feedback */}
      {feedback && (
        <div className="ats-feedback-grid">
          <div className="ats-feedback-card">
            <div className="ats-feedback-card-title strengths">💚 Strengths</div>
            <ul className="ats-feedback-list">
              {(feedback.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="ats-feedback-card">
            <div className="ats-feedback-card-title weaknesses">⚠️ Weaknesses</div>
            <ul className="ats-feedback-list">
              {(feedback.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>

          <div className="ats-feedback-card full-width">
            <div className="ats-feedback-card-title suggestions">💡 Suggestions</div>
            <ul className="ats-feedback-list">
              {(feedback.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          {(feedback.overExplained && feedback.overExplained.length > 0) && (
            <div className="ats-feedback-card full-width">
              <div className="ats-feedback-card-title weaknesses">✂️ Over-Explained Sections</div>
              <ul className="ats-feedback-list">
                {feedback.overExplained.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}

          {(feedback.companyFit && feedback.companyFit.length > 0) && (
            <div className="ats-feedback-card full-width">
              <div className="ats-feedback-card-title strengths">🏢 Best Company Fit</div>
              <ul className="ats-feedback-list">
                {feedback.companyFit.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {feedback.overallVerdict && (
            <div className="ats-feedback-card full-width">
              <div className="ats-feedback-card-title verdict">🏆 Recruiter Verdict</div>
              <p className="ats-verdict-text">{feedback.overallVerdict}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AtsAnalysisPanel;
