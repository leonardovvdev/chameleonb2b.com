import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import style from "./modal.module.css";
import {
  createStaff,
  getStaffDetail,
  updateStaffContract,
  uploadStaffImage,
} from "../../../../../core/services";
import type { CreateStaffPayload, StaffDetail } from "../../../../../core/types";
import { useAuth } from "../../../../../core/contexts/auth.context";
import { icon } from "../../../../../core/icons";

import Parte1, {
  FORM_INICIAL,
  validarPaso1,
  type FormState,
  type FormErrors,
  type OpcionesCargadas,
} from "./parte1";
import Parte2, {
  HORARIO_INICIAL,
  REFRIGERIO_INICIAL,
  VIGENCIA_ASISTENCIA_INICIAL,
  CLAVES_HORARIO,
  CLAVES_REFRIGERIO,
  toleranciaEnMinutos,
  validarPaso2,
  type HorarioState,
  type RefrigerioState,
  type VigenciaAsistenciaState,
} from "./parte2";
import Parte3, { FERIADO_INICIAL, CLAVES_FERIADO, validarPaso3, type FeriadoState } from "./parte3";
import Parte4, { HONORARIOS_INICIAL, validarPaso4, type HonorariosState } from "./parte4";
import Parte5 from "./parte5";

const PASOS = ["Datos personales", "Horario", "Feriados", "Honorarios", "Resumen"];
const TOTAL_PASOS = PASOS.length;

const SUBTITULOS = [
  "Introduce las credenciales y asigna el puesto del trabajador.",
  "Asígnale un horario y su refrigerio.",
  "Asígnale sus días feriados.",
  "Define el sueldo y los descuentos del trabajador.",
  "Revisa la información antes de crear al personal.",
];

const SUBTITULO_RESUMEN_EDICION =
  "Revisa los cambios. Al guardar, el personal quedará activo y se registrará un nuevo contrato.";

const TIPO_PAGO_API = { monthly: "Monthly", weekly: "Weekly", daily: "Daily" } as const;
const UNIDAD_DESCUENTO_API = { minute: "per_minute", hour: "per_hour", fixed: "fixed" } as const;
/** Convierte lo que el usuario llenó en los 4 pasos en el cuerpo de POST /staffs. */
const armarPayload = (
  form: FormState,
  conAcceso: boolean,
  horario: HorarioState,
  refrigerio: RefrigerioState,
  vigencia: VigenciaAsistenciaState,
  feriado: FeriadoState,
  honorarios: HonorariosState
): CreateStaffPayload => ({
  name: form.stff_name.trim(),
  lastname: form.stff_lastname.trim(),
  dni: form.stff_dni,
  phone: form.stff_phone === "" ? null : form.stff_phone,
  jobPositionId: Number(form.jb_pstn_cust_id),
  roleId: form.cust_role_id ? Number(form.cust_role_id) : null,
  supervisorId: form.stff_supervisor_id ? Number(form.stff_supervisor_id) : null,
  withAccess: conAcceso,
  password: conAcceso && form.stff_password !== "" ? form.stff_password : null,

  schedule:
    horario.tipo === "fixed"
      ? {
          type: "fixed",
          start: horario.entrada,
          end: horario.salida,
          toleranceMinutes: Math.round(toleranciaEnMinutos(horario)),
          requiredMinutes: null,
        }
      : horario.tipo === "flexible"
        ? {
            type: "flexible",
            start: null,
            end: null,
            toleranceMinutes: 0,
            requiredMinutes: Math.round(Number(horario.horas) * 60),
          }
        : { type: "free", start: null, end: null, toleranceMinutes: 0, requiredMinutes: null },

  refreshment:
    refrigerio.tipo === "fixed"
      ? { type: "fixed", start: refrigerio.inicio, end: refrigerio.fin, minutes: null }
      : refrigerio.tipo === "flexible"
        ? { type: "flexible", start: null, end: null, minutes: Number(refrigerio.minutos) }
        : { type: "free", start: null, end: null, minutes: null },

  nonWorkingDays:
    feriado.tipo === "fixed"
      ? { type: "fixed", days: Array.from({ length: 7 }, (_, i) => feriado.dias.includes(i)) }
      : feriado.tipo === "flexible"
        ? { type: "flexible", numberDays: feriado.cantidad }
        : null,

  salary: { type: TIPO_PAGO_API[honorarios.tipoPago], amount: Number(honorarios.sueldo) },

  contract: {
    startDate: vigencia.inicioTipo === "fecha" ? vigencia.fechaInicio : null,
    endDate: vigencia.finTipo === "fecha" ? vigencia.fechaFin : null,
  },
    discount: honorarios.personalizadoActivo
    ? {
        absenceAmount: Number(honorarios.personalizado.falta),
        delayType: UNIDAD_DESCUENTO_API[honorarios.personalizado.unidadTardanza],
        delayAmount: Number(honorarios.personalizado.tardanza),
        refreshmentDelayType: UNIDAD_DESCUENTO_API[honorarios.personalizado.unidadDemora],
        refreshmentDelayAmount: Number(honorarios.personalizado.demora),
      }
    : null,
});

/* ───────────── Edición: del detalle del backend a los estados de los pasos ─────────────
   Es lo inverso de armarPayload: el backend devuelve la misma forma que recibe. */
const TIPO_PAGO_UI = { Monthly: "monthly", Weekly: "weekly", Daily: "daily" } as const;
const UNIDAD_DESCUENTO_UI = { per_minute: "minute", per_hour: "hour", fixed: "fixed" } as const;
const soloFecha = (valor: string | null) => (valor ? valor.slice(0, 10) : ""); // "YYYY-MM-DD"

const estadosDesdeDetalle = (d: StaffDetail) => {
  const form: FormState = {
    cust_role_id: d.roleId ? String(d.roleId) : "",
    stff_name: d.name,
    stff_lastname: d.lastname,
    stff_dni: d.dni,
    stff_phone: d.phone ?? "",
    jb_pstn_cust_id: String(d.jobPositionId),
    stff_supervisor_id: d.supervisorId ? String(d.supervisorId) : "",
    stff_password: "", // la contraseña actual nunca llega al navegador
  };

  const tolerancia = d.schedule.toleranceMinutes ?? 0;
  const toleranciaEnHoras = tolerancia > 0 && tolerancia % 60 === 0;
  const horario: HorarioState = {
    ...HORARIO_INICIAL,
    tipo: d.schedule.type === "free" ? "libre" : d.schedule.type,
    entrada: d.schedule.start ?? "",
    salida: d.schedule.end ?? "",
    tolerancia: String(toleranciaEnHoras ? tolerancia / 60 : tolerancia),
    toleranciaUnidad: toleranciaEnHoras ? "h" : "min",
    horas:
      d.schedule.requiredMinutes != null
        ? String(d.schedule.requiredMinutes / 60)
        : HORARIO_INICIAL.horas,
  };

  const refrigerio: RefrigerioState = {
    ...REFRIGERIO_INICIAL,
    tipo: d.refreshment.type === "free" ? "none" : d.refreshment.type,
    inicio: d.refreshment.start ?? "",
    fin: d.refreshment.end ?? "",
    minutos:
      d.refreshment.minutes != null ? String(d.refreshment.minutes) : REFRIGERIO_INICIAL.minutos,
  };

  const vigencia: VigenciaAsistenciaState = {
    inicioTipo: d.contract.startDate ? "fecha" : "primera_asistencia",
    fechaInicio: soloFecha(d.contract.startDate),
    finTipo: d.contract.endDate ? "fecha" : "indefinido",
    fechaFin: soloFecha(d.contract.endDate),
  };

  const dias = d.nonWorkingDays;
  const feriado: FeriadoState =
    dias === null
      ? { ...FERIADO_INICIAL, tipo: "none", dias: [] }
      : dias.type === "fixed"
        ? {
            tipo: "fixed",
            dias: dias.days.flatMap((activo, i) => (activo ? [i] : [])),
            cantidad: FERIADO_INICIAL.cantidad,
          }
        : { tipo: "flexible", dias: [], cantidad: dias.numberDays };

  const descuento = d.discount;
  const honorarios: HonorariosState = {
    ...HONORARIOS_INICIAL,
    tipoPago: TIPO_PAGO_UI[d.salary.type],
    sueldo: String(d.salary.amount),
    // Sin descuento propio => aplica el general del sistema
    generalActivo: descuento === null,
    personalizadoActivo: descuento !== null,
    personalizado: descuento
      ? {
          falta: String(descuento.absenceAmount),
          tardanza: String(descuento.delayAmount),
          demora: String(descuento.refreshmentDelayAmount),
          unidadTardanza: UNIDAD_DESCUENTO_UI[descuento.delayType],
          unidadDemora: UNIDAD_DESCUENTO_UI[descuento.refreshmentDelayType],
        }
      : HONORARIOS_INICIAL.personalizado,
  };

  return { form, horario, refrigerio, vigencia, feriado, honorarios };
};

interface ModalProps {
  /** Con id => modo "editar" (carga sus datos). Sin id => modo "crear". */
  stffId?: number;
  onClose: () => void;
  /** Se llama al terminar bien, tanto al crear como al editar. */
  onGuardado: () => void;
}

/* ───────────── Modal ─────────────
   Todo el estado de los 5 pasos vive AQUÍ (en el padre). Los pasos solo se
   muestran/ocultan, así que al ir "Atrás" o "Siguiente" nada se pierde.
   Los datos se olvidan únicamente cuando el modal se desmonta (al cerrarlo).

   Modo crear (sin stffId):  POST  → crea al personal.
   Modo editar (con stffId): carga sus datos y, al final, el backend actualiza al
   personal, lo ACTIVA y crea un NUEVO registro en staff_contracts. */
const Modal = ({ stffId, onClose, onGuardado }: ModalProps) => {
  const { custId } = useAuth();
  const uid = useId();
  const esEdicion = stffId !== undefined;

  const [paso, setPaso] = useState(1);

  // Datos de los pasos (persisten mientras el modal esté abierto)
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [conAcceso, setConAcceso] = useState(false);
  const [horario, setHorario] = useState<HorarioState>(HORARIO_INICIAL);
  const [refrigerio, setRefrigerio] = useState<RefrigerioState>(REFRIGERIO_INICIAL);
  const [vigencia, setVigencia] = useState<VigenciaAsistenciaState>(VIGENCIA_ASISTENCIA_INICIAL);
  const [feriado, setFeriado] = useState<FeriadoState>(FERIADO_INICIAL);
  const [honorarios, setHonorarios] = useState<HonorariosState>(HONORARIOS_INICIAL);
  const [foto, setFoto] = useState<File | null>(null);

  // Errores
  const [errores, setErrores] = useState<FormErrors>({});
  const [erroresPaso, setErroresPaso] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);

  // Solo edición: carga inicial del personal
  const [cargandoDetalle, setCargandoDetalle] = useState(esEdicion);
  const [errorCarga, setErrorCarga] = useState(false);
  const [fotoActualUrl, setFotoActualUrl] = useState<string | null>(null);
  const [yaTeniaAcceso, setYaTeniaAcceso] = useState(false);

  // Lo que carga el paso 1 (cargos y jefes): el resumen del paso 5 lo necesita
  const [opciones, setOpciones] = useState<OpcionesCargadas>({});
  // null = el paso 1 aún no terminó de consultar los supervisores
  const [haySupervisores, setHaySupervisores] = useState<boolean | null>(null);

  // Edición: trae al personal y rellena los 4 pasos con sus datos actuales
  useEffect(() => {
    if (stffId === undefined) return;
    let cancelado = false;

    setCargandoDetalle(true);
    setErrorCarga(false);

    getStaffDetail(stffId)
      .then((detalle) => {
        if (cancelado) return;
        const e = estadosDesdeDetalle(detalle);
        setForm(e.form);
        setHorario(e.horario);
        setRefrigerio(e.refrigerio);
        setVigencia(e.vigencia);
        setFeriado(e.feriado);
        setHonorarios(e.honorarios);
        setConAcceso(detalle.withAccess);
        setYaTeniaAcceso(detalle.withAccess);
        setFotoActualUrl(detalle.img_url);
      })
      .catch((err) => {
        if (cancelado) return;
        console.error("Error al cargar el personal a editar:", err);
        setErrorCarga(true);
        setErrorGeneral(
          err instanceof Error && err.message
            ? err.message
            : "No se pudieron cargar los datos del personal."
        );
      })
      .finally(() => {
        if (!cancelado) setCargandoDetalle(false);
      });

    return () => {
      cancelado = true;
    };
  }, [stffId]);

  const manejarOpcionesCargadas = useCallback(
    (cargadas: OpcionesCargadas) => setOpciones((prev) => ({ ...prev, ...cargadas })),
    []
  );

  // El correo se genera en el servidor: DNI@codigo_del_sistema.com
  const correo = form.stff_dni ? `${form.stff_dni}@(código del sistema).com` : "";

  const cerrar = () => {
    if (!guardando) onClose();
  };

  // Escape cierra el modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !guardando) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [guardando, onClose]);

  /* ── Cambios de datos ── */

  // Quita solo los errores indicados (no borra los del resto del paso)
  const limpiarErroresPaso = (claves: string[]) =>
    setErroresPaso((prev) => {
      if (!claves.some((c) => prev[c])) return prev;
      const siguiente = { ...prev };
      claves.forEach((c) => delete siguiente[c]);
      return siguiente;
    });

  const manejarCambio = (campo: keyof FormState, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev));
  };

  const alternarAcceso = (activo: boolean) => {
    setConAcceso(activo);
    if (!activo) {
      // Al desmarcar se limpia la contraseña y su error
      setForm((prev) => ({ ...prev, stff_password: "" }));
      setErrores((prev) => ({ ...prev, stff_password: undefined }));
    }
  };

  const cambiarHorario = (cambios: Partial<HorarioState>) => {
    setHorario((prev) => ({ ...prev, ...cambios }));
    limpiarErroresPaso(CLAVES_HORARIO);
  };

  const cambiarRefrigerio = (cambios: Partial<RefrigerioState>) => {
    setRefrigerio((prev) => ({ ...prev, ...cambios }));
    limpiarErroresPaso(CLAVES_REFRIGERIO);
  };

  const cambiarVigencia = (cambios: Partial<VigenciaAsistenciaState>) => {
    setVigencia((prev) => ({ ...prev, ...cambios }));
    limpiarErroresPaso(["fechaInicio", "fechaFin"]);
  };

  const cambiarFeriado = (cambios: Partial<FeriadoState>) => {
    setFeriado((prev) => ({ ...prev, ...cambios }));
    limpiarErroresPaso(CLAVES_FERIADO);
  };

  const cambiarHonorarios = (cambios: Partial<HonorariosState>) => {
    setHonorarios((prev) => ({ ...prev, ...cambios }));
    limpiarErroresPaso(["sueldo", "falta", "tardanza", "demora"]);
  };

  /* ── Navegación entre pasos ── */
  const siguiente = () => {
    setErrorGeneral(null);

    if (paso === 1) {
      const e = validarPaso1(form, conAcceso, haySupervisores ?? false, yaTeniaAcceso);
      setErrores(e);
      if (Object.keys(e).length > 0) return;
    }

    if (paso >= 2 && paso <= 4) {
      const e =
        paso === 2
          ? validarPaso2(horario, refrigerio, vigencia)
          : paso === 3
            ? validarPaso3(feriado)
            : validarPaso4(honorarios);
      setErroresPaso(e);
      if (Object.keys(e).length > 0) return;
    }

    setPaso((p) => Math.min(p + 1, TOTAL_PASOS));
  };

  const atras = () => {
    setErrorGeneral(null);
    setErroresPaso({});
    setPaso((p) => Math.max(p - 1, 1));
  };

  /* ── Guardar (solo se ejecuta en el último paso) ──
     Crear:  POST /staffs guarda todo junto: personal, horario, refrigerio, días no
             laborables, contrato y sueldo.
     Editar: actualiza esos mismos datos, activa al personal y crea un nuevo
             registro en staff_contracts (lo hace el backend en una sola operación).
     La foto (opcional) se sube después en ambos casos. */
  const manejarGuardar = async () => {
    if (guardando) return;
    setErrorGeneral(null);

    if (custId === null) {
      setErrorGeneral("No se pudo identificar al cliente.");
      return;
    }

    setGuardando(true);
    try {
      const payload = armarPayload(
        form,
        conAcceso,
        horario,
        refrigerio,
        vigencia,
        feriado,
        honorarios
      );

      let id: number;
      if (stffId !== undefined) {
        await updateStaffContract(stffId, payload);
        id = stffId;
      } else {
        id = (await createStaff(payload)).stff_id;
      }

      // El personal ya está guardado: si la foto falla se puede subir después desde la lista.
      if (foto) {
        try {
          await uploadStaffImage(id, foto);
        } catch (errFoto) {
          console.error("El personal se guardó, pero no se pudo subir la foto:", errFoto);
        }
      }

      setGuardando(false);
      onGuardado();
      onClose();
    } catch (err) {
      console.error(esEdicion ? "Error al editar personal:" : "Error al crear personal:", err);
      setErrorGeneral(
        err instanceof Error && err.message
          ? err.message
          : esEdicion
            ? "No se pudo guardar el personal. Intenta de nuevo."
            : "No se pudo crear el personal. Intenta de nuevo."
      );
      setGuardando(false);
    }
  };

  const manejarSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Enter dentro de un campo avanza de paso en vez de crear
    if (paso < TOTAL_PASOS) {
      siguiente();
      return;
    }
    manejarGuardar();
  };

  /* ── Datos derivados para los pasos ── */
  const cargoNombre =
    opciones.cargos?.find((c) => c.value === form.jb_pstn_cust_id)?.label ?? "—";
  const jefe = opciones.jefes?.find((j) => j.value === form.stff_supervisor_id);
  const jefeNombre = jefe?.label ?? "—";
  const jefeAvatar = jefe?.avatar ?? null;

  return (
    <div
      className={style.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <form
        className={style.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-titulo`}
        onSubmit={manejarSubmit}
        noValidate
      >
        <div className={style.encabezado}>
          <div>
            <h3 id={`${uid}-titulo`} className={style.titulo}>
              {esEdicion ? "Editar Personal" : "Registrar Nuevo Personal"}
            </h3>
            <p className={style.subtitulo}>
              {esEdicion && paso === TOTAL_PASOS
                ? SUBTITULO_RESUMEN_EDICION
                : SUBTITULOS[paso - 1]}
            </p>
          </div>
          <button
            type="button"
            className={style.botonCerrar}
            onClick={cerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <icon.iconClose className={style.icono} />
          </button>
        </div>

        {/* ── Indicador de pasos ── */}
        <ol className={style.pasos} aria-label="Progreso">
          {PASOS.map((nombre, i) => {
            const n = i + 1;
            const estado = n === paso ? style.pasoActivo : n < paso ? style.pasoCompleto : "";
            return (
              <li
                key={nombre}
                className={`${style.paso} ${estado}`}
                aria-current={n === paso ? "step" : undefined}
              >
                <span className={style.pasoBarra} />
                <span className={style.pasoInfo}>
                  <span className={style.pasoNumero}>
                    {n < paso ? <icon.iconCheck className={style.pasoCheck} /> : n}
                  </span>
                  <span className={style.pasoTexto}>{nombre}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className={`${style.cuerpo} ${style.cuerpoPaso}`}>
          {errorGeneral && (
            <p className={style.errorGeneral} role="alert">
              {errorGeneral}
            </p>
          )}
          {custId === null && (
            <p className={style.errorGeneral} role="alert">
              No se pudo identificar al cliente. Vuelve a iniciar sesión.
            </p>
          )}

          {cargandoDetalle && <p>Cargando datos del personal...</p>}

          {!cargandoDetalle && !errorCarga && paso === 1 && (
            <Parte1
              uid={uid}
              form={form}
              errores={errores}
              conAcceso={conAcceso}
              onCambio={manejarCambio}
              onAcceso={alternarAcceso}
              onSupervisoresCargados={setHaySupervisores}
              onOpcionesCargadas={manejarOpcionesCargadas}
              excluirSupervisorId={stffId !== undefined ? String(stffId) : undefined}
              passwordOpcional={yaTeniaAcceso}
            />
          )}

          {!cargandoDetalle && !errorCarga && paso === 2 && (
            <Parte2
              uid={uid}
              horario={horario}
              refrigerio={refrigerio}
              vigencia={vigencia}
              errores={erroresPaso}
              onHorario={cambiarHorario}
              onRefrigerio={cambiarRefrigerio}
              onVigencia={cambiarVigencia}
            />
          )}

          {!cargandoDetalle && !errorCarga && paso === 3 && (
            <Parte3 uid={uid} feriado={feriado} errores={erroresPaso} onFeriado={cambiarFeriado} />
          )}

          {!cargandoDetalle && !errorCarga && paso === 4 && (
            <Parte4
              uid={uid}
              honorarios={honorarios}
              errores={erroresPaso}
              onHonorarios={cambiarHonorarios}
            />
          )}

          {!cargandoDetalle && !errorCarga && paso === 5 && (
            <Parte5
              form={form}
              horario={horario}
              refrigerio={refrigerio}
              feriado={feriado}
              honorarios={honorarios}
              cargoNombre={cargoNombre}
              jefeNombre={jefeNombre}
              jefeAvatar={jefeAvatar}
              conAcceso={conAcceso}
              correo={correo}
              foto={foto}
              onFoto={setFoto}
              fotoActualUrl={fotoActualUrl}
            />
          )}
        </div>

        <div className={style.acciones}>
          <button
            type="button"
            className={`${style.botonCancelar} ${style.accionesIzquierda}`}
            onClick={cerrar}
            disabled={guardando}
          >
            Cancelar
          </button>

          {paso > 1 && (
            <button type="button" className={style.botonAtras} onClick={atras} disabled={guardando}>
              Atrás
            </button>
          )}

          {/* Las keys fuerzan un botón nuevo al llegar al último paso,
              así el clic en "Siguiente" no se convierte en un submit. */}
          {paso < TOTAL_PASOS ? (
            <button
              key="siguiente"
              type="button"
              className={style.botonGuardar}
              onClick={siguiente}
              disabled={
                cargandoDetalle ||
                errorCarga ||
                (paso === 1 && (haySupervisores === null || custId === null))
              }
            >
              Siguiente
            </button>
          ) : (
            <button
              key="crear"
              type="submit"
              className={style.botonGuardar}
              disabled={guardando || custId === null}
            >
              <icon.iconUserPlus className={style.icon} />
              {guardando
                ? "Guardando..."
                : esEdicion
                  ? "Guardar y activar"
                  : "Crear personal"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Modal;