const express = require("express");

const {
    getDashboardData
} = require("../services/dashboardService");

const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const data = await getDashboardData();

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Erro ao carregar dashboard:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Erro ao carregar dashboard",
            error: error.message
        });
    }
});

module.exports = router;