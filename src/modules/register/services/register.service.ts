// register.service.tsx
import { callBackend } from "../../../core/services/backend";
import type {
  AbsenceResponse,
  AttendanceResponse,
  CheckInResponse,
  IncidenciaDescuento,
  PendingFiltersPayload,
  RegistroDetalle,
  StaffPendiente,
  TiemposRegistro,
  TipoJustificacionApi,
} from "../types/register.types";

/**
 * Asistencias del personal del customer en una fecha (YYYY-MM-DD)
 * + cantidad de personal activo. El backend saca el customer del JWT.
 */
export const getAttendanceByDate = (date: string): Promise<AttendanceResponse> =>
  callBackend<AttendanceResponse>("attendance", { query: { date } });

const getPending = (ruta: string, filtros: PendingFiltersPayload): Promise<StaffPendiente[]> =>
  callBackend<{ items: StaffPendiente[] }>(ruta, {
    query: { search: filtros.search, cargoId: filtros.cargoId, rolId: filtros.rolId },
  }).then((r) => r.items);

/** Personal activo que todavía no registró su ingreso hoy (con búsqueda y filtro de cargo o rol). */
export const getPendingCheckIn = (filtros: PendingFiltersPayload) =>
  getPending("attendance/pending", filtros);

/** Personal activo sin ingreso ni ausencia registrada hoy. */
export const getPendingAbsence = (filtros: PendingFiltersPayload) =>
  getPending("attendance/pending-absence", filtros);

/** Registra el ingreso de hoy (att_schedule_start = hora actual del servidor). */
export const registerCheckIn = (stffId: number): Promise<CheckInResponse> =>
  callBackend<CheckInResponse>("attendance", { method: "POST", body: { stffId } });

/** Registra la ausencia de hoy con su descripción (obligatoria, máx. 200). */
export const registerAbsence = (stffId: number, description: string): Promise<AbsenceResponse> =>
  callBackend<AbsenceResponse>("attendance/absence", { method: "POST", body: { stffId, description } });

/* ───────── Modal de un registro ───────── */

/** Observación, rol y total de registros del personal de una asistencia. */
export const getAttendanceDetail = (attId: number): Promise<RegistroDetalle> =>
  callBackend<RegistroDetalle>("attendance/detail", { query: { id: attId } });

/** Reemplaza las 4 horas del registro (ISO 8601 o null). */
export const updateAttendanceTimes = (
  attId: number,
  horas: {
    inicioJornada: string | null;
    inicioReceso: string | null;
    finReceso: string | null;
    finJornada: string | null;
  }
): Promise<TiemposRegistro & { att_id: number }> =>
  callBackend<TiemposRegistro & { att_id: number }>("attendance/times", {
    method: "PATCH",
    query: { id: attId },
    body: horas,
  });

/** Guarda la observación (null o vacío = borrarla). */
export const updateAttendanceObservation = (
  attId: number,
  observation: string | null
): Promise<{ att_id: number; att_observation: string | null }> =>
  callBackend<{ att_id: number; att_observation: string | null }>("attendance/observation", {
    method: "PATCH",
    query: { id: attId },
    body: { observation },
  });

/** Guarda una justificación (null o vacío = borrarla). */
export const updateAttendanceJustification = (
  attId: number,
  type: TipoJustificacionApi,
  text: string | null
): Promise<{ att_id: number; type: TipoJustificacionApi; text: string | null }> =>
  callBackend<{ att_id: number; type: TipoJustificacionApi; text: string | null }>(
    "attendance/justification",
    { method: "PATCH", query: { id: attId }, body: { type, text } }
  );

/** Elimina el registro de asistencia. */
export const deleteAttendance = (attId: number): Promise<{ ok: boolean }> =>
  callBackend<{ ok: boolean }>("attendance", { method: "DELETE", query: { id: attId } });

/** Incidencias con descuento de un registro. */
export const getIncidents = (attId: number): Promise<IncidenciaDescuento[]> =>
  callBackend<{ items: IncidenciaDescuento[] }>("staff-discount-incidents", {
    query: { attId },
  }).then((r) => r.items);

/** Crea una incidencia (tipo "other"); el backend anota quién la registró. */
export const createIncident = (
  attId: number,
  description: string,
  amount: number
): Promise<IncidenciaDescuento> =>
  callBackend<IncidenciaDescuento>("staff-discount-incidents", {
    method: "POST",
    body: { attId, description, amount },
  });