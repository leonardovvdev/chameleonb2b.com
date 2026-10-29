// register.types.ts
import type { CustomerJobPosition, CustomerRole } from "../../../core/types";

/** Tipo de horario del personal (tabla staff_schedules). */
export type ScheduleType = "fixed" | "flexible" | "free";

/**
 * Fila de asistencia tal como la devuelve GET /attendance?date=YYYY-MM-DD.
 * Las horas (att_inicio_*, att_fin_*) son TIMESTAMPTZ en ISO 8601 (UTC):
 * se convierten a hora local en el frontend (ver aMinutos / formatHora en register.controller.ts).
 */
export interface StaffAttendance {
  att_id: number;
  att_fecha: string;
  att_inicio_jornada: string | null;
  att_inicio_receso: string | null;
  att_fin_receso: string | null;
  att_fin_jornada: string | null;

  att_justification_absence: string | null;
  att_justification_delay: string | null;
  att_justification_refreshment_delay: string | null;

  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  job_position_name: string | null;

  /** Horario del personal: sirve para decidir si llegó tarde. */
  schedule_type: ScheduleType | null;
  /** Hora de inicio del horario fijo ("08:00:00"). */
  schedule_start: string | null;
  /** Minutos de tolerancia después de la hora de inicio. */
  schedule_tolerance: number | null;

  /** URL firmada y temporal de la foto (null si no tiene). */
  img_url: string | null;
}

/** Respuesta completa de GET /attendance. */
export interface AttendanceResponse {
  items: StaffAttendance[];
  /** Personal activo del customer (base para las tarjetas de resumen). */
  total_staff: number;
}

/** Estado de una fila: null = todavía no registró su ingreso. */
export type EstadoAsistencia = "puntual" | "tardanza" | null;

/** Valores del filtro "Estado" (seccion_3). "" = todos. */
export type EstadoFiltro = "" | "presente" | "tardanza" | "ausente";

export interface RegisterFilters {
  /** Nombre, apellido o DNI. */
  busqueda: string;
  /** Nombre del cargo ("" = todos). */
  cargo: string;
  estado: EstadoFiltro;
  /** Fecha consultada, YYYY-MM-DD en hora local. */
  fecha: string;
}

export type ActualizarFiltro = <K extends keyof RegisterFilters>(
  clave: K,
  valor: RegisterFilters[K]
) => void;

/** Datos de las 4 tarjetas de seccion_2. */
export interface RegisterSummary {
  totalEmpleados: number;
  presentes: number;
  tardanzas: number;
  ausencias: number;
}

/* ───────────────────────── Nuevo registro (ingreso) ───────────────────────── */

/** Personal activo sin ingreso hoy: GET /attendance/pending. */
export interface StaffPendiente {
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  job_position_name: string | null;
  role_name: string | null;
  /** URL firmada y temporal de la foto (null si no tiene). */
  img_url: string | null;
}

/** Filtros que se mandan a GET /attendance/pending. */
export interface PendingFiltersPayload {
  search: string;
  cargoId: number | null;
  rolId: number | null;
}

/** Respuesta de POST /attendance. */
export interface CheckInResponse {
  att_id: number;
  att_schedule_start: string;
}

export type ModoRegistro = "ingreso" | "ausencia";
/** Respuesta de POST /attendance/absence. */
export interface AbsenceResponse {
  att_id: number;
  att_justification_absence: string;
}
/**
 * Todo lo que el modal "Nuevo registro" necesita del controller.
 * `filtro` es "" (todos), "cargo:<id>" o "rol:<id>": solo se puede elegir uno de los dos.
 */
export interface NuevoRegistroControl {
  abierto: boolean;
  abrir: () => void;
  abrirAusencia: () => void;
  cerrar: () => void;

  modo: ModoRegistro;
  descripcion: string;
  onCambiarDescripcion: (valor: string) => void;
  maxDescripcion: number;

  personal: StaffPendiente[];
  cargando: boolean;

  busqueda: string;
  onCambiarBusqueda: (valor: string) => void;
  filtro: string;
  onCambiarFiltro: (valor: string) => void;
  cargos: CustomerJobPosition[];
  roles: CustomerRole[];

  /** Persona sobre la que se pregunta "¿registrar asistencia?" (null = sin pregunta). */
  seleccionado: StaffPendiente | null;
  onSeleccionar: (staff: StaffPendiente) => void;
  onCancelarSeleccion: () => void;
  onConfirmar: () => void;
  registrando: boolean;

  error: string;
  exito: string;
}

/* ───────────────────── Modal de un registro (detalle, edición, incidencias) ───────────────────── */

/** GET /attendance/detail?id= */
export interface RegistroDetalle {
  att_id: number;
  att_observation: string | null;
  role_name: string | null;
  /** Filas de attendance del personal, de todas las fechas. */
  total_records: number;
}

/** Las 4 horas de un registro (ISO 8601 o null). Respuesta de PATCH /attendance/times. */
export interface TiemposRegistro {
  att_inicio_jornada: string | null;
  att_inicio_receso: string | null;
  att_fin_receso: string | null;
  att_fin_jornada: string | null;
}

export type TipoJustificacionApi = "delay" | "refreshment_delay" | "absence";

/** Incidencia con descuento (tabla staff_discount_incidents). */
export interface IncidenciaDescuento {
  id: number;
  att_id: number;
  created_by_staff_id: number | null;
  created_by_name: string | null;
  type: "delay" | "absence" | "other";
  description: string;
  amount: number;
  /** null si la tabla no guarda fecha. */
  created_at: string | null;
}

/** Cambia una fila de la tabla sin volver a pedirla al backend. */
export type ActualizarFila = (attId: number, parche: Partial<StaffAttendance>) => void;