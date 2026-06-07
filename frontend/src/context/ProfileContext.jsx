import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyProfile } from "../api/profileApi";

/**
 * ProfileContext
 * Global profile state for jobseeker dashboard & profile builder.
 * Any component can call useProfile() to read or refresh profile data.
 */
const ProfileContext = createContext(null);

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile]               = useState(null);
  const [completionScore, setCompletionScore] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const res = await getMyProfile();
      if (res.data.success) {
        setProfile(res.data.data.profile);
        setCompletionScore(res.data.data.completionScore);
      }
    } catch {
      setProfile(null);
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
    <ProfileContext.Provider value={{ profile, completionScore, profileLoading, refetchProfile, setProfile, setCompletionScore }}>
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileContext;
