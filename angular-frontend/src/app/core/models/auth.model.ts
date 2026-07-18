/**
 * User interface matching the backend's sendTokenResponse shape.
 * See: backend/utils/generateToken.js
 */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'recruiter' | 'admin';
  provider: 'local' | 'google';
  isVerified: boolean;
  createdAt: string;
  // Recruiter-specific fields (from GET /api/auth/me)
  companyName?: string;
  workEmail?: string;
  companyWebsite?: string;
  companyVerificationStatus?: 'pending' | 'approved' | 'rejected';
  companyVerificationNote?: string;
}

/**
 * Standard API response shape from your Express backend.
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user: User;
}

export interface MeResponse {
  success: boolean;
  user: User;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}
