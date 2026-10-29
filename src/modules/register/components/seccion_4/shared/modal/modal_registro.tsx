import { useEffect, useState } from "react";
import type { ActualizarFila, StaffAttendance } from "../../../../types/register.types";
import { useDetalleRegistro } from "../../../../controllers/register.controller";
import ModalInformation from "./modal_information";
import ModalEditar from "./modal_editar";
import ModalIncidents from "./modal_incidents";
import ModalAdvancements from "./modal_advancements";
import ModalObservation from "./modal_observation";
import ModalJustifications from "./modal_justifications";
import style from "./modal_registro.module.css";

export type PestanaRegistro =
  | "informacion"
  | "editar"
  | "incidencias"
  | "adelantos"
  | "observacion"
  | "justificacion";

const PESTANAS: { id: PestanaRegistro; etiqueta: string }[] = [
  { id: "informacion", etiqueta: "Información" },
  { id: "editar", etiqueta: "Editar" },
  { id: "incidencias", etiqueta: "Incidencias" },
  { id: "adelantos", etiqueta: "Adelantos" },
  { id: "observacion", etiqueta: "Observación" },
  { id: "justificacion", etiqueta: "Justificación" },
];

/** "2026-10-26" → "26/10/2026" (si no tiene ese formato se deja igual). */
const formatFecha = (fecha: string): string => {
  const m = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : fecha;
};

interface ModalRegistroProps {
  registro: StaffAttendance;
  /** Pestaña con la que se abre el modal. */
  pestanaInicial?: PestanaRegistro;
  onClose: () => void;
  /** Refleja en la tabla un cambio ya guardado (horas, justificaciones). */
  onFilaActualizada: ActualizarFila;
}

const ModalRegistro = ({
  registro,
  pestanaInicial = "informacion",
  onClose,
  onFilaActualizada,
}: ModalRegistroProps) => {
  const [pestana, setPestana] = useState<PestanaRegistro>(pestanaInicial);
  // Una sola consulta de detalle para Información y Observación.
  const detalle = useDetalleRegistro(registro.att_id);

  // Cierra con la tecla ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={style.overlay} onClick={onClose}>
      <div
        className={style.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del registro"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={style.encabezado}>
          <div className={style.encabezadoTexto}>
            <h3 className={style.titulo}>
              {registro.stff_name} {registro.stff_lastname}
            </h3>
            <p className={style.subtitulo}>
              Registro N° {registro.att_id} · {formatFecha(registro.att_fecha)}
            </p>
          </div>
          <button
            type="button"
            className={style.cerrar}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className={style.pestanas} role="tablist">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pestana === p.id}
              className={`${style.pestana} ${pestana === p.id ? style.pestanaActiva : ""}`}
              onClick={() => setPestana(p.id)}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>

        {/* Todas las pestañas quedan montadas (solo se ocultan) para no perder lo que se escribió. */}
        <div className={style.cuerpo}>
          <div role="tabpanel" hidden={pestana !== "informacion"}>
            <ModalInformation
              registro={registro}
              detalle={detalle.detalle}
              cargando={detalle.cargando}
              error={detalle.error}
            />
          </div>
          <div role="tabpanel" hidden={pestana !== "editar"}>
            <ModalEditar
              registro={registro}
              onCancelar={onClose}
              onGuardado={(parche) => {
                onFilaActualizada(registro.att_id, parche);
                onClose();
              }}
            />
          </div>
          <div role="tabpanel" hidden={pestana !== "incidencias"}>
            <ModalIncidents registro={registro} />
          </div>
          <div role="tabpanel" hidden={pestana !== "adelantos"}>
            <ModalAdvancements registro={registro} />
          </div>
          <div role="tabpanel" hidden={pestana !== "observacion"}>
            <ModalObservation
              registro={registro}
              detalle={detalle.detalle}
              cargando={detalle.cargando}
              error={detalle.error}
              onGuardada={(observacion) => detalle.actualizarLocal({ att_observation: observacion })}
            />
          </div>
          <div role="tabpanel" hidden={pestana !== "justificacion"}>
            <ModalJustifications
              registro={registro}
              onGuardada={(parche) => onFilaActualizada(registro.att_id, parche)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistro;