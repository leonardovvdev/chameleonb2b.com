import { callBackend } from "./backend";
import { conCache, invalidarCache } from "./cache";
import type {
  CreateStaffPayload,
  StaffFilters,
  StaffDetail,
  StaffListItem,
  SupervisorItem,
  UpdateStaffPayload,
} from "../types";

/** Una página del personal del customer (con sus filtros). */
export const listStaff = (
  page: number,
  pageSize: number,
  filtros: StaffFilters,
): Promise<{ data: StaffListItem[]; count: number }> =>
  callBackend<{ items: StaffListItem[]; count: number }>("staffs", {
    query: {
      page,
      pageSize,
      search: filtros.busqueda,
      cargoId: filtros.cargoId,
      rolId: filtros.rolId,
      estado: filtros.estado,
    },
  }).then(({ items, count }) => ({ data: items, count }));

/** Todo el personal, del que tiene más subordinados al que no tiene ninguno. */
export const getSupervisors = (): Promise<SupervisorItem[]> =>
  conCache(
    CLAVE_SUPERVISORES,
    () => callBackend<{ items: SupervisorItem[] }>("staffs/supervisors").then((r) => r.items),
    { ttlMs: 2 * 60_000 },
  );

/** Los jefes (y su cantidad de subordinados) cambian al crear, editar o activar personal. */
const CLAVE_SUPERVISORES = "staffs:supervisors";
const invalidarSupervisores = () => invalidarCache(CLAVE_SUPERVISORES);

export const setStaffActive = (stffId: number, active: boolean) =>
  callBackend<{ id: number; active: boolean }>("staffs/active", {
    method: "PATCH",
    query: { id: stffId },
    body: { active },
  }).finally(invalidarSupervisores);

export const updateStaff = (stffId: number, payload: UpdateStaffPayload) =>
  callBackend<{ id: number }>("staffs", {
    method: "PATCH",
    query: { id: stffId },
    body: { ...payload },
  }).finally(invalidarSupervisores);

export const createStaff = (payload: CreateStaffPayload) =>
  callBackend<{ stff_id: number }>("staffs", { method: "POST", body: { ...payload } }).finally(
    invalidarSupervisores,
  );

/** Datos completos del personal (horario, refrigerio, feriados, sueldo, contrato) para editarlo. */
export const getStaffDetail = (stffId: number): Promise<StaffDetail> =>
  callBackend<StaffDetail>("staffs/detail", { query: { id: stffId } });

/**
 * Guarda la edición: el backend, en una sola operación, actualiza los datos,
 * ACTIVA al personal y crea un NUEVO registro en staff_contracts.
 */
export const updateStaffContract = (stffId: number, payload: CreateStaffPayload) =>
  callBackend<{ stff_id: number }>("staffs/contract", {
    method: "PUT",
    query: { id: stffId },
    body: { ...payload },
  }).finally(invalidarSupervisores);

/** Sube la foto del personal. Devuelve el nombre del archivo y su URL firmada. */
export const uploadStaffImage = (
  stffId: number,
  archivo: File,
): Promise<{ stff_link_img: string; img_url: string | null }> => {
  const formData = new FormData();
  formData.append("file", archivo);
  return callBackend("staffs/photo", { method: "POST", query: { id: stffId }, body: formData });
};