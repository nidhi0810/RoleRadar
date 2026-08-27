export function parseLlmJson(content) {
    if (content == null) {
        throw new Error("Empty LLM response");
    }

    if (typeof content === "object") {
        return content;
    }

    let cleaned = String(content).trim();

    cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        // continue to extraction fallbacks
    }

    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
        try {
            return JSON.parse(objectMatch[0]);
        } catch {
            // continue
        }
    }

    const scoreMatch = cleaned.match(/matchScore["\s:]+(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
        return { matchScore: Number(scoreMatch[1]) };
    }

    throw new Error(
        `LLM response is not valid JSON: ${cleaned.slice(0, 120)}`
    );
}
