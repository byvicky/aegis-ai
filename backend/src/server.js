const { loadAiAdvisorConfig } = require("./config/loadAiAdvisorConfig");

loadAiAdvisorConfig();

const express = require("express");
const cors = require("cors");

const analyzeRoutes = require("./routes/analyzeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const advisorRoutes = require("./routes/advisorRoutes");

const createTables = require("../database/schema");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", analyzeRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/advisor", advisorRoutes);


app.get("/health", (req, res) => {

    res.json({
        status: "Backend funcionando"
    });

});


const PORT = 3000;


async function startServer() {

    await createTables();

    app.listen(PORT, () => {

        console.log(
            `Servidor rodando em http://localhost:${PORT}`
        );

    });

}


startServer();
