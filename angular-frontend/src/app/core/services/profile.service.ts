import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Resume {
  _id: string;
  title: string;
  originalFileName: string;
  fileName?: string;
  isActive: boolean;
  versionNumber: number;
  parsingStatus: 'pending' | 'idle' | 'parsing' | 'done' | 'failed';
  parsedData?: any;
  createdAt: string;
  uploadedAt?: string;
  fileUrl?: string;
}

export interface ResumesResponse {
  success: boolean;
  data: Resume[];
}

export interface Education {
  _id?: string;
  degree: string;
  college: string;
  specialization?: string;
  startYear: number;
  endYear: number;
  cgpa?: string;
}

export interface Experience {
  _id?: string;
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities?: string;
}

export interface Project {
  _id?: string;
  name: string;
  description?: string;
  techStack?: string[];
  githubLink?: string;
  liveLink?: string;
}

export interface Certification {
  _id?: string;
  name: string;
  issuer?: string;
  issueDate?: string;
  credentialUrl?: string;
}

export interface Profile {
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  headline?: string;
  about?: string;
  technicalSkills?: string[];
  tools?: string[];
  softSkills?: string[];
  education?: Education[];
  experience?: Experience[];
  projects?: Project[];
  certifications?: Certification[];
  photo?: { url: string; publicId?: string };
  resume?: { url: string; publicId?: string; originalName?: string; uploadedAt?: string };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    profile: Profile;
    completionScore: number;
  };
}

/**
 * ProfileService — wraps all profile & resume API endpoints.
 * Backend base: /api/profile
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/profile`;

  // ── Core ──────────────────────────────────────────────────────────────────

  /** GET /api/profile/me — full profile + completion score */
  getMyProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.base}/me`);
  }

  // ── Profile Sections (flat PUT) ───────────────────────────────────────────

  /** PUT /api/profile/personal */
  updatePersonalInfo(data: { phone?: string; location?: string; linkedin?: string; github?: string; portfolio?: string }): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.base}/personal`, data);
  }

  /** PUT /api/profile/professional */
  updateProfessional(data: { headline?: string; about?: string }): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.base}/professional`, data);
  }

  /** PUT /api/profile/skills */
  updateSkills(data: { technicalSkills?: string[]; tools?: string[]; softSkills?: string[] }): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.base}/skills`, data);
  }

  /** PUT /api/profile/autofill */
  autofillProfile(data: any): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.base}/autofill`, data);
  }

  // ── Education ─────────────────────────────────────────────────────────────

  addEducation(data: Omit<Education, '_id'>): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(`${this.base}/education`, data);
  }

  updateEducation(id: string, data: Partial<Education>): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.base}/education/${id}`, data);
  }

  deleteEducation(id: string): Observable<ProfileResponse> {
    return this.http.delete<ProfileResponse>(`${this.base}/education/${id}`);
  }

  // ── Experience ────────────────────────────────────────────────────────────

  addExperience(data: Omit<Experience, '_id'>): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(`${this.base}/experience`, data);
  }

  updateExperience(id: string, data: Partial<Experience>): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.base}/experience/${id}`, data);
  }

  deleteExperience(id: string): Observable<ProfileResponse> {
    return this.http.delete<ProfileResponse>(`${this.base}/experience/${id}`);
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  addProject(data: Omit<Project, '_id'>): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(`${this.base}/projects`, data);
  }

  updateProject(id: string, data: Partial<Project>): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.base}/projects/${id}`, data);
  }

  deleteProject(id: string): Observable<ProfileResponse> {
    return this.http.delete<ProfileResponse>(`${this.base}/projects/${id}`);
  }

  // ── Certifications ────────────────────────────────────────────────────────

  addCertification(data: Omit<Certification, '_id'>): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(`${this.base}/certifications`, data);
  }

  updateCertification(id: string, data: Partial<Certification>): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.base}/certifications/${id}`, data);
  }

  deleteCertification(id: string): Observable<ProfileResponse> {
    return this.http.delete<ProfileResponse>(`${this.base}/certifications/${id}`);
  }

  // ── Photo ─────────────────────────────────────────────────────────────────

  /** POST /api/profile/photo (multipart) */
  uploadPhoto(file: File): Observable<any> {
    const form = new FormData();
    form.append('photo', file);
    return this.http.post(`${this.base}/photo`, form);
  }

  /** DELETE /api/profile/photo */
  deletePhoto(): Observable<any> {
    return this.http.delete(`${this.base}/photo`);
  }

  // ── Resume Versions ───────────────────────────────────────────────────────

  /** GET /api/profile/resumes */
  getResumes(): Observable<ResumesResponse> {
    return this.http.get<ResumesResponse>(`${this.base}/resumes`);
  }

  /** POST /api/profile/resumes — upload a resume PDF */
  uploadResume(file: File, title?: string): Observable<any> {
    const form = new FormData();
    form.append('resume', file);
    if (title) form.append('title', title);
    return this.http.post(`${this.base}/resumes`, form);
  }

  /** PUT /api/profile/resumes/:id/active — set active resume */
  activateResume(id: string): Observable<any> {
    return this.http.put(`${this.base}/resumes/${id}/active`, {});
  }

  /** GET /api/profile/resumes/:id/download */
  getResumeDownloadUrl(id: string): string {
    return `${this.base}/resumes/${id}/download`;
  }

  /** DELETE /api/profile/resumes/:id */
  deleteResume(id: string): Observable<any> {
    return this.http.delete(`${this.base}/resumes/${id}`);
  }

  // ── Resume Intelligence ───────────────────────────────────────────────────

  /** POST /api/resume-intelligence/:id/parse */
  parseResume(id: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/resume-intelligence/${id}/parse`, {});
  }
}

