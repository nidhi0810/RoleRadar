function normalize(value) {
    return String(value || "").toLowerCase().trim();
}

function overlaps(a, b) {
    return a.includes(b) || b.includes(a);
}

export function calculateSimpleMatchScore(profile, job) {
    if (!profile) {
        return 0;
    }

    let score = 0;
    const role = normalize(job.role);
    const preferredRoles = (profile.preferredRoles || []).map(normalize);

    if (role && preferredRoles.some((preferred) => overlaps(role, preferred))) {
        score += 40;
    } else if (preferredRoles.length === 0) {
        score += 20;
    }

    const userSkills = (profile.skills || []).map(normalize);
    const jobSkills = (job.skillsRequired || []).map(normalize);

    if (jobSkills.length > 0) {
        const matchedSkills = jobSkills.filter((skill) =>
            userSkills.some((userSkill) => overlaps(userSkill, skill))
        ).length;
        score += Math.round((matchedSkills / jobSkills.length) * 40);
    } else {
        score += 20;
    }

    const experience = Number(profile.experience ?? 0);
    const minExperience = Number(job.experienceRequired?.min ?? 0);
    const maxExperience = job.experienceRequired?.max;

    if (experience >= minExperience && (maxExperience == null || experience <= maxExperience)) {
        score += 10;
    } else if (experience >= minExperience - 1) {
        score += 5;
    }

    const minSalary = Number(profile.minSalary ?? 0);
    const jobMinSalary = Number(job.salaryRange?.min ?? 0);

    if (jobMinSalary === 0 || minSalary === 0 || minSalary <= jobMinSalary) {
        score += 10;
    }

    return Math.min(100, Math.max(0, score));
}
