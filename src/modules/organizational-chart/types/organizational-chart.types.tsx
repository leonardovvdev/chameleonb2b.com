/** Persona tal como la devuelve GET /staffs/org-chart. */
export interface OrgChartStaff {
  id: number;
  supervisor_id: number | null;
  name: string;
  lastname: string;
  img_url: string | null;
  job_position: string | null;
}

/** Respuesta de GET /staffs/org-chart. */
export interface OrgChartResponse {
  items: OrgChartStaff[];
}

/** Nodo del árbol que dibuja seccion_3. */
export interface OrgNode {
  id: number;
  name: string;
  lastname: string;
  img_url: string | null;
  job_position: string | null;
  hijos: OrgNode[];
}