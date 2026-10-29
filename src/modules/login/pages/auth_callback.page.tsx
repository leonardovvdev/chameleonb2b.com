import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/contexts/auth.context";
import { procesarRetornoGoogle } from "../controllers/login.controller";
import style from "./auth_callback.page.module.css";

/** Marco común: fondo de selva + tarjeta blanca centrada (igual que el login). */
const Pantalla = ({ children }: { children: ReactNode }) => (
  <div className={style.pantalla}>
    <img className={style.fondo} src="./fondoselva.jpg" alt="" />
    {children}
  </div>
);

const IconoAlerta = () => (
  <svg className={style.iconoSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshCustomer } = useAuth();

  const [error, setError] = useState("");
  const ejecutado = useRef(false);

  useEffect(() => {
    // Evita la doble ejecución de React.StrictMode en desarrollo.
    if (ejecutado.current) return;
    ejecutado.current = true;

    procesarRetornoGoogle(refreshCustomer).then((resultado) => {
      if (resultado.ok) {
        navigate(resultado.destino, { replace: true });
      } else if (resultado.requiereRegistro) {
        // Sin cuenta: vuelve al login, directo a la vista "formulario" y con el aviso.
        navigate("/login", {
          replace: true,
          state: { vista: "formulario", correoSinCuenta: resultado.correo },
        });
      } else {
        setError(resultado.error);
      }
    });
  }, [navigate, refreshCustomer]);

  // ── Error ──
  if (error) {
    return (
      <Pantalla>
        <div className={style.tarjeta} role="alert">
          <div className={`${style.iconoCirculo} ${style.iconoCirculoError}`}>
            <IconoAlerta />
          </div>
          <h2 className={style.titulo}>No se pudo continuar</h2>
          <p className={style.texto}>{error}</p>

          <div className={style.acciones}>
            <button type="button" className={style.boton}
                    onClick={() => navigate("/login", { replace: true })}>
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </Pantalla>
    );
  }

  // ── Verificando ──
  return (
    <Pantalla>
      <div className={style.tarjeta} aria-live="polite" role="status">
        <div className={style.spinner} aria-hidden="true" />
        <h2 className={style.titulo} style={{ marginTop: 16 }}>Verificando tu cuenta</h2>
        <p className={style.texto}>Esto tomará solo un momento...</p>
      </div>
    </Pantalla>
  );
};

export default AuthCallback;