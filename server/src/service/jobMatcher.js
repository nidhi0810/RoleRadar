import { parseLlmJson } from "../utils/parseLlmJson.js";
import { calculateSimpleMatchScore } from "../utils/simpleMatchScore.js";

export const calculateMatchScore = async (profile, job) => {
    try {
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    model: "openrouter/free",

                    messages: [
                        {
                            role: "system",
                            content: `
You are a job matching system.

Compare the user's profile with the job and return
a match score from 0 to 100.

Consider:
- preferred role
- skills
- experience
- minimum salary

Understand semantic similarities such as:
- SDE and Software Engineer
- Backend Engineer and Backend Developer
- Node and Node.js

Do not invent information.

Return ONLY valid JSON in this exact shape:
{"matchScore": 75}
`
                        },
                        {
                            role: "user",
                            content: JSON.stringify({
                                profile,
                                job
                            })
                        }
                    ],

                    response_format: {
                        type: "json_schema",

                        json_schema: {
                            name: "job_match",
                            strict: true,

                            schema: {
                                type: "object",

                                properties: {
                                    matchScore: {
                                        type: "number",
                                        minimum: 0,
                                        maximum: 100
                                    }
                                },

                                required: ["matchScore"],
                                additionalProperties: false
                            }
                        }
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenRouter error: ${error}`);
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;

        if (message?.parsed?.matchScore != null) {
            return message.parsed.matchScore;
        }

        const result = parseLlmJson(message?.content);
        return result.matchScore;
    } catch (error) {
        console.warn(
            "LLM match scoring failed, using fallback score:",
            error.message
        );
        return calculateSimpleMatchScore(profile, job);
    }
};
