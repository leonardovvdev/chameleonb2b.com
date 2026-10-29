import { useEffect, useRef, useState } from "react";
import style from "./modal.module.css";

/* ───────────── Menú de acciones (⋮) ───────────── */
export interface OpcionMenu {
  label: string;
  onClick: () => void;
  peligro?: boolean;
}

interface ModalProps {
  opciones: OpcionMenu[];
  onClose?: () => void;
}

const Modal = ({ opciones, onClose }: ModalProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // Cierra al hacer clic fuera. Se ignora lo que ocurra dentro de la celda de
  // acciones para no chocar con el botón ⋮ (que ya alterna el menú).
  useEffect(() => {
    if (!onClose) return;
    const cerrarAlClicFuera = (e: MouseEvent) => {
      const celda = ref.current?.parentElement;
      if (celda && celda.contains(e.target as Node)) return;
      onClose();
    };
    const cerrarConEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();

    document.addEventListener("mousedown", cerrarAlClicFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarAlClicFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [onClose]);

  return (
    <div ref={ref} className={style.menu} role="menu">
      {opciones.map((opcion) => (
        <button
          key={opcion.label}
          type="button"
          role="menuitem"
          className={`${style.opcion} ${opcion.peligro ? style.opcionPeligro : ""}`}
          onClick={opcion.onClick}
        >
          {opcion.label}
        </button>
      ))}
    </div>
  );
};

export default Modal;

/* ───────────── Confirmar "Terminar contrato" ─────────────
 * El botón de confirmar queda bloqueado SEGUNDOS_ESPERA segundos con cuenta
 * regresiva, para evitar un clic por accidente. */
const SEGUNDOS_ESPERA = 4;

interface ConfirmarProps {
  nombreCompleto: string;
  procesando: boolean;
  /** Mensaje del backend (por ejemplo, si no tiene permiso). */
  error: string | null;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ConfirmarTerminarContrato = ({
  nombreCompleto,
  procesando,
  error,
  onConfirmar,
  onCancelar,
}: ConfirmarProps) => {
  const [segundos, setSegundos] = useState(SEGUNDOS_ESPERA);

  useEffect(() => {
    if (segundos <= 0) return;
    const id = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [segundos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !procesando && onCancelar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [procesando, onCancelar]);

  const bloqueado = segundos > 0 || procesando;

  return (
    <div
      className={style.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !procesando) onCancelar();
      }}
    >
      <div className={style.confirmar} role="alertdialog" aria-modal="true" aria-labelledby="terminar-titulo">
        <h3 id="terminar-titulo" className={style.confirmarTitulo}>
          ¿Terminar contrato?
        </h3>
        <p className={style.confirmarTexto}>
          Estás por terminar el contrato de <strong>{nombreCompleto}</strong>. El personal pasará a
          estado <strong>Inactivo</strong>. ¿Estás seguro?
        </p>

        {error && (
          <p className={style.confirmarError} role="alert">
            {error}
          </p>
        )}

        <div className={style.confirmarAcciones}>
          <button type="button" className={style.botonCancelar} onClick={onCancelar} disabled={procesando}>
            Cancelar
          </button>
          <button type="button" className={style.botonPeligro} onClick={onConfirmar} disabled={bloqueado}>
            {procesando
              ? "Terminando..."
              : segundos > 0
                ? `Terminar contrato (${segundos})`
                : "Terminar contrato"}
          </button>
        </div>
      </div>
    </div>
  );
};
