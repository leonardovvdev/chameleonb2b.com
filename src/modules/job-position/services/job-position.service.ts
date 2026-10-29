import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import type {
  JobPosition,
  JobPositionInput,
  JobPositionsResponse,
} from "../types/job-position.types";

const ENDPOINT = "backend-chameleonb2b/customer-job-positions";

/**
 * Error que devuelve el backend: { error, code } + status HTTP.
 * status = 0 → no se pudo conectar con el servidor.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function toApiError(error: unknown): Promise<ApiError> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    return new ApiError(
      body?.error ?? "Error inesperado del servidor.",
      error.context.status,
      body?.code ?? null
    );
  }
  return new ApiError("No se pudo conectar con el servidor.", 0);
}

/** supabase-js adjunta solo el JWT de la sesión en el header Authorization. */
async function request<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: JobPositionInput
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(path, {
    method,
    body,
  });
  if (error) throw await toApiError(error);
  return data as T;
}

/** READ: cargos del customer de la sesión. */
export async function listJobPositions(): Promise<JobPosition[]> {
  const res = await request<JobPositionsResponse>(ENDPOINT, "GET");
  return res.items;
}

/** CREATE */
export const createJobPosition = (input: JobPositionInput) =>
  request<JobPosition>(ENDPOINT, "POST", input);

/** UPDATE */
export const updateJobPosition = (id: number, input: JobPositionInput) =>
  request<JobPosition>(`${ENDPOINT}?id=${id}`, "PATCH", input);

/** DELETE */
export const deleteJobPosition = (id: number) =>
  request<{ id: number }>(`${ENDPOINT}?id=${id}`, "DELETE");