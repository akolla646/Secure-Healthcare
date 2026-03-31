const { callLLM } = require("./llmProvider");

/**
 * AI Bot Service
 * Handles extracting text, building prompts, and communicating with the LLM.
 */

/**
 * Strip basic PHI/PII from text to comply with HIPAA Data Minimization.
 * 
 * @param {string} text The raw clinical text
 * @returns {string} Text with identified PII/PHI redacted
 */
const scrubPHI = (text) => {
    let scrubbed = text;
    // Remove Email Addresses
    scrubbed = scrubbed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL REMOVED]");
    // Remove Phone Numbers
    scrubbed = scrubbed.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE REMOVED]");
    // Remove SSNs
    scrubbed = scrubbed.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN REMOVED]");
    // Remove typical date formats like MM/DD/YYYY, YYYY-MM-DD
    scrubbed = scrubbed.replace(/\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b/g, "[DATE REMOVED]");
    // Remove Age if formatted like "Age: 35"
    scrubbed = scrubbed.replace(/\b(age|yrs|years old)\s*[:\-]?\s*\d{1,3}\b/gi, "[AGE REMOVED]");
    
    return scrubbed;
};

/**
 * Construct the system prompt for the LLM based on our requirements.
 * 
 * @returns {string} The system prompt instructing the LLM on its behavior and output format.
 */
const buildSystemPrompt = () => {
    return `You are an expert clinical AI assistant. The user will provide you with the raw text of a doctor's diagnosis file. 
Your task is to analyze this diagnosis and generate a comprehensive care plan and diet plan based STRICTLY on this diagnosis.

CRITICAL INSTRUCTIONS:
1. Do NOT suggest, prescribe, or recommend any medications.
2. Focus entirely on lifestyle, monitoring, follow-up care, and dietary recommendations.
3. Be specific, actionable, and empathetic.
4. If the diagnosis file is empty, unclear, or does not contain a medical diagnosis, indicate that in the response.
5. Do NOT mention, suggest, or recommend consulting any specific specialists (e.g., cardiologist, neurologist). You MAY suggest consulting their "regular doctor" or "primary care physician".

You MUST respond with valid JSON matching exactly this schema:
{
  "diagnosisSummary": "A short 1-2 sentence summary of the patient's condition based on the text",
  "carePlan": {
    "monitoring": ["Array of specific things the patient should monitor at home or via tests"],
    "lifestyle": ["Array of lifestyle modifications, exercises, or habits to adopt"],
    "followUp": ["Array of general follow-up steps (You may suggest consulting a regular doctor, but do NOT mention specific specialists)"]
  },
  "dietPlan": {
    "recommended": ["Array of specific foods or food groups they should eat"],
    "avoid": ["Array of specific foods, drinks, or ingredients they should avoid"],
    "mealSuggestions": ["Array of 2-3 specific meal ideas (e.g., breakfast, lunch) that fit the diet"]
  }
}
Ensure the JSON is perfectly formatted and contains no markdown code blocks outside of the JSON structure.`;
};

/**
 * Orchestrate the generation of insights from a raw diagnosis text.
 * 
 * @param {string} diagnosisText Raw text extracted from the uploaded file
 * @returns {Promise<Object>} The parsed JSON object containing the care and diet plan
 */
exports.generateInsights = async (diagnosisText) => {
    if (!diagnosisText || diagnosisText.trim().length === 0) {
        throw new Error("Diagnosis text is empty.");
    }

    const systemPrompt = buildSystemPrompt();
    
    // HIPAA Compliance: Scrub PHI before sending to LLM
    const scrubbedText = scrubPHI(diagnosisText);

    try {
        console.log("Calling LLM with scrubbed text length:", scrubbedText.length);
        const rawResponse = await callLLM(systemPrompt, scrubbedText);

        // The LLM might wrap the JSON in markdown code blocks like ```json ... ```
        // Let's clean that up just in case, even though we requested application/json
        let cleanResponse = rawResponse.trim();
        if (cleanResponse.startsWith("```json")) {
            cleanResponse = cleanResponse.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (cleanResponse.startsWith("```")) {
            cleanResponse = cleanResponse.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const parsedJson = JSON.parse(cleanResponse);
        return parsedJson;

    } catch (error) {
        console.error("Error generating insights:", error);
        if (error instanceof SyntaxError) {
            throw new Error("The AI returned a malformed response that could not be parsed.");
        }
        throw new Error(error.message || "Failed to generate insights from the AI Bot.");
    }
};
