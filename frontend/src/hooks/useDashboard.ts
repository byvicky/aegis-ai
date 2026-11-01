import { useEffect, useState } from "react";

import { getDashboard } from "@/api/dashboard";
import type { DashboardData } from "@/types/dashboard";

export function useDashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(false);

      const data = await getDashboard();

      setDashboard(data);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);

      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return {
    dashboard,
    loading,
    error,
    reload: loadDashboard,
  };
}