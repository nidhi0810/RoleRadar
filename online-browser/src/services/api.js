const API_URL = "http://localhost:5000";

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await parseJson(response);

  if (response.status === 401) {
    localStorage.removeItem("token");
    return { ok: false, unauthorized: true, data };
  }

  return {
    ok: response.ok,
    status: response.status,
    unauthorized: false,
    data,
  };
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJson(response);
  return { ok: response.ok, status: response.status, data };
}

export async function getProfile() {
  const result = await authFetch("/api/v1/users/me", { method: "GET" });
  if (result.unauthorized) return null;
  if (!result.ok) throw new Error(result.data.message || "Failed to load profile");
  return result.data;
}

export async function updateProfile(profile) {
  const result = await authFetch("/api/v1/users/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  if (result.unauthorized) return null;
  if (!result.ok) throw new Error(result.data.message || "Failed to update profile");
  return result.data;
}

export async function getJobs() {
  const result = await authFetch("/api/v1/jobs", { method: "GET" });
  if (result.unauthorized) return null;
  if (!result.ok) throw new Error(result.data.message || "Failed to load jobs");
  return result.data;
}

export async function getApplications() {
  const result = await authFetch("/api/v1/applications", { method: "GET" });
  if (result.unauthorized) return null;
  if (!result.ok) throw new Error(result.data.message || "Failed to load applications");
  return result.data;
}

export async function createApplication(jobId) {
  const result = await authFetch("/api/v1/applications", {
    method: "POST",
    body: JSON.stringify({ jobId }),
  });
  if (result.unauthorized) return { unauthorized: true };
  return {
    ok: result.ok,
    status: result.status,
    unauthorized: false,
    data: result.data,
  };
}

export async function uploadResume(applicationId, file) {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch(
    `${API_URL}/api/v1/applications/${applicationId}/resume`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  );

  const data = await parseJson(response);

  if (response.status === 401) {
    localStorage.removeItem("token");
    return null;
  }

  return { ok: response.ok, data };
}
