import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApplications, uploadResume } from "../services/api";
import Layout from "../components/Layout";
import { formatDate, getStatusClass, formatStatus } from "../utils/format";

function hasResume(application) {
  return Boolean(application.resume?.fileName || application.resume?.key);
}

function ApplicationResumeUpload({ application, compact = false, onUploaded }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  async function handleUpload() {
    if (!selectedFile) {
      setFeedback({ type: "error", message: "Please select a resume first." });
      return;
    }

    setUploading(true);
    setFeedback({ type: "", message: "" });

    try {
      const result = await uploadResume(application._id, selectedFile);

      if (result === null) {
        navigate("/", { replace: true });
        return;
      }

      if (!result.ok) {
        setFeedback({
          type: "error",
          message: result.data.message || "Upload failed. Please try again.",
        });
        return;
      }

      setFeedback({ type: "success", message: "Resume uploaded successfully" });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploaded(application._id, result.data.resume);
    } catch {
      setFeedback({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  }

  if (hasResume(application)) {
    return (
      <div className={`resume-section resume-uploaded ${compact ? "compact" : ""}`}>
        <span className="resume-label">Resume</span>
        <p className="resume-success">✓ Resume uploaded</p>
        {application.resume?.fileName && (
          <p className="resume-filename">{application.resume.fileName}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`resume-section ${compact ? "compact" : ""}`}>
      <span className="resume-label">Resume</span>
      <input
        ref={fileInputRef}
        type="file"
        className="resume-file-input"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={uploading}
        onChange={(e) => {
          setSelectedFile(e.target.files?.[0] || null);
          setFeedback({ type: "", message: "" });
        }}
      />

      {selectedFile && (
        <p className="resume-selected">Selected: {selectedFile.name}</p>
      )}

      {feedback.message && (
        <p className={`resume-feedback ${feedback.type}`}>{feedback.message}</p>
      )}

      <div className="resume-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={uploading}
          onClick={handleUpload}
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </button>
      </div>
    </div>
  );
}

function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchApplications() {
      try {
        const data = await getApplications();

        if (!data) {
          navigate("/", { replace: true });
          return;
        }

        setApplications(data.applications || []);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, [navigate]);

  function handleResumeUploaded(applicationId, resume) {
    setApplications((prev) =>
      prev.map((app) =>
        app._id === applicationId ? { ...app, resume } : app
      )
    );
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
          <h1>Applications</h1>
          <p>Track the status of your job applications</p>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <h3>No applications yet</h3>
            <p>Apply to jobs from the Jobs page to see them here.</p>
          </div>
        ) : (
          <>
            <div className="applications-table-wrap">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Resume</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td>{app.jobId?.companyName || "—"}</td>
                      <td>{app.jobId?.role || "—"}</td>
                      <td>{formatDate(app.appliedAt || app.createdAt)}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(app.status)}`}>
                          {formatStatus(app.status)}
                        </span>
                      </td>
                      <td>
                        <ApplicationResumeUpload
                          application={app}
                          compact
                          onUploaded={handleResumeUploaded}
                        />
                      </td>
                      <td>
                        {app.jobId?.link ? (
                          <a
                            className="btn btn-secondary btn-sm"
                            href={app.jobId.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Job
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="applications-cards">
              {applications.map((app) => (
                <div className="application-card" key={app._id}>
                  <div className="application-card-row">
                    <div>
                      <div className="application-card-value">{app.jobId?.role || "—"}</div>
                      <div className="application-card-label">{app.jobId?.companyName || "—"}</div>
                    </div>
                    <span className={`status-badge ${getStatusClass(app.status)}`}>
                      {formatStatus(app.status)}
                    </span>
                  </div>
                  <div className="application-card-row">
                    <span className="application-card-label">Applied</span>
                    <span className="application-card-value">
                      {formatDate(app.appliedAt || app.createdAt)}
                    </span>
                  </div>

                  <ApplicationResumeUpload
                    application={app}
                    onUploaded={handleResumeUploaded}
                  />

                  {app.jobId?.link && (
                    <div className="application-card-actions">
                      <a
                        className="btn btn-secondary btn-sm"
                        href={app.jobId.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Job
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default Applications;
