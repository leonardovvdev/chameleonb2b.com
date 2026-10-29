import style from "./modal.module.css";
import { Segmentado } from "./parte2";

/* ───────────── Tipos y valores iniciales (paso 3) ───────────── */
export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export type TipoFeriado = "none" | "fixed" | "flexible";

export interface FeriadoState {
  tipo: TipoFeriado;
  dias: number[]; // 0 = lunes ... 6 = domingo
  cantidad: number; // flexible: N° de feriados a la semana
}

export const FERIADO_INICIAL: FeriadoState = {
  tipo: "fixed",
  dias: [],
  cantidad: 1,
};

export const CLAVES_FERIADO = ["dias"];

/* ───────────── Validación del paso 3 ───────────── */
export const validarPaso3 = (feriado: FeriadoState): Record<string, string> => {
  const e: Record<string, string> = {};
  if (feriado.tipo === "fixed" && feriado.dias.length === 0)
    e.dias = "Selecciona al menos un día.";
  return e;
};

/* ───────────── Paso 3: Feriados ───────────── */
interface Parte3Props {
  uid: string;
  feriado: FeriadoState;
  errores: Record<string, string>;
  onFeriado: (cambios: Partial<FeriadoState>) => void;
}

const Parte3 = ({ uid, feriado, errores, onFeriado }: Parte3Props) => {
  const idPaso = (clave: string) => `${uid}-p-${clave}`;

  const alternarDia = (dia: number) => {
    onFeriado({
      dias: feriado.dias.includes(dia)
        ? feriado.dias.filter((d) => d !== dia)
        : [...feriado.dias, dia].sort((a, b) => a - b),
    });
  };

  return (
    <section className={`${style.columna} ${style.columnaUnica}`}>
      <h4 className={style.seccion}>Dias no laborables del trabajador</h4>

      <Segmentado<TipoFeriado>
        etiqueta="Tipo de feriado"
        valor={feriado.tipo}
        onChange={(v) => onFeriado({ tipo: v })}
        opciones={[
          { value: "fixed", label: "Fijo" },
          // { value: "flexible", label: "Flexible" },
          // { value: "none", label: "Todos los días trabaja" },
        ]}
      />

      {feriado.tipo === "fixed" && (
        <div className={style.campo}>
          <span className={style.etiqueta} id={idPaso("dias-label")}>
            Días fijos <span className={style.requerido}>*</span>
          </span>
          <div
            className={style.dias}
            role="group"
            aria-labelledby={idPaso("dias-label")}
            aria-describedby={errores.dias ? `${idPaso("dias")}-error` : undefined}
          >
            {DIAS_SEMANA.map((nombre, i) => (
              <button
                key={nombre}
                type="button"
                className={`${style.dia} ${feriado.dias.includes(i) ? style.diaActivo : ""}`}
                aria-pressed={feriado.dias.includes(i)}
                onClick={() => alternarDia(i)}
              >
                {nombre}
              </button>
            ))}
          </div>
          {errores.dias && (
            <span id={`${idPaso("dias")}-error`} className={style.errorCampo}>
              {errores.dias}
            </span>
          )}
          <p className={style.ayuda}>Puedes elegir uno o varios días.</p>
        </div>
      )}

      {feriado.tipo === "flexible" && (
        <div className={style.campo}>
          <span className={style.etiqueta} id={idPaso("cantidad-label")}>
            N° de feriados a la semana
          </span>
          <div className={style.contador} role="group" aria-labelledby={idPaso("cantidad-label")}>
            <button
              type="button"
              className={style.contadorBoton}
              onClick={() => onFeriado({ cantidad: Math.max(1, feriado.cantidad - 1) })}
              disabled={feriado.cantidad <= 1}
              aria-label="Disminuir"
            >
              −
            </button>
            <output className={style.contadorValor} aria-live="polite">
              {feriado.cantidad}
            </output>
            <button
              type="button"
              className={style.contadorBoton}
              onClick={() => onFeriado({ cantidad: Math.min(6, feriado.cantidad + 1) })}
              disabled={feriado.cantidad >= 6}
              aria-label="Aumentar"
            >
              +
            </button>
          </div>
          <p className={style.ayuda}>El día exacto se decide cada semana.</p>
        </div>
      )}

      {feriado.tipo === "none" && (
        <p className={style.ayuda}>El trabajador no tendrá dias no laborables.</p>
      )}
    </section>
  );
};

export default Parte3;