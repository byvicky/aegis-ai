function correlate(findings){

    const correlations = [];

    // Regra 1
    detectSQLAndSecrets(findings, correlations);

    // Regra 2
    detectAuthenticationProblems(findings, correlations);

    // Regra 3
    detectRemoteExecution(findings, correlations);

    return correlations;

}

module.exports = {

    correlate

};

function detectSQLAndSecrets(findings, correlations){

    const hasSQL =
        findings.some(f =>

            f.title.toLowerCase().includes("sql")

        );

    const hasSecret =
        findings.some(f =>

            f.title.toLowerCase().includes("secret")

        );

    if(hasSQL && hasSecret){

        correlations.push({

            title:
            "SQL Injection + Hardcoded Secret",

            severity:
            "CRITICAL",

            score:
            50,

            recommendation:
            "Existe risco elevado de acesso indevido ao banco de dados."

        });

    }

}

function detectAuthenticationProblems(findings, correlations){

    const authProblems =

        findings.filter(f =>

            f.file.toLowerCase().includes("auth") ||

            f.file.toLowerCase().includes("login") ||

            f.title.toLowerCase().includes("jwt")

        );

    if(authProblems.length >= 2){

        correlations.push({

            title:
            "Falhas de autenticação",

            severity:
            "HIGH",

            score:
            35,

            recommendation:
            "Revisar mecanismos de autenticação."

        });

    }

}

function detectRemoteExecution(findings, correlations){

    const commandInjection =

        findings.some(f =>

            f.title.toLowerCase().includes("command")

        );

    const pathTraversal =

        findings.some(f =>

            f.title.toLowerCase().includes("path")

        );

    if(commandInjection && pathTraversal){

        correlations.push({

            title:
            "Possível execução remota",

            severity:
            "CRITICAL",

            score:
            60,

            recommendation:
            "Corrigir imediatamente."

        });

    }

}
