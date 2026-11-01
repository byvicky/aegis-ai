function mapToOWASP(title) {

    const text = title.toLowerCase();

    if (
        text.includes("sql") ||
        text.includes("xss") ||
        text.includes("command") ||
        text.includes("injection")
    ) {

        return "A03: Injection";

    }

    if (
        text.includes("secret") ||
        text.includes("crypto") ||
        text.includes("password")
    ) {

        return "A02: Cryptographic Failures";

    }

    if (
        text.includes("auth") ||
        text.includes("login") ||
        text.includes("jwt")
    ) {

        return "A07: Identification and Authentication Failures";

    }

    if (
        text.includes("path") ||
        text.includes("directory")
    ) {

        return "A01: Broken Access Control";

    }

    if (
        text.includes("ssrf")
    ) {

        return "A10: Server-Side Request Forgery";

    }

    return "Outros";

}

module.exports = {
    mapToOWASP
};