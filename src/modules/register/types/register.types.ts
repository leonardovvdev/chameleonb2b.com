export interface StaffAttendance {
  att_id: number;
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  img_url: string | null;
  job_position_name: string | null;
  /** YYYY-MM-DD */
  att_date: string;
  /** Timestamps ISO */
  att_schedule_start: string | null;
  att_refreshment_start: string | null;
  att_refreshment_end: string | null;
  att_schedule_end: string | null;
  att_justification_absence: string | null;
  att_justification_delay: string | null;
  att_justification_refreshment_delay: string | null;
  att_discount_absence: boolean;
  att_discount_delay: boolean;
  att_discount_refreshment_delay: boolean;
  att_observation: string | null;
  /** Total de incidencias (staff_discount_incidents) de este registro. */
  incidents_count?: number;
}

export type TiemposRegistro = Pick<
  StaffAttendance,
  | "att_schedule_start"
  | "att_refreshment_start"
  | "att_refreshment_end"
  | "att_schedule_end"
>;

export type ActualizarFila = (attId: number, parche: Partial<StaffAttendance>) => void;

export type TipoJustificacionApi = "delay" | "refreshment_delay" | "absence";

export interface RegistroDetalle {
  att_id: number;
  role_name: string | null;
  total_records: number;
  att_observation: string | null;
}

export interface Incidencia {
  id: number;
  amount: number;
  description: string;
  created_by_staff_id: number | null;
  created_by_name: string | null;
  created_at: string | null;
}

export type EstadoFiltro = "" | "presente" | "tardanza" | "ausente";

export interface RegisterFilters {
  busqueda: string;
  cargo: string;
  estado: EstadoFiltro;
  /** YYYY-MM-DD */
  fecha: string;
}

export type ActualizarFiltro = <K extends keyof RegisterFilters>(
  clave: K,
  valor: RegisterFilters[K]
) => void;

export interface RegisterSummary {
  totalEmpleados: number;
  puntuales: number;
  tardanzas: number;
  ausencias: number;
}

/** Persona mostrada en las listas de los cards de Seccion_2. */
export interface PersonaResumen {
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  img_url: string | null;
}

export interface ListasResumen {
  /** Todo el personal activo. */
  empleados: PersonaResumen[];
  puntuales: PersonaResumen[];
  tardanzaIngreso: PersonaResumen[];
  tardanzaRefrigerio: PersonaResumen[];
  /** Personal que no marcó ingreso en la fecha consultada. */
  ausentes: PersonaResumen[];
}

export interface StaffPendiente {
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  img_url: string | null;
  job_position_id: number | null;
  job_position_name: string | null;
  role_id: number | null;
  role_name: string | null;
}

export interface NuevoRegistroControl {
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  /** Fecha del calendario (YYYY-MM-DD) para la que se registra. */
  fecha: string;
  esHoy: boolean;
  /** "HH:MM". Solo se usa si la fecha no es hoy. */
  horaIngreso: string;
  onCambiarHoraIngreso: (valor: string) => void;
  personal: StaffPendiente[];
  cargando: boolean;
  busqueda: string;
  onCambiarBusqueda: (valor: string) => void;
  /** "" | "cargo:ID" | "rol:ID" */
  filtro: string;
  onCambiarFiltro: (valor: string) => void;
  cargos: { id: number; name: string }[];
  roles: { id: number; name: string }[];
  seleccionado: StaffPendiente | null;
  onSeleccionar: (staff: StaffPendiente) => void;
  onCancelarSeleccion: () => void;
  onConfirmar: () => void;
  registrando: boolean;
  error: string;
  exito: string;
}
export interface PersonaResumen {
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  img_url: string | null;
  /** Solo en las listas de tardanza: texto de la justificación, si la hay. */
  justificacion?: string | null;
}