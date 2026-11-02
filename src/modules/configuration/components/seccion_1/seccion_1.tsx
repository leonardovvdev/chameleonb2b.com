import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../../lib/supabase";
import { leerErrorBackend } from "../../../login/services/login.service";
import style from "./seccion_1.module.css";

// ─────────────── Backend ───────────────

const RUTA_CLAVE = "backend-chameleonb2b/auth/password";
const MIN_CLAVE = 6;

/** ¿La cuenta ya tiene clave? (solo responde sí/no, nunca la clave). */
const consultarClave = () =>
  supabase.functions.invoke<{ has_password: boolean }>(RUTA_CLAVE, { method: "GET" });

/** Crea la clave si no existe o la reemplaza si ya existe. */
const guardarClave = (password: string, confirmPassword: string) =>
  supabase.functions.invoke<{ created: boolean }>(RUTA_CLAVE, {
    method: "POST",
    body: { password, confirmPassword },
  });

/** Mensaje del backend si lo hay; si no (sin internet, etc.), uno propio. */
async function mensajeDeError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) return (await leerErrorBackend(error)).mensaje;
  return "No se pudo conectar. Revisa tu conexión e intenta de nuevo.";
}

/** Devuelve un mensaje de error, o null si todo está bien. */
function validarClave(clave: string, confirmar: string): string | null {
  if (!clave) return "Ingresa tu nueva clave.";
  if (clave.length < MIN_CLAVE) return `La clave debe tener al menos ${MIN_CLAVE} caracteres.`;
  if (!confirmar) return "Confirma tu nueva clave.";
  if (clave !== confirmar) return "Las claves no coinciden.";
  return null;
}

// ─────────────── Iconos ───────────────

const Icono = ({ children }: { children: ReactNode }) => (
  <svg className={style.icono} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IconoLlave = () => (
  <Icono>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </Icono>
);

const IconoInfo = () => (
  <Icono>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </Icono>
);

const IconoOjo = () => (
  <Icono>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icono>
);

const IconoOjoOculto = () => (
  <Icono>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M3 3l18 18" />
  </Icono>
);

const IconoGuardar = () => (
  <Icono>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </Icono>
);

const IconoReiniciar = () => (
  <Icono>
    <path d="M21 12a9 9 0 0 0-15.5-6.2L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 15.5 6.2L21 16" />
    <path d="M16 16h5v5" />
  </Icono>
);

// ─────────────── Pantalla ───────────────

const Seccion_1 = () => {
  // null = todavía consultando si la cuenta ya tiene clave
  const [tieneClave, setTieneClave] = useState<boolean | null>(null);
  const [intento, setIntento] = useState(0);

  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Al entrar: ¿la cuenta ya tiene clave? (crear o actualizar)
  useEffect(() => {
    let activo = true;

    consultarClave().then(async ({ data, error: errorConsulta }) => {
      if (!activo) return;
      if (errorConsulta || !data) {
        setError(errorConsulta ? await mensajeDeError(errorConsulta) : "No se pudo consultar tu cuenta.");
        return;
      }
      setError("");
      setTieneClave(data.has_password);
    });

    return () => {
      activo = false;
    };
  }, [intento]);

  /** Crea un onChange que guarda lo escrito y borra los avisos anteriores. */
  const escribir =
    (guardar: (valor: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
      guardar(e.target.value);
      setError("");
      setExito("");
    };

  const vaciarCampos = () => {
    setClave("");
    setConfirmar("");
    setVerClave(false);
    setVerConfirmar(false);
  };

  /** Botón "Cancelar": limpia el formulario. */
  const handleCancelar = () => {
    vaciarCampos();
    setError("");
    setExito("");
  };

  /** Botón "Guardar": valida, envía al backend y avisa el resultado. */
  const handleGuardar = async (e: FormEvent) => {
    e.preventDefault();

    const errorValidacion = validarClave(clave, confirmar);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setError("");
    setExito("");
    setGuardando(true);
    const { data, error: errorBackend } = await guardarClave(clave, confirmar);
    setGuardando(false);

    if (errorBackend) {
      setError(await mensajeDeError(errorBackend));
      return;
    }

    vaciarCampos();
    setTieneClave(true);
    setExito(data?.created ? "Tu clave se creó correctamente." : "Tu clave se actualizó correctamente.");
  };

  const cargando = tieneClave === null && !error;
  const fallo = tieneClave === null && !!error;
  const actualizando = tieneClave === true;

  return (
    <div className={style.seccion}>
      <form className={style.tarjeta} onSubmit={handleGuardar} noValidate>
        <div className={style.cabecera}>
          <div className={style.iconoCirculo}>
            <IconoLlave />
          </div>
          <div>
            <h2 className={style.titulo}>{actualizando ? "Actualizar clave" : "Crear clave"}</h2>
            <p className={style.subtitulo}>
              {actualizando
                ? "Ya tienes una clave. Por seguridad no se muestra; escribe una nueva para cambiarla."
                : "Genera una clave de acceso para tu cuenta."}
            </p>
          </div>
        </div>

        {cargando && (
          <p className={style.estado} role="status">
            Verificando tu cuenta...
          </p>
        )}

        {fallo && (
          <>
            <span className={style.textoError} role="alert">
              {error}
            </span>
            <div className={style.acciones}>
              <button
                type="button"
                className={style.botonSecundario}
                onClick={() => {
                  setError("");
                  setIntento(intento + 1);
                }}
              >
                Reintentar
              </button>
            </div>
          </>
        )}

        {tieneClave !== null && (
          <>
            <label htmlFor="clave-nueva" className={style.label}>
              Nueva clave
            </label>
            <div className={style.campo}>
              <input
                id="clave-nueva"
                type={verClave ? "text" : "password"}
                className={style.input}
                value={clave}
                placeholder="Ingresa tu clave segura..."
                autoComplete="new-password"
                onChange={escribir(setClave)}
              />
              <button
                type="button"
                className={style.ojo}
                onClick={() => setVerClave(!verClave)}
                aria-label={verClave ? "Ocultar clave" : "Mostrar clave"}
              >
                {verClave ? <IconoOjoOculto /> : <IconoOjo />}
              </button>
            </div>

            <label htmlFor="clave-confirmar" className={style.label}>
              Confirmar clave
            </label>
            <div className={style.campo}>
              <input
                id="clave-confirmar"
                type={verConfirmar ? "text" : "password"}
                className={style.input}
                value={confirmar}
                placeholder="Repite tu clave..."
                autoComplete="new-password"
                onChange={escribir(setConfirmar)}
              />
              <button
                type="button"
                className={style.ojo}
                onClick={() => setVerConfirmar(!verConfirmar)}
                aria-label={verConfirmar ? "Ocultar clave" : "Mostrar clave"}
              >
                {verConfirmar ? <IconoOjoOculto /> : <IconoOjo />}
              </button>
            </div>

            <div className={style.aviso}>
              <span className={style.avisoIcono}>
                <IconoInfo />
              </span>
              <div>
                <p className={style.avisoTitulo}>Recomendación</p>
                <p className={style.avisoTexto}>
                  Utiliza una combinación de letras, números y símbolos para mayor seguridad.
                  Mínimo {MIN_CLAVE} caracteres.
                </p>
              </div>
            </div>

            {error && (
              <span className={style.textoError} role="alert">
                {error}
              </span>
            )}
            {exito && (
              <p className={style.textoExito} role="status">
                {exito}
              </p>
            )}

            <div className={style.acciones}>
              <button
                type="button"
                className={style.botonSecundario}
                onClick={handleCancelar}
                disabled={guardando}
              >
                <IconoReiniciar />
                Cancelar
              </button>
              <button type="submit" className={style.botonPrimario} disabled={guardando}>
                <IconoGuardar />
                {guardando ? "Guardando..." : actualizando ? "Actualizar clave" : "Guardar clave"}
              </button>
            </div>
          </>
        )}
      </form>

      <aside className={style.ilustracion} aria-hidden="true">
        <svg viewBox="0 0 200 200" role="presentation">
          <circle cx="62" cy="150" r="42" fill="#cfdffa" />
          <circle cx="132" cy="62" r="34" fill="#d6e4fb" />
          <path d="M100 22 L158 44 V100 C158 138 134 164 100 178 Z" fill="#5b98f4" />
          <path d="M100 22 L42 44 V100 C42 138 66 164 100 178 Z" fill="#3f7ee6" />
          <rect x="76" y="88" width="48" height="40" rx="7" fill="#fff" />
          <path d="M85 88 V78 a15 15 0 0 1 30 0 V88" fill="none" stroke="#fff" strokeWidth="8" />
          <circle cx="100" cy="106" r="6" fill="#3f7ee6" />
          <rect x="97.5" y="106" width="5" height="12" rx="2.5" fill="#3f7ee6" />
          <circle cx="150" cy="150" r="18" fill="#2fbf9b" />
          <path d="M141 150 l7 7 l12 -13" fill="none" stroke="#fff" strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </aside>
    </div>
  );
};

export default Seccion_1;