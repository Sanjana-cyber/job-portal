import { ProfileProvider } from "../context/ProfileContext";
import JobsPage from "./JobsPage";

const DashboardJobsPage = () => {
  return (
    <ProfileProvider>
      <div style={{ minHeight: "100vh", fontFamily: "var(--font-body)" }}>
        <JobsPage />
      </div>
    </ProfileProvider>
  );
};

export default DashboardJobsPage;
