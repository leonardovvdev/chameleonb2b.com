/** Persona de la lista tal como la devuelve GET /staffs. */
export interface StaffListItem {
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  stff_phone: string | null;
  /** Solo el nombre del archivo en el bucket. */
  stff_link_img: string | null;
  stff_active: boolean;
  stff_access_system: boolean;
  stff_supervisor_id: number | null;
  cust_jb_pstn_id: number;
  cust_role_id: number | null;
  job_position_name: string | null;
  role_name: string | null;
  /** URL firmada y temporal de la foto (el bucket es privado). */
  img_url: string | null;
}

export type EstadoFiltro = "" | "ACTIVO" | "INACTIVO";

export interface StaffFilters {
  busqueda: string;
  cargoId: number | null;
  rolId: number | null;
  estado: EstadoFiltro;
}

/** Candidato a jefe directo (GET /staffs/supervisors). */
export interface SupervisorItem {
  id: number;
  name: string;
  lastname: string;
  img_url: string | null;
  job_position: string | null;
  /** Personal que lo tiene como jefe directo. */
  subordinates: number;
}

/** PATCH /staffs?id= */
export interface UpdateStaffPayload {
  name: string;
  lastname: string;
  dni: string;
  phone: string | null;
  jobPositionId: number;
  roleId: number | null;
  supervisorId: number | null;
  /** Acceso al sistema. El correo es siempre DNI@codigo_del_sistema.com. */
  withAccess: boolean;
  /** Obligatoria al activar el acceso por primera vez; vacía/null = no cambiar. */
  password: string | null;
}

export type TipoHorarioApi = "fixed" | "flexible" | "free";

/** POST /staffs */
export interface CreateStaffPayload extends UpdateStaffPayload {
  withAccess: boolean;
  password: string | null;
  schedule: {
    type: TipoHorarioApi;
    start: string | null;
    end: string | null;
    toleranceMinutes: number;
    requiredMinutes: number | null;
  };
  refreshment: {
    type: TipoHorarioApi;
    start: string | null;
    end: string | null;
    minutes: number | null;
  };
  /** null = sin días no laborables. `days`: lunes … domingo. */
  nonWorkingDays:
    | { type: "fixed"; days: boolean[] }
    | { type: "flexible"; numberDays: number }
    | null;
  salary: { type: "Monthly" | "Weekly" | "Daily"; amount: number };
  /** null = fecha abierta (inicio: desde su primera asistencia · fin: indefinido). */
  contract: { startDate: string | null; endDate: string | null };
    discount: {
    absenceAmount: number;
    delayType: "per_minute" | "per_hour" | "fixed";
    delayAmount: number;
    refreshmentDelayType: "per_minute" | "per_hour" | "fixed";
    refreshmentDelayAmount: number;
  } | null;
}

/**
 * GET /staffs/detail?id=
 * Misma forma que recibe el POST de creación, más la foto.
 * La contraseña nunca viaja de vuelta (`password` llega en null).
 */
export type StaffDetail = CreateStaffPayload & {
  /** URL firmada y temporal de la foto (el bucket es privado). */
  img_url: string | null;
};