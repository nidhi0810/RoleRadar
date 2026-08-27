export function formatSalary(amount) {
  if (amount == null || amount === "") return "N/A";
  const num = Number(amount);
  if (Number.isNaN(num)) return "N/A";
  if (num >= 100000) {
    const lakhs = num / 100000;
    return lakhs % 1 === 0 ? `₹${lakhs}L` : `₹${lakhs.toFixed(1)}L`;
  }
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num}`;
}

export function formatSalaryRange(min, max) {
  return `${formatSalary(min)} – ${formatSalary(max)}`;
}

export function formatExperience(job) {
  const min =
    job.experienceRequired?.min ?? job.minexperienceRequired ?? 0;
  const max = job.experienceRequired?.max;
  if (max != null) return `${min}–${max} years`;
  if (min > 0) return `${min}+ years`;
  return "0–2 years";
}

export function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getMatchScoreClass(score) {
  if (score >= 80) return "match-high";
  if (score >= 60) return "match-medium";
  return "match-low";
}

export function getStatusClass(status) {
  const map = {
    saved: "status-saved",
    applied: "status-applied",
    interview: "status-interview",
    rejected: "status-rejected",
    offer: "status-offer",
  };
  return map[status] || "status-applied";
}

export function formatStatus(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getJobChannel(job) {
  if (job.channelName) return job.channelName;
  if (typeof job.channel === "string") return job.channel;
  if (job.channel?.name) return job.channel.name;
  if (job.sourceChannel) return job.sourceChannel;
  if (job.groupName) return job.groupName;
  return null;
}

export function getJobFoundDate(job) {
  return job.messageDate || job.postedAt || job.createdAt;
}
