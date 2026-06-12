import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyProfile, getResumes } from "../api/profileApi";

/**
 * ProfileContext
 * Global profile state for jobseeker dashboard & profile builder.
 * Any component can call useProfile() to read or refresh profile data.
 */
export const ProfileContext = createContext(null);

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile]               = useState(null);
  const [resumes, setResumes]               = useState([]);
  const [completionScore, setCompletionScore] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, resumesRes] = await Promise.all([
        getMyProfile(),
        getResumes().catch(() => ({ data: { data: [] } }))
      ]);
      
      if (profileRes.data.success) {
        setProfile(profileRes.data.data.profile);
        setCompletionScore(profileRes.data.data.completionScore);
      }
      
      if (resumesRes?.data?.data) {
        setResumes(resumesRes.data.data);
      }
    } catch {
      setProfile(null);
      setResumes([]);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  /**
   * Call refetchProfile() from any component after a successful save
   * to keep the dashboard completion ring in sync.
   */
  const refetchProfile = fetchProfile;

  return (
    <ProfileContext.Provider value={{ profile, resumes, completionScore, profileLoading, refetchProfile, setProfile, setCompletionScore }}>
      {children}
    </ProfileContext.Provider>
  );
};
