import { api } from "../api/client";

export interface DashboardData {

    riskScore: number;

    riskLevel: string;

    totalFindings: number;

    criticalFindings: number;

    highFindings: number;

    mediumFindings: number;

    lowFindings: number;

    securityPosture: number;

    repositoryStatus: {

        scanner: string;

        advisor: string;

        repositories: number;

        lastScan: string | null;

        averageScan: string;

    };

    riskHistory: {

        id: number;

        scanDate: string;

        riskScore: number;

        riskLevel: string;

    }[];

    topVulnerabilities: {

        id: number;

        scanId: number;

        title: string;

        severity: string;

        file: string;

        line: number;

        score: number;

        owaspCategory: string;

    }[];

    recommendations: string[];
}

export async function getDashboardData(): Promise<DashboardData> {

    const response =
        await api.get("/dashboard");

    return response.data.data;
}
