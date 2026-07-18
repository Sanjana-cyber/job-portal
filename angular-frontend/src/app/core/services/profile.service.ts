import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Resume {
  _id: string;
  fileName: string;
  isActive: boolean;
  uploadedAt: string;
}

export interface ResumesResponse {
  success: boolean;
  data: Resume[];
}

/**
 * ProfileService — wraps GET /api/profile/resumes
 * Used by the jobs page to fetch the active resume for ATS matching.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** GET /api/profile/resumes — requires auth cookie */
  getResumes(): Observable<ResumesResponse> {
    return this.http.get<ResumesResponse>(`${this.apiUrl}/profile/resumes`);
  }
}
