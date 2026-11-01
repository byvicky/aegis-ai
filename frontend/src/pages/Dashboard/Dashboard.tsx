import { useEffect, useState } from "react";

import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    FileWarning,
    GitBranch,
    Plus,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";

import {
    getDashboard,
    type DashboardData,
} from "@/api/dashboard";
import { normalizeScannerResults, unavailableConfiguredScanners } from "@/components/analysis/scannerConfig";


interface DashboardProps {
    onNewAnalysis: () => void;
}


export function Dashboard({
    onNewAnalysis,
}: DashboardProps) {

    const [data, setData] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ============================================
    // CARREGAR DASHBOARD
    // ============================================

    useEffect(() => {

        async function loadDashboard() {

            try {

                setLoading(true);
                setError("");

                const dashboard =
                    await getDashboard();

                console.log(
                    "DASHBOARD DATA:",
                    dashboard
                );

                setData(dashboard);

            } catch (err) {

                console.error(
                    "Erro ao carregar dashboard:",
                    err
                );

                setError(
                    "Não foi possível carregar os dados do dashboard."
                );

            } finally {

                setLoading(false);

            }

        }

        loadDashboard();

    }, []);


    // ============================================
    // LOADING
    // ============================================

    if (loading) {

        return (

            <AppLayout>

                <div className="flex min-h-[60vh] items-center justify-center">

                    <div className="flex flex-col items-center gap-3">

                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-purple-500" />

                        <p className="text-sm text-zinc-400">
                            Loading dashboard...
                        </p>

                    </div>

                </div>

            </AppLayout>

        );

    }


    // ============================================
    // ERRO
    // ============================================

    if (error || !data) {

        return (

            <AppLayout>

                <div className="flex min-h-[60vh] items-center justify-center">

                    <div className="max-w-md rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">

                        <ShieldAlert
                            className="mx-auto mb-3 text-red-400"
                            size={32}
                        />

                        <h2 className="mb-2 text-lg font-semibold text-white">
                            Unable to load dashboard
                        </h2>

                        <p className="text-sm text-zinc-400">
                            {error ||
                                "No dashboard data is available."}
                        </p>

                    </div>

                </div>

            </AppLayout>

        );

    }


    // ============================================
    // DADOS AUXILIARES
    // ============================================

    const totalFindings =
        data.criticalFindings +
        data.highFindings +
        data.mediumFindings +
        data.lowFindings;

    const riskHistory =
        data.riskHistory || [];

    const vulnerabilities =
        data.topVulnerabilities || [];

    const recommendations =
        data.recommendations || [];

    const dashboardScanners =
        data.scannerResults?.length
            ? normalizeScannerResults(data.scannerResults)
            : unavailableConfiguredScanners("The dashboard does not receive per-scanner results. Run a new analysis to view execution status.");


    // ============================================
    // RENDER
    // ============================================

    return (

        <AppLayout>

            <main className="min-h-screen bg-[#09090b] p-6 text-white lg:p-8">

                {/* ================================= */}
                {/* HEADER */}
                {/* ================================= */}

                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">

                    <div>

                        <div className="mb-1 flex items-center gap-2">

                            <ShieldCheck
                                size={22}
                                className="text-purple-400"
                            />

                            <span className="text-sm font-medium text-purple-400">
                                Security Overview
                            </span>

                        </div>

                        <h1 className="text-2xl font-semibold tracking-tight">
                            Application Risk Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-zinc-500">
                            Monitor your application's security posture and risk exposure.
                        </p>

                    </div>


                    {/* HEADER ACTIONS */}

                    <div className="flex flex-wrap items-center gap-3">

                        {/* SCANNER STATUS */}

                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300">
                            Scanner results per analysis
                        </div>


                        {/* NEW ANALYSIS */}

                        <button
                            onClick={onNewAnalysis}
                            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-500"
                        >

                            <Plus size={17} />

                            New Analysis

                        </button>

                    </div>

                </div>


                {/* ================================= */}
                {/* METRICS */}
                {/* ================================= */}

                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">


                    {/* Risk Score */}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">

                        <div className="mb-4 flex items-center justify-between">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">

                                <ShieldAlert
                                    size={20}
                                    className="text-purple-400"
                                />

                            </div>

                            <span className="text-xs text-zinc-500">
                                Current
                            </span>

                        </div>

                        <p className="text-sm text-zinc-400">
                            Risk Score
                        </p>

                        <p className="mt-1 text-3xl font-semibold">
                            {data.riskScore}
                        </p>

                        <p className="mt-2 text-xs text-red-400">
                            {data.riskLevel}
                        </p>

                    </div>


                    {/* Critical */}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">

                        <div className="mb-4 flex items-center justify-between">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">

                                <AlertTriangle
                                    size={20}
                                    className="text-red-400"
                                />

                            </div>

                            <span className="text-xs text-zinc-500">
                                Critical
                            </span>

                        </div>

                        <p className="text-sm text-zinc-400">
                            Critical Findings
                        </p>

                        <p className="mt-1 text-3xl font-semibold">
                            {data.criticalFindings}
                        </p>

                        <p className="mt-2 text-xs text-zinc-500">
                            Highest priority
                        </p>

                    </div>


                    {/* Total Findings */}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">

                        <div className="mb-4 flex items-center justify-between">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">

                                <FileWarning
                                    size={20}
                                    className="text-amber-400"
                                />

                            </div>

                            <span className="text-xs text-zinc-500">
                                Total
                            </span>

                        </div>

                        <p className="text-sm text-zinc-400">
                            Security Findings
                        </p>

                        <p className="mt-1 text-3xl font-semibold">
                            {totalFindings}
                        </p>

                        <p className="mt-2 text-xs text-zinc-500">
                            Across latest scan
                        </p>

                    </div>


                    {/* Security Posture */}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">

                        <div className="mb-4 flex items-center justify-between">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">

                                <ShieldCheck
                                    size={20}
                                    className="text-emerald-400"
                                />

                            </div>

                            <span className="text-xs text-zinc-500">
                                Posture
                            </span>

                        </div>

                        <p className="text-sm text-zinc-400">
                            Security Posture
                        </p>

                        <p className="mt-1 text-3xl font-semibold">
                            {data.securityPosture}%
                        </p>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">

                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                    width: `${data.securityPosture}%`,
                                }}
                            />

                        </div>

                    </div>

                </section>


                {/* ================================= */}
                {/* MAIN GRID */}
                {/* ================================= */}

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">


                    {/* RISK HISTORY */}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 xl:col-span-2">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <h2 className="font-semibold">
                                    Risk Overview
                                </h2>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Risk score across recent analyses
                                </p>

                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500">

                                <GitBranch size={14} />

                                {riskHistory.length} scans

                            </div>

                        </div>


                        {riskHistory.length > 0 ? (

                            <div className="space-y-4">

                                {riskHistory.map((scan) => {

                                    const maxRisk =
                                        Math.max(
                                            ...riskHistory.map(
                                                (item) =>
                                                    item.riskScore
                                            ),
                                            1
                                        );

                                    const width =
                                        Math.max(
                                            4,
                                            (scan.riskScore /
                                                maxRisk) *
                                                100
                                        );

                                    return (

                                        <div
                                            key={scan.id}
                                            className="space-y-2"
                                        >

                                            <div className="flex items-center justify-between">

                                                <span className="text-xs text-zinc-500">
                                                    {scan.scanDate}
                                                </span>

                                                <div className="flex items-center gap-2">

                                                    <span className="text-sm font-medium">
                                                        {scan.riskScore}
                                                    </span>

                                                    <span className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400">
                                                        {scan.riskLevel}
                                                    </span>

                                                </div>

                                            </div>


                                            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">

                                                <div
                                                    className="h-full rounded-full bg-purple-500 transition-all"
                                                    style={{
                                                        width: `${width}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    );

                                })}

                            </div>

                        ) : (

                            <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
                                No risk history available.
                            </div>

                        )}

                    </div>


                    {/* REPOSITORY STATUS */}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">

                        <div className="mb-6">

                            <h2 className="font-semibold">
                                Repository Status
                            </h2>

                            <p className="mt-1 text-xs text-zinc-500">
                                Current platform status
                            </p>

                        </div>


                        <div className="space-y-5">


                            <div>

                                <p className="mb-3 text-sm text-zinc-300">
                                    Scanner Status
                                </p>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {dashboardScanners.map((scanner) => {
                                        const failed = scanner.status === "failed";
                                        const completed = scanner.status === "completed";
                                        const label = scanner.status === "unavailable" ? "Status unavailable" : scanner.status;

                                        return <div key={scanner.scanner} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div><p className="text-sm text-zinc-200">{scanner.scanner}</p><p className="text-xs text-zinc-500">{scanner.type}</p></div>
                                                <span className={`text-xs font-medium ${completed ? "text-emerald-400" : failed ? "text-red-400" : scanner.status === "unavailable" ? "text-amber-300" : "text-zinc-400"}`}>{label}</span>
                                            </div>
                                        </div>;
                                    })}
                                </div>

                            </div>


                            {/* AI Advisor */}

                            <div className="flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">

                                        <ShieldCheck
                                            size={17}
                                            className="text-purple-400"
                                        />

                                    </div>

                                    <div>

                                        <p className="text-sm">
                                            AI Advisor
                                        </p>

                                        <p className="text-xs text-zinc-500">
                                            Recommendation engine
                                        </p>

                                    </div>

                                </div>

                                <span className="text-xs font-medium text-purple-400">
                                    {data.repositoryStatus.advisor}
                                </span>

                            </div>


                            {/* Repositories */}

                            <div className="flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">

                                        <GitBranch
                                            size={17}
                                            className="text-blue-400"
                                        />

                                    </div>

                                    <div>

                                        <p className="text-sm">
                                            Repositories
                                        </p>

                                        <p className="text-xs text-zinc-500">
                                            Registered
                                        </p>

                                    </div>

                                </div>

                                <span className="text-sm font-semibold">
                                    {data.repositoryStatus.repositories}
                                </span>

                            </div>


                            {/* Last Scan */}

                            <div className="flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">

                                        <Clock3
                                            size={17}
                                            className="text-amber-400"
                                        />

                                    </div>

                                    <div>

                                        <p className="text-sm">
                                            Last Scan
                                        </p>

                                        <p className="text-xs text-zinc-500">
                                            Most recent analysis
                                        </p>

                                    </div>

                                </div>

                                <span className="max-w-[140px] text-right text-xs text-zinc-400">
                                    {data.repositoryStatus.lastScan ||
                                        "No scans"}
                                </span>

                            </div>


                            {/* Average */}

                            <div className="flex items-center justify-between border-t border-zinc-800 pt-5">

                                <span className="text-xs text-zinc-500">
                                    Average scan time
                                </span>

                                <span className="text-sm font-medium">
                                    {data.repositoryStatus.averageScan}
                                </span>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ================================= */}
                {/* TOP VULNERABILITIES */}
                {/* ================================= */}

                <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">

                    <div className="mb-6 flex items-center justify-between">

                        <div>

                            <h2 className="font-semibold">
                                Top Vulnerabilities
                            </h2>

                            <p className="mt-1 text-xs text-zinc-500">
                                Highest priority findings from the latest analysis
                            </p>

                        </div>

                        <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                            {vulnerabilities.length} findings
                        </span>

                    </div>


                    {vulnerabilities.length > 0 ? (

                        <div className="overflow-x-auto">

                            <table className="w-full text-left">

                                <thead>

                                    <tr className="border-b border-zinc-800 text-xs text-zinc-500">

                                        <th className="pb-3 pr-4 font-medium">
                                            Vulnerability
                                        </th>

                                        <th className="pb-3 pr-4 font-medium">
                                            Severity
                                        </th>

                                        <th className="pb-3 pr-4 font-medium">
                                            OWASP
                                        </th>

                                        <th className="pb-3 pr-4 font-medium">
                                            File
                                        </th>

                                        <th className="pb-3 font-medium">
                                            Line
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {vulnerabilities.map(
                                        (vulnerability) => {

                                            const severity =
                                                vulnerability.severity?.toUpperCase();

                                            const isCritical =
                                                severity === "ERROR" ||
                                                severity === "CRITICAL";

                                            const isHigh =
                                                severity === "HIGH";

                                            const isMedium =
                                                severity === "MEDIUM" ||
                                                severity === "WARNING";

                                            return (

                                                <tr
                                                    key={vulnerability.id}
                                                    className="border-b border-zinc-800/60 last:border-0"
                                                >

                                                    <td className="max-w-[300px] py-4 pr-4">

                                                        <p className="truncate text-sm text-zinc-200">
                                                            {vulnerability.title}
                                                        </p>

                                                    </td>


                                                    <td className="py-4 pr-4">

                                                        <span
                                                            className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                                                                isCritical
                                                                    ? "bg-red-500/10 text-red-400"
                                                                    : isHigh
                                                                    ? "bg-orange-500/10 text-orange-400"
                                                                    : isMedium
                                                                    ? "bg-yellow-500/10 text-yellow-400"
                                                                    : "bg-zinc-800 text-zinc-400"
                                                            }`}
                                                        >

                                                            {isCritical
                                                                ? "CRITICAL"
                                                                : isHigh
                                                                ? "HIGH"
                                                                : isMedium
                                                                ? "MEDIUM"
                                                                : severity || "LOW"}

                                                        </span>

                                                    </td>


                                                    <td className="py-4 pr-4 text-xs text-zinc-400">

                                                        {vulnerability.owaspCategory ||
                                                            "Other"}

                                                    </td>


                                                    <td className="max-w-[300px] py-4 pr-4">

                                                        <p
                                                            className="truncate text-xs text-zinc-500"
                                                            title={
                                                                vulnerability.file
                                                            }
                                                        >

                                                            {vulnerability.file}

                                                        </p>

                                                    </td>


                                                    <td className="py-4 text-xs text-zinc-400">

                                                        {vulnerability.line}

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    ) : (

                        <div className="flex h-32 items-center justify-center">

                            <div className="flex items-center gap-2 text-sm text-zinc-500">

                                <CheckCircle2
                                    size={18}
                                    className="text-emerald-400"
                                />

                                No vulnerabilities found.

                            </div>

                        </div>

                    )}

                </section>


                {/* ================================= */}
                {/* BREAKDOWN + RECOMMENDATIONS */}
                {/* ================================= */}

                <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">


                    {/* Finding Breakdown */}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">

                        <div className="mb-6">

                            <h2 className="font-semibold">
                                Finding Breakdown
                            </h2>

                            <p className="mt-1 text-xs text-zinc-500">
                                Vulnerabilities by severity
                            </p>

                        </div>


                        <div className="space-y-4">

                            {[
                                {
                                    name: "Critical",
                                    value: data.criticalFindings,
                                    color: "bg-red-500",
                                    text: "text-red-400",
                                },
                                {
                                    name: "High",
                                    value: data.highFindings,
                                    color: "bg-orange-500",
                                    text: "text-orange-400",
                                },
                                {
                                    name: "Medium",
                                    value: data.mediumFindings,
                                    color: "bg-yellow-500",
                                    text: "text-yellow-400",
                                },
                                {
                                    name: "Low",
                                    value: data.lowFindings,
                                    color: "bg-blue-500",
                                    text: "text-blue-400",
                                },
                            ].map((item) => (

                                <div key={item.name}>

                                    <div className="mb-2 flex items-center justify-between">

                                        <span className="text-sm text-zinc-400">
                                            {item.name}
                                        </span>

                                        <span
                                            className={`text-sm font-medium ${item.text}`}
                                        >
                                            {item.value}
                                        </span>

                                    </div>


                                    <div className="h-2 rounded-full bg-zinc-800">

                                        <div
                                            className={`h-full rounded-full ${item.color}`}
                                            style={{
                                                width: `${
                                                    totalFindings > 0
                                                        ? (item.value /
                                                              totalFindings) *
                                                          100
                                                        : 0
                                                }%`,
                                            }}
                                        />

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>


                    {/* Recommendations */}

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">

                        <div className="mb-6">

                            <h2 className="font-semibold">
                                Security Recommendations
                            </h2>

                            <p className="mt-1 text-xs text-zinc-500">
                                Actions based on the latest analysis
                            </p>

                        </div>


                        <div className="space-y-3">

                            {recommendations.length > 0 ? (

                                recommendations.map(
                                    (recommendation, index) => (

                                        <div
                                            key={index}
                                            className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
                                        >

                                            <div className="mt-0.5">

                                                <AlertTriangle
                                                    size={17}
                                                    className="text-purple-400"
                                                />

                                            </div>

                                            <p className="text-sm leading-6 text-zinc-300">
                                                {recommendation}
                                            </p>

                                        </div>

                                    )
                                )

                            ) : (

                                <div className="flex items-center gap-2 text-sm text-zinc-500">

                                    <CheckCircle2
                                        size={18}
                                        className="text-emerald-400"
                                    />

                                    No recommendations available.

                                </div>

                            )}

                        </div>

                    </div>

                </section>

            </main>

        </AppLayout>

    );

}
