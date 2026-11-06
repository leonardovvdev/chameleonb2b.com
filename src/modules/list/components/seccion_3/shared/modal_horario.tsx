import { useEffect, useState } from "react";
import style from "./modal_horario.module.css";
import { callBackend } from "../../../../../core/services/backend";
import type { StaffListItem } from "../../../../../core/types";
import { getContratoActual, type ContratoActual } from "./modal_contrato";

/** PATCH /staff-contracts/schedule */
const guardarHorario = (body: Record<string, unknown>) =>
  callBackend<unknown>("staff-contracts/schedule", { method: "PATCH", body });

/* ───────────────────────── Formulario ───────────────────────── */

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]; // 0 = lunes

type Tipo = "fixed" | "flexible" | "free";
type TipoDias = "none" | "fixed" | "flexible";

interface FormHorario {
  tipo: Tipo;
  entrada: string;
  salida: string;
  tolerancia: string; // minutos
  horas: string; // flexible: horas de trabajo por día

  refTipo: Tipo;
  refInicio: string;
  refFin: string;
  refMinutos: string;

  diasTipo: TipoDias;
  dias: boolean[];
  cantidad: string; // flexible: N° de días no laborables
}

type Errores = Partial<Record<"entrada" | "salida" | "horas" | "refInicio" | "refFin" | "refMinutos" | "dias" | "cantidad", string>>;

const aForm = (c: ContratoActual): FormHorario => {
  const s = c.schedule;
  const r = c.refreshment;
  const n = c.nonWorkingDays;
  return {
    tipo: s?.type ?? "free",
    entrada: s?.start ?? "",
    salida: s?.end ?? "",
    tolerancia: String(s?.toleranceMinutes ?? 0),
    horas: s?.requiredMinutes != null ? String(s.requiredMinutes / 60) : "8",

    refTipo: r?.type ?? "free",
    refInicio: r?.start ?? "",
    refFin: r?.end ?? "",
    refMinutos: r?.minutes != null ? String(r.minutes) : "60",

    diasTipo: n === null ? "none" : n.type,
    dias: n?.type === "fixed" ? n.days : Array(7).fill(false),
    cantidad: n?.type === "flexible" ? String(n.numberDays) : "1",
  };
};

const soloDigitos = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

/** Botones tipo "segmentado" (una sola opción activa). */
interface SegmentadoProps<T extends string> {
  etiqueta: string;
  valor: T;
  opciones: { value: T; label: string }[];
  onChange: (v: T) => void;
}

const Segmentado = <T extends string>({ etiqueta, valor, opciones, onChange }: SegmentadoProps<T>) => (
  <div className={style.campo}>
    <span className={style.etiqueta}>{etiqueta}</span>
    <div className={style.segmentado} role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={valor === o.value}
          className={`${style.segmento} ${valor === o.value ? style.segmentoActivo : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

interface Props {
  staff: StaffListItem;
  onClose: () => void;
}

const ModalHorario = ({ staff, onClose }: Props) => {
  const [contrato, setContrato] = useState<ContratoActual | null>(null);
  const [form, setForm] = useState<FormHorario | null>(null);
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
        if (!c.schedule) setErrorGeneral("Este contrato no tiene un horario registrado.");
      })
      .catch((err) => {
        console.error("Error al cargar el horario:", err);
        if (activo) setErrorGeneral(err instanceof Error ? err.message : "No se pudo cargar el horario.");
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

  const cambiar = (parche: Partial<FormHorario>) => {
    setForm((prev) => (prev ? { ...prev, ...parche } : prev));
    setErrores({});
    setExito(null);
  };

  const alternarDia = (i: number) => {
    if (!form) return;
    cambiar({ dias: form.dias.map((v, idx) => (idx === i ? !v : v)) });
  };

  const validar = (f: FormHorario): Errores => {
    const e: Errores = {};

    if (f.tipo === "fixed") {
      if (!f.entrada) e.entrada = "Indica la hora de entrada.";
      if (!f.salida) e.salida = "Indica la hora de salida.";
    }
    if (f.tipo === "flexible" && !(Number(f.horas) > 0 && Number(f.horas) <= 24)) {
      e.horas = "Indica entre 0.5 y 24 horas.";
    }

    if (f.refTipo === "fixed") {
      if (!f.refInicio) e.refInicio = "Indica el inicio del refrigerio.";
      if (!f.refFin) e.refFin = "Indica el fin del refrigerio.";
      if (f.refInicio && f.refFin && f.refFin <= f.refInicio) e.refFin = "El fin debe ser posterior al inicio.";
    }
    if (f.refTipo === "flexible" && !(Number(f.refMinutos) > 0)) {
      e.refMinutos = "Indica los minutos de refrigerio.";
    }

    if (f.diasTipo === "fixed" && !f.dias.some(Boolean)) e.dias = "Selecciona al menos un día.";
    if (f.diasTipo === "flexible" && !(Number(f.cantidad) >= 1 && Number(f.cantidad) <= 7)) {
      e.cantidad = "Indica entre 1 y 7 días.";
    }
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
      await guardarHorario({
        stffId: staff.stff_id,
        contractId: contrato.id,
        schedule:
          form.tipo === "fixed"
            ? {
                type: "fixed",
                start: form.entrada,
                end: form.salida,
                toleranceMinutes: Number(form.tolerancia || 0),
                requiredMinutes: null,
              }
            : form.tipo === "flexible"
              ? { type: "flexible", start: null, end: null, toleranceMinutes: 0, requiredMinutes: Math.round(Number(form.horas) * 60) }
              : { type: "free", start: null, end: null, toleranceMinutes: 0, requiredMinutes: null },
        refreshment:
          form.refTipo === "fixed"
            ? { type: "fixed", start: form.refInicio, end: form.refFin, minutes: null }
            : form.refTipo === "flexible"
              ? { type: "flexible", start: null, end: null, minutes: Number(form.refMinutos) }
              : { type: "free", start: null, end: null, minutes: null },
        nonWorkingDays:
          form.diasTipo === "fixed"
            ? { type: "fixed", days: form.dias }
            : form.diasTipo === "flexible"
              ? { type: "flexible", numberDays: Number(form.cantidad) }
              : null,
      });
      setExito("Horario actualizado.");
    } catch (err) {
      console.error("Error al guardar el horario:", err);
      setErrorGeneral(err instanceof Error && err.message ? err.message : "No se pudo guardar el horario.");
    } finally {
      setGuardando(false);
    }
  };

  // "Flexible" en días no laborables solo se ofrece si el contrato ya lo tiene.
  const opcionesDias: { value: TipoDias; label: string }[] = [
    { value: "none", label: "Ninguno" },
    { value: "fixed", label: "Fijo" },
    ...(contrato?.nonWorkingDays?.type === "flexible" ? [{ value: "flexible" as const, label: "Flexible" }] : []),
  ];

  return (
    <div
      className={style.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !guardando) onClose();
      }}
    >
      <div className={style.modal} role="dialog" aria-modal="true" aria-label={`Horario de ${nombreCompleto}`}>
        <div className={style.encabezado}>
          <div>
            <h3 className={style.titulo}>Horario · {nombreCompleto}</h3>
            <p className={style.subtitulo}>Horario laboral, refrigerio y días no laborables del contrato actual</p>
          </div>
          <button type="button" className={style.cerrar} onClick={onClose} aria-label="Cerrar" disabled={guardando}>
            ×
          </button>
        </div>

        <div className={style.contenido}>
          {cargando && <p className={style.mensaje}>Cargando horario...</p>}
          {!cargando && !form && errorGeneral && <p className={style.errorGeneral}>{errorGeneral}</p>}

          {form && contrato?.schedule && (
            <>
              {/* ── Horario laboral ── */}
              <section className={style.bloque}>
                <h4 className={style.seccion}>Horario laboral</h4>
                <Segmentado<Tipo>
                  etiqueta="Tipo de horario"
                  valor={form.tipo}
                  onChange={(v) => cambiar({ tipo: v })}
                  opciones={[
                    { value: "fixed", label: "Fijo" },
                    { value: "flexible", label: "Flexible" },
                    { value: "free", label: "Libre" },
                  ]}
                />

                {form.tipo === "fixed" && (
                  <div className={style.fila3}>
                    <div className={style.campo}>
                      <label className={style.etiqueta} htmlFor="hor-entrada">Hora de entrada</label>
                      <input
                        id="hor-entrada"
                        type="time"
                        className={style.input}
                        value={form.entrada}
                        aria-invalid={!!errores.entrada}
                        onChange={(e) => cambiar({ entrada: e.target.value })}
                      />
                      {errores.entrada && <p className={style.error}>{errores.entrada}</p>}
                    </div>
                    <div className={style.campo}>
                      <label className={style.etiqueta} htmlFor="hor-salida">Hora de salida</label>
                      <input
                        id="hor-salida"
                        type="time"
                        className={style.input}
                        value={form.salida}
                        aria-invalid={!!errores.salida}
                        onChange={(e) => cambiar({ salida: e.target.value })}
                      />
                      {errores.salida && <p className={style.error}>{errores.salida}</p>}
                    </div>
                    <div className={style.campo}>
                      <label className={style.etiqueta} htmlFor="hor-tol">Tolerancia (min)</label>
                      <input
                        id="hor-tol"
                        inputMode="numeric"
                        className={style.input}
                        value={form.tolerancia}
                        onChange={(e) => cambiar({ tolerancia: soloDigitos(e.target.value, 4) })}
                      />
                    </div>
                  </div>
                )}

                {form.tipo === "flexible" && (
                  <div className={style.campo}>
                    <label className={style.etiqueta} htmlFor="hor-horas">Horas de trabajo por día</label>
                    <input
                      id="hor-horas"
                      type="number"
                      min={0.5}
                      max={24}
                      step={0.5}
                      className={style.input}
                      value={form.horas}
                      aria-invalid={!!errores.horas}
                      onChange={(e) => cambiar({ horas: e.target.value })}
                    />
                    {errores.horas && <p className={style.error}>{errores.horas}</p>}
                  </div>
                )}

                {form.tipo === "free" && <p className={style.ayuda}>Sin hora fija de entrada ni de salida.</p>}
              </section>

              {/* ── Refrigerio ── */}
              <section className={style.bloque}>
                <h4 className={style.seccion}>Refrigerio</h4>
                <Segmentado<Tipo>
                  etiqueta="Tipo de refrigerio"
                  valor={form.refTipo}
                  onChange={(v) => cambiar({ refTipo: v })}
                  opciones={[
                    { value: "fixed", label: "Fijo" },
                    { value: "flexible", label: "Flexible" },
                    { value: "free", label: "Sin refrigerio" },
                  ]}
                />

                {form.refTipo === "fixed" && (
                  <div className={style.fila}>
                    <div className={style.campo}>
                      <label className={style.etiqueta} htmlFor="ref-inicio">Inicio</label>
                      <input
                        id="ref-inicio"
                        type="time"
                        className={style.input}
                        value={form.refInicio}
                        aria-invalid={!!errores.refInicio}
                        onChange={(e) => cambiar({ refInicio: e.target.value })}
                      />
                      {errores.refInicio && <p className={style.error}>{errores.refInicio}</p>}
                    </div>
                    <div className={style.campo}>
                      <label className={style.etiqueta} htmlFor="ref-fin">Fin</label>
                      <input
                        id="ref-fin"
                        type="time"
                        className={style.input}
                        value={form.refFin}
                        aria-invalid={!!errores.refFin}
                        onChange={(e) => cambiar({ refFin: e.target.value })}
                      />
                      {errores.refFin && <p className={style.error}>{errores.refFin}</p>}
                    </div>
                  </div>
                )}

                {form.refTipo === "flexible" && (
                  <div className={style.campo}>
                    <label className={style.etiqueta} htmlFor="ref-min">Minutos de refrigerio</label>
                    <input
                      id="ref-min"
                      inputMode="numeric"
                      className={style.input}
                      value={form.refMinutos}
                      aria-invalid={!!errores.refMinutos}
                      onChange={(e) => cambiar({ refMinutos: soloDigitos(e.target.value, 4) })}
                    />
                    {errores.refMinutos && <p className={style.error}>{errores.refMinutos}</p>}
                  </div>
                )}
              </section>

              {/* ── Días no laborables ── */}
              <section className={style.bloque}>
                <h4 className={style.seccion}>Días no laborables</h4>
                <Segmentado<TipoDias>
                  etiqueta="Tipo"
                  valor={form.diasTipo}
                  onChange={(v) => cambiar({ diasTipo: v })}
                  opciones={opcionesDias}
                />

                {form.diasTipo === "fixed" && (
                  <div className={style.campo}>
                    <div className={style.dias} role="group" aria-label="Días no laborables">
                      {DIAS_SEMANA.map((dia, i) => (
                        <button
                          key={dia}
                          type="button"
                          aria-pressed={form.dias[i]}
                          className={`${style.dia} ${form.dias[i] ? style.diaActivo : ""}`}
                          onClick={() => alternarDia(i)}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                    {errores.dias && <p className={style.error}>{errores.dias}</p>}
                  </div>
                )}

                {form.diasTipo === "flexible" && (
                  <div className={style.campo}>
                    <label className={style.etiqueta} htmlFor="dias-cant">Días no laborables a la semana</label>
                    <input
                      id="dias-cant"
                      inputMode="numeric"
                      className={style.input}
                      value={form.cantidad}
                      aria-invalid={!!errores.cantidad}
                      onChange={(e) => cambiar({ cantidad: soloDigitos(e.target.value, 1) })}
                    />
                    {errores.cantidad && <p className={style.error}>{errores.cantidad}</p>}
                  </div>
                )}

                {form.diasTipo === "none" && <p className={style.ayuda}>Trabaja todos los días de la semana.</p>}
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

export default ModalHorario;