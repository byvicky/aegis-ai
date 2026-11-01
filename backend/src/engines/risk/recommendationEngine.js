const recommendations = {

    sql: {

        title: "SQL Injection",

        priority: "CRITICAL",

        estimatedFixTime: "8 horas",

        recommendation:
            "Utilize Prepared Statements ou ORM. Nunca concatene entradas do usuário em consultas SQL.",

        references: [

            "OWASP SQL Injection",

            "OWASP Cheat Sheet"

        ]

    },

    xss: {

        title: "Cross Site Scripting",

        priority: "HIGH",

        estimatedFixTime: "6 horas",

        recommendation:
            "Escape toda saída HTML e utilize bibliotecas apropriadas.",

        references: [

            "OWASP XSS"

        ]

    },

    secret: {

        title: "Hardcoded Secret",

        priority: "CRITICAL",

        estimatedFixTime: "2 horas",

        recommendation:
            "Mover credenciais para variáveis de ambiente ou um Secret Manager.",

        references: [

            "OWASP Secrets Management"

        ]

    },

    auth: {

        title: "Authentication",

        priority: "HIGH",

        estimatedFixTime: "10 horas",

        recommendation:
            "Revisar autenticação, JWT, sessões e controle de acesso.",

        references: [

            "OWASP Authentication"

        ]

    }

};

function generateRecommendation(finding){

    const title =
        finding.title.toLowerCase();

    if(title.includes("sql"))
        return recommendations.sql;

    if(title.includes("xss"))
        return recommendations.xss;

    if(title.includes("secret"))
        return recommendations.secret;

    if(title.includes("auth"))
        return recommendations.auth;

    return {

        priority:"MEDIUM",

        estimatedFixTime:"4 horas",

        recommendation:
            "Revisar a vulnerabilidade manualmente.",

        references:[]

    };

}

module.exports = {

    generateRecommendation

};