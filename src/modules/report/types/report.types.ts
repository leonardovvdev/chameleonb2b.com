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

export interface ReportIncident {
  amount: number;
  description: string;
}

export interface ReportRow {
  att_id: number | null;
  date: string;
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
  };
  schedule: ReportSchedule | null;
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
}