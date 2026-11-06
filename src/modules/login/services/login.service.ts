import { supabase } from "../../../lib/supabase"; // cliente de Supabase

export const ERROR_GENERICO = "No se pudo completar el inicio de sesión.";

// ─────────────── Errores ───────────────

/** Código que manda el backend cuando el usuario de Google no tiene cuenta. */
export const CODIGO_CUSTOMER_NO_EXISTE = "CUSTOMER_NOT_FOUND";

/**
 * Saca { error, code } que devuelve nuestro backend (el body solo se puede leer una vez).
 * supabase-js deja la respuesta HTTP en `error.context`. Se comprueba así (y no con
 * `instanceof FunctionsHttpError`) porque esa comprobación puede fallar según cómo se
 * empaquete la librería, y entonces se perdería el código (ej. CUSTOMER_NOT_FOUND).
 */
export async function leerErrorBackend(
  error: unknown,
): Promise<{ mensaje: string; codigo: string | null }> {
  const context = (error as { context?: unknown } | null)?.context;

  if (context instanceof Response) {
    const body = await context.clone().json().catch(() => null);
    const mensaje = body?.error ?? body?.message;
    return {
      mensaje: typeof mensaje === "string" ? mensaje : ERROR_GENERICO,
      codigo: typeof body?.code === "string" ? body.code : null,
    };
  }

  // Sin respuesta del backend: red caída, CORS bloqueado o la función no arrancó.
  console.error("El backend no respondió (red, CORS o función caída):", error);
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

// ─────────────── Google sin redirección (Google Identity Services) ───────────────

/** Verifica con el backend si la cuenta de Google ya tiene customer. NO crea nada en Supabase. */
export const verificarCuentaGoogle = (credential: string) =>
  supabase.functions.invoke<{ exists: boolean; email: string }>(`${BACKEND}/auth/google/check`, {
    method: "POST",
    body: { credential },
  });

/** Entrega el token de Google a Supabase Auth: crea/recupera el usuario y guarda la sesión (JWT). */
export const entrarConCredencialGoogle = (credential: string) =>
  supabase.auth.signInWithIdToken({ provider: "google", token: credential });

// Tipos mínimos de la librería de Google (solo lo que usamos).
interface GoogleIdApi {
  initialize: (config: {
    client_id: string;
    callback: (respuesta: { credential?: string }) => void;
    ux_mode?: "popup";
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (contenedor: HTMLElement, opciones: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
let cargaGoogle: Promise<void> | null = null;

/** Carga el script de Google una sola vez. */
function cargarScriptGoogle(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (cargaGoogle) return cargaGoogle;

  cargaGoogle = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      cargaGoogle = null; // permite reintentar
      script.remove();
      reject(new Error("No se pudo cargar el script de Google."));
    };
    document.head.appendChild(script);
  });
  return cargaGoogle;
}

/** Dibuja el botón oficial de Google dentro de `contenedor`. Al elegir cuenta llama a `alRecibir(credential)`. */
export async function dibujarBotonGoogle(
  contenedor: HTMLElement,
  texto: "signin_with" | "signup_with",
  alRecibir: (credential: string) => void,
): Promise<void> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) throw new Error("Falta VITE_GOOGLE_CLIENT_ID en el .env del frontend.");

  await cargarScriptGoogle();
  const google = window.google?.accounts?.id;
  if (!google) throw new Error("Google no está disponible.");

  google.initialize({
    client_id: clientId,
    callback: (respuesta) => {
      if (respuesta.credential) alRecibir(respuesta.credential);
    },
  });

  contenedor.innerHTML = "";
  google.renderButton(contenedor, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: texto,
    shape: "rectangular",
    logo_alignment: "left",
    width: Math.min(Math.max(contenedor.clientWidth, 200), 400),
  });
}
