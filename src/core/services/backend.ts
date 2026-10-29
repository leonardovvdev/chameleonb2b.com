import { supabase } from "../../lib/supabase";

export const BACKEND = "backend-chameleonb2b";

type QueryValue = string | number | boolean | null | undefined;

interface CallOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Objeto (se envía como JSON) o FormData (para archivos). */
  body?: Record<string, unknown> | FormData;
  query?: Record<string, QueryValue>;
}

/** Error del backend con el mensaje que debe ver el usuario. */

export class BackendError extends Error {
  status: number | undefined;
  code: string | null | undefined;

  constructor(message: string, status?: number, code?: string | null) {
    super(message);
    this.name = "BackendError";
    this.status = status;
    this.code = code;
  }
}

/** supabase-js oculta el mensaje real dentro de `error.context` (la Response). */
async function toBackendError(error: unknown): Promise<Error> {
  const context = (error as { context?: unknown } | null)?.context;

  if (context instanceof Response) {
    const payload = (await context
      .clone()
      .json()
      .catch(() => null)) as { error?: string; code?: string | null } | null;

    return new BackendError(
      payload?.error ?? "No se pudo completar la operación.",
      context.status,
      payload?.code ?? null,
    );
  }

  return new BackendError("No se pudo conectar con el servidor.");
}

/** Llama a la Edge Function (el JWT de la sesión lo agrega supabase-js). */
export async function callBackend<T>(path: string, options: CallOptions = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const queryString = params.toString();

  const { data, error } = await supabase.functions.invoke<T>(
    `${BACKEND}/${path}${queryString ? `?${queryString}` : ""}`,
    { method: options.method ?? "GET", body: options.body },
  );

  if (error) throw await toBackendError(error);
  if (data === null || data === undefined) throw new BackendError("Respuesta vacía del servidor.");
  return data;
}
