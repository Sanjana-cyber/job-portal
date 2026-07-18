import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Job {
  _id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  experienceRequired?: string;
  requiredSkills?: string[];
  createdAt: string;
}

export interface JobsResponse {
  success: boolean;
  count: number;
  data: Job[];
}

/**
 * JobService — Angular equivalent of React's jobApi.js
 * Calls GET /api/jobs?search= (public endpoint — no auth required)
 */
@Injectable({ providedIn: 'root' })
export class JobService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** GET /api/jobs?search=<query> */
  getJobs(search: string = ''): Observable<JobsResponse> {
    return this.http.get<JobsResponse>(`${this.apiUrl}/jobs`, {
      params: search ? { search } : {}
    });
  }

  /** GET /api/jobs/:id */
  getJobById(id: string): Observable<{ success: boolean; data: Job }> {
    return this.http.get<{ success: boolean; data: Job }>(`${this.apiUrl}/jobs/${id}`);
  }
}
