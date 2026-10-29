import style from "./modal.module.css";

/* ───────────── Paso 4: Honorarios ───────────── */
export type TipoPago = "monthly" | "weekly" | "daily";
export type UnidadDescuento = "minute" | "hour" | "fixed";

export interface MontosDescuento {
  falta: string;
  tardanza: string;
  demora: string;
}

export interface DescuentoPersonalizado extends MontosDescuento {
  unidadTardanza: UnidadDescuento;
  unidadDemora: UnidadDescuento;
}

export interface HonorariosState {
  tipoPago: TipoPago;
  sueldo: string;
  generalActivo: boolean;
  personalizadoActivo: boolean;
  general: MontosDescuento;
  personalizado: DescuentoPersonalizado;
}

export const HONORARIOS_INICIAL: HonorariosState = {
  tipoPago: "monthly",
  sueldo: "",
  generalActivo: false,
  personalizadoActivo: true,
  // Valores del sistema (no editables)
  general: { falta: "50", tardanza: "5", demora: "5" },
  personalizado: {
    falta: "0",
    tardanza: "0",
    demora: "0",
    unidadTardanza: "fixed",
    unidadDemora: "fixed",
  },
};

const TIPOS_PAGO: { value: TipoPago; label: string; sueldo: string }[] = [
  { value: "monthly", label: "Mensual", sueldo: "Sueldo mensual" },
];

// Solo números y un punto decimal
const soloMonto = (valor: string) => valor.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");

/* ───────────── Validación del paso 4 (el sueldo es obligatorio) ───────────── */
export const validarPaso4 = (h: HonorariosState): Record<string, string> => {
  const errores: Record<string, string> = {};
  if (h.sueldo.trim() === "") {
    errores.sueldo = "Ingresa el sueldo.";
  } else if (!(Number(h.sueldo) > 0)) {
    errores.sueldo = "Ingresa un monto válido.";
  }
  return errores;
};

/* ───────────── Paso 4 ───────────── */
interface Parte4Props {
  uid: string;
  honorarios: HonorariosState;
  errores: Record<string, string>;
  onHonorarios: (cambios: Partial<HonorariosState>) => void;
}

const Parte4 = ({ uid, honorarios, errores, onHonorarios }: Parte4Props) => {
  const etiquetaSueldo = TIPOS_PAGO.find((t) => t.value === honorarios.tipoPago)?.sueldo ?? "Sueldo";

  return (
    <div className={style.columnas}>
      <div className={style.columna}>
        <h4 className={style.seccion}>Honorarios</h4>

        <div className={style.campo}>
          <span className={style.etiqueta}>Frecuencia de pago</span>
          <div className={style.segmentado} role="group" aria-label="Frecuencia de Pago">
            {TIPOS_PAGO.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`${style.segmento} ${
                  honorarios.tipoPago === t.value ? style.segmentoActivo : ""
                }`}
                onClick={() => onHonorarios({ tipoPago: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`${style.columna} ${style.columnaDerecha}`}>
        <div className={style.campo}>
          <label className={style.etiqueta} htmlFor={`${uid}-sueldo`}>
            {etiquetaSueldo} <span className={style.requerido}>*</span>
          </label>
          <div className={style.inputConIcono}>
            <span className={`${style.iconoInputIzquierdo} ${style.simboloMoneda}`} aria-hidden="true">
              S/
            </span>
            <input
              id={`${uid}-sueldo`}
              className={`${style.input} ${style.inputMoneda}`}
              type="text"
              inputMode="decimal"
              placeholder="1130"
              value={honorarios.sueldo}
              aria-invalid={!!errores.sueldo}
              onChange={(e) => onHonorarios({ sueldo: soloMonto(e.target.value) })}
            />
          </div>
          {errores.sueldo && (
            <p className={style.errorCampo} role="alert">
              {errores.sueldo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Parte4;