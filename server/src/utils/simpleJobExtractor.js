const JOB_KEYWORDS =
    /\b(intern|internship|hiring|hire|job|developer|engineer|sde|stipend|salary|lpa|vacancy|opening|recruit|placement|fresher|trainee|apply here|apply now)\b/i;

const COMPANY_PATTERN =
    /([a-z0-9][\w\s.&-]*?\b(?:pvt\.?\s*ltd\.?|private limited|limited|ltd\.?|llc|inc\.?|corp\.?|technologies|tech|solutions|company|co\.?))\b/i;

const KNOWN_SKILLS = [
    "mern stack",
    "mean stack",
    "full stack",
    "node.js",
    "nodejs",
    "react",
    "angular",
    "vue",
    "python",
    "java",
    "mongodb",
    "express",
    "django",
    "flutter",
    "kotlin",
    "swift",
    "aws",
    "docker",
    "kubernetes",
    "typescript",
    "javascript",
    "sql",
    "postgres",
    "mysql",
    "redis",
    "graphql",
    "next.js",
    "nextjs",
];

function titleCase(value) {
    return value
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

function emptyJobResult(isJob = false) {
    return {
        isJob,
        companyName: null,
        role: null,
        link: null,
        skillsRequired: [],
        experienceRequired: null,
        salaryRange: null,
        registrationEndDate: null,
    };
}

function extractSalary(text) {
    const stipendMatch = text.match(
        /(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)\s*k\b(?:\s*(?:stipend|salary|pm|per month|\/month))?/i
    );
    if (stipendMatch) {
        const amount = Number(stipendMatch[1]) * 1000;
        return { min: amount, max: amount };
    }

    const lpaMatch = text.match(/(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)\s*lpa\b/i);
    if (lpaMatch) {
        const amount = Number(lpaMatch[1]) * 100000;
        return { min: amount, max: amount };
    }

    const plainAmountMatch = text.match(
        /(?:stipend|salary)\s*(?:of|:)?\s*(?:₹|rs\.?\s*)?(\d[\d,]*)/i
    );
    if (plainAmountMatch) {
        const amount = Number(plainAmountMatch[1].replace(/,/g, ""));
        return { min: amount, max: amount };
    }

    return null;
}

function extractSkills(text) {
    const lower = text.toLowerCase();
    const skills = new Set();

    for (const skill of KNOWN_SKILLS) {
        if (lower.includes(skill)) {
            skills.add(titleCase(skill));
        }
    }

    if (/\bmern\b/.test(lower)) {
        skills.add("MERN Stack");
    }

    if (/\bmean\b/.test(lower)) {
        skills.add("MEAN Stack");
    }

    return [...skills].filter(
        (skill, index, list) =>
            list.findIndex(
                (item) => item.toLowerCase() === skill.toLowerCase()
            ) === index
    );
}

function extractLink(text) {
    const httpMatch = text.match(
        /https?:\/\/[^\s<>"')\]]+/i
    );

    if (httpMatch) {
        return httpMatch[0].replace(/[.,!?;:]+$/, "");
    }

    const wwwMatch = text.match(
        /\bwww\.[^\s<>"')\]]+/i
    );

    if (wwwMatch) {
        return `https://${wwwMatch[0].replace(/[.,!?;:]+$/, "")}`;
    }

    const bareDomainMatch = text.match(
        /\b[a-z0-9][-a-z0-9]*\.(?:com|in|org|net|io|co)(?:\/[^\s<>"')\]]*)?/i
    );

    if (bareDomainMatch) {
        return `https://${bareDomainMatch[0].replace(/[.,!?;:]+$/, "")}`;
    }

    return null;
}

function extractExperience(text) {
    const rangeMatch = text.match(
        /(\d+)\s*(?:-|to)\s*(\d+)\s*years?/i
    );
    if (rangeMatch) {
        return {
            min: Number(rangeMatch[1]),
            max: Number(rangeMatch[2]),
        };
    }

    const minMatch = text.match(/(\d+)\+\s*years?/i);
    if (minMatch) {
        return {
            min: Number(minMatch[1]),
            max: null,
        };
    }

    const exactMatch = text.match(/(\d+)\s*years?/i);
    if (exactMatch) {
        const years = Number(exactMatch[1]);
        return { min: years, max: years };
    }

    return null;
}

function extractRole(text, companyMatch) {
    if (companyMatch?.index > 0) {
        const beforeCompany = text.slice(0, companyMatch.index).trim();
        if (beforeCompany) {
            return beforeCompany.replace(/[,\-–]+$/u, "").trim();
        }
    }

    const roleMatch = text.match(
        /^([a-z0-9][\w\s./+-]*?(?:intern(?:ship)?|developer|engineer|sde|designer|analyst|manager|devops|tester|qa|associate))\b/i
    );

    return roleMatch ? roleMatch[1].trim() : null;
}

export function extractJobFallback(text) {
    const normalized = text.trim().replace(/\s+/g, " ");

    if (!normalized || !JOB_KEYWORDS.test(normalized)) {
        return emptyJobResult(false);
    }

    const link = extractLink(normalized);
    const companyMatch = normalized.match(COMPANY_PATTERN);
    let companyName = companyMatch
        ? companyMatch[1].trim().replace(/\s+/g, " ")
        : null;
    const role = extractRole(normalized, companyMatch);

    if (role && companyName) {
        const rolePrefix = new RegExp(
            `^${role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`,
            "i"
        );
        companyName = companyName.replace(rolePrefix, "").trim() || companyName;
    }

    const skills = extractSkills(normalized);

    return {
        isJob: true,
        companyName,
        role,
        link,
        skillsRequired: skills,
        experienceRequired: extractExperience(normalized),
        salaryRange: extractSalary(normalized),
        registrationEndDate: null,
    };
}
