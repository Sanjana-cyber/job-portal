import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HeroSection from "./components/HeroSection/HeroSection.jsx";
import Footer from "./components/Footer/Footer.jsx";
import RecruiterPage from "./pages/recruiter/RecruiterPage.jsx";
import SeekerJobs from "./seeker/SeekerJobs.jsx";
import InterviewInvitationPage from "./pages/candidate/InterviewInvitationPage.jsx";
import { AuthModalProvider, useAuthModal } from "./context/AuthModalContext.jsx";
import "./index.css";

function AppContent() {
  const { user } = useAuthModal();

  return (
    <Routes>
      {/* Route for candidate interview invitation landing page */}
      <Route path="/interview-invitation" element={<InterviewInvitationPage />} />

      {/* Route /seeker/jobs to display the job listing page */}
      <Route path="/seeker/jobs" element={<SeekerJobs />} />
      <Route path="/seeker" element={<SeekerJobs />} />

      {/* Recruiter route */}
      <Route
        path="/recruiter"
        element={
          user && user.role === "recruiter" ? (
            <RecruiterPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Home route: routes based on authenticated role or displays landing page */}
      <Route
        path="/"
        element={
          user && user.role === "recruiter" ? (
            <RecruiterPage />
          ) : user && (user.role === "jobseeker" || user.role === "seeker") ? (
            <SeekerJobs />
          ) : (
            <main>
              <HeroSection />
              <Footer />
            </main>
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthModalProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthModalProvider>
  );
}
