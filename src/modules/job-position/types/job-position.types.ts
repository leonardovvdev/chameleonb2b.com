/** Cargo tal como lo devuelve backend-chameleonb2b. */
export interface JobPosition {
  id: number;
  name: string;
  description: string | null;
}

/** Datos que se envían al crear o editar un cargo. */
export interface JobPositionInput {
  name: string;
  description: string | null;
}

/** Respuesta de GET /customer-job-positions */
export interface JobPositionsResponse {
  items: JobPosition[];
}