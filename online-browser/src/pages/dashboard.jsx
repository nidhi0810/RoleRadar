import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile, getJobs, getApplications } from "../services/api";
import Layout from "../components/Layout";
import {
  getMatchScoreClass,
  getStatusClass,
  formatStatus,
  getJobChannel,
  getJobFoundDate,
  formatDate,
} from "../utils/format";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, jobsData, appsData] = await Promise.all([
          getProfile(),
          getJobs(),
          getApplications(),
        ]);

        if (!profileData) {
          window.location.href = "/";
          return;
        }

        setUser(profileData.user);
        setJobs(jobsData?.jobs || []);
        setApplications(appsData?.applications || []);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const activeApplications = applications.filter(
    (app) => app.status === "applied" || app.status === "interview"
  ).length;

  if (loading) {
    return (
      <Layout>
        <div className="loading-state full-page">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="page-container">
          <div className="error-state">
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const recentJobs = jobs.slice(0, 4);
  const recentApplications = applications.slice(0, 4);

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <h1>Welcome back, {user.name}</h1>
          <p>Here's what's happening with your job search.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-label">Jobs Found</div>
            <div className="stat-card-value">{jobs.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Applications</div>
            <div className="stat-card-value">{applications.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Interview / Active</div>
            <div className="stat-card-value">{activeApplications}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">WhatsApp Status</div>
            <div className="stat-card-value text-status disconnected">Not connected</div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Jobs</h2>
              <Link to="/jobs">View all</Link>
            </div>

            {recentJobs.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
                No jobs found yet.
              </p>
            ) : (
              <div className="mini-list">
                {recentJobs.map((job) => (
                  <div className="mini-list-item" key={job._id}>
                    <div className="mini-list-item-info">
                      <h4>{job.role}</h4>
                      <p>{job.companyName}</p>
                      <p className="mini-list-meta">
                        {getJobChannel(job) ? `${getJobChannel(job)} · ` : ""}
                        {formatDate(getJobFoundDate(job))}
                      </p>
                    </div>
                    <div className={`match-score ${getMatchScoreClass(job.matchScore)}`}>
                      {job.matchScore}%
                      <span>Match</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Applications</h2>
              <Link to="/applications">View all</Link>
            </div>

            {recentApplications.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
                No applications yet.
              </p>
            ) : (
              <div className="mini-list">
                {recentApplications.map((app) => (
                  <div className="mini-list-item" key={app._id}>
                    <div className="mini-list-item-info">
                      <h4>{app.jobId?.role || "Unknown role"}</h4>
                      <p>{app.jobId?.companyName || "Unknown company"}</p>
                    </div>
                    <span className={`status-badge ${getStatusClass(app.status)}`}>
                      {formatStatus(app.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-section full-width">
            <div className="section-header">
              <h2>WhatsApp Status</h2>
            </div>
            <div className="whatsapp-notice">
              <div className="whatsapp-notice-icon">📱</div>
              <div>
                <h4>WhatsApp — Not connected</h4>
                <p>Open the desktop app to connect WhatsApp and start monitoring job groups.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
