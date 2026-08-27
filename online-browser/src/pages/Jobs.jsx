import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJobs, getApplications, createApplication } from "../services/api";
import Layout from "../components/Layout";
import {
  formatSalaryRange,
  formatExperience,
  getMatchScoreClass,
  getJobChannel,
  getJobFoundDate,
  formatDate,
} from "../utils/format";

function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);
  const [applyFeedback, setApplyFeedback] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobsData, appsData] = await Promise.all([
          getJobs(),
          getApplications(),
        ]);

        if (!jobsData) {
          navigate("/", { replace: true });
          return;
        }

        setJobs(jobsData.jobs || []);

        const applied = new Set(
          (appsData?.applications || []).map((app) =>
            typeof app.jobId === "object" ? app.jobId._id : app.jobId
          )
        );
        setAppliedJobIds(applied);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [navigate]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter((job) => {
      const role = job.role?.toLowerCase() || "";
      const company = job.companyName?.toLowerCase() || "";
      const skills = (job.skillsRequired || []).join(" ").toLowerCase();
      return (
        role.includes(query) ||
        company.includes(query) ||
        skills.includes(query)
      );
    });
  }, [jobs, search]);

  async function handleApply(jobId) {
    if (appliedJobIds.has(jobId)) return;

    setApplyingId(jobId);
    setApplyFeedback((prev) => ({ ...prev, [jobId]: "" }));

    try {
      const result = await createApplication(jobId);

      if (result.unauthorized) {
        navigate("/", { replace: true });
        return;
      }

      if (!result.ok) {
        setApplyFeedback((prev) => ({
          ...prev,
          [jobId]: result.data.message || "Failed to apply.",
        }));
        return;
      }

      setAppliedJobIds((prev) => new Set([...prev, jobId]));
      setApplyFeedback((prev) => ({ ...prev, [jobId]: "Applied!" }));
    } catch {
      setApplyFeedback((prev) => ({
        ...prev,
        [jobId]: "Something went wrong. Please try again.",
      }));
    } finally {
      setApplyingId(null);
    }
  }

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

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <h1>Jobs</h1>
          <p>Jobs matched to your profile</p>
        </div>

        <div className="jobs-toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Search by role, company, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {jobs.length === 0 ? (
          <div className="empty-state">
            <h3>No jobs found yet.</h3>
            <p>Matching jobs will appear here once they're discovered.</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <h3>No matching jobs</h3>
            <p>Try a different search term.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job) => {
              const isApplied = appliedJobIds.has(job._id);
              const feedback = applyFeedback[job._id];
              const isApplying = applyingId === job._id;

              return (
                <div className="job-card" key={job._id}>
                  <div className="job-card-header">
                    <div>
                      <h2>{job.role}</h2>
                      <p className="company-name">{job.companyName}</p>
                      <div className="job-source">
                        <span className="job-source-item">
                          <span className="job-source-label">Channel</span>
                          {getJobChannel(job) || "—"}
                        </span>
                        <span className="job-source-item">
                          <span className="job-source-label">Found</span>
                          {formatDate(getJobFoundDate(job))}
                        </span>
                      </div>
                    </div>
                    <div className={`match-score ${getMatchScoreClass(job.matchScore)}`}>
                      {job.matchScore}%
                      <span>Match</span>
                    </div>
                  </div>

                  <div className="job-details">
                    <div className="job-detail">
                      <span>Experience</span>
                      <strong>{formatExperience(job)}</strong>
                    </div>
                    <div className="job-detail">
                      <span>Salary</span>
                      <strong>
                        {formatSalaryRange(
                          job.salaryRange?.min,
                          job.salaryRange?.max
                        )}
                      </strong>
                    </div>
                  </div>

                  {job.skillsRequired?.length > 0 && (
                    <div className="skills">
                      {job.skillsRequired.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="job-card-actions">
                    {job.link ? (
                      <a
                        className="btn btn-secondary"
                        href={
                          job.link?.startsWith("http")
                            ? job.link
                            : `https://${job.link}`
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Job
                      </a>
                    ) : (
                      <button className="btn btn-secondary" disabled>
                        View Job
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isApplied || isApplying}
                      onClick={() => handleApply(job._id)}
                    >
                      {isApplying
                        ? "Applying..."
                        : isApplied
                          ? "Applied"
                          : "Apply"}
                    </button>
                  </div>

                  {feedback && (
                    <p
                      style={{
                        marginTop: "10px",
                        fontSize: "13px",
                        color: isApplied ? "var(--success)" : "var(--error)",
                      }}
                    >
                      {feedback}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Jobs;
