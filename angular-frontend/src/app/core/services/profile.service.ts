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

  /** GET /api/profile/resumes — requires auth cookie */
  getResumes(): Observable<ResumesResponse> {
    return this.http.get<ResumesResponse>(`${this.apiUrl}/profile/resumes`);
  }
}
