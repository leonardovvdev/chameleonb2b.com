import { supabase } from "../../../lib/supabase"; // ← AJUSTAR a tu cliente real de Supabase
import type {
  OrgChartResponse,
  OrgChartStaff,
} from "../types/organizational-chart.types";

// ← AJUSTAR si tu variable de entorno se llama distinto
const BACKEND_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/backend-chameleonb2b`;

/** GET /staffs/org-chart → personal activo del customer de la sesión. */
export async function getOrgChartStaff(): Promise<OrgChartStaff[]> {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (error || !token) {
    throw new Error("Debes iniciar sesión para continuar.");
  }

  const res = await fetch(`${BACKEND_URL}/staffs/org-chart`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error ?? "No se pudo cargar el organigrama.");
  }

  return (body as OrgChartResponse).items;
}