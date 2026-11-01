function analyzeContext(finding){

    const file =
        finding.file.toLowerCase();

    let score = 0;

    let module = "General";

    let businessImpact = "LOW";

    let critical = false;

    // --------------------------

    if(file.includes("auth")){

        module = "Authentication";

        businessImpact = "HIGH";

        score += 20;

        critical = true;

    }

    if(file.includes("login")){

        module = "Authentication";

        businessImpact = "HIGH";

        score += 20;

        critical = true;

    }

    if(file.includes("admin")){

        module = "Administration";

        businessImpact = "HIGH";

        score += 25;

        critical = true;

    }

    if(file.includes("payment")){

        module = "Payments";

        businessImpact = "CRITICAL";

        score += 35;

        critical = true;

    }

    if(file.includes("jwt")){

        module = "Authentication";

        businessImpact = "HIGH";

        score += 20;

        critical = true;

    }

    if(file.includes("token")){

        module = "Authentication";

        businessImpact = "HIGH";

        score += 20;

        critical = true;

    }

    // --------------------------

    if(file.includes("test")){

        businessImpact = "LOW";

        score -= 15;

        critical = false;

    }

    return{

        module,

        businessImpact,

        contextScore:score,

        critical

    };

}

module.exports = {

    analyzeContext

};