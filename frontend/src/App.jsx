import React from "react";
import HeroSection from "./components/HeroSection/HeroSection.jsx";
import Footer from "./components/Footer/Footer.jsx";
import RecruiterPage from "./pages/recruiter/RecruiterPage.jsx";
import SeekerPage from "./pages/SeekerPage.jsx";
import { AuthModalProvider, useAuthModal } from "./context/AuthModalContext.jsx";
import "./index.css";

function AppContent() {
  const { user } = useAuthModal();

  // If authenticated as recruiter -> route to dummy recruiter page
  if (user && user.role === "recruiter") {
    return <RecruiterPage />;
  }

  // If authenticated as seeker -> route to dummy seeker page
  if (user && (user.role === "jobseeker" || user.role === "seeker")) {
    return <SeekerPage />;
  }

  // Otherwise -> landing page (HeroSection + Footer)
  return (
    <main>
      <HeroSection />
      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <AuthModalProvider>
      <AppContent />
    </AuthModalProvider>
  );
}
