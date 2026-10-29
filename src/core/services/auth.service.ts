import { obtenerCustomerActual } from "./customer.service";

/**
 * Datos mínimos del customer para el AuthContext.
 * Resultado con la forma { data, error }: el contexto distingue "aún no existe" de "hay customer".
 *
 * El backend identifica al usuario por el JWT de la sesión, por eso `_authId`
 * no se envía: se conserva solo para mantener la firma que ya usa el contexto.
 */
export async function obtenerCustIdPorAuthId(_authId: string): Promise<{
  data: { cust_id: number; cust_name_bucket: string } | null;
  error: unknown;
}> {
  try {
    const customer = await obtenerCustomerActual();
    return {
      data: {
        cust_id: customer.cust_id,
        cust_name_bucket: String(customer.cust_name_bucket),
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}