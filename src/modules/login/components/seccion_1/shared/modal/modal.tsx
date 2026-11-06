import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { icon } from "../../../../../../core/icons";
import style from "./modal.module.css";

import ModalLogueo from "./modal_logueo";
import ModalFormulario from "./modal_formulario";
import {
  abrirGoogleParaCrearCuenta,
  loginConGoogle,
} from "../../../../controllers/login.controller";

/** Vistas posibles dentro de la misma tarjeta. */
type Vista = "login" | "formulario";

/** Logo de Google (no necesita ningún archivo externo). */
const LogoGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const Modal = () => {
  // /auth/callback manda aquí a quien entró con Google sin tener cuenta:
  // se abre directo en "formulario" y con el aviso de su correo.
  const estado = useLocation().state as { vista?: Vista; correoSinCuenta?: string } | null;

  const [vista, setVista] = useState<Vista>(estado?.vista === "formulario" ? "formulario" : "login");
  const [correoSinCuenta, setCorreoSinCuenta] = useState(estado?.correoSinCuenta ?? "");

  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorGoogle, setErrorGoogle] = useState("");

  const esLogin = vista === "login";

  const irALogin = useCallback(() => {
    setErrorGoogle("");
    setCorreoSinCuenta("");
    setVista("login");
  }, []);

  const irAFormulario = useCallback(() => {
    setErrorGoogle("");
    setVista("formulario");
  }, []);

  // Si el usuario vuelve atrás desde Google, el navegador puede restaurar la página
  // con el botón bloqueado: se desbloquea.
  useEffect(() => {
    const alMostrar = (e: PageTransitionEvent) => {
      if (e.persisted) setGoogleLoading(false);
    };
    window.addEventListener("pageshow", alMostrar);
    return () => window.removeEventListener("pageshow", alMostrar);
  }, []);

  /**
   * Botón de Google (redirige a Google; al volver, /auth/callback hace el resto):
   *   login      → "Acceder con Google": verifica que exista el customer y entra a su módulo.
   *                Si no tiene cuenta, vuelve aquí en la vista "formulario".
   *   formulario → "Crear cuenta con Google": crea el customer y entra a su módulo.
   */
  const handleGoogle = async () => {
    setErrorGoogle("");
    setGoogleLoading(true);

    const { error } = esLogin ? await loginConGoogle() : await abrirGoogleParaCrearCuenta();

    // Sin error, el navegador ya se está yendo a Google.
    if (error) {
      setGoogleLoading(false);
      setErrorGoogle(error);
    }
  };

  return (
    <div className={style.modal}>
      {/* Encabezado: la X solo aparece en la vista de registro */}
      <div className={style.encabezado}>
        <h2 className={style.titulo}>{esLogin ? "Login" : "Formulario"}</h2>

        {!esLogin && (
          <button
            type="button"
            className={style.cerrar}
            onClick={irALogin}
            aria-label="Volver al login"
          >
            <icon.iconClose className={style.iconCerrar} />
          </button>
        )}
      </div>

      {/* Aviso: entró con Google pero no tiene cuenta creada */}
      {!esLogin && correoSinCuenta && (
        <p className={style.aviso} role="status">
          <strong>{correoSinCuenta}</strong> no tiene una cuenta creada en el sistema.
          Puedes crearla ahora con Google.
        </p>
      )}

      {/* Google */}
      <button
        type="button"
        className={style.boton}
        onClick={handleGoogle}
        disabled={googleLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "#fff",
          color: "#3c4043",
          border: "1px solid #dadce0",
        }}
      >
        <LogoGoogle />
        {googleLoading
          ? "Redirigiendo a Google..."
          : esLogin
            ? "Acceder con Google"
            : "Crear cuenta con Google"}
      </button>

      {errorGoogle && (
        <span className={style.textoError} role="alert">
          {errorGoogle}
        </span>
      )}

      {/* Login: separador + correo/contraseña. Formulario: solo Google. */}
      {esLogin ? (
        <>
          <div className={style.separador}>
            <span>o</span>
          </div>
          <ModalLogueo onCrearCuenta={irAFormulario} bloqueado={googleLoading} />
        </>
      ) : (
        <ModalFormulario onYaTengoCuenta={irALogin} />
      )}
    </div>
  );
};

export default Modal;