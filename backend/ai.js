const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiKeyString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const geminiIndexedKeys = Object.keys(process.env)
  .filter((key) => /^GEMINI_API_KEY(_\d+)?$/.test(key))
  .sort()
  .map((key) => process.env[key])
  .filter(Boolean);
const geminiApiKeys = [
  ...geminiKeyString
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean),
  ...geminiIndexedKeys
].filter(Boolean);
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const duplicateThreshold = Number(process.env.DUPLICATE_THRESHOLD || 0.82);

const parseAiResponse = (output) => {
  let cleanOutput = String(output || "").trim();
  if (cleanOutput.startsWith("```json")) cleanOutput = cleanOutput.substring(7);
  if (cleanOutput.startsWith("```")) cleanOutput = cleanOutput.substring(3);
  if (cleanOutput.endsWith("```")) cleanOutput = cleanOutput.substring(0, cleanOutput.length - 3);

  const parsed = JSON.parse(cleanOutput.trim());
  return {
    priority: String(parsed.priority || "Medium").trim() || "Medium",
    category: String(parsed.category || "Other").trim() || "Other",
    summary: String(parsed.summary || "AI analysis failed").trim() || "AI analysis failed"
  };
};

const callGemini = async (prompt, apiKey) => {
  if (!apiKey) throw new Error("No Gemini API key configured");
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: geminiModel });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
};

const tryGeminiKeys = async (prompt) => {
  if (!geminiApiKeys.length) {
    throw new Error("No Gemini API keys configured");
  }

  const errors = [];
  for (const apiKey of geminiApiKeys) {
    try {
      return await callGemini(prompt, apiKey);
    } catch (error) {
      errors.push(error.message || String(error));
    }
  }

  throw new Error(`All Gemini keys failed: ${errors.join(" | ")}`);
};

const analyzeComplaint = async (text) => {
  const prompt = `
You are an AI for a municipality system. Your job is to analyze a citizen's complaint.

Return ONLY a valid JSON object with no markdown formatting, no \`\`\`json, and no other text.

The JSON object must have exactly these keys:
{
  "priority": "High" or "Medium" or "Low",
  "category": "Roads & Potholes" or "Water Issues" or "Sewage & Drainage" or "Electricity Problems" or "Traffic Problems" or "Illegal Construction" or "Other",
  "summary": "A very short 5-10 word summary of the issue in the original language of the complaint"
}

Complaint to analyze: "${text}"
`;

  try {
    const geminiOutput = await tryGeminiKeys(prompt);
    return parseAiResponse(geminiOutput);
  } catch (geminiError) {
    console.error("AI Analysis Error:", geminiError.message || geminiError);
    return {
      priority: "Medium",
      category: "Other",
      summary: "AI analysis failed"
    };
  }
};

const detectDuplicateComplaint = async (newComplaintText, candidates = []) => {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { duplicateOfId: null, similarityScore: 0 };
  }

  try {
    const client = new GoogleGenerativeAI(geminiApiKeys[0]);
    const model = client.getGenerativeModel({ model: geminiModel });
    const lightweightCandidates = candidates.map((item) => ({
      analysisId: item.analysisId,
      complaintId: item.complaintId,
      categoryId: item.categoryId,
      location: item.location || null,
      summary: item.summary || "",
      description: item.description || ""
    }));

    const prompt = `
You are helping detect complaint duplicates for a municipality.

Compare the NEW complaint against the CANDIDATE complaints and find the best possible match.
Return ONLY a valid JSON object with no markdown and no extra text.

Required JSON format:
{
  "duplicateOfId": number or null,
  "similarityScore": number
}

Rules:
- similarityScore must be between 0 and 1.
- duplicateOfId must be the analysisId of the best matching candidate only if similarityScore is high enough.
- If not a strong duplicate, use duplicateOfId = null.

NEW complaint:
${newComplaintText}

CANDIDATES:
${JSON.stringify(lightweightCandidates)}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text().trim();

    let cleanOutput = output;
    if (cleanOutput.startsWith("```json")) {
      cleanOutput = cleanOutput.substring(7);
    }
    if (cleanOutput.startsWith("```")) {
      cleanOutput = cleanOutput.substring(3);
    }
    if (cleanOutput.endsWith("```")) {
      cleanOutput = cleanOutput.substring(0, cleanOutput.length - 3);
    }

    const parsed = JSON.parse(cleanOutput.trim());
    const scoreRaw = Number(parsed.similarityScore);
    const normalizedScore = Number.isFinite(scoreRaw)
      ? Math.max(0, Math.min(1, scoreRaw))
      : 0;
    const roundedScore = Number(normalizedScore.toFixed(3));

    if (
      parsed.duplicateOfId === null ||
      roundedScore < duplicateThreshold ||
      !candidates.some((c) => Number(c.analysisId) === Number(parsed.duplicateOfId))
    ) {
      return { duplicateOfId: null, similarityScore: roundedScore };
    }

    return {
      duplicateOfId: Number(parsed.duplicateOfId),
      similarityScore: roundedScore
    };
  } catch (error) {
    console.error("Duplicate Detection Error:", error);
    return { duplicateOfId: null, similarityScore: 0 };
  }
};

module.exports = { analyzeComplaint, detectDuplicateComplaint };
