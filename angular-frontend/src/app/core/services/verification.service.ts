import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VerificationData {
  companyName: string;
  companyWebsite: string;
  taxId: string;
}

export interface VerificationStatusResponse {
  success: boolean;
  data: {
    verificationRequired: boolean;
    companyVerificationStatus: string;
  };
}

export interface AdminStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  verificationRequired: boolean;
}

export interface RecruiterQueueItem {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  companyWebsite?: string;
  workEmail?: string;
  companyVerificationStatus: string;
  companyVerificationNote?: string;
  provider?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class VerificationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** Recruiter: get own verification status + global setting */
  getVerificationStatus(): Observable<VerificationStatusResponse> {
    return this.http.get<VerificationStatusResponse>(`${this.apiUrl}/verification/status`);
  }

  /** Recruiter: submit company details for verification */
  submitVerification(data: VerificationData): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/verification/submit`, data);
  }

  /** Admin: get stats */
  getAdminStats(): Observable<{ success: boolean; data: AdminStats }> {
    return this.http.get<{ success: boolean; data: AdminStats }>(`${this.apiUrl}/verification/stats`);
  }

  /** Admin: list all recruiters with verification info */
  getVerificationQueue(): Observable<{ success: boolean; data: RecruiterQueueItem[] }> {
    return this.http.get<{ success: boolean; data: RecruiterQueueItem[] }>(`${this.apiUrl}/verification/queue`);
  }

  /** Admin: approve a recruiter */
  approveRecruiter(id: string): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/verification/approve/${id}`, {});
  }

  /** Admin: reject a recruiter with optional note */
  rejectRecruiter(id: string, data: { note: string }): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/verification/reject/${id}`, data);
  }

  /** Admin: update the global toggle */
  updateVerificationSettings(data: { verificationRequired: boolean }): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/verification/settings`, data);
  }

  /** Admin: delete verification request */
  deleteVerificationRequest(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/verification/delete/${id}`);
  }
}
