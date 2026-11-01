const express = require("express");
const { createAnalyzeHandler } = require("../services/analysisService");

function createAnalyzeRouter(dependencies) {
    const router = express.Router();

    router.get("/test", (req, res) => {
        res.json({ message: "API funcionando!" });
    });

    router.post("/analyze", createAnalyzeHandler(dependencies));
    return router;
}

const router = createAnalyzeRouter();

module.exports = router;
module.exports.createAnalyzeRouter = createAnalyzeRouter;
