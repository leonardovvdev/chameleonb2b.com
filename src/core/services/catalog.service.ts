import { callBackend } from "./backend";
import { conCache } from "./cache";
import type { AfpItem, CustomerJobPosition, CustomerRole } from "../types";

/** Cargos y roles casi no cambian: se guardan unos minutos. */
const TTL_CATALOGO_MS = 5 * 60_000;

/** Cargos del customer (solo los suyos, sin plantillas generales). */
export const getCustomerJobPositions = (): Promise<CustomerJobPosition[]> =>
  conCache(
    "catalog:job-positions",
    () => callBackend<{ items: CustomerJobPosition[] }>("customer-job-positions").then((r) => r.items),
    { ttlMs: TTL_CATALOGO_MS },
  );

/** Roles del customer (solo los suyos, sin plantillas generales). */
export const getCustomerRoles = (): Promise<CustomerRole[]> =>
  conCache(
    "catalog:roles",
    () => callBackend<{ items: CustomerRole[] }>("customer-roles").then((r) => r.items),
    { ttlMs: TTL_CATALOGO_MS },
  );

  /** AFP disponibles (Integra, Habitat, Prima, Profuturo). */
export const getAfps = (): Promise<AfpItem[]> =>
  conCache(
    "catalog:afps",
    () => callBackend<{ items: AfpItem[] }>("staffs/afp").then((r) => r.items),
    { ttlMs: TTL_CATALOGO_MS },
  );