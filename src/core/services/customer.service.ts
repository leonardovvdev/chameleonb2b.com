import { supabase } from "../../lib/supabase";

const BACKEND = "backend-chameleonb2b";

/** Datos del customer que devuelve el backend en GET /customers/me. */
export interface Customer {
  cust_id: number;
  cust_name: string;
  cust_lastname: string;
  cust_name_bucket: number;
  /** Solo el nombre del archivo (ej. "carlos.jpg"). */
  cust_name_img_link: string | null;
  /**
   * Enlace firmado y temporal de {cust_name_bucket}/imagen_customer/{cust_name_img_link}.
   * El bucket es privado, por eso la imagen no se puede pedir con una URL fija.
   */
  cust_name_img_url: string | null;
}

/** Customer de la sesión actual. Lanza el error del backend si no se puede obtener. */
export async function obtenerCustomerActual(): Promise<Customer> {
  const { data, error } = await supabase.functions.invoke<Customer>(
    `${BACKEND}/customers/me`,
    { method: "GET" },
  );

  if (error || !data) throw error ?? new Error("No se pudo cargar el cliente.");
  return data;
}