import { callBackend } from "./backend";
import { conCache, invalidarCache } from "./cache";
import type {
  CreateStaffPayload,
  StaffDetail,
  StaffFilters,
  StaffListItem,
  SupervisorItem,
  UpdateStaffPayload,
} from "../types";

const CLAVE_SUPERVISORES = "staffs:supervisors";
const invalidarSupervisores = () => invalidarCache(CLAVE_SUPERVISORES);

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

export const getSupervisors = (): Promise<SupervisorItem[]> =>
  conCache(
    CLAVE_SUPERVISORES,
    () => callBackend<{ items: SupervisorItem[] }>("staffs/supervisors").then((r) => r.items),
    { ttlMs: 2 * 60_000 },
  );

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

export const getStaffDetail = (stffId: number): Promise<StaffDetail> =>
  callBackend<StaffDetail>("staffs/detail", { query: { id: stffId } });

export const updateStaffContract = (stffId: number, payload: CreateStaffPayload) =>
  callBackend<{ stff_id: number }>("staffs/contract", {
    method: "PUT",
    query: { id: stffId },
    body: { ...payload },
  }).finally(invalidarSupervisores);

export const uploadStaffImage = (
  stffId: number,
  archivo: File,
): Promise<{ stff_link_img: string; img_url: string | null }> => {
  const formData = new FormData();
  formData.append("file", archivo);
  return callBackend<{ stff_link_img: string; img_url: string | null }>("staffs/photo", {
    method: "POST",
    query: { id: stffId },
    body: formData,
  }).finally(invalidarSupervisores); // la foto también aparece en la lista de jefes directos
};
