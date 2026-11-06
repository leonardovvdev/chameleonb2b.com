import type { CSSProperties } from "react";
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
  descuentaAusencia: boolean; // si no viene a trabajar
  descuentaTardanza: boolean; // si viene tarde
  descuentaDemora: boolean; // si se demora en su refrigerio
}

export const HONORARIOS_INICIAL: HonorariosState = {
  tipoPago: "monthly",
  sueldo: "",
  generalActivo: false,
  personalizadoActivo: true,
  descuentaAusencia: true, // igual que el DEFAULT TRUE de staff_contracts
  descuentaTardanza: true,
  descuentaDemora: true,
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
const DESCUENTOS: {
  campo: "descuentaAusencia" | "descuentaTardanza" | "descuentaDemora";
  label: string;
  ayuda: string;
}[] = [
  { campo: "descuentaAusencia", label: "Ausencia", ayuda: "si no viene a trabajar" },
  { campo: "descuentaTardanza", label: "Tardanza", ayuda: "si viene tarde" },
  { campo: "descuentaDemora", label: "Demora", ayuda: "si se demora en su refrigerio" },
];

// Estilos en línea para no tocar el css
const FILA_CHECKS: CSSProperties = { display: "flex", flexWrap: "wrap", gap: "12px 28px", marginTop: 8 };

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
    <div>
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

      {/* ── Fila: Descuentos ── */}
      <section style={{ marginTop: 24 }}>
        <h4 className={style.seccion}>Descuentos</h4>

        <div style={FILA_CHECKS}>
          {DESCUENTOS.map((d) => (
            <label key={d.campo} className={style.checkAcceso}>
              <input
                type="checkbox"
                className={style.checkbox}
                checked={honorarios[d.campo]}
                onChange={(e) =>
                  onHonorarios({ [d.campo]: e.target.checked } as Partial<HonorariosState>)
                }
              />
              {d.label} <span style={{ opacity: 0.65 }}>({d.ayuda})</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Parte4;