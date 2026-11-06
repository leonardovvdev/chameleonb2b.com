import { useState } from "react";
import type { StaffAttendance, TiemposRegistro } from "../../../../types/register.types";
import { aMinutos } from "../../../../controllers/register.controller";
import { updateAttendanceTimes } from "../../../../services/register.service";
import style from "./modal_editar.module.css";

type Horas = {
  inicioJornada: string;
  inicioReceso: string;
  finReceso: string;
  finJornada: string;
};

/** Timestamp ISO → "HH:MM" en hora local (formato de <input type="time">). */
const aInput = (valor: string | null): string => {
  const min = aMinutos(valor);
  if (min === null) return "";
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
};

const CAMPOS: { clave: keyof Horas; etiqueta: string }[] = [
  { clave: "inicioJornada", etiqueta: "Inicio de jornada" },
  { clave: "inicioReceso", etiqueta: "Inicio de receso" },
  { clave: "finReceso", etiqueta: "Fin de receso" },
  { clave: "finJornada", etiqueta: "Fin de jornada" },
];

interface ModalEditarProps {
  registro: StaffAttendance;
  onCancelar: () => void;
  /** Se llama con las horas ya guardadas en el backend. */
  onGuardado: (horas: TiemposRegistro) => void;
}

/** "HH:MM" del día del registro (hora local) → ISO 8601, o null si está vacío. */
const aIso = (fecha: string, hhmm: string): string | null =>
  hhmm === "" ? null : new Date(`${fecha}T${hhmm}:00`).toISOString();

/** Mismas reglas que el backend: las horas llenas deben ir en orden. */
const validar = (h: Horas): string => {
  if (h.inicioJornada === "" && (h.inicioReceso !== "" || h.finReceso !== "" || h.finJornada !== "")) {
    return "Indica el inicio de jornada antes de las demás horas.";
  }
  if (h.finReceso !== "" && h.inicioReceso === "") return "Indica el inicio del receso antes de su fin.";
  const llenas = [h.inicioJornada, h.inicioReceso, h.finReceso, h.finJornada].filter((v) => v !== "");
  if (llenas.some((v, i) => i > 0 && v < llenas[i - 1])) {
    return "Las horas deben ir en orden: ingreso, inicio de receso, fin de receso y salida.";
  }
  return "";
};

const ModalEditar = ({ registro, onCancelar, onGuardado }: ModalEditarProps) => {
  const original: Horas = {
    inicioJornada: aInput(registro.att_schedule_start),
    inicioReceso: aInput(registro.att_refreshment_start),
    finReceso: aInput(registro.att_refreshment_end),
    finJornada: aInput(registro.att_schedule_end),
  };
  const [horas, setHoras] = useState<Horas>(original);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const huboCambios = CAMPOS.some((c) => horas[c.clave] !== original[c.clave]);

  const guardar = async () => {
    const problema = validar(horas);
    if (problema) {
      setError(problema);
      return;
    }

    setGuardando(true);
    setError("");
    try {
      const guardado = await updateAttendanceTimes(registro.att_id, {
        inicioJornada: aIso(registro.att_date, horas.inicioJornada),
        inicioReceso: aIso(registro.att_date, horas.inicioReceso),
        finReceso: aIso(registro.att_date, horas.finReceso),
        finJornada: aIso(registro.att_date, horas.finJornada),
      });
      onGuardado({
        att_schedule_start: guardado.att_schedule_start,
        att_refreshment_start: guardado.att_refreshment_start,
        att_refreshment_end: guardado.att_refreshment_end,
        att_schedule_end: guardado.att_schedule_end,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar las horas.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={style.contenedor}>
      <p className={style.ayuda}>Modifica las 4 horas del registro de asistencia.</p>

      <div className={style.grilla}>
        {CAMPOS.map((c) => (
          <label key={c.clave} className={style.campo}>
            <span className={style.etiqueta}>{c.etiqueta}</span>
            <input
              type="time"
              className={style.input}
              value={horas[c.clave]}
              disabled={guardando}
              onChange={(e) => {
                setHoras({ ...horas, [c.clave]: e.target.value });
                setError("");
              }}
            />
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" style={{ margin: "0 0 8px", color: "#b42318", fontSize: 13 }}>
          {error}
        </p>
      )}

      <div className={style.botones}>
        <button
          type="button"
          className={style.btnSecundario}
          disabled={guardando}
          onClick={() => {
            setHoras(original);
            setError("");
          }}
        >
          Restablecer
        </button>
        <button type="button" className={style.btnSecundario} disabled={guardando} onClick={onCancelar}>
          Cancelar
        </button>
        <button
          type="button"
          className={style.btnPrimario}
          disabled={guardando || !huboCambios}
          onClick={() => void guardar()}
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
};

export default ModalEditar;