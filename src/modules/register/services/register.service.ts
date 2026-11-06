import type {
  Incidencia,
  RegistroDetalle,
  StaffAttendance,
  StaffPendiente,
  TiemposRegistro,
  TipoJustificacionApi,
} from "../types/register.types";
// El JWT de la sesión lo agrega supabase-js dentro de callBackend: aquí no se lee ningún token.
import { callBackend } from "../../../core/services/backend";
import { getCustomerJobPositions, getCustomerRoles } from "../../../core/services/catalog.service";

export const esperar = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface TiemposPayload {
  inicioJornada: string | null;
  inicioReceso: string | null;
  finReceso: string | null;
  finJornada: string | null;
}

/** PATCH /attendance/times → devuelve las 4 horas ya guardadas. */
export const updateAttendanceTimes = (attId: number, t: TiemposPayload): Promise<TiemposRegistro> =>
  callBackend<TiemposRegistro>("attendance/times", { method: "PATCH", body: { id: attId, ...t } });

/** PATCH /attendance/observation (texto vacío o null = borrar la observación). */
export const updateAttendanceObservation = (
  attId: number,
  texto: string | null
): Promise<{ att_observation: string | null }> =>
  callBackend<{ att_observation: string | null }>("attendance/observation", {
    method: "PATCH",
    body: { id: attId, text: texto },
  });

/** PATCH /attendance/justification (tipo: delay | refreshment_delay | absence). */
export const updateAttendanceJustification = (
  attId: number,
  tipo: TipoJustificacionApi,
  texto: string | null
): Promise<{ text: string | null }> =>
  callBackend<{ text: string | null }>("attendance/justification", {
    method: "PATCH",
    body: { id: attId, type: tipo, text: texto },
  });

/** GET /attendance/detail?id= → rol, total de registros y observación. */
export const getAttendanceDetail = (attId: number): Promise<RegistroDetalle> =>
  callBackend<RegistroDetalle>("attendance/detail", { query: { id: attId } });

/** GET /attendance/incidents?attId= */
export const getIncidencias = async (attId: number): Promise<Incidencia[]> =>
  (await callBackend<{ items: Incidencia[] }>("attendance/incidents", { query: { attId } })).items;

/** POST /attendance/incidents */
export const createIncidencia = (attId: number, descripcion: string, monto: number): Promise<Incidencia> =>
  callBackend<Incidencia>("attendance/incidents", {
    method: "POST",
    body: { attId, description: descripcion, amount: monto },
  });

/* ═══════════ Sección 3 · datos reales (Supabase Edge Function) ═══════════ */

export interface CatalogoItem {
  id: number;
  name: string;
}

/** Cargos del customer (con la caché de core). */
export const getCargos = async (): Promise<CatalogoItem[]> =>
  (await getCustomerJobPositions()).map(({ id, name }) => ({ id, name }));

/** Roles del customer (con la caché de core). */
export const getRoles = async (): Promise<CatalogoItem[]> =>
  (await getCustomerRoles()).map(({ id, name }) => ({ id, name }));

interface StaffApi {
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  img_url: string | null;
  cust_jb_pstn_id: number | null;
  job_position_name: string | null;
  cust_role_id: number | null;
  role_name: string | null;
}

/** GET /staffs (existente): todo el personal ACTIVO, paginando de 100 en 100. */
export const getPersonalActivo = async (): Promise<StaffPendiente[]> => {
  const resultado: StaffPendiente[] = [];
  const PAGE_SIZE = 100;

  for (let page = 1; page < 100; page++) {
    const { items, count } = await callBackend<{ items: StaffApi[]; count: number }>("staffs", {
      query: { estado: "ACTIVO", page, pageSize: PAGE_SIZE },
    });
    for (const s of items) {
      resultado.push({
        stff_id: s.stff_id,
        stff_name: s.stff_name,
        stff_lastname: s.stff_lastname,
        stff_dni: s.stff_dni,
        img_url: s.img_url,
        job_position_id: s.cust_jb_pstn_id,
        job_position_name: s.job_position_name,
        role_id: s.cust_role_id,
        role_name: s.role_name,
      });
    }
    if (items.length < PAGE_SIZE || resultado.length >= count) break;
  }
  return resultado;
};

/**
 * GET /attendance/eligible-staff?date=YYYY-MM-DD
 * Personal ACTIVO con un contrato que cubre esa fecha (los de contrato aún sin inicio también entran).
 */
export const getPersonalElegible = async (fecha: string): Promise<StaffPendiente[]> =>
  (await callBackend<{ items: StaffApi[] }>("attendance/eligible-staff", { query: { date: fecha } })).items.map(
    (s) => ({
      stff_id: s.stff_id,
      stff_name: s.stff_name,
      stff_lastname: s.stff_lastname,
      stff_dni: s.stff_dni,
      img_url: s.img_url,
      job_position_id: s.cust_jb_pstn_id,
      job_position_name: s.job_position_name,
      role_id: s.cust_role_id,
      role_name: s.role_name,
    })
  );

/** GET /attendance?date=YYYY-MM-DD (nuevo) */
export const getAsistenciasPorFecha = async (fecha: string): Promise<StaffAttendance[]> =>
  (await callBackend<{ items: StaffAttendance[] }>("attendance", { query: { date: fecha } })).items;

export interface NuevoRegistroPayload {
  staffId: number;
  /** YYYY-MM-DD (la fecha elegida en el calendario) */
  date: string;
  /** Timestamp ISO de ingreso. Si se omite, el servidor usa su hora actual. */
  startAt?: string;
}

/** POST /attendance (nuevo): el servidor pone la hora de ingreso. */
export const crearAsistencia = (payload: NuevoRegistroPayload): Promise<StaffAttendance> =>
  callBackend<StaffAttendance>("attendance", { method: "POST", body: { ...payload } });

/** DELETE /attendance?id= (nuevo) */
export const eliminarAsistencia = (attId: number) =>
  callBackend<{ id: number }>("attendance", { method: "DELETE", query: { id: attId } });

/** GET /attendance/can-delete */
export const getPuedeEliminar = async (): Promise<boolean> =>
  (await callBackend<{ allowed: boolean }>("attendance/can-delete")).allowed;

/** DELETE /attendance/incidents?id= → { id, total } */
export const deleteIncidencia = (id: number): Promise<{ id: number; total: number }> =>
  callBackend<{ id: number; total: number }>("attendance/incidents", { method: "DELETE", query: { id } });