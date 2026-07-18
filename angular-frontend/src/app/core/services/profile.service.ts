import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Resume {
  _id: string;
  title: string;
  fileName: string;
  isActive: boolean;
  versionNumber: number;
  parsingStatus: 'pending' | 'done' | 'failed';
  createdAt: string;
  uploadedAt: string;
}

export interface ResumesResponse {
  success: boolean;
  data: Resume[];
}

export interface Profile {
  phone?: string;
  location?: string;
  headline?: string;
  about?: string;
  technicalSkills?: string[];
  education?: any[];
  experience?: any[];
  projects?: any[];
  certifications?: any[];
  photo?: { url: string };
  resume?: { url: string; originalName?: string };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    profile: Profile;
    completionScore: number;
  };
}

/**
 * ProfileService — wraps profile & resume API endpoints.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** GET /api/profile/me — full profile + completion score */
  getMyProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.apiUrl}/profile/me`);
  }

  /** PUT /api/profile — save any profile section */
  updateProfile(data: Partial<Profile>): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.apiUrl}/profile`, data);
  }

  /** GET /api/profile/resumes — requires auth cookie */
  getResumes(): Observable<ResumesResponse> {
    return this.http.get<ResumesResponse>(`${this.apiUrl}/profile/resumes`);
  }

  /** POST /api/profile/resumes — upload a resume PDF */
  uploadResume(file: File): Observable<any> {
    const form = new FormData();
    form.append('resume', file);
    return this.http.post(`${this.apiUrl}/profile/resumes`, form);
  }

  /** PUT /api/profile/resumes/:id/activate — set active resume */
  activateResume(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile/resumes/${id}/activate`, {});
  }

  /** DELETE /api/profile/resumes/:id — delete a resume */
  deleteResume(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/profile/resumes/${id}`);
  }
}
