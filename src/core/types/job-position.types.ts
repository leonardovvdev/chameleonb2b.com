// job-position.types.ts

/** Cargo del customer (tabla `customer_job_positions`). */
export interface CustomerJobPosition {
  id: number;
  name: string;
  description: string | null;
}
