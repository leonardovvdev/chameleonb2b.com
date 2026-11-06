import { useEffect, useState } from "react";
import style from "./modal_contrato.module.css";
import { callBackend } from "../../../../../core/services/backend";
import type { StaffListItem } from "../../../../../core/types";

/* ───────────────────────── API (contrato actual) ───────────────────────── */

export interface ContratoActual {
  id: number;
  status: "activo" | "inactivo";
  start_date: string | null;
  end_date: string | null;
  salary_amount: number;
  payroll: boolean;
  afp_discount: number;
  insurance_premium: number;
  discount_absence: boolean;
  discount_delay: boolean;
  discount_refreshment_delay: boolean;
  schedule: {
    type: "fixed" | "flexible" | "free";
    start: string | null;
    end: string | null;
    toleranceMinutes: number;
    requiredMinutes: number | null;
  } | null;
  refreshment: {
    type: "fixed" | "flexible" | "free";
    start: string | null;
    end: string | null;
    minutes: number | null;
  } | null;
  nonWorkingDays:
    | { type: "fixed"; days: boolean[] }
    | { type: "flexible"; numberDays: number }
    | null;
}

/** GET /staff-contracts/current?stffId= → contrato más reciente del personal. */
export const getContratoActual = (stffId: number): Promise<ContratoActual> =>
  callBackend<ContratoActual>("staff-contracts/current", { query: { stffId } });

/** PATCH /staff-contracts */
const guardarContrato = (body: Record<string, unknown>) =>
  callBackend<unknown>("staff-contracts", { method: "PATCH", body });

/* ───────────────────────── Formulario ───────────────────────── */

interface FormContrato {
  inicioAuto: boolean; // true = sin fecha: se fija con su primer registro de asistencia
  fechaInicio: string;
  finIndefinido: boolean; // true = sin fecha de fin
  fechaFin: string;
  sueldo: string;
  planilla: boolean;
  afp: string;
  prima: string;
  descuentaAusencia: boolean;
  descuentaTardanza: boolean;
  descuentaDemora: boolean;
}

type Errores = Partial<Record<"fechaInicio" | "fechaFin" | "sueldo" | "afp" | "prima", string>>;

const aForm = (c: ContratoActual): FormContrato => ({
  inicioAuto: !c.start_date,
  fechaInicio: c.start_date ?? "",
  finIndefinido: !c.end_date,
  fechaFin: c.end_date ?? "",
  sueldo: String(c.salary_amount),
  planilla: c.payroll,
  afp: String(c.afp_discount),
  prima: String(c.insurance_premium),
  descuentaAusencia: c.discount_absence,
  descuentaTardanza: c.discount_delay,
  descuentaDemora: c.discount_refreshment_delay,
});

/** Solo dígitos y un punto, máximo 2 decimales (ej. "1.37"). */
const decimal = (valor: string) => {
  const limpio = valor.replace(",", ".").replace(/[^\d.]/g, "");
  const [entero, ...resto] = limpio.split(".");
  return resto.length ? `${entero}.${resto.join("").slice(0, 2)}` : entero;
};

const fuera = (v: string, max: number) => v === "" || !Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > max;

interface Props {
  staff: StaffListItem;
  onClose: () => void;
}

const ModalContrato = ({ staff, onClose }: Props) => {
  const [contrato, setContrato] = useState<ContratoActual | null>(null);
  const [form, setForm] = useState<FormContrato | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const nombreCompleto = `${staff.stff_name} ${staff.stff_lastname}`;

  useEffect(() => {
    let activo = true;
    getContratoActual(staff.stff_id)
      .then((c) => {
        if (!activo) return;
        setContrato(c);
        setForm(aForm(c));
      })
      .catch((err) => {
        console.error("Error al cargar el contrato:", err);
        if (activo) setErrorGeneral(err instanceof Error ? err.message : "No se pudo cargar el contrato.");
      })
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [staff.stff_id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !guardando && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guardando, onClose]);

  const cambiar = <K extends keyof FormContrato>(campo: K, valor: FormContrato[K]) => {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setErrores({});
    setExito(null);
  };

  // Un contrato terminado conserva siempre su fecha de fin.
  const terminado = contrato?.status === "inactivo";

  const validar = (f: FormContrato): Errores => {
    const e: Errores = {};
    if (!f.inicioAuto && !f.fechaInicio) e.fechaInicio = "Indica la fecha de inicio.";
    if ((!f.finIndefinido || terminado) && !f.fechaFin) e.fechaFin = "Indica la fecha de fin.";
    if (!f.inicioAuto && f.fechaInicio && !f.finIndefinido && f.fechaFin && f.fechaFin < f.fechaInicio) {
      e.fechaFin = "La fecha de fin no puede ser anterior a la de inicio.";
    }
    if (!(Number(f.sueldo) > 0)) e.sueldo = "Ingresa un sueldo mayor a 0.";
    if (fuera(f.afp, 100)) e.afp = "Debe estar entre 0 y 100.";
    if (fuera(f.prima, 100)) e.prima = "Debe estar entre 0 y 100.";
    return e;
  };

  const guardar = async () => {
    if (!contrato || !form || guardando) return;
    setErrorGeneral(null);
    setExito(null);

    const e = validar(form);
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);
    try {
      await guardarContrato({
        stffId: staff.stff_id,
        contractId: contrato.id,
        startDate: form.inicioAuto ? null : form.fechaInicio,
        endDate: form.finIndefinido && !terminado ? null : form.fechaFin,
        salaryAmount: Number(form.sueldo),
        payroll: form.planilla,
        afpDiscount: Number(form.afp),
        insurancePremium: Number(form.prima),
        discountFlags: {
          absence: form.descuentaAusencia,
          delay: form.descuentaTardanza,
          refreshmentDelay: form.descuentaDemora,
        },
      });
      setExito("Contrato actualizado.");
    } catch (err) {
      console.error("Error al guardar el contrato:", err);
      setErrorGeneral(err instanceof Error && err.message ? err.message : "No se pudo guardar el contrato.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className={style.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !guardando) onClose();
      }}
    >
      <div className={style.modal} role="dialog" aria-modal="true" aria-label={`Contrato de ${nombreCompleto}`}>
        <div className={style.encabezado}>
          <div>
            <h3 className={style.titulo}>Contrato · {nombreCompleto}</h3>
            <p className={style.subtitulo}>
              {contrato
                ? `Contrato ${contrato.status === "activo" ? "activo" : "terminado"} (el más reciente)`
                : "Cargando contrato..."}
            </p>
          </div>
          <button type="button" className={style.cerrar} onClick={onClose} aria-label="Cerrar" disabled={guardando}>
            ×
          </button>
        </div>

        <div className={style.contenido}>
          {cargando && <p className={style.mensaje}>Cargando contrato...</p>}
          {!cargando && !form && errorGeneral && <p className={style.errorGeneral}>{errorGeneral}</p>}

          {form && (
            <>
              <section className={style.bloque}>
                <h4 className={style.seccion}>Vigencia</h4>
                <div className={style.fila}>
                  <div className={style.campo}>
                    <label className={style.etiqueta} htmlFor="cntrt-inicio">Fecha de inicio</label>
                    <input
                      id="cntrt-inicio"
                      type="date"
                      className={style.input}
                      value={form.fechaInicio}
                      disabled={form.inicioAuto}
                      aria-invalid={!!errores.fechaInicio}
                      onChange={(e) => cambiar("fechaInicio", e.target.value)}
                    />
                    <label className={style.interruptor}>
                      <input
                        type="checkbox"
                        checked={form.inicioAuto}
                        onChange={(e) => cambiar("inicioAuto", e.target.checked)}
                      />
                      Empieza con su primer registro de asistencia
                    </label>
                    {errores.fechaInicio && <p className={style.error}>{errores.fechaInicio}</p>}
                  </div>

                  <div className={style.campo}>
                    <label className={style.etiqueta} htmlFor="cntrt-fin">Fecha de fin</label>
                    <input
                      id="cntrt-fin"
                      type="date"
                      className={style.input}
                      value={form.fechaFin}
                      disabled={form.finIndefinido && !terminado}
                      aria-invalid={!!errores.fechaFin}
                      onChange={(e) => cambiar("fechaFin", e.target.value)}
                    />
                    <label className={style.interruptor}>
                      <input
                        type="checkbox"
                        checked={form.finIndefinido && !terminado}
                        disabled={terminado}
                        onChange={(e) => cambiar("finIndefinido", e.target.checked)}
                      />
                      Sin fecha de fin (indefinido)
                    </label>
                    {errores.fechaFin && <p className={style.error}>{errores.fechaFin}</p>}
                  </div>
                </div>
              </section>

              <section className={style.bloque}>
                <h4 className={style.seccion}>Pago y planilla</h4>
                <div className={style.fila3}>
                  <div className={style.campo}>
                    <label className={style.etiqueta} htmlFor="cntrt-sueldo">Sueldo acordado</label>
                    <input
                      id="cntrt-sueldo"
                      inputMode="decimal"
                      className={style.input}
                      value={form.sueldo}
                      aria-invalid={!!errores.sueldo}
                      onChange={(e) => cambiar("sueldo", decimal(e.target.value))}
                    />
                    {errores.sueldo && <p className={style.error}>{errores.sueldo}</p>}
                  </div>

                  <div className={style.campo}>
                    <label className={style.etiqueta} htmlFor="cntrt-afp">Descuento de AFP (%)</label>
                    <input
                      id="cntrt-afp"
                      inputMode="decimal"
                      className={style.input}
                      value={form.afp}
                      placeholder="10"
                      aria-invalid={!!errores.afp}
                      onChange={(e) => cambiar("afp", decimal(e.target.value))}
                    />
                    {errores.afp && <p className={style.error}>{errores.afp}</p>}
                  </div>

                  <div className={style.campo}>
                    <label className={style.etiqueta} htmlFor="cntrt-prima">Prima de seguro (%)</label>
                    <input
                      id="cntrt-prima"
                      inputMode="decimal"
                      className={style.input}
                      value={form.prima}
                      placeholder="1.37"
                      aria-invalid={!!errores.prima}
                      onChange={(e) => cambiar("prima", decimal(e.target.value))}
                    />
                    {errores.prima && <p className={style.error}>{errores.prima}</p>}
                  </div>
                </div>

                <label className={style.interruptor}>
                  <input type="checkbox" checked={form.planilla} onChange={(e) => cambiar("planilla", e.target.checked)} />
                  Está en planilla
                </label>
              </section>

              <section className={style.bloque}>
                <h4 className={style.seccion}>Descuentos por defecto en la asistencia</h4>
                <p className={style.ayuda}>Se aplican a los registros de asistencia nuevos de este personal.</p>
                <label className={style.interruptor}>
                  <input
                    type="checkbox"
                    checked={form.descuentaAusencia}
                    onChange={(e) => cambiar("descuentaAusencia", e.target.checked)}
                  />
                  Descontar ausencias
                </label>
                <label className={style.interruptor}>
                  <input
                    type="checkbox"
                    checked={form.descuentaTardanza}
                    onChange={(e) => cambiar("descuentaTardanza", e.target.checked)}
                  />
                  Descontar tardanzas
                </label>
                <label className={style.interruptor}>
                  <input
                    type="checkbox"
                    checked={form.descuentaDemora}
                    onChange={(e) => cambiar("descuentaDemora", e.target.checked)}
                  />
                  Descontar demora de refrigerio
                </label>
              </section>

              {errorGeneral && <p className={style.errorGeneral} role="alert">{errorGeneral}</p>}
              {exito && <p className={style.exito} role="status">{exito}</p>}

              <div className={style.acciones}>
                <button type="button" className={style.botonSecundario} onClick={onClose} disabled={guardando}>
                  Cerrar
                </button>
                <button type="button" className={style.botonPrimario} onClick={guardar} disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalContrato;