/** Rol tal como lo devuelve backend-chameleonb2b. */
export interface Role {
  id: number;
  name: string;
  description: string | null;
}

/** Datos que se envían al crear o editar un rol. */
export interface RoleInput {
  name: string;
  description: string | null;
}

/** Respuesta de GET /customer-roles */
export interface RolesResponse {
  items: Role[];
}
