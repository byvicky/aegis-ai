const express = require("express");

const {
    generateSecurityAdvice
} = require("../services/aiAdvisorService");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| POST /api/advisor
|--------------------------------------------------------------------------
|
| Recebe os findings de segurança e envia para o AI Advisor.
|
*/

router.post("/", async (req, res) => {

    try {

        const {
            findings
        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | Validação
        |--------------------------------------------------------------------------
        */

        if (!Array.isArray(findings)) {

            return res.status(400).json({

                success: false,

                message:
                    "The 'findings' field must be an array."

            });

        }


        console.log(
            `[Advisor API] Received ${findings.length} findings`
        );


        /*
        |--------------------------------------------------------------------------
        | Chamar AI Advisor
        |--------------------------------------------------------------------------
        */

        const result =
            await generateSecurityAdvice(
                findings
            );


        /*
        |--------------------------------------------------------------------------
        | Retornar resultado
        |--------------------------------------------------------------------------
        */

        return res.status(200).json(
            result
        );


    } catch (error) {

        console.error(
            "[Advisor API] Error:"
        );

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to generate AI security advice."

        });

    }

});


/*
|--------------------------------------------------------------------------
| GET /api/advisor/health
|--------------------------------------------------------------------------
|
| Endpoint simples para verificar se a API do Advisor
| está registrada e funcionando.
|
*/

router.get("/health", (req, res) => {

    return res.json({

        success: true,

        service:
            "AegisAI AI Advisor",

        status:
            "online",

        model:
            process.env.OLLAMA_MODEL ||
            "gpt-oss:20b-cloud"

    });

});


module.exports = router;