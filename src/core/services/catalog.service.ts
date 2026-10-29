import { callBackend } from "./backend";
import { conCache } from "./cache";
import type { CustomerJobPosition, CustomerRole } from "../types";

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