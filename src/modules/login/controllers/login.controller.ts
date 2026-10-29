import {
  CODIGO_CUSTOMER_NO_EXISTE,
  ERROR_GENERICO,
  cerrarSesion,
  consumirModoGoogle,
  entrarConGoogle,
  entrarConPassword,
  leerErrorBackend,
  leerErrorOAuth,
  loginEnBackendCorreo,
  loginEnBackendGoogle,
  obtenerSesion,
  registrarConGoogle,
} from "../services/login.service";

// ─────────────── Tipos ───────────────

export type ResultadoLogin =
  | { ok: true; destino: string }
  | { ok: false; error: string };

/** Resultado al volver de Google: además de entrar o fallar, puede pedir crear la cuenta. */
export type ResultadoRetornoGoogle =
  | { ok: true; destino: string }
  | { ok: false; requiereRegistro: true; correo: string }
  | { ok: false; requiereRegistro?: false; error: string };

// ─────────────── Utilidades ───────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Solo acepta rutas internas ("/algo"), nunca otros sitios. */
function rutaSegura(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const ruta = url.trim();
  return ruta.startsWith("/") && !ruta.startsWith("//") ? ruta : null;
}

/** Traduce el error de Supabase Auth a un mensaje para el usuario. */
function mensajeErrorAuth(mensaje: string): string {
  const texto = mensaje.toLowerCase();
  if (texto.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (texto.includes("email not confirmed")) return "Tu correo aún no está verificado.";
  return ERROR_GENERICO;
}

/** El backend rechazó la petición: se cierra la sesión y se muestra su mensaje. */
async function fallarYCerrarSesion(error: unknown): Promise<{ ok: false; error: string }> {
  console.error("Error del backend:", error);
  const { mensaje } = await leerErrorBackend(error);
  await cerrarSesion();
  return { ok: false, error: mensaje };
}

/** Último paso de todo login: validar el destino (tabla modules) y refrescar el cliente. */
async function entrarAlDestino(
  data: { redirect_url?: unknown } | null,
  refreshCustomer: () => Promise<void>,
): Promise<ResultadoLogin> {
  const destino = rutaSegura(data?.redirect_url);

  if (!destino) {
    await cerrarSesion();
    return { ok: false, error: "Tu cuenta no tiene un módulo activo. Contacta a soporte." };
  }

  await refreshCustomer();
  return { ok: true, destino };
}

// ─────────────── Validaciones (se usan en los formularios) ───────────────

/** Devuelve un mensaje de error, o null si todo está bien. */
export function validarCredenciales(correo: string, password: string): string | null {
  if (!correo.trim()) return "Ingresa tu correo.";
  if (!EMAIL_REGEX.test(correo.trim())) return "Ingresa un correo válido.";
  if (!password) return "Ingresa tu contraseña.";
  return null;
}

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //////////       Modal_logueo      //////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Botón "Acceder con Google" (vista login).
 * Redirige a Google; al volver, /auth/callback llama a procesarRetornoGoogle().
 */
export async function loginConGoogle(): Promise<{ error?: string }> {
  const { error } = await entrarConGoogle("login");
  return error ? { error: "No se pudo iniciar con Google. Intenta de nuevo." } : {};
}

/** Botón "Entrar": Supabase Auth valida correo/contraseña (guarda el JWT) y el backend da el destino. */
export async function loginConCorreoContrasena(
  correo: string,
  password: string,
  refreshCustomer: () => Promise<void>,
): Promise<ResultadoLogin> {
  try {
    // 1) Supabase Auth valida el correo y la contraseña y guarda la sesión (JWT).
    const { error: authError } = await entrarConPassword(correo.trim().toLowerCase(), password);
    if (authError) return { ok: false, error: mensajeErrorAuth(authError.message) };

    // 2) El backend comprueba el cliente activo y busca el destino en modules / customer_modules.
    const { data, error: backendError } = await loginEnBackendCorreo();
    if (backendError) return await fallarYCerrarSesion(backendError);

    // 3) Se refresca el cliente y se entra al módulo.
    return await entrarAlDestino(data, refreshCustomer);
  } catch (err) {
    console.error("Error inesperado en el login:", err);
    return { ok: false, error: ERROR_GENERICO };
  }
}

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////            Modal_formulario            /////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Botón "Crear cuenta con Google" (vista formulario).
 * Redirige a Google; al volver, /auth/callback ejecuta crearConGoogle() directamente.
 */
export async function abrirGoogleParaCrearCuenta(): Promise<{ error?: string }> {
  const { error } = await entrarConGoogle("registro");
  return error ? { error: "No se pudo iniciar con Google. Intenta de nuevo." } : {};
}

/**
 * Crea la cuenta del usuario que ya volvió de Google con sesión activa.
 * Se usa en dos casos: botón "Crear cuenta con Google" y respuesta "Sí" al aviso
 * de "tu cuenta no existe, ¿deseas crearla?".
 */
export async function crearConGoogle(
  refreshCustomer: () => Promise<void>,
): Promise<ResultadoLogin> {
  try {
    // 1) Google o Supabase pueden dejar un error en la URL.
    if (leerErrorOAuth()) {
      return { ok: false, error: "No se pudo verificar tu cuenta de Google." };
    }

    // 2) Tiene que existir una sesión.
    const { data: sesion, error: sesionError } = await obtenerSesion();
    if (sesionError || !sesion.session) {
      return {
        ok: false,
        error: "No se pudo verificar tu cuenta de Google. Intenta iniciar sesión nuevamente.",
      };
    }

    // 3) El backend crea el cliente (si no existe) y da el destino.
    const { data, error: backendError } = await registrarConGoogle();
    if (backendError) return await fallarYCerrarSesion(backendError);

    // 4) Se refresca el cliente y se entra al módulo.
    return await entrarAlDestino(data, refreshCustomer);
  } catch (err) {
    console.error("Error inesperado al crear la cuenta con Google:", err);
    return { ok: false, error: ERROR_GENERICO };
  }
}

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////            /auth/callback (al volver de Google)            ///////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Se ejecuta al volver de Google.
 *  - Si el usuario venía de "Crear cuenta con Google" → crearConGoogle().
 *  - Si venía de "Acceder con Google" → login; si NO tiene cuenta, cierra la sesión
 *    y devuelve `requiereRegistro` para que la pantalla lo lleve al formulario.
 */
export async function procesarRetornoGoogle(
  refreshCustomer: () => Promise<void>,
): Promise<ResultadoRetornoGoogle> {
  const modo = consumirModoGoogle();

  if (modo === "registro") return await crearConGoogle(refreshCustomer);

  try {
    if (leerErrorOAuth()) {
      return { ok: false, error: "No se pudo verificar tu cuenta de Google." };
    }

    const { data: sesion, error: sesionError } = await obtenerSesion();
    if (sesionError || !sesion.session) {
      return {
        ok: false,
        error: "No se pudo verificar tu cuenta de Google. Intenta iniciar sesión nuevamente.",
      };
    }

    const { data, error: backendError } = await loginEnBackendGoogle();

    if (backendError) {
      // El body de la respuesta solo se puede leer una vez: se lee aquí y se reutiliza.
      const { mensaje, codigo } = await leerErrorBackend(backendError);

      if (codigo === CODIGO_CUSTOMER_NO_EXISTE) {
        // Sin cuenta: se cierra la sesión que dejó Google. La pantalla devolverá al
        // usuario al formulario, donde podrá crear su cuenta con "Crear cuenta con Google".
        const correo = sesion.session.user.email ?? "";
        await cerrarSesion();
        return { ok: false, requiereRegistro: true, correo };
      }

      console.error("Error del backend:", backendError);
      await cerrarSesion();
      return { ok: false, error: mensaje };
    }

    return await entrarAlDestino(data, refreshCustomer);
  } catch (err) {
    console.error("Error inesperado al volver de Google:", err);
    return { ok: false, error: ERROR_GENERICO };
  }
}