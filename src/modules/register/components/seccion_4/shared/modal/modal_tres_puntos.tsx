import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import style from "./modal_tres_puntos.module.css";

const ANCHO_MENU = 200;
const ALTO_MENU = 148; // 3 opciones + padding (para decidir si se abre hacia arriba)

/* ───────── Iconos ───────── */
const Icono = ({ children }: { children: ReactNode }) => (
  <svg
    className={style.icono}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconoVer = () => (
  <Icono>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icono>
);

const IconoEditar = () => (
  <Icono>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </Icono>
);

const IconoEliminar = () => (
  <Icono>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v5M14 11v5" />
  </Icono>
);

/* ───────── Menú de 3 opciones ───────── */
interface ModalTresPuntosProps {
  /** Posición del botón de los 3 puntos (getBoundingClientRect). */
  ancla: DOMRect;
  onVerInformacion: () => void;
  onEditar: () => void;
  onEliminar: () => void;
  onClose: () => void;
}

const ModalTresPuntos = ({
  ancla,
  onVerInformacion,
  onEditar,
  onEliminar,
  onClose,
}: ModalTresPuntosProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  // Alineado al borde derecho del botón; si no cabe abajo, se abre hacia arriba.
  const left = Math.max(8, Math.min(ancla.right - ANCHO_MENU, window.innerWidth - ANCHO_MENU - 8));
  const abajo = ancla.bottom + 6;
  const top = abajo + ALTO_MENU > window.innerHeight ? Math.max(8, ancla.top - ALTO_MENU - 6) : abajo;

  // Va en un portal porque la tabla recorta (overflow) todo lo que se sale de ella.
  return createPortal(
    <div className={style.capa} onClick={onClose}>
      <div
        className={style.menu}
        role="menu"
        style={{ top, left, width: ANCHO_MENU }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" role="menuitem" className={style.opcion} onClick={onVerInformacion}>
          <IconoVer />
          Ver información
        </button>
        <button type="button" role="menuitem" className={style.opcion} onClick={onEditar}>
          <IconoEditar />
          Editar
        </button>
        <button
          type="button"
          role="menuitem"
          className={`${style.opcion} ${style.opcionPeligro}`}
          onClick={onEliminar}
        >
          <IconoEliminar />
          Eliminar
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ModalTresPuntos;

/* ───────── Confirmación de eliminar (con cuenta regresiva) ───────── */
interface ConfirmarEliminarProps {
  /** Segundos que hay que esperar antes de poder pulsar "Sí". */
  segundos?: number;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ConfirmarEliminar = ({
  segundos = 5,
  onConfirmar,
  onCancelar,
}: ConfirmarEliminarProps) => {
  const [restante, setRestante] = useState(segundos);

  // Cuenta regresiva: baja 1 cada segundo hasta llegar a 0.
  useEffect(() => {
    if (restante <= 0) return;
    const t = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [restante]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancelar]);

  const habilitado = restante <= 0;

  return createPortal(
    <div className={style.overlay} onClick={onCancelar}>
      <div
        className={style.confirmacion}
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={style.confirmacionIcono}>
          <IconoEliminar />
        </div>
        <h3 className={style.confirmacionTitulo}>¿Estás seguro de eliminar este registro?</h3>
        <p className={style.confirmacionTexto}>Esta acción no se puede deshacer.</p>
        <div className={style.confirmacionBotones}>
          <button type="button" className={style.btnSecundario} onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className={style.btnPeligro}
            disabled={!habilitado}
            onClick={onConfirmar}
          >
            {habilitado ? "Sí, eliminar" : `Sí (${restante})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
