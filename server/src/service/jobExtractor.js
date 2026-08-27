import { parseLlmJson } from "../utils/parseLlmJson.js";
import { extractJobFallback } from "../utils/simpleJobExtractor.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function normalizeLink(link) {
    if (!link) {
        return null;
    }

    const trimmed = String(link).trim();

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    if (/^www\./i.test(trimmed)) {
        return `https://${trimmed}`;
    }

    return `https://${trimmed}`;
}

function pickString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return null;
}

function pickArray(...values) {
    for (const value of values) {
        if (Array.isArray(value) && value.length > 0) {
            return value;
        }
    }

    return [];
}

function pickObject(...values) {
    for (const value of values) {
        if (value && typeof value === "object") {
            return value;
        }
    }

    return null;
}

function mergeJobResults(fallbackResult, llmResult) {
    const isJob = Boolean(fallbackResult?.isJob || llmResult?.isJob);

    if (!isJob) {
        return {
            isJob: false,
            companyName: null,
            role: null,
            link: null,
            skillsRequired: [],
            experienceRequired: null,
            salaryRange: null,
            registrationEndDate: null,
        };
    }

    const companyName = pickString(llmResult?.companyName, fallbackResult?.companyName);
    const role = pickString(llmResult?.role, fallbackResult?.role);

    return {
        isJob: true,
        companyName,
        role,
        link: normalizeLink(pickString(llmResult?.link, fallbackResult?.link)),
        skillsRequired: pickArray(llmResult?.skillsRequired, fallbackResult?.skillsRequired),
        experienceRequired: pickObject(
            llmResult?.experienceRequired,
            fallbackResult?.experienceRequired
        ),
        salaryRange: pickObject(llmResult?.salaryRange, fallbackResult?.salaryRange),
        registrationEndDate: pickString(
            llmResult?.registrationEndDate,
            fallbackResult?.registrationEndDate
        ),
    };
}

async function callExtractionModel(text) {
    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || "openrouter/free",
            messages: [
                {
                    role: "system",
                    content: `
You extract job and internship postings from WhatsApp messages.

Treat short hiring posts as jobs when they mention a role, company, stipend/salary, skills, or an apply link.
Internships, trainee roles, and stipend-based openings count as jobs.

Return ONLY valid JSON matching the schema.
Do not explain your reasoning.
Do not use markdown.
`,
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "job_extraction",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            isJob: { type: "boolean" },
                            companyName: { type: ["string", "null"] },
                            role: { type: ["string", "null"] },
                            link: { type: ["string", "null"] },
                            skillsRequired: {
                                type: "array",
                                items: { type: "string" },
                            },
                            experienceRequired: {
                                type: ["object", "null"],
                                properties: {
                                    min: { type: ["number", "null"] },
                                    max: { type: ["number", "null"] },
                                },
                                required: ["min", "max"],
                                additionalProperties: false,
                            },
                            salaryRange: {
                                type: ["object", "null"],
                                properties: {
                                    min: { type: ["number", "null"] },
                                    max: { type: ["number", "null"] },
                                },
                                required: ["min", "max"],
                                additionalProperties: false,
                            },
                            registrationEndDate: { type: ["string", "null"] },
                        },
                        required: [
                            "isJob",
                            "companyName",
                            "role",
                            "link",
                            "skillsRequired",
                            "experienceRequired",
                            "salaryRange",
                            "registrationEndDate",
                        ],
                        additionalProperties: false,
                    },
                },
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter error: ${error}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    if (message?.parsed) {
        return message.parsed;
    }

    return parseLlmJson(message?.content);
}

export const extractJob = async (text) => {
    console.log("========== EXTRACT JOB ==========");
    console.log("TEXT:", text);
    const fallbackResult = extractJobFallback(text);

    console.log("FALLBACK RESULT:", fallbackResult);

    try {
        const llmResult = await callExtractionModel(text);

        console.log("LLM RESULT:", llmResult);

        const mergedResult = mergeJobResults(
            fallbackResult,
            llmResult
        );

        console.log("MERGED RESULT:", mergedResult);

        return mergedResult;

    } catch (error) {
        console.warn(
            "LLM job extraction failed, using fallback extractor:",
            error.message
        );

        return fallbackResult;
    }
};