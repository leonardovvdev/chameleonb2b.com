import { useState } from "react";
import type { RegistroDetalle, StaffAttendance } from "../../../../types/register.types";
import { updateAttendanceObservation } from "../../../../services/register.service";
import style from "./modal_observation.module.css";

interface ModalObservationProps {
  registro: StaffAttendance;
  /** null mientras carga (o si falló). */
  detalle: RegistroDetalle | null;
  cargando: boolean;
  error: string;
  /** Se llama con la observación ya guardada (null = borrada). */
  onGuardada: (observacion: string | null) => void;
}

const ModalObservation = ({ registro, detalle, cargando, error, onGuardada }: ModalObservationProps) => {
  const guardada = detalle?.att_observation ?? "";
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");

  const hayObservacion = guardada !== "";
  const mostrarFormulario = !hayObservacion || editando;

  const empezarEdicion = () => {
    setBorrador(guardada);
    setErrorGuardar("");
    setEditando(true);
  };

  const cancelar = () => {
    setEditando(false);
    setBorrador("");
    setErrorGuardar("");
  };

  /** Guarda el texto (o lo borra con null) en el backend. */
  const enviar = async (texto: string | null) => {
    setGuardando(true);
    setErrorGuardar("");
    try {
      const resultado = await updateAttendanceObservation(registro.att_id, texto);
      onGuardada(resultado.att_observation);
      setEditando(false);
      setBorrador("");
    } catch (e) {
      setErrorGuardar(e instanceof Error ? e.message : "No se pudo guardar la observación.");
    } finally {
      setGuardando(false);
    }
  };

  // Sin el detalle no se sabe si ya hay observación: se espera (o se muestra el error).
  if (!detalle) {
    return (
      <div className={style.contenedor}>
        <p
          className={style.ayuda}
          role={error ? "alert" : undefined}
          style={error ? { color: "#b42318" } : undefined}
        >
          {cargando ? "Cargando observación…" : error || "No se pudo cargar la observación."}
        </p>
      </div>
    );
  }

  return (
    <div className={style.contenedor}>
      <p className={style.ayuda}>
        {hayObservacion
          ? "Observación registrada para esta asistencia."
          : "Este registro aún no tiene observación."}
      </p>

      {mostrarFormulario ? (
        <>
          <textarea
            className={style.textarea}
            placeholder="Escribe una observación…"
            maxLength={500}
            value={borrador}
            disabled={guardando}
            onChange={(e) => setBorrador(e.target.value)}
          />
          <div className={style.botones}>
            {editando && (
              <button type="button" className={style.btnSecundario} disabled={guardando} onClick={cancelar}>
                Cancelar
              </button>
            )}
            <button
              type="button"
              className={style.btnPrimario}
              disabled={borrador.trim() === "" || guardando}
              onClick={() => void enviar(borrador.trim())}
            >
              {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Añadir observación"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={style.tarjeta}>
            <p className={style.texto}>{guardada}</p>
          </div>
          <div className={style.botones}>
            <button
              type="button"
              className={style.btnPeligro}
              disabled={guardando}
              onClick={() => void enviar(null)}
            >
              {guardando ? "Eliminando…" : "Eliminar"}
            </button>
            <button type="button" className={style.btnPrimario} disabled={guardando} onClick={empezarEdicion}>
              Editar
            </button>
          </div>
        </>
      )}

      {errorGuardar && (
        <p role="alert" style={{ margin: "8px 0 0", color: "#b42318", fontSize: 13 }}>
          {errorGuardar}
        </p>
      )}
    </div>
  );
};

export default ModalObservation;