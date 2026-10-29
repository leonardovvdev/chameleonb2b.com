import { useState } from "react";
import type { StaffAttendance, TipoJustificacionApi } from "../../../../types/register.types";
import { updateAttendanceJustification } from "../../../../services/register.service";
import style from "./modal_justifications.module.css";

type Clave = "tardanza" | "demora" | "ausencia";

const MAX_JUSTIFICACION = 200; // = VARCHAR(200) en la BD (el backend también lo valida)

const TIPOS: {
  clave: Clave;
  titulo: string;
  descripcion: string;
  tipoApi: TipoJustificacionApi;
  campo: "att_justification_delay" | "att_justification_refreshment_delay" | "att_justification_absence";
}[] = [
  {
    clave: "tardanza",
    titulo: "Tardanza",
    descripcion: "Llegó después de su hora de ingreso.",
    tipoApi: "delay",
    campo: "att_justification_delay",
  },
  {
    clave: "demora",
    titulo: "Demora en refrigerio",
    descripcion: "Volvió tarde de su receso.",
    tipoApi: "refreshment_delay",
    campo: "att_justification_refreshment_delay",
  },
  {
    clave: "ausencia",
    titulo: "Ausencia",
    descripcion: "No asistió a trabajar.",
    tipoApi: "absence",
    campo: "att_justification_absence",
  },
];

/** Una justificación: se puede añadir, editar y eliminar (igual que la observación). */
const BloqueJustificacion = ({
  titulo,
  descripcion,
  inicial,
  onGuardar,
}: {
  titulo: string;
  descripcion: string;
  inicial: string;
  /** Guarda en el backend (texto vacío o null = borrar). Lanza error si falla. */
  onGuardar: (texto: string | null) => Promise<void>;
}) => {
  const [guardada, setGuardada] = useState(inicial);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const hayTexto = guardada !== "";
  const mostrarFormulario = !hayTexto || editando;

  /** Envía el texto (o null para borrar) y recién después actualiza lo que se ve. */
  const enviar = async (texto: string | null) => {
    setGuardando(true);
    setError("");
    try {
      await onGuardar(texto);
      setGuardada(texto ?? "");
      setEditando(false);
      setBorrador("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la justificación.");
    } finally {
      setGuardando(false);
    }
  };

  const cancelar = () => {
    setEditando(false);
    setBorrador("");
    setError("");
  };

  return (
    <section className={style.bloque}>
      <div className={style.bloqueCabecera}>
        <div>
          <h4 className={style.titulo}>{titulo}</h4>
          <p className={style.ayuda}>{descripcion}</p>
        </div>
        <span className={`${style.estado} ${hayTexto ? style.estadoOk : ""}`}>
          {hayTexto ? "Justificada" : "Sin justificación"}
        </span>
      </div>

      {mostrarFormulario ? (
        <>
          <textarea
            className={style.textarea}
            placeholder={`Escribe la justificación de ${titulo.toLowerCase()}…`}
            value={borrador}
            maxLength={MAX_JUSTIFICACION}
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
              {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Añadir justificación"}
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
            <button
              type="button"
              className={style.btnPrimario}
              disabled={guardando}
              onClick={() => {
                setBorrador(guardada);
                setError("");
                setEditando(true);
              }}
            >
              Editar
            </button>
          </div>
        </>
      )}

      {error && (
        <p role="alert" style={{ margin: "8px 0 0", color: "#b42318", fontSize: 13 }}>
          {error}
        </p>
      )}
    </section>
  );
};

interface ModalJustificationsProps {
  registro: StaffAttendance;
  /** Se llama con el campo ya guardado, para reflejarlo en la tabla (columna Incidencias). */
  onGuardada: (parche: Partial<StaffAttendance>) => void;
}

const ModalJustifications = ({ registro, onGuardada }: ModalJustificationsProps) => (
  <div className={style.contenedor}>
    {TIPOS.map((t) => (
      <BloqueJustificacion
        key={t.clave}
        titulo={t.titulo}
        descripcion={t.descripcion}
        inicial={registro[t.campo] ?? ""}
        onGuardar={async (texto) => {
          const resultado = await updateAttendanceJustification(registro.att_id, t.tipoApi, texto);
          onGuardada({ [t.campo]: resultado.text });
        }}
      />
    ))}
  </div>
);

export default ModalJustifications;