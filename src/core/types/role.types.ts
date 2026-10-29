// role.types.ts

/** Rol del customer (tabla `customer_roles`). */
export interface CustomerRole {
  id: number;
  name: string;
  description: string | null;
}
