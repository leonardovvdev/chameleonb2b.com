/* Espejo de los tipos del backend (attendance.types.ts → AttendanceReport) y de staffs / staff-contracts. */

export type ScheduleKind = "fixed" | "flexible" | "free";

export interface ReportSchedule {
  type: ScheduleKind;
  start: string | null;
  end: string | null;
  tolerance: number;
  requiredMinutes: number | null;
  refreshment: { type: ScheduleKind; start: string | null; end: string | null; minutes: number | null } | null;
  nonWorkingDays: { type: "fixed"; days: boolean[] } | { type: "flexible"; numberDays: number } | null;
}

/** Un tramo del historial de horarios del contrato (fechas YYYY-MM-DD; end null = sigue vigente). */
export interface ReportSchedulePeriod {
  start: string;
  end: string | null;
  schedule: ReportSchedule;
}

export interface ReportIncident {
  amount: number;
  description: string;
}

export interface ReportRow {
  att_id: number | null;
  date: string;
  /** Posición en AttendanceReport.schedules del horario que rigió este día (null = sin horario). */
  schedule_index: number | null;
  arrival: string | null;
  refreshment_start: string | null;
  refreshment_end: string | null;
  departure: string | null;
  is_worked: boolean;
  is_absence: boolean;
  delay_minutes: number | null;
  refreshment_delay_minutes: number | null;
  advancement: number | null;
  incidents: ReportIncident[];
  observation: string | null;
  justification_absence: string | null;
  justification_delay: string | null;
  justification_refreshment_delay: string | null;
}

export interface AttendanceReport {
  staff: { id: number; name: string; lastname: string; dni: string; img_url: string | null };
  contract: {
    id: number;
    number: number;
    start_date: string | null;
    end_date: string | null;
    range_start: string | null;
    range_end: string | null;
    /** Sueldo mensual del contrato. */
    salary_amount: number;
    /** AFP y prima de seguro: porcentajes (0 a 100) sobre el sueldo. */
    afp_discount: number;
    insurance_premium: number;
    /** Si es true, el contrato descuenta faltas / tardanzas de ingreso / demoras de refrigerio. */
    discount_absence: boolean;
    discount_delay: boolean;
    discount_refreshment_delay: boolean;
  };
  /** Horario vigente hoy (el último del historial). */
  schedule: ReportSchedule | null;
  /** Historial completo de horarios, del más antiguo al más reciente. */
  schedules: ReportSchedulePeriod[];
  rows: ReportRow[];
}

/** Personal del selector (subconjunto de GET /staffs). */
export interface StaffOption {
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  stff_active: boolean;
  img_url: string | null;
}

/** Contrato del selector (GET /staff-contracts). */
export interface ContractOption {
  id: number;
  number: number;
  start_date: string | null;
  end_date: string | null;
  status: "activo" | "inactivo";
}
/** Una línea del cuadro de resumen de pago del mes (amount: positivo suma, negativo descuenta). */
export interface ReportSummaryLine {
  label: string;
  detail: string;
  amount: number;
  kind: "base" | "discount" | "total";
}

/**
 * Una hoja del reporte.
/**
 * Una hoja del reporte. La vista previa (Sección 2) y el Excel (Sección 1)
 * se dibujan SOLO a partir de este objeto: es la única fuente de datos visual.
 */
export interface ReportSheet {
  name: string; // "SEPTIEMBRE 2026" (válido como nombre de hoja de Excel)
  title: string;
  staffLine: string;
  dniLine: string;
  startLine: string;
  endLine: string;
  scheduleLine: string;
  header: string[];
  rows: string[][];
  /** Cuadro de resumen de pago de ESTE mes (va al final de la hoja del Excel). */
  summary: ReportSummaryLine[];
}