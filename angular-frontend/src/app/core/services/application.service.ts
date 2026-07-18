import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AtsData {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  status: string;
}

export interface AiFeedback {
  atsScore: number;
  matchLevel: 'Strong' | 'Moderate' | 'Weak';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface RecommendedJob {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  reason?: string;
}

export interface AiIntelligenceResponse {
  success: boolean;
  data: {
    atsFeedback: AiFeedback;
    recommendedJobs: RecommendedJob[];
  };
}

export interface ApplicationResponse {
  success: boolean;
  message: string;
}

/**
 * ApplicationService — Angular equivalent of React's applicationApi.js & analysisApi.js
 *
 * Handles:
 *   - Submitting a job application (POST /api/applications/:jobId/apply)
 *   - Running ATS match against active resume (POST /api/resume-intelligence/:id/ats-match)
 */
@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * POST /api/applications/:jobId/apply
   * Requires auth — jobseeker only
   */
  applyToJob(jobId: string, coverLetter: string): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      `${this.apiUrl}/applications/${jobId}/apply`,
      { coverLetter }
    );
  }

  /**
   * POST /api/resume-intelligence/:resumeId/ats-match
   * Deterministic ATS scoring — same inputs always produce same score
   */
  matchATS(resumeId: string, jobDescription: string): Observable<{ success: boolean; data: AtsData }> {
    return this.http.post<{ success: boolean; data: AtsData }>(
      `${this.apiUrl}/resume-intelligence/${resumeId}/ats-match`,
      { jobDescription }
    );
  }

  /**
   * POST /api/resume-intelligence/:resumeId/ai-intelligence
   * Gemini AI explanation of ATS score + job recommendations
   */
  getAiIntelligence(resumeId: string, payload: {
    jobDescription: string;
    atsScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    matchedRequirements: string[];
    missingRequirements: string[];
  }): Observable<AiIntelligenceResponse> {
    return this.http.post<AiIntelligenceResponse>(
      `${this.apiUrl}/resume-intelligence/${resumeId}/ai-intelligence`,
      payload
    );
  }

  // ── Recruiter Endpoints ──

  /**
   * GET /api/applications/job/:jobId
   * Requires auth — recruiter only
   */
  getJobApplications(jobId: string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/applications/job/${jobId}`);
  }

  /**
   * PUT /api/applications/:appId/status
   * Requires auth — recruiter only
   */
  updateApplicationStatus(appId: string, status: string): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/applications/${appId}/status`,
      { status }
    );
  }
}
