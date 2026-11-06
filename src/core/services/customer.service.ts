import { callBackend } from "./backend";

/** Datos del customer que devuelve el backend en GET /customers/me. */
export interface Customer {
  cust_id: number;
  cust_name: string;
  cust_lastname: string;
  cust_name_bucket: number;
  /** Solo el nombre del archivo (ej. "carlos.jpg"). */
  cust_name_img_link: string | null;
  /**
   * Enlace firmado y temporal de la imagen del customer.
   * El bucket es privado, por eso la imagen no se puede pedir con una URL fija.
   */
  cust_name_img_url: string | null;
}

/** Customer de la sesión actual. Lanza `BackendError` (con el mensaje del backend) si no se puede obtener. */
export const obtenerCustomerActual = (): Promise<Customer> => callBackend<Customer>("customers/me");
