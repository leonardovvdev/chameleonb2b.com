import { FunctionsHttpError } from "@supabase/supabase-js"; // errores de las Edge Functions
import { supabase } from "../../../lib/supabase"; // cliente de Supabase

export const ERROR_GENERICO = "No se pudo completar el inicio de sesión.";

// ─────────────── Errores ───────────────

/** Código que manda el backend cuando el usuario de Google no tiene cuenta. */
export const CODIGO_CUSTOMER_NO_EXISTE = "CUSTOMER_NOT_FOUND";

/** Saca { error, code } que devuelve nuestro backend (el body solo se puede leer una vez). */
export async function leerErrorBackend(
  error: unknown,
): Promise<{ mensaje: string; codigo: string | null }> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    const mensaje = body?.error ?? body?.message;
    return {
      mensaje: typeof mensaje === "string" ? mensaje : ERROR_GENERICO,
      codigo: typeof body?.code === "string" ? body.code : null,
    };
  }
  return { mensaje: ERROR_GENERICO, codigo: null };
}

/** Error que Google/Supabase dejan en la URL al volver a /auth/callback. */
export function leerErrorOAuth(): string | null {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const leer = (clave: string) => query.get(clave) ?? hash.get(clave);

  return leer("error_description") ?? leer("error");
}

// ─────────────── Supabase Auth ───────────────

/** Verifica correo y contraseña en Supabase Authentication. Si son válidos guarda la sesión (JWT). */
export const entrarConPassword = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

/** Sesión actual (contiene el JWT). */
export const obtenerSesion = () => supabase.auth.getSession();

/** Cierra la sesión en Supabase Authentication. */
export const cerrarSesion = () => supabase.auth.signOut();

/**
 * Qué quería hacer el usuario al pulsar el botón de Google.
 * Google nos devuelve a /auth/callback sin ese dato, así que se guarda
 * en sessionStorage antes de redirigir (más fiable que un query param,
 * que exige que esté permitido en "Redirect URLs" de Supabase).
 */
export type ModoGoogle = "login" | "registro";
const CLAVE_MODO_GOOGLE = "auth_modo_google";

/** Redirige a Google. `modo` se recuerda para cuando vuelva a /auth/callback. */
export const entrarConGoogle = (modo: ModoGoogle) => {
  sessionStorage.setItem(CLAVE_MODO_GOOGLE, modo);
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });
};

/** Lee (y borra) el modo guardado antes de ir a Google. Por defecto: "login". */
export function consumirModoGoogle(): ModoGoogle {
  const modo = sessionStorage.getItem(CLAVE_MODO_GOOGLE);
  sessionStorage.removeItem(CLAVE_MODO_GOOGLE);
  return modo === "registro" ? "registro" : "login";
}

// ─────────────── Backend (Edge Functions) ───────────────
// invoke() envía solo el JWT de la sesión en el header Authorization.

const BACKEND = "backend-chameleonb2b";

/** Correo/contraseña: comprueba que haya un cliente activo y devuelve a qué módulo ir. */
export const loginEnBackendCorreo = () =>
  supabase.functions.invoke(`${BACKEND}/auth/email/login`, { method: "POST", body: {} });

/** Google: igual que el anterior, pero NO crea la cuenta si no existe. */
export const loginEnBackendGoogle = () =>
  supabase.functions.invoke(`${BACKEND}/auth/google/login`, { method: "POST", body: {} });

/** Google: crea el cliente si no existe (se puede repetir sin duplicar). */
export const registrarConGoogle = () =>
  supabase.functions.invoke(`${BACKEND}/auth/google/register`, { method: "POST", body: {} });