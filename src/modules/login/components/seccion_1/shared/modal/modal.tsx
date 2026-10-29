import { useCallback, useState } from "react";
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

  /**
   * Botón de Google. Según la vista:
   *   login      → loginConGoogle()              ("Acceder con Google")
   *   formulario → abrirGoogleParaCrearCuenta()  ("Crear cuenta con Google")
   * En ambos casos el resto ocurre al volver, en /auth/callback.
   */
  const handleGoogle = async () => {
    setErrorGoogle("");
    setGoogleLoading(true);

    const { error } = esLogin ? await loginConGoogle() : await abrirGoogleParaCrearCuenta();

    // Si no hay error el navegador se redirige a Google,
    // por eso solo se desbloquea el botón cuando algo falla.
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

      {/* Google: el texto cambia según la vista */}
      <button
        type="button"
        className={style.botonGoogle}
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        <icon.iconGoogle className={style.icon} />
        {googleLoading
          ? "Redirigiendo..."
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