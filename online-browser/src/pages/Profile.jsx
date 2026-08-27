import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getProfile, updateProfile } from "../services/api";

function Profile() {
  const [profile, setProfile] = useState({
    preferredRoles: [],
    skills: [],
    experience: 0,
    minSalary: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getProfile();

        if (!data) {
          window.location.href = "/";
          return;
        }

        setProfile({
          preferredRoles: data.user.profile?.preferredRoles || [],
          skills: data.user.profile?.skills || [],
          experience: data.user.profile?.experience ?? 0,
          minSalary: data.user.profile?.minSalary ?? 0,
        });
      } catch (err) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  function validate(data) {
    const errors = {};

    if (!data.preferredRoles.length) {
      errors.preferredRoles = "Add at least one preferred role.";
    }

    if (!data.skills.length) {
      errors.skills = "Add at least one skill.";
    }

    if (data.experience < 0) {
      errors.experience = "Experience cannot be negative.";
    }

    if (data.minSalary < 0) {
      errors.minSalary = "Minimum salary cannot be negative.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    const cleaned = {
      preferredRoles: profile.preferredRoles.map((r) => r.trim()).filter(Boolean),
      skills: profile.skills.map((s) => s.trim()).filter(Boolean),
      experience: Number(profile.experience),
      minSalary: Number(profile.minSalary),
    };

    if (!validate(cleaned)) return;

    setProfile(cleaned);

    setSaving(true);

    try {
      const data = await updateProfile(cleaned);

      if (!data) {
        window.location.href = "/";
        return;
      }

      setMessage(data.message || "Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="loading-state full-page">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <h1>Profile</h1>
          <p>Tell us what kind of jobs you're looking for.</p>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="preferredRoles">Preferred Roles</label>
            <input
              id="preferredRoles"
              className={fieldErrors.preferredRoles ? "input-error" : ""}
              value={profile.preferredRoles.join(", ")}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, preferredRoles: "" }));
                setProfile({
                  ...profile,
                  preferredRoles: e.target.value.split(",").map((r) => r.trim()),
                });
              }}
              placeholder="Software Engineer, Backend Developer"
              disabled={saving}
            />
            <span className="form-hint">Separate multiple roles with commas</span>
            {fieldErrors.preferredRoles && (
              <span className="form-error">{fieldErrors.preferredRoles}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="skills">Skills</label>
            <input
              id="skills"
              className={fieldErrors.skills ? "input-error" : ""}
              value={profile.skills.join(", ")}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, skills: "" }));
                setProfile({
                  ...profile,
                  skills: e.target.value.split(",").map((s) => s.trim()),
                });
              }}
              placeholder="Java, Node.js, MongoDB"
              disabled={saving}
            />
            <span className="form-hint">Separate multiple skills with commas</span>
            {fieldErrors.skills && (
              <span className="form-error">{fieldErrors.skills}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="experience">Experience (years)</label>
            <input
              id="experience"
              type="number"
              className={fieldErrors.experience ? "input-error" : ""}
              value={profile.experience}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, experience: "" }));
                setProfile({ ...profile, experience: e.target.value });
              }}
              min="0"
              disabled={saving}
            />
            {fieldErrors.experience && (
              <span className="form-error">{fieldErrors.experience}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="minSalary">Minimum Salary (₹ per year)</label>
            <input
              id="minSalary"
              type="number"
              className={fieldErrors.minSalary ? "input-error" : ""}
              value={profile.minSalary}
              onChange={(e) => {
                setFieldErrors((prev) => ({ ...prev, minSalary: "" }));
                setProfile({ ...profile, minSalary: e.target.value });
              }}
              min="0"
              placeholder="600000"
              disabled={saving}
            />
            <span className="form-hint">Enter annual salary in rupees (e.g. 600000 for ₹6L)</span>
            {fieldErrors.minSalary && (
              <span className="form-error">{fieldErrors.minSalary}</span>
            )}
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default Profile;
