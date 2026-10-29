import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../core/contexts/auth.context";
import { listRoles } from "../services/role.service";
import type { Role } from "../types/role.types";

const ITEMS_POR_PAGINA = 5;

export interface RoleFilters {
  busqueda: string;
}

export const FILTROS_ROLE_INICIALES: RoleFilters = {
  busqueda: "",
};

/**
 * @param recargaKey  Al cambiar su valor se vuelve a consultar (lo usa la
 *                    página cuando seccion_1 crea un rol).
 */
export const useRoleController = (filtros: RoleFilters, recargaKey = 0) => {
  // El backend identifica al cliente por el JWT, no por custId.
  // Aquí solo sirve para saber si la sesión ya está lista.
  const { custId } = useAuth();
  const sesionLista = custId !== null;

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  // Identifica la última petición para descartar respuestas obsoletas.
  const ultimaPeticion = useRef(0);

  const busqueda = filtros.busqueda.trim().toLowerCase();

  // Al cambiar la búsqueda volvemos a la página 1 (ajuste durante el render).
  const [busquedaPrevia, setBusquedaPrevia] = useState(busqueda);
  if (busquedaPrevia !== busqueda) {
    setBusquedaPrevia(busqueda);
    setPaginaActual(1);
  }

  const cargarRoles = useCallback(async () => {
    if (!sesionLista) return;

    const peticion = ++ultimaPeticion.current;
    setLoading(true);
    setError(null);

    try {
      const data = await listRoles();
      if (peticion !== ultimaPeticion.current) return;
      setRoles(data);
    } catch (err) {
      if (peticion !== ultimaPeticion.current) return;
      console.error("Error al cargar roles:", err);
      setError("No se pudo cargar la lista de roles.");
    } finally {
      if (peticion === ultimaPeticion.current) setLoading(false);
    }
  }, [sesionLista]);

  useEffect(() => {
    cargarRoles();
  }, [cargarRoles, recargaKey]);

  const rolesFiltrados = useMemo(() => {
    if (busqueda === "") return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(busqueda) ||
        (r.description ?? "").toLowerCase().includes(busqueda)
    );
  }, [roles, busqueda]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(rolesFiltrados.length / ITEMS_POR_PAGINA)
  );

  // Si al eliminar se queda vacía la última página, retrocede sola.
  const paginaVisible = Math.min(paginaActual, totalPaginas);

  const rolesPagina = useMemo(() => {
    const inicio = (paginaVisible - 1) * ITEMS_POR_PAGINA;
    return rolesFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [rolesFiltrados, paginaVisible]);

  return {
    rolesPagina,
    loading,
    error,
    paginaActual: paginaVisible,
    setPaginaActual,
    totalPaginas,
    itemsPorPagina: ITEMS_POR_PAGINA,
    recargar: cargarRoles,
  };
};