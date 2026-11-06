// core/types/staff.types.ts



/** Fila de la tabla `staffs`. */
export interface Staff {
  stff_id: number;
  cust_id: number;
  cust_role_id: number | null;
  cust_jb_pstn_id: number;
  stff_supervisor_id: number | null;
  stff_auth_id: string | null;
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  stff_phone: string | null;
  stff_link_img: string | null;
  stff_active: boolean;
  stff_access_system: boolean;
}

/* ───────────── Lista: GET /staffs ───────────── */

/** Filtros de la lista. El backend ignora los vacíos y cualquier `estado` distinto de ACTIVO / INACTIVO. */
export interface StaffFilters {
  busqueda?: string;
  cargoId?: number | string | null;
  rolId?: number | string | null;
  estado?: string;
}

export interface StaffListItem {
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  stff_phone: string | null;
  stff_link_img: string | null;
  stff_active: boolean;
  stff_access_system: boolean;
  stff_supervisor_id: number | null;
  cust_jb_pstn_id: number;
  cust_role_id: number | null;
  job_position_name: string | null;
  role_name: string | null;
  /** Enlace firmado y temporal de la foto. */
  img_url: string | null;
}

/* ───────────── Jefes directos: GET /staffs/supervisors ───────────── */

export interface SupervisorItem {
  id: number;
  name: string;
  lastname: string;
  img_url: string | null;
  job_position: string | null;
  /** Cuántas personas lo tienen como jefe directo. */
  subordinates: number;
}

/* ───────────── Crear / editar: POST, PATCH y PUT /staffs ───────────── */

export type TipoHorario = "fixed" | "flexible" | "free";

/** Datos personales, cargo, rol, jefe y acceso (lo que lee PATCH /staffs). */
export interface StaffPersonalPayload {
  name: string;
  lastname: string;
  /** 8 dígitos. */
  dni: string;
  /** 9 dígitos o vacío. */
  phone?: string | null;
  jobPositionId: number;
  roleId?: number | null;
  supervisorId?: number | null;
  withAccess?: boolean;
  /** Obligatoria al activar el acceso por primera vez; si va vacía no cambia la clave. */
  password?: string | null;
}

export interface StaffSchedulePayload {
  type: TipoHorario;
  /** "HH:mm" (obligatorio si `type` es "fixed"). */
  start?: string | null;
  end?: string | null;
  toleranceMinutes?: number;
  /** Obligatorio si `type` es "flexible". */
  requiredMinutes?: number | null;
}

export interface StaffRefreshmentPayload {
  type: TipoHorario;
  /** "HH:mm" (obligatorio si `type` es "fixed"). */
  start?: string | null;
  end?: string | null;
  /** Obligatorio si `type` es "flexible". */
  minutes?: number | null;
}

export type StaffNonWorkingDaysPayload =
  | { type: "fixed"; /** 7 valores, de lunes a domingo. */ days: boolean[] }
  | { type: "flexible"; numberDays: number };

export interface StaffDiscountFlags {
  absence: boolean;
  delay: boolean;
  refreshmentDelay: boolean;
}

export type TipoPagoApi = "Monthly" | "Weekly" | "Daily";
export type UnidadDescuentoApi = "per_minute" | "per_hour" | "fixed";

/** Montos de descuento propios del personal (hoy el backend los acepta pero no los guarda). */
export interface StaffDiscountAmounts {
  absenceAmount: number;
  delayType: UnidadDescuentoApi;
  delayAmount: number;
  refreshmentDelayType: UnidadDescuentoApi;
  refreshmentDelayAmount: number;
}

/** Lo que lee POST /staffs y PUT /staffs/contract (datos personales + contrato). */
export interface CreateStaffPayload extends StaffPersonalPayload {
  schedule: StaffSchedulePayload;
  refreshment: StaffRefreshmentPayload;
  nonWorkingDays?: StaffNonWorkingDaysPayload | null;
  /** El backend solo guarda `amount`; `type` se acepta pero hoy no se guarda. */
  salary: { type?: TipoPagoApi; amount: number };
  contract?: { startDate?: string | null; endDate?: string | null };
  /** Se acepta pero hoy no se guarda. */
  discount?: StaffDiscountAmounts | null;
  discountFlags?: StaffDiscountFlags;
}

/** Lo que lee PATCH /staffs (solo datos personales, sin contrato). */
export type UpdateStaffPayload = StaffPersonalPayload;

/**
 * GET /staffs/detail: misma forma que `CreateStaffPayload`, más la foto.
 * El backend siempre devuelve estos campos, por eso aquí no son opcionales
 * (así el modal de edición no necesita comprobar `undefined`).
 */
export interface StaffDetail extends CreateStaffPayload {
  withAccess: boolean;
  /** La clave nunca viaja de vuelta. */
  password: null;
  nonWorkingDays: StaffNonWorkingDaysPayload | null;
  salary: { type: TipoPagoApi; amount: number };
  contract: { startDate: string | null; endDate: string | null };
  /** Hoy siempre null: los montos de descuento aún no se guardan. */
  discount: StaffDiscountAmounts | null;
  discountFlags: StaffDiscountFlags;
  img_url: string | null;
}