const { Ollama } = require("ollama");

const client = new Ollama({
    host: process.env.OLLAMA_HOST || "http://localhost:11434"
});

const MODEL =
    process.env.OLLAMA_MODEL ||
    "gpt-oss:20b-cloud";


async function generateSecurityAdvice(findings) {

    if (!Array.isArray(findings)) {
        throw new Error("Findings must be an array.");
    }


    /*
    |--------------------------------------------------------------------------
    | Nenhum finding
    |--------------------------------------------------------------------------
    */

    if (findings.length === 0) {

        return {

            success: true,

            data: {

                summary:
                    "No security findings were detected in the analyzed repository.",

                riskLevel: "LOW",

                priority: "LOW",

                keyRisks: [],

                recommendations: [
                    "Continue monitoring the repository.",
                    "Keep dependencies updated.",
                    "Run security scans regularly."
                ],

                findingsAnalyzed: 0

            }

        };
    }


    /*
    |--------------------------------------------------------------------------
    | Limitar findings
    |--------------------------------------------------------------------------
    */

    const limitedFindings =
        findings.slice(0, 20);


    /*
    |--------------------------------------------------------------------------
    | Preparar contexto
    |--------------------------------------------------------------------------
    */

    const securityContext =
        limitedFindings.map(
            (finding, index) => {

                return {

                    id: index + 1,

                    title:
                        finding.title ||
                        finding.check_id ||
                        "Unknown security finding",

                    severity:
                        finding.severity ||
                        "UNKNOWN",

                    file:
                        finding.file ||
                        "Unknown file",

                    line:
                        finding.line ||
                        null,

                    score:
                        finding.score ||
                        0,

                    owaspCategory:
                        finding.owaspCategory ||
                        "Other",

                    message:
                        finding.message ||
                        ""

                };

            }
        );


    /*
    |--------------------------------------------------------------------------
    | Prompt
    |--------------------------------------------------------------------------
    */

    const prompt = `
You are the AI Security Advisor of AegisAI.

AegisAI is an Application Security Risk Management
platform that analyzes software repositories.

Analyze the security findings below.

Your responsibilities:

1. Determine the overall security risk.
2. Identify the most important vulnerabilities.
3. Prioritize remediation.
4. Explain why the important findings matter.
5. Provide practical remediation recommendations.
6. Use OWASP categories when available.
7. Never invent vulnerabilities that are not present.

IMPORTANT:

Base your analysis ONLY on the findings provided.

Return ONLY valid JSON.

Do not use Markdown.

Use exactly this structure:

{
  "summary": "Short executive summary",
  "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL",
  "keyRisks": [
    {
      "title": "Risk title",
      "explanation": "Why this risk matters",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "priority": "LOW | MEDIUM | HIGH | CRITICAL"
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}

Security findings:

${JSON.stringify(
    securityContext,
    null,
    2
)}
`;


    try {

        console.log(
            `[AI Advisor] Model: ${MODEL}`
        );

        console.log(
            `[AI Advisor] Findings: ${limitedFindings.length}`
        );


        /*
        |--------------------------------------------------------------------------
        | Ollama
        |--------------------------------------------------------------------------
        */

        const response =
            await client.chat({

                model: MODEL,

                messages: [

                    {
                        role: "system",

                        content:
                            "You are an expert application security analyst. Return only valid JSON when requested."
                    },

                    {
                        role: "user",

                        content: prompt
                    }

                ],

                stream: false,

                options: {
                    temperature: 0.2
                }

            });


        /*
        |--------------------------------------------------------------------------
        | Resposta
        |--------------------------------------------------------------------------
        */

        const output =
            response?.message?.content;


        if (!output) {

            throw new Error(
                "Ollama returned an empty response."
            );
        }


        console.log(
            "[AI Advisor] Response received."
        );


        /*
        |--------------------------------------------------------------------------
        | Limpar Markdown
        |--------------------------------------------------------------------------
        */

        const cleanedOutput =
            output
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();


        /*
        |--------------------------------------------------------------------------
        | Converter JSON
        |--------------------------------------------------------------------------
        */

        let analysis;

        try {

            analysis =
                JSON.parse(
                    cleanedOutput
                );

        } catch (error) {

            console.error(
                "[AI Advisor] Invalid JSON returned by model:"
            );

            console.error(output);

            throw new Error(
                "The AI Advisor returned an invalid JSON response."
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Normalizar resultado
        |--------------------------------------------------------------------------
        */

        const normalizedAnalysis = {

            summary:
                analysis.summary ||
                "No summary was generated.",

            riskLevel:
                analysis.riskLevel ||
                "MEDIUM",

            priority:
                analysis.priority ||
                "MEDIUM",

            keyRisks:
                Array.isArray(
                    analysis.keyRisks
                )
                    ? analysis.keyRisks
                    : [],

            recommendations:
                Array.isArray(
                    analysis.recommendations
                )
                    ? analysis.recommendations
                    : [],

            findingsAnalyzed:
                limitedFindings.length

        };


        return {

            success: true,

            data:
                normalizedAnalysis

        };

    } catch (error) {

        console.error(
            "[AI Advisor] Error:"
        );

        console.error(error);


        throw new Error(
            `Unable to generate AI security advice: ${error.message}`
        );
    }
}


module.exports = {
    generateSecurityAdvice,
    getOllamaClient: () => client,
    getOllamaModel: () => MODEL
};
