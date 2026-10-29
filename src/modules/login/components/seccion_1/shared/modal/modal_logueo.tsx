import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import style from "./modal.module.css";
import { icon } from "../../../../../../core/icons";
import { useAuth } from "../../../../../../core/contexts/auth.context"; // para obtener el id del customer
import {
  loginConCorreoContrasena,
  validarCredenciales,
} from "../../../../controllers/login.controller";
interface ModalLogueoProps {
  /** Cambia a la vista de registro. */
  onCrearCuenta: () => void;
  /** true mientras el padre está redirigiendo a Google. */
  bloqueado?: boolean;
}

/**
 * Formulario de inicio de sesión con correo y contraseña.
 * (El título y el botón de Google los pone el componente Modal.)
 */
const ModalLogueo = ({ onCrearCuenta, bloqueado = false }: ModalLogueoProps) => {
  const navigate = useNavigate();
  const { refreshCustomer } = useAuth();

  // Lo que escribe el usuario
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);

  // Estado de la pantalla
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ocupado = loading || bloqueado;

  /** Crea un onChange que guarda el valor escrito y borra el error anterior. */
  const escribir =
    (guardar: (valor: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
      guardar(e.target.value);
      setError("");
    };

  /** Botón "Entrar": valida los datos y, si son correctos, inicia sesión. */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Validación local (campos vacíos, formato de correo, etc.)
    const errorValidacion = validarCredenciales(correo, password);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    // 2. Intento de inicio de sesión
    setError("");
    setLoading(true);
    const resultado = await loginConCorreoContrasena(correo, password, refreshCustomer);
    setLoading(false);

    // 3. Si funcionó, navega; si no, muestra el error
    if (resultado.ok) navigate(resultado.destino, { replace: true });
    else setError(resultado.error);
  };

  return (
    <form className={style.formulario} onSubmit={handleLogin} noValidate>
      {/* Correo */}
      <label htmlFor="login-correo" className={style.label}>
        Correo Electrónico
      </label>
      <input
        id="login-correo"
        type="email"
        className={style.input}
        value={correo}
        autoComplete="email"
        onChange={escribir(setCorreo)}
      />

      {/* Contraseña con botón para mostrar/ocultar */}
      <label htmlFor="login-password" className={style.label}>
        Contraseña
      </label>
      <div className={style.campoPassword}>
        <input
          id="login-password"
          type={verPassword ? "text" : "password"}
          className={`${style.input} ${style.inputPassword}`}
          value={password}
          autoComplete="current-password"
          onChange={escribir(setPassword)}
        />

        <button
          type="button"
          className={style.togglePassword}
          onClick={() => setVerPassword(!verPassword)}
          aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {verPassword ? (
            <icon.iconEyeOff className={style.icon} />
          ) : (
            <icon.iconEye className={style.icon} />
          )}
        </button>
      </div>

      {/* Error de validación o de inicio de sesión */}
      {error && (
        <span className={style.textoError} role="alert">
          {error}
        </span>
      )}

      <button type="button" className={style.enlace} onClick={onCrearCuenta}>
        ¿crear cuenta?
      </button>

      <button type="submit" className={style.boton} disabled={ocupado}>
        {loading ? "Ingresando..." : "Entrar"}
      </button>
    </form>
  );
};

export default ModalLogueo;